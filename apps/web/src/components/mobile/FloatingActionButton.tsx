"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Copy, ShoppingBag, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";

interface FABAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  /** Actions to show when FAB is expanded */
  actions?: FABAction[];
  /** Primary action when FAB is tapped (if no actions provided) */
  onPress?: () => void;
  /** Position offset from bottom */
  bottomOffset?: number;
  /** Custom icon for main button */
  icon?: React.ReactNode;
  /** Hide FAB (e.g., when scrolling down) */
  hidden?: boolean;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

const defaultActions: FABAction[] = [
  {
    id: "search",
    icon: <Search className="w-5 h-5" />,
    label: "Search",
    onClick: () => {
      window.dispatchEvent(new Event("jfp:open-spotlight"));
    },
    color: "bg-sky-500",
  },
  {
    id: "basket",
    icon: <ShoppingBag className="w-5 h-5" />,
    label: "Basket",
    onClick: () => {
      window.dispatchEvent(new CustomEvent("toggle-basket"));
    },
    color: "bg-indigo-500",
  },
];

/**
 * FloatingActionButton - iOS/Android-style FAB for mobile quick actions.
 *
 * Features:
 * - Spring-based expand/collapse animation
 * - Staggered action button reveal
 * - Haptic feedback
 * - Glass-morphism backdrop
 * - Hide on scroll (optional)
 * - Thumb-zone optimized position
 *
 * @example
 * ```tsx
 * <FloatingActionButton
 *   actions={[
 *     { id: "search", icon: <Search />, label: "Search", onClick: handleSearch },
 *     { id: "add", icon: <Plus />, label: "Add", onClick: handleAdd },
 *   ]}
 * />
 * ```
 */
export function FloatingActionButton({
  actions = defaultActions,
  onPress,
  bottomOffset = 80,
  icon,
  hidden = false,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const haptic = useHaptic();

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleToggle = useCallback(() => {
    if (onPress && !actions.length) {
      onPress();
      haptic.medium();
      return;
    }
    setIsExpanded((prev) => !prev);
    haptic.medium();
  }, [onPress, actions.length, haptic]);

  const handleActionClick = useCallback(
    (action: FABAction) => {
      action.onClick();
      haptic.success();
      setIsExpanded(false);
    },
    [haptic]
  );

  const handleBackdropClick = useCallback(() => {
    setIsExpanded(false);
    haptic.light();
  }, [haptic]);

  // Only render on mobile
  if (!isMobile) return null;

  return (
    <>
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={handleBackdropClick}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <motion.div
        className="fixed right-4 z-50"
        style={{ bottom: bottomOffset }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{
          opacity: hidden ? 0 : 1,
          scale: hidden ? 0.8 : 1,
          y: hidden ? 20 : 0,
        }}
        transition={springConfig}
      >
        {/* Action buttons (expanded state) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="absolute bottom-16 right-0 flex flex-col-reverse items-end gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: {
                      ...springConfig,
                      delay: index * 0.05,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.5,
                    y: 10,
                    transition: { duration: 0.15 },
                  }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleActionClick(action)}
                  className="flex items-center gap-3"
                >
                  {/* Label pill */}
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: { delay: index * 0.05 + 0.1 },
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full",
                      "bg-white dark:bg-zinc-800",
                      "text-sm font-medium text-zinc-900 dark:text-zinc-100",
                      "shadow-lg shadow-black/10"
                    )}
                  >
                    {action.label}
                  </motion.span>

                  {/* Icon button */}
                  <div
                    className={cn(
                      "size-12 rounded-full flex items-center justify-center",
                      "shadow-lg shadow-black/20",
                      "text-white",
                      action.color || "bg-indigo-500"
                    )}
                  >
                    {action.icon}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleToggle}
          className={cn(
            "size-14 rounded-full flex items-center justify-center",
            "shadow-xl shadow-indigo-500/30",
            "text-white touch-manipulation",
            isExpanded
              ? "bg-zinc-800 dark:bg-zinc-700"
              : "bg-gradient-to-br from-indigo-500 to-indigo-600"
          )}
          style={{
            boxShadow: isExpanded
              ? "0 10px 40px -10px rgba(0,0,0,0.3)"
              : "0 10px 40px -10px rgba(99,102,241,0.5)",
          }}
          aria-label={isExpanded ? "Close menu" : "Open quick actions"}
          aria-expanded={isExpanded}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={springConfig}
          >
            {/* Plus rotates 45° to become × when expanded (don't swap icons - rotation handles it) */}
            {icon || <Plus className="w-6 h-6" />}
          </motion.div>
        </motion.button>
      </motion.div>
    </>
  );
}

/**
 * Preset: Copy-focused FAB for prompt pages
 */
export function CopyFAB({ onCopy }: { onCopy: () => void }) {
  const haptic = useHaptic();
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleCopy = useCallback(() => {
    onCopy();
    haptic.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopy, haptic]);

  if (!isMobile) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleCopy}
      className={cn(
        "fixed right-4 bottom-20 z-50",
        "size-14 rounded-full flex items-center justify-center",
        "shadow-xl text-white touch-manipulation",
        copied
          ? "bg-emerald-500 shadow-emerald-500/30"
          : "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/30"
      )}
      aria-label={copied ? "Copied!" : "Copy prompt"}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Copy className="w-6 h-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default FloatingActionButton;
