"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type Theme } from "./theme-provider";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const themeOrder: Theme[] = ["light", "dark", "system"];

function getNextTheme(current: Theme): Theme {
  const currentIndex = themeOrder.indexOf(current);
  return themeOrder[(currentIndex + 1) % themeOrder.length];
}

function getThemeLabel(theme: Theme): string {
  switch (theme) {
    case "light":
      return "Light mode";
    case "dark":
      return "Dark mode";
    case "system":
      return "System preference";
  }
}

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const handleClick = () => {
    setTheme(getNextTheme(theme));
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn("relative h-9 w-9", className)}
      aria-label={`Current: ${getThemeLabel(theme)}. Click to change.`}
      title={getThemeLabel(theme)}
    >
      {theme === "light" && (
        <Sun className="h-5 w-5 transition-transform duration-200" />
      )}
      {theme === "dark" && (
        <Moon className="h-5 w-5 transition-transform duration-200" />
      )}
      {theme === "system" && (
        <Monitor className="h-5 w-5 transition-transform duration-200" />
      )}
      <span className="sr-only">{getThemeLabel(theme)}</span>
    </Button>
  );
}
