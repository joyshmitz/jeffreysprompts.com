import { NextRequest, NextResponse } from "next/server";
import { getPrompt } from "@jeffreysprompts/core/prompts";
import { generateSkillMd } from "@jeffreysprompts/core/export";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prompt = getPrompt(id);

  if (!prompt) {
    return NextResponse.json(
      { error: "not_found", message: `Prompt '${id}' not found` },
      { status: 404 }
    );
  }

  const skillMd = generateSkillMd(prompt);

  // Sanitize ID for Content-Disposition header (defense-in-depth)
  const safeId = id.replace(/[^a-z0-9-]/gi, "");

  return new NextResponse(skillMd, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeId}.SKILL.md"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
