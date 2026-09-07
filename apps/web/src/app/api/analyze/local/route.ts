import { NextRequest, NextResponse } from "next/server";
import {
  analyzeInMemoryFiles,
  RepositoryLimitExceededError,
} from "@codexel/analyzer";

export const maxDuration = 60; // 60 seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, files } = body as {
      name?: string;
      files?: Array<{ path: string; content: string }>;
    };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "A non-empty 'files' array is required." },
        { status: 400 },
      );
    }

    const model = await analyzeInMemoryFiles({
      name: name || "local-project",
      files,
    });

    return NextResponse.json(model);
  } catch (error: any) {
    if (error instanceof RepositoryLimitExceededError) {
      return NextResponse.json(
        { error: error.message, limitType: error.limitType },
        { status: 413 },
      );
    }

    console.error("Local repository analysis failed:", error);
    return NextResponse.json(
      {
        error: error?.message || "Internal server error during local analysis",
      },
      { status: 500 },
    );
  }
}
