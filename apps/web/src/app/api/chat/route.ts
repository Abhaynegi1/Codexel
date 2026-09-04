import { NextRequest, NextResponse } from "next/server";
import type { RepositoryModel } from "@codexel/shared";
import {
  serializeModelToFacts,
  constructGroundedUserPrompt,
  GROUNDED_SYSTEM_PROMPT,
  generateDeterministicGroundedResponse,
} from "@codexel/analyzer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, model } = body as {
      query: string;
      model?: RepositoryModel;
    };

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "A valid 'query' string is required." },
        { status: 400 },
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: "A valid 'model' (RepositoryModel) is required." },
        { status: 400 },
      );
    }

    // Check for OpenAI / Gemini API Keys if configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const geminiApiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (openaiApiKey) {
      try {
        const facts = serializeModelToFacts(model);
        const userPrompt = constructGroundedUserPrompt(query, facts);

        const openAiRes = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: GROUNDED_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              stream: true,
            }),
          },
        );

        if (openAiRes.ok && openAiRes.body) {
          // Return the streaming response directly
          return new Response(openAiRes.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        }
      } catch (err) {
        console.warn(
          "External OpenAI call failed, using deterministic engine:",
          err,
        );
      }
    }

    // Fallback: Built-in deterministic grounded engine with simulated streaming
    const answer = generateDeterministicGroundedResponse(query, model);

    // Create a streaming response simulating fast token emission for rich UX
    const encoder = new TextEncoder();
    const chunks = answer.split(/(\s+|\n+)/);

    const stream = new ReadableStream({
      async start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
          // small tick to create authentic streaming sensation
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
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
