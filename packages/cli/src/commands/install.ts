import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";
import { getPrompt, prompts } from "@jeffreysprompts/core/prompts";
import { generateSkillMd } from "@jeffreysprompts/core/export/skills";
import chalk from "chalk";

interface InstallOptions {
  project?: boolean;
  all?: boolean;
  json?: boolean;
  force?: boolean;
}

export function installCommand(ids: string[], options: InstallOptions) {
  const targetRoot = options.project
    ? resolve(process.cwd(), ".claude/skills")
    : join(homedir(), ".config/claude/skills");

  if (options.all) {
    // Install all prompts
    ids = prompts.map((p) => p.id);
  }

  if (ids.length === 0) {
    console.error(chalk.red("Error: No prompts specified. Use <id> or --all"));
    process.exit(1);
  }

  const installed: string[] = [];
  const failed: string[] = [];

  for (const id of ids) {
    const prompt = getPrompt(id);
    if (!prompt) {
      console.warn(chalk.yellow(`Warning: Prompt '${id}' not found. Skipping.`));
      failed.push(id);
      continue;
    }

    try {
      const skillContent = generateSkillMd(prompt);
      const skillDir = join(targetRoot, prompt.id);
      const skillPath = join(skillDir, "SKILL.md");

      if (!existsSync(skillDir)) {
        mkdirSync(skillDir, { recursive: true });
      }

      // Check if file exists (unless force is used)
      // Actually, standard behavior is overwrite for 'install', maybe 'update' is different.
      // README implies 'install' works for updates too.

      writeFileSync(skillPath, skillContent);
      installed.push(id);

      if (!options.json) {
        console.log(
          `${chalk.green("✓")} Installed ${chalk.bold(prompt.id)} to ${chalk.dim(skillPath)}`
        );
      }
    } catch (err) {
      console.error(chalk.red(`Failed to install '${id}': ${(err as Error).message}`));
      failed.push(id);
    }
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          installed,
          failed,
          targetDir: targetRoot,
        },
        null,
        2
      )
    );
  } else {
    console.log();
    if (installed.length > 0) {
      console.log(chalk.green(`Successfully installed ${installed.length} skill(s).`));
      console.log(chalk.dim("Restart Claude Code or run /refresh to see new skills."));
    }
    if (failed.length > 0) {
      console.log(chalk.yellow(`Failed to install ${failed.length} skill(s).`));
      process.exit(1);
    }
  }
}
