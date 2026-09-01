import { NextResponse } from "next/server";
import {
  CURRENT_SCHEMA_VERSION,
  ANALYZER_ENGINE_VERSION,
} from "@codexel/shared";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "Codexel Web",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    engineVersion: ANALYZER_ENGINE_VERSION,
    timestamp: new Date().toISOString(),
  });
}
