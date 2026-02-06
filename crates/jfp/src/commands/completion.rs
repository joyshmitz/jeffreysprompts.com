//! Shell completion generation
//!
//! From EXISTING_JFP_STRUCTURE.md section 15 (completion):
//! - Generates shell completions for bash, zsh, fish, powershell
//! - Uses clap_complete for generation

use std::io;
use std::process::ExitCode;

use clap::Command;
use clap_complete::{generate, Shell};

pub fn run(shell: &str, mut cmd: Command) -> ExitCode {
    let shell = match shell.to_lowercase().as_str() {
        "bash" => Shell::Bash,
        "zsh" => Shell::Zsh,
        "fish" => Shell::Fish,
        "powershell" | "pwsh" => Shell::PowerShell,
        "elvish" => Shell::Elvish,
        _ => {
            eprintln!(
                "Unsupported shell: {}. Supported: bash, zsh, fish, powershell, elvish",
                shell
            );
            return ExitCode::FAILURE;
        }
    };

    let name = cmd.get_name().to_string();
    generate(shell, &mut cmd, name, &mut io::stdout());

    ExitCode::SUCCESS
}
