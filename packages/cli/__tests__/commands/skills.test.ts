import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { installCommand } from "../../src/commands/install";
import { uninstallCommand } from "../../src/commands/uninstall";
import { installedCommand } from "../../src/commands/installed";
import { updateCommand } from "../../src/commands/update";
import { exportCommand } from "../../src/commands/export";

let output: string[] = [];
let errors: string[] = [];
let exitCode: number | undefined;

const originalLog = console.log;
const originalError = console.error;
const originalExit = process.exit;

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

describe("deprecated skill commands", () => {
  it("installCommand redirects to jsm", async () => {
    await expectExit(() => installCommand(["idea-wizard"], { json: true }));
    const payload = JSON.parse(output.join(""));
    expect(payload.code).toBe("deprecated_command");
    expect(payload.message).toContain("jsm install <skill>");
    expect(exitCode).toBe(1);
  });

  it("uninstallCommand redirects to jsm", async () => {
    await expectExit(() => uninstallCommand(["idea-wizard"], { json: true }));
    const payload = JSON.parse(output.join(""));
    expect(payload.code).toBe("deprecated_command");
    expect(payload.message).toContain("jsm --help");
    expect(exitCode).toBe(1);
  });

  it("installedCommand redirects to jsm", async () => {
    await expectExit(() => installedCommand({ json: true }));
    const payload = JSON.parse(output.join(""));
    expect(payload.code).toBe("deprecated_command");
    expect(payload.message).toContain("jsm --help");
    expect(exitCode).toBe(1);
  });

  it("updateCommand redirects to jsm", async () => {
    await expectExit(() => updateCommand({ json: true }));
    const payload = JSON.parse(output.join(""));
    expect(payload.code).toBe("deprecated_command");
    expect(payload.message).toContain("jsm --help");
    expect(exitCode).toBe(1);
  });
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
