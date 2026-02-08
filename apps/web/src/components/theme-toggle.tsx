"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type Theme } from "./theme-provider";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
      className={cn("relative h-10 w-10 touch-manipulation rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors", className)}
      aria-label={`Current: ${getThemeLabel(theme)}. Click to change.`}
      title={getThemeLabel(theme)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.2, ease: "circOut" }}
          className="flex items-center justify-center"
        >
          {theme === "light" && <Sun className="h-5 w-5" />}
          {theme === "dark" && <Moon className="h-5 w-5" />}
          {theme === "system" && <Monitor className="h-5 w-5" />}
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">{getThemeLabel(theme)}</span>
    </Button>
  );
}
