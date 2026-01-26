import { exitWithDeprecatedSkillCommand } from "../lib/utils";

interface InstallOptions {
  json?: boolean;
}

export async function installCommand(_ids: string[], options: InstallOptions) {
  exitWithDeprecatedSkillCommand(
    options,
    "This command moved to jsm. Run: jsm install <skill>"
  );
}
