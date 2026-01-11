"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Package,
  Search,
  Workflow,
  Menu,
  X,
  Gift,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";

interface TabItem {
  id: string;
  label: string;
  icon: typeof Home;
  href?: string;
  action?: "search" | "menu";
}

const tabs: TabItem[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "bundles", label: "Bundles", icon: Package, href: "/bundles" },
  { id: "search", label: "Search", icon: Search, action: "search" },
  { id: "workflows", label: "Workflows", icon: Workflow, href: "/workflows" },
  { id: "more", label: "More", icon: Menu, action: "menu" },
];

const moreMenuItems = [
  { label: "Contribute", icon: Gift, href: "/contribute" },
  { label: "How It's Made", icon: Info, href: "/how_it_was_made" },
];

interface BottomTabBarProps {
  /** Callback to open spotlight search */
  onOpenSearch?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * BottomTabBar - Mobile-first bottom navigation.
 *
 * Features:
 * - 5 tabs: Home, Bundles, Search, Workflows, More
 * - Glass morphism background with backdrop blur
 * - Hides on scroll down, shows on scroll up
 * - Haptic feedback on tap
 * - Safe area padding for iPhone notch
 * - Active state indicator
 *
 * @example
 * ```tsx
 * <BottomTabBar onOpenSearch={() => setSearchOpen(true)} />
 * ```
 */
export function BottomTabBar({ onOpenSearch, className }: BottomTabBarProps) {
  const pathname = usePathname();
  const haptic = useHaptic();

  const [isVisible, setIsVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      if (Math.abs(diff) > scrollThreshold) {
        if (diff > 0 && currentScrollY > 100) {
          // Scrolling down and not at top
          setIsVisible(false);
          setMenuOpen(false);
        } else {
          // Scrolling up
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if a tab is active
  const isActive = useCallback(
    (tab: TabItem) => {
      if (!tab.href) return false;
      if (tab.href === "/") return pathname === "/";
      return pathname.startsWith(tab.href);
    },
    [pathname]
  );

  // Handle tab click
  const handleTabClick = useCallback(
    (tab: TabItem) => {
      haptic.selection();

      if (tab.action === "search") {
        onOpenSearch?.();
      } else if (tab.action === "menu") {
        setMenuOpen((prev) => !prev);
      }
    },
    [haptic, onOpenSearch]
  );

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-tab-bar]")) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] right-4 z-40 md:hidden"
            data-tab-bar
          >
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg rounded-2xl shadow-xl border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden">
              {moreMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    haptic.light();
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3.5",
                    "text-sm font-medium",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    "transition-colors",
                    pathname === item.href && "text-indigo-600 dark:text-indigo-400"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab bar */}
      <motion.nav
        initial={false}
        animate={{
          y: isVisible ? 0 : 100,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className={cn(
          "fixed bottom-0 inset-x-0 z-50 md:hidden",
          "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl",
          "border-t border-zinc-200/50 dark:border-zinc-700/50",
          "pb-[env(safe-area-inset-bottom)]",
          className
        )}
        data-tab-bar
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.id === "more" && menuOpen ? X : tab.icon;

            const content = (
              <motion.div
                className={cn(
                  "flex flex-col items-center justify-center gap-1",
                  "w-full h-full px-3 py-2",
                  "rounded-xl",
                  "transition-colors",
                  active
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                )}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </motion.div>
            );

            if (tab.href) {
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => haptic.selection()}
                  className="flex-1 min-w-0 touch-manipulation"
                  aria-current={active ? "page" : undefined}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className="flex-1 min-w-0 touch-manipulation"
                aria-expanded={tab.action === "menu" ? menuOpen : undefined}
              >
                {content}
              </button>
            );
          })}
        </div>
      </motion.nav>

      {/* Spacer for content */}
      <div className="h-16 md:hidden pb-[env(safe-area-inset-bottom)]" />
    </>
  );
}

export default BottomTabBar;
