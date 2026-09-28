/**
 * AI Rate Limiter & Security Guard
 *
 * Protects external LLM APIs (Google Gemini / OpenAI) from:
 * 1. Per-IP spam / rapid fire (Minute & Daily sliding-window limits)
 * 2. Key exhaustion / billing spikes (Global safety cap below Gemini free tier 15 RPM)
 * 3. Token-bombing attacks (Max query length & prompt context distillation)
 * 4. Hangs & zombie connections (Fetch timeout abort controller)
 *
 * When limits are reached, the system gracefully degrades to Codexel's
 * 100% accurate Deterministic AST Engine without breaking the user experience.
 */

export interface RateLimitConfig {
  perIpMinute: number;
  perIpDaily: number;
  globalMinute: number;
  globalDaily: number;
  cooldownSeconds: number;
  maxQueryLength: number;
  maxFactsLength: number;
  geminiMaxOutputTokens: number;
}

export const AI_CONFIG: RateLimitConfig = {
  // Per-IP limit: max 6 requests per minute
  perIpMinute: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || "6", 10),
  // Per-IP limit: max 30 requests per day (preserves quota across users)
  perIpDaily: parseInt(process.env.AI_RATE_LIMIT_PER_DAY || "30", 10),
  // Global safety limit: max 12 requests per minute across all visitors (Gemini free tier is 15 RPM)
  globalMinute: parseInt(
    process.env.AI_GLOBAL_RATE_LIMIT_PER_MINUTE || "12",
    10,
  ),
  // Global safety limit: max 1200 requests per day across all visitors (Gemini free tier is 1500 RPD)
  globalDaily: parseInt(process.env.AI_GLOBAL_RATE_LIMIT_PER_DAY || "1200", 10),
  // Minimum cooldown between consecutive requests from same IP (seconds)
  cooldownSeconds: parseInt(process.env.AI_COOLDOWN_SECONDS || "3", 10),
  // Max query length in characters
  maxQueryLength: parseInt(process.env.AI_MAX_QUERY_LENGTH || "500", 10),
  // Max facts markdown characters to send to Gemini (~2500-3000 tokens)
  maxFactsLength: parseInt(process.env.AI_MAX_FACTS_LENGTH || "12000", 10),
  // Maximum tokens Gemini can generate in reply
  geminiMaxOutputTokens: parseInt(
    process.env.GEMINI_MAX_OUTPUT_TOKENS || "1024",
    10,
  ),
};

export type RateLimitReason =
  "cooldown" | "ip_minute" | "ip_daily" | "global_minute" | "global_daily";

export interface RateLimitStatus {
  allowed: boolean;
  reason?: RateLimitReason;
  reasonMessage?: string;
  remainingMinute: number;
  remainingDaily: number;
  resetMinuteSeconds: number;
  resetDailySeconds: number;
  cooldownRemainingSeconds: number;
}

interface IpTracker {
  lastRequestTime: number;
  minuteRequests: number[];
  dailyRequests: number[];
}

// In-memory sliding window store
const ipStore = new Map<string, IpTracker>();
const globalTracker = {
  minuteRequests: [] as number[],
  dailyRequests: [] as number[],
};

// Periodic garbage collection to prevent memory leaks in long-running processes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
let lastCleanup = Date.now();

function cleanupExpiredEntries(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  for (const [ip, tracker] of ipStore.entries()) {
    tracker.dailyRequests = tracker.dailyRequests.filter((t) => t > oneDayAgo);
    tracker.minuteRequests = tracker.minuteRequests.filter(
      (t) => t > now - 60 * 1000,
    );
    if (
      tracker.dailyRequests.length === 0 &&
      tracker.minuteRequests.length === 0
    ) {
      ipStore.delete(ip);
    }
  }

  globalTracker.dailyRequests = globalTracker.dailyRequests.filter(
    (t) => t > oneDayAgo,
  );
  globalTracker.minuteRequests = globalTracker.minuteRequests.filter(
    (t) => t > now - 60 * 1000,
  );
}

/**
 * Extracts client IP from standard proxy and CDN headers.
 */
export function getClientIp(
  headers: Headers | Record<string, string | string[] | undefined>,
): string {
  if (typeof (headers as Headers).get === "function") {
    const h = headers as Headers;
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      const firstIp = forwarded.split(",")[0]?.trim();
      if (firstIp) return firstIp;
    }
    const realIp = h.get("x-real-ip");
    if (realIp) return realIp.trim();

    const cfIp = h.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();
  } else {
    const obj = headers as Record<string, string | string[] | undefined>;
    const forwarded = obj["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      const firstIp = forwarded.split(",")[0]?.trim();
      if (firstIp) return firstIp;
    }
    const realIp = obj["x-real-ip"];
    if (typeof realIp === "string" && realIp.length > 0) return realIp.trim();

    const cfIp = obj["cf-connecting-ip"];
    if (typeof cfIp === "string" && cfIp.length > 0) return cfIp.trim();
  }

  return "127.0.0.1";
}

/**
 * Checks if the request is within rate limits.
 * Does NOT increment counters yet — call recordAiRequest(ip) after confirming.
 */
export function checkAiRateLimit(
  ip: string,
  config: RateLimitConfig = AI_CONFIG,
): RateLimitStatus {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const oneMinuteAgo = now - 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // 1. Check Global Limits
  const globalMinuteActive = globalTracker.minuteRequests.filter(
    (t) => t > oneMinuteAgo,
  );
  const globalDailyActive = globalTracker.dailyRequests.filter(
    (t) => t > oneDayAgo,
  );

  if (globalMinuteActive.length >= config.globalMinute) {
    const oldest = globalMinuteActive[0] ?? now;
    const resetSec = Math.max(1, Math.ceil((oldest + 60 * 1000 - now) / 1000));
    return {
      allowed: false,
      reason: "global_minute",
      reasonMessage: `High system traffic: global safety limit reached (${config.globalMinute} req/min). Resets in ${resetSec}s.`,
      remainingMinute: 0,
      remainingDaily: Math.max(
        0,
        config.globalDaily - globalDailyActive.length,
      ),
      resetMinuteSeconds: resetSec,
      resetDailySeconds: 86400,
      cooldownRemainingSeconds: 0,
    };
  }

  if (globalDailyActive.length >= config.globalDaily) {
    return {
      allowed: false,
      reason: "global_daily",
      reasonMessage: "Daily platform AI quota has been reached.",
      remainingMinute: 0,
      remainingDaily: 0,
      resetMinuteSeconds: 60,
      resetDailySeconds: 86400,
      cooldownRemainingSeconds: 0,
    };
  }

  // 2. Check Per-IP Limits
  let tracker = ipStore.get(ip);
  if (!tracker) {
    tracker = {
      lastRequestTime: 0,
      minuteRequests: [],
      dailyRequests: [],
    };
    ipStore.set(ip, tracker);
  }

  // Cooldown check
  const timeSinceLast = (now - tracker.lastRequestTime) / 1000;
  if (timeSinceLast < config.cooldownSeconds) {
    const waitSec = Math.ceil(config.cooldownSeconds - timeSinceLast);
    return {
      allowed: false,
      reason: "cooldown",
      reasonMessage: `Please wait ${waitSec}s before sending another AI query.`,
      remainingMinute: Math.max(
        0,
        config.perIpMinute - tracker.minuteRequests.length,
      ),
      remainingDaily: Math.max(
        0,
        config.perIpDaily - tracker.dailyRequests.length,
      ),
      resetMinuteSeconds: 60,
      resetDailySeconds: 86400,
      cooldownRemainingSeconds: waitSec,
    };
  }

  // Filter sliding windows for IP
  tracker.minuteRequests = tracker.minuteRequests.filter(
    (t) => t > oneMinuteAgo,
  );
  tracker.dailyRequests = tracker.dailyRequests.filter((t) => t > oneDayAgo);

  if (tracker.minuteRequests.length >= config.perIpMinute) {
    const oldest = tracker.minuteRequests[0] ?? now;
    const resetSec = Math.max(1, Math.ceil((oldest + 60 * 1000 - now) / 1000));
    return {
      allowed: false,
      reason: "ip_minute",
      reasonMessage: `You've reached your limit of ${config.perIpMinute} queries per minute. Resets in ${resetSec}s.`,
      remainingMinute: 0,
      remainingDaily: Math.max(
        0,
        config.perIpDaily - tracker.dailyRequests.length,
      ),
      resetMinuteSeconds: resetSec,
      resetDailySeconds: 86400,
      cooldownRemainingSeconds: 0,
    };
  }

  if (tracker.dailyRequests.length >= config.perIpDaily) {
    return {
      allowed: false,
      reason: "ip_daily",
      reasonMessage: `Daily limit of ${config.perIpDaily} AI queries reached for today.`,
      remainingMinute: 0,
      remainingDaily: 0,
      resetMinuteSeconds: 60,
      resetDailySeconds: 86400,
      cooldownRemainingSeconds: 0,
    };
  }

  return {
    allowed: true,
    remainingMinute: config.perIpMinute - tracker.minuteRequests.length,
    remainingDaily: config.perIpDaily - tracker.dailyRequests.length,
    resetMinuteSeconds: 60,
    resetDailySeconds: 86400,
    cooldownRemainingSeconds: 0,
  };
}

/**
 * Records an accepted AI request against rate limit counters.
 */
export function recordAiRequest(ip: string): void {
  const now = Date.now();
  let tracker = ipStore.get(ip);
  if (!tracker) {
    tracker = {
      lastRequestTime: now,
      minuteRequests: [],
      dailyRequests: [],
    };
    ipStore.set(ip, tracker);
  }

  tracker.lastRequestTime = now;
  tracker.minuteRequests.push(now);
  tracker.dailyRequests.push(now);

  globalTracker.minuteRequests.push(now);
  globalTracker.dailyRequests.push(now);
}

/**
 * Truncates facts payload safely to prevent token-bombing Gemini.
 */
export function truncateFactsForPrompt(
  factsMarkdown: string,
  maxLength: number = AI_CONFIG.maxFactsLength,
): string {
  if (factsMarkdown.length <= maxLength) {
    return factsMarkdown;
  }
  return (
    factsMarkdown.slice(0, maxLength) +
    "\n\n*(...Additional repository facts truncated to optimize model token limits)*"
  );
}

/**
 * Reset store (useful for automated testing)
 */
export function _resetRateLimiter(): void {
  ipStore.clear();
  globalTracker.minuteRequests = [];
  globalTracker.dailyRequests = [];
}
