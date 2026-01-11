"use client";

import Link from "next/link";
import { Github, Menu, X, Sparkles, ShoppingBasket, Crown } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { BasketSidebar } from "./BasketSidebar";
import { Button } from "./ui/button";
import { useBasket } from "@/hooks/use-basket";
import { cn } from "@/lib/utils";

// Pro site URL - use env var if available, otherwise default
const PRO_URL = process.env.NEXT_PUBLIC_PRO_URL ?? "https://pro.jeffreysprompts.com";

const navLinks = [
  { href: "/", label: "Prompts" },
  { href: "/bundles", label: "Bundles" },
  { href: "/contribute", label: "Contribute" },
  { href: "/workflows", label: "Workflows" },
  { href: "/how_it_was_made", label: "How It Was Made" },
];

export function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [basketOpen, setBasketOpen] = useState(false);
  const { items } = useBasket();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg transition-colors hover:text-primary"
        >
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">JeffreysPrompts</span>
          <span className="sm:hidden">JFP</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Pro links - desktop only */}
          <a
            href={`${PRO_URL}/login`}
            className="hidden lg:inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            rel="noopener noreferrer"
          >
            Login
          </a>
          <Button
            variant="default"
            size="sm"
            asChild
            className="hidden lg:inline-flex gap-1.5 h-8 px-3"
          >
            <a href={PRO_URL} rel="noopener noreferrer">
              <Crown className="h-3.5 w-3.5" />
              Go Pro
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 relative touch-manipulation"
            onClick={() => setBasketOpen(true)}
            aria-label={`Open basket (${items.length} items)`}
          >
            <ShoppingBasket className="h-5 w-5" />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {items.length > 9 ? "9+" : items.length}
              </span>
            )}
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild className="h-11 w-11 touch-manipulation">
            <a
              href="https://github.com/Dicklesworthstone/jeffreysprompts.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-11 w-11 touch-manipulation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-[500px]" : "max-h-0"
        )}
      >
        <nav className="container mx-auto px-4 py-2 border-t border-border/40" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block min-h-[44px] py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground touch-manipulation"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* Pro links in mobile menu */}
          <div className="border-t border-border/40 mt-2 pt-2">
            <a
              href={`${PRO_URL}/login`}
              className="block min-h-[44px] py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground touch-manipulation"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </a>
            <a
              href={PRO_URL}
              className="flex items-center gap-2 min-h-[44px] py-3 text-sm font-medium text-primary transition-colors hover:text-primary/80 touch-manipulation"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Crown className="h-4 w-4" />
              Go Pro
            </a>
          </div>
        </nav>
      </div>

      {/* Basket Sidebar */}
      <BasketSidebar isOpen={basketOpen} onClose={() => setBasketOpen(false)} />
    </header>
  );
}
