"use client";

import { motion } from "framer-motion";
import {
  Clock,
  MessageSquare,
  Wrench,
  FileCode,
  Code2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type ProcessedTranscript } from "@/lib/transcript/types";
import { formatNumber } from "@/lib/transcript/utils";

interface StatsDashboardProps {
  transcript: ProcessedTranscript;
}

interface StatCardProps {
  icon: typeof Clock;
  label: string;
  value: string | number;
  detail?: string;
  color: string;
  index: number;
}

function StatCard({ icon: Icon, label, value, detail, color, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative rounded-xl p-4 border",
        "bg-zinc-50 dark:bg-zinc-900",
        "border-zinc-200 dark:border-zinc-800",
        "hover:border-zinc-300 dark:hover:border-zinc-700",
        "transition-colors duration-200"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
          color
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {typeof value === "number" ? formatNumber(value) : value}
      </div>

      {/* Label */}
      <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
        {label}
      </div>

      {/* Detail */}
      {detail && (
        <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
          {detail}
        </div>
      )}
    </motion.div>
  );
}

export function StatsDashboard({ transcript }: StatsDashboardProps) {
  const { stats } = transcript.meta;

  const statItems = [
    {
      icon: Clock,
      label: "Duration",
      value: transcript.meta.duration,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      value: stats.userMessages + stats.assistantMessages,
      detail: `${stats.userMessages} human, ${stats.assistantMessages} Claude`,
      color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    },
    {
      icon: Wrench,
      label: "Tool Calls",
      value: stats.toolCalls,
      color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    },
    {
      icon: FileCode,
      label: "Files Edited",
      value: stats.filesEdited,
      color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Code2,
      label: "Lines Written",
      value: stats.linesWritten,
      color: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
    },
    {
      icon: Zap,
      label: "Tokens Used",
      value: stats.tokensUsed,
      detail: `~$${((stats.tokensUsed / 1000) * 0.015).toFixed(2)} at $15/M`,
      color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((stat, index) => (
        <StatCard
          key={stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          detail={stat.detail}
          color={stat.color}
          index={index}
        />
      ))}
    </div>
  );
}
