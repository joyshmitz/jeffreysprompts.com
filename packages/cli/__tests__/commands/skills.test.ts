import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { exportCommand } from "../../src/commands/export";

let output: string[] = [];
let errors: string[] = [];
let exitCode: number | undefined;

const originalLog = console.log;
const originalError = console.error;
const originalExit = process.exit;
const originalArgv = process.argv;

beforeEach(() => {
  output = [];
  errors = [];
  exitCode = undefined;

  console.log = (...args: unknown[]) => {
    output.push(args.join(" "));
  };
  console.error = (...args: unknown[]) => {
    errors.push(args.join(" "));
  };
  process.exit = ((code?: number) => {
    exitCode = code ?? 0;
    throw new Error("process.exit");
  }) as never;
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
  process.exit = originalExit;
  process.argv = originalArgv;
});

async function expectExit(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if ((err as Error).message !== "process.exit") {
      throw err;
    }
  }
}

async function runDeprecatedCommand(command: string): Promise<void> {
  process.argv = ["node", "jfp", command, "--json"];
  const url = new URL("../../src/index.ts", import.meta.url);
  url.searchParams.set("test", `${command}-${Date.now()}`);
  await import(url.href);
}

describe("deprecated skill commands", () => {
  it("installCommand redirects to jsm", async () => {
    await expectExit(() => runDeprecatedCommand("install"));
    const payload = JSON.parse(output.join(""));
    expect(payload.code).toBe("deprecated_command");
    expect(payload.message).toContain("jsm install <skill>");
    expect(exitCode).toBe(1);
  });

  for (const command of ["uninstall", "installed", "update", "skills"]) {
    it(`${command} command redirects to jsm`, async () => {
      await expectExit(() => runDeprecatedCommand(command));
      const payload = JSON.parse(output.join(""));
      expect(payload.code).toBe("deprecated_command");
      expect(payload.message).toContain("jsm --help");
      expect(exitCode).toBe(1);
    });
  }
});

describe("exportCommand", () => {
  it("rejects skill format", async () => {
    await expectExit(() => exportCommand([], { format: "skill", json: true }));
    const payload = JSON.parse(output.join(""));
    expect(payload.code).toBe("deprecated_command");
    expect(payload.message).toContain("jsm --help");
    expect(exitCode).toBe(1);
  });
});
