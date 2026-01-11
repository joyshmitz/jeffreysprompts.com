"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useMotionValue, useTransform } from "framer-motion";
import {
  Clock,
  MessageSquare,
  Wrench,
  FileCode,
  Code2,
  Zap,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountUp, easings } from "@/hooks/useCountUp";
import { type ProcessedTranscript } from "@/lib/transcript/types";

interface EnhancedStatsProps {
  transcript: ProcessedTranscript;
}

interface AnimatedStatProps {
  icon: typeof Clock;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  detail?: string;
  gradient: string;
  glowColor: string;
  index: number;
  inView: boolean;
}

function AnimatedStat({
  icon: Icon,
  label,
  value,
  suffix = "",
  prefix = "",
  detail,
  gradient,
  glowColor,
  index,
  inView,
}: AnimatedStatProps) {
  const count = useCountUp({
    end: value,
    duration: 2000,
    delay: index * 100,
    enabled: inView,
    easing: easings.easeOutExpo,
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const rotateX = useTransform(mouseY, [-100, 100], [5, -5]);
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative perspective-1000"
    >
      {/* Glow effect on hover */}
      <div
        className={cn(
          "absolute -inset-0.5 rounded-2xl opacity-0 blur-xl transition-opacity duration-500",
          "group-hover:opacity-50",
          glowColor
        )}
      />

      {/* Card */}
      <div
        className={cn(
          "relative rounded-2xl p-5 sm:p-6",
          "bg-white/80 dark:bg-zinc-900/80",
          "backdrop-blur-xl",
          "border border-zinc-200/50 dark:border-zinc-700/50",
          "shadow-lg shadow-zinc-900/5 dark:shadow-zinc-900/30",
          "group-hover:border-zinc-300 dark:group-hover:border-zinc-600",
          "group-hover:shadow-xl",
          "transition-all duration-300"
        )}
      >
        {/* Gradient accent line */}
        <div
          className={cn(
            "absolute top-0 left-6 right-6 h-px",
            "bg-gradient-to-r",
            gradient,
            "opacity-0 group-hover:opacity-100 transition-opacity"
          )}
        />

        {/* Icon with gradient background */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br",
              gradient,
              "shadow-lg",
              "transform transition-transform duration-300 group-hover:scale-110"
            )}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <TrendingUp
            className={cn(
              "w-4 h-4 text-zinc-400",
              "opacity-0 group-hover:opacity-100",
              "transform translate-x-2 group-hover:translate-x-0",
              "transition-all duration-300"
            )}
          />
        </div>

        {/* Value with animated counter */}
        <div className="mb-1">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {prefix}
            {count.toLocaleString()}
            {suffix}
          </span>
        </div>

        {/* Label */}
        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </div>

        {/* Detail */}
        {detail && (
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500 font-mono">
            {detail}
          </div>
        )}

        {/* Subtle shine effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl",
            "bg-gradient-to-br from-white/10 via-transparent to-transparent",
            "pointer-events-none"
          )}
        />
      </div>
    </motion.div>
  );
}

export function EnhancedStats({ transcript }: EnhancedStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { stats, duration } = transcript.meta;

  // Parse duration string to get numeric value
  const durationHours = parseFloat(duration.replace(/[^0-9.]/g, "")) || 8;

  interface StatItem {
    icon: typeof Clock;
    label: string;
    value: number;
    suffix?: string;
    prefix?: string;
    detail?: string;
    gradient: string;
    glowColor: string;
  }

  const statItems: StatItem[] = [
    {
      icon: Clock,
      label: "Session Duration",
      value: durationHours,
      suffix: "h",
      gradient: "from-blue-500 to-cyan-400",
      glowColor: "bg-blue-500/30",
    },
    {
      icon: MessageSquare,
      label: "Total Messages",
      value: stats.userMessages + stats.assistantMessages,
      detail: `${stats.userMessages} prompts → ${stats.assistantMessages} responses`,
      gradient: "from-violet-500 to-purple-400",
      glowColor: "bg-violet-500/30",
    },
    {
      icon: Wrench,
      label: "Tool Invocations",
      value: stats.toolCalls,
      detail: "Read, Write, Edit, Bash, Glob...",
      gradient: "from-amber-500 to-orange-400",
      glowColor: "bg-amber-500/30",
    },
    {
      icon: FileCode,
      label: "Files Created",
      value: stats.filesEdited,
      detail: "TypeScript, TSX, CSS, JSON",
      gradient: "from-emerald-500 to-green-400",
      glowColor: "bg-emerald-500/30",
    },
    {
      icon: Code2,
      label: "Lines of Code",
      value: stats.linesWritten,
      detail: "Production-ready code",
      gradient: "from-pink-500 to-rose-400",
      glowColor: "bg-pink-500/30",
    },
    {
      icon: Zap,
      label: "Tokens Processed",
      value: Math.round(stats.tokensUsed / 1000),
      suffix: "K",
      detail: `≈ $${((stats.tokensUsed / 1000000) * 15).toFixed(2)} cost`,
      gradient: "from-orange-500 to-red-400",
      glowColor: "bg-orange-500/30",
    },
  ];

  return (
    <div ref={ref} className="w-full">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        className="text-center mb-10"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          By the Numbers
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
          Real metrics from the session that built this entire platform
        </p>
      </motion.div>

      {/* Stats grid - responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statItems.map((stat, index) => (
          <AnimatedStat
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            suffix={stat.suffix}
            prefix={stat.prefix}
            detail={stat.detail}
            gradient={stat.gradient}
            glowColor={stat.glowColor}
            index={index}
            inView={isInView}
          />
        ))}
      </div>
    </div>
  );
}
