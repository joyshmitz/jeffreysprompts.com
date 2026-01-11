import { NextResponse } from "next/server";
import { runReadyChecks } from "@/lib/health/checks";

export async function GET() {
  const { status, checks } = await runReadyChecks();
  const httpStatus = status === "ready" ? 200 : 503;

  return NextResponse.json(
    {
      status,
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
