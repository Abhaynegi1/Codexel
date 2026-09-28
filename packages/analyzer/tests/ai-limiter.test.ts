import { describe, it, expect, beforeEach } from "vitest";
import {
  checkAiRateLimit,
  recordAiRequest,
  truncateFactsForPrompt,
  getClientIp,
  _resetRateLimiter,
  type RateLimitConfig,
} from "../src/ai/limiter";

describe("AI Rate Limiter & Quota Protection", () => {
  beforeEach(() => {
    _resetRateLimiter();
  });

  const testConfig: RateLimitConfig = {
    perIpMinute: 3,
    perIpDaily: 5,
    globalMinute: 5,
    globalDaily: 10,
    cooldownSeconds: 2,
    maxQueryLength: 500,
    maxFactsLength: 100,
    geminiMaxOutputTokens: 512,
  };

  it("extracts client IP from various proxy and CDN headers", () => {
    // 1. x-forwarded-for with multiple IPs
    const headers1 = new Headers({
      "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
    });
    expect(getClientIp(headers1)).toBe("203.0.113.195");

    // 2. x-real-ip
    const headers2 = new Headers({ "x-real-ip": "198.51.100.4" });
    expect(getClientIp(headers2)).toBe("198.51.100.4");

    // 3. cf-connecting-ip
    const headers3 = new Headers({ "cf-connecting-ip": "192.0.2.1" });
    expect(getClientIp(headers3)).toBe("192.0.2.1");

    // 4. Fallback when no headers present
    const headers4 = new Headers();
    expect(getClientIp(headers4)).toBe("127.0.0.1");

    // 5. Plain object headers support
    expect(getClientIp({ "x-forwarded-for": "10.0.0.1" })).toBe("10.0.0.1");
  });

  it("enforces cooldown between consecutive requests from the same IP", () => {
    const ip = "1.2.3.4";

    // First request is allowed
    const res1 = checkAiRateLimit(ip, testConfig);
    expect(res1.allowed).toBe(true);
    recordAiRequest(ip);

    // Immediate second request within cooldown (2s) is blocked
    const res2 = checkAiRateLimit(ip, testConfig);
    expect(res2.allowed).toBe(false);
    expect(res2.reason).toBe("cooldown");
    expect(res2.cooldownRemainingSeconds).toBeGreaterThan(0);
    expect(res2.reasonMessage).toContain("wait");
  });

  it("enforces per-IP minute rate limit", () => {
    const ip = "2.3.4.5";
    const noCooldownConfig = { ...testConfig, cooldownSeconds: 0 };

    // Should allow up to perIpMinute (3)
    for (let i = 0; i < 3; i++) {
      const check = checkAiRateLimit(ip, noCooldownConfig);
      expect(check.allowed).toBe(true);
      recordAiRequest(ip);
    }

    // 4th request must be blocked
    const check4 = checkAiRateLimit(ip, noCooldownConfig);
    expect(check4.allowed).toBe(false);
    expect(check4.reason).toBe("ip_minute");
    expect(check4.remainingMinute).toBe(0);
    expect(check4.resetMinuteSeconds).toBeGreaterThan(0);
  });

  it("enforces per-IP daily quota cap", () => {
    const ip = "3.4.5.6";
    const noCooldownConfig = {
      ...testConfig,
      cooldownSeconds: 0,
      perIpMinute: 100, // high minute limit
      perIpDaily: 3, // only 3 per day
    };

    for (let i = 0; i < 3; i++) {
      const check = checkAiRateLimit(ip, noCooldownConfig);
      expect(check.allowed).toBe(true);
      recordAiRequest(ip);
    }

    // 4th request exceeds daily quota
    const check4 = checkAiRateLimit(ip, noCooldownConfig);
    expect(check4.allowed).toBe(false);
    expect(check4.reason).toBe("ip_daily");
    expect(check4.reasonMessage).toContain("Daily limit");
  });

  it("enforces global minute safety cap to protect Gemini free tier", () => {
    const tightGlobalConfig = {
      ...testConfig,
      cooldownSeconds: 0,
      perIpMinute: 10,
      globalMinute: 2, // only 2 requests total globally per minute
    };

    // IP 1 sends 1 request
    expect(checkAiRateLimit("10.0.0.1", tightGlobalConfig).allowed).toBe(true);
    recordAiRequest("10.0.0.1");

    // IP 2 sends 1 request
    expect(checkAiRateLimit("10.0.0.2", tightGlobalConfig).allowed).toBe(true);
    recordAiRequest("10.0.0.2");

    // IP 3 sends request -> blocked by global minute limit even though IP 3 is new
    const check3 = checkAiRateLimit("10.0.0.3", tightGlobalConfig);
    expect(check3.allowed).toBe(false);
    expect(check3.reason).toBe("global_minute");
    expect(check3.reasonMessage).toContain("global safety limit reached");
  });

  it("truncates oversized facts context to prevent token exhaustion", () => {
    const shortFacts = "Small repository facts within limits.";
    expect(truncateFactsForPrompt(shortFacts, 100)).toBe(shortFacts);

    const longFacts = "A".repeat(250);
    const truncated = truncateFactsForPrompt(longFacts, 100);
    expect(truncated.length).toBeLessThan(longFacts.length);
    expect(truncated).toContain("truncated to optimize model token limits");
  });
});
