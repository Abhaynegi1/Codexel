import { NextRequest, NextResponse } from "next/server";
import type { RepositoryModel } from "@codexel/shared";
import {
  serializeModelToFacts,
  constructGroundedUserPrompt,
  GROUNDED_SYSTEM_PROMPT,
  generateDeterministicGroundedResponse,
} from "@codexel/analyzer";
import {
  getClientIp,
  checkAiRateLimit,
  recordAiRequest,
  truncateFactsForPrompt,
  AI_CONFIG,
} from "@/lib/ai-limiter";

/**
 * Creates a streaming response simulating authentic token emission.
 */
function createSimulatedStreamResponse(
  text: string,
  extraHeaders: Record<string, string> = {},
): Response {
  const encoder = new TextEncoder();
  const chunks = text.split(/(\s+|\n+)/);

  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        // Small delay to provide natural streaming feel
        await new Promise((resolve) => setTimeout(resolve, 8));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...extraHeaders,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, model, engine } = body as {
      query: string;
      model?: RepositoryModel;
      engine?: "gemini" | "deterministic" | "auto";
    };

    // 1. Validate Input
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "A valid 'query' string is required." },
        { status: 400 },
      );
    }

    if (query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query cannot be empty." },
        { status: 400 },
      );
    }

    // Protect against oversized prompt injections / token spikes
    if (query.length > AI_CONFIG.maxQueryLength) {
      return NextResponse.json(
        {
          error: `Query is too long (${query.length} characters). Maximum allowed is ${AI_CONFIG.maxQueryLength} characters.`,
        },
        { status: 400 },
      );
    }

    if (!model || !model.metadata || !model.fileSystem) {
      return NextResponse.json(
        { error: "A valid 'model' (RepositoryModel) is required." },
        { status: 400 },
      );
    }

    // 2. Direct Deterministic Mode Request
    // Allows visitors or developers to intentionally bypass external AI calls
    if (engine === "deterministic") {
      const answer = generateDeterministicGroundedResponse(query, model);
      return createSimulatedStreamResponse(answer, {
        "X-AI-Engine": "deterministic-direct",
      });
    }

    // 3. Rate Limit & Safety Quota Check
    const clientIp = getClientIp(request.headers);
    const rateLimit = checkAiRateLimit(clientIp);

    // If rate limited, DO NOT call external LLM APIs — fall back directly to deterministic engine
    if (!rateLimit.allowed) {
      const fallbackNotice =
        `> [!NOTE]\n` +
        `> 🛡️ **AI Safety Limit Active**: ${rateLimit.reasonMessage} ` +
        `Your question is served via our verified **Deterministic AST Engine** (100% accurate, zero hallucinations).\n\n`;

      const groundedAnswer = generateDeterministicGroundedResponse(
        query,
        model,
      );
      const combinedAnswer = fallbackNotice + groundedAnswer;

      return createSimulatedStreamResponse(combinedAnswer, {
        "X-AI-Engine": "deterministic-fallback",
        "X-RateLimit-Exceeded": "true",
        "X-RateLimit-Reason": rateLimit.reason || "rate_limited",
        "X-RateLimit-Remaining-Minute": String(rateLimit.remainingMinute),
        "X-RateLimit-Remaining-Day": String(rateLimit.remainingDaily),
        "X-RateLimit-Reset-Minute": String(rateLimit.resetMinuteSeconds),
      });
    }

    // Check for API Keys
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const geminiApiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    // Distill & safely truncate model facts to prevent token exhaustion
    const rawFacts = serializeModelToFacts(model);
    const safeFacts = truncateFactsForPrompt(rawFacts);
    const userPrompt = constructGroundedUserPrompt(query, safeFacts);

    // 4. Try Google Gemini API if configured
    if (geminiApiKey) {
      try {
        // Record quota usage
        recordAiRequest(clientIp);

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(15000), // 15-second timeout safeguard
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: GROUNDED_SYSTEM_PROMPT }],
              },
              contents: [
                {
                  parts: [{ text: userPrompt }],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: AI_CONFIG.geminiMaxOutputTokens,
                topP: 0.8,
              },
            }),
          },
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (generatedText) {
            return createSimulatedStreamResponse(generatedText, {
              "X-AI-Engine": "gemini-1.5-flash",
              "X-RateLimit-Remaining-Minute": String(
                Math.max(0, rateLimit.remainingMinute - 1),
              ),
              "X-RateLimit-Remaining-Day": String(
                Math.max(0, rateLimit.remainingDaily - 1),
              ),
            });
          }
        } else {
          console.warn(
            `Gemini API returned status ${geminiRes.status}: ${geminiRes.statusText}`,
          );
        }
      } catch (err) {
        console.warn(
          "External Gemini call failed or timed out, gracefully falling back to deterministic engine:",
          err,
        );
      }
    }

    // 5. Try OpenAI API if configured
    if (openaiApiKey) {
      try {
        recordAiRequest(clientIp);

        const openAiRes = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiApiKey}`,
            },
            signal: AbortSignal.timeout(15000),
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: GROUNDED_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              stream: true,
              max_tokens: AI_CONFIG.geminiMaxOutputTokens,
              temperature: 0.2,
            }),
          },
        );

        if (openAiRes.ok && openAiRes.body) {
          return new Response(openAiRes.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
              "X-AI-Engine": "gpt-4o-mini",
              "X-RateLimit-Remaining-Minute": String(
                Math.max(0, rateLimit.remainingMinute - 1),
              ),
              "X-RateLimit-Remaining-Day": String(
                Math.max(0, rateLimit.remainingDaily - 1),
              ),
            },
          });
        }
      } catch (err) {
        console.warn(
          "External OpenAI call failed or timed out, gracefully falling back to deterministic engine:",
          err,
        );
      }
    }

    // 6. Safe Default Fallback: Built-in deterministic grounded engine
    const answer = generateDeterministicGroundedResponse(query, model);
    return createSimulatedStreamResponse(answer, {
      "X-AI-Engine": "deterministic-default",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
