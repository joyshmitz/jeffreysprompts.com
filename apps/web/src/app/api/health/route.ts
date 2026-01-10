import { NextResponse } from "next/server";
import { prompts, categories, tags } from "@jeffreysprompts/core/prompts";

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.JFP_REGISTRY_VERSION ?? "1.0.0",
    prompts: {
      count: prompts.length,
      categories: categories.length,
      tags: tags.length,
    },
    environment: process.env.NODE_ENV ?? "development",
  };

  return NextResponse.json(health, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
