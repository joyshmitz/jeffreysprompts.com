import cac from "cac";
import { version } from "../package.json";
import { listCommand } from "./commands/list";
import { searchCommand } from "./commands/search";
import { showCommand } from "./commands/show";
import { installCommand } from "./commands/install";

export const cli = cac("jfp");

cli
  .command("list", "List all prompts")
  .option("--category <category>", "Filter by category")
  .option("--tag <tag>", "Filter by tag")
  .option("--json", "Output JSON")
  .action(listCommand);

cli
  .command("search <query>", "Fuzzy search prompts")
  .option("--json", "Output JSON")
  .action(searchCommand);

cli
  .command("show <id>", "Show a prompt")
  .option("--json", "Output JSON")
  .option("--raw", "Output raw content")
  .action(showCommand);

cli
  .command("install [...ids]", "Install prompts as Claude Code skills")
  .option("--project", "Install to current project (.claude/skills)")
  .option("--all", "Install all prompts")
  .option("--json", "Output JSON")
  .action(installCommand);

cli.help();
cli.version(version);

// Default command (no args)
cli.command("").action(() => {
  cli.outputHelp();
});