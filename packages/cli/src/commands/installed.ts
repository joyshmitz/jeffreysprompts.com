import { exitWithDeprecatedSkillCommand } from "../lib/utils";

interface InstalledOptions {
  json?: boolean;
}

export function installedCommand(options: InstalledOptions) {
  exitWithDeprecatedSkillCommand(
    options,
    "Skill management moved to jsm. Run: jsm --help"
  );
}
