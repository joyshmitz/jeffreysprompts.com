import { exitWithDeprecatedSkillCommand } from "../lib/utils";

interface UninstallOptions {
  json?: boolean;
}

export function uninstallCommand(_ids: string[], options: UninstallOptions) {
  exitWithDeprecatedSkillCommand(
    options,
    "Skill management moved to jsm. Run: jsm --help"
  );
}
