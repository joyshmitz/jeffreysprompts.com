import { exitWithDeprecatedSkillCommand } from "../lib/utils";

interface UpdateOptions {
  json?: boolean;
}

export async function updateCommand(options: UpdateOptions) {
  exitWithDeprecatedSkillCommand(
    options,
    "Skill management moved to jsm. Run: jsm --help"
  );
}
