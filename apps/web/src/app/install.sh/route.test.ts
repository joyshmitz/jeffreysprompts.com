/**
 * Unit tests for /install.sh route (GET)
 * @module install.sh/route.test
 */

import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("/install.sh", () => {
  it("returns an install script for a single id", async () => {
    const req = new Request("http://localhost/install.sh?ids=idea-wizard");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/x-shellscript");

    const script = await res.text();
    expect(script).toContain('SKILLS_DIR="$HOME/.config/claude/skills"');
    expect(script).toContain('echo "Installing JeffreysPrompts skills');
    expect(script).toContain("$SKILLS_DIR/idea-wizard");
    expect(script).toContain('SKILL.md"');
  });

  it("supports project=1 to target $PWD/.claude/skills", async () => {
    const req = new Request("http://localhost/install.sh?ids=idea-wizard&project=1");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const script = await res.text();
    expect(script).toContain('SKILLS_DIR="$PWD/.claude/skills"');
    expect(script).toContain("$SKILLS_DIR/idea-wizard");
  });

  it("returns 404 when ids contains no known prompts", async () => {
    const req = new Request("http://localhost/install.sh?ids=does-not-exist");
    const res = await GET(req);

    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("text/x-shellscript");
    const script = await res.text();
    expect(script).toContain("No matching prompts found");
    expect(script).toContain("exit 1");
  });
});

