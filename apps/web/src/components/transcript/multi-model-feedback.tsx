"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Zap,
  GitBranch,
  Layers,
  Shield,
  Search,
  Smartphone,
  Activity,
  FileJson,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  source: "gpt" | "gemini";
  implemented: boolean;
  icon: typeof CheckCircle2;
  category: "architecture" | "feature" | "reliability" | "performance";
}

const feedbackItems: FeedbackItem[] = [
  {
    id: "packages-core",
    title: "Shared packages/core Package",
    description:
      "Decouple CLI from web app with shared core package for types, registry, and search",
    source: "gpt",
    implemented: true,
    icon: Layers,
    category: "architecture",
  },
  {
    id: "bm25-search",
    title: "BM25 Search Engine",
    description:
      "Replace hash embeddings with proper BM25 ranking algorithm for better relevance",
    source: "gpt",
    implemented: true,
    icon: Search,
    category: "performance",
  },
  {
    id: "cac-parser",
    title: "CAC CLI Parser",
    description:
      "Replace ad-hoc flag parsing with cac for robust parsing, help generation, and completions",
    source: "gpt",
    implemented: true,
    icon: FileJson,
    category: "reliability",
  },
  {
    id: "skill-manifest",
    title: "Skill Manifest System",
    description:
      "Track installed skills with SHA256 hashes to detect user modifications before updates",
    source: "gpt",
    implemented: true,
    icon: Shield,
    category: "reliability",
  },
  {
    id: "yaml-safe",
    title: "YAML-Safe Frontmatter",
    description:
      "Use JSON.stringify for YAML values and add x_jfp_generated marker for safe updates",
    source: "gpt",
    implemented: true,
    icon: GitBranch,
    category: "reliability",
  },
  {
    id: "health-endpoints",
    title: "Health Check Endpoints",
    description:
      "Add /api/health for monitoring, load balancers, and CI/CD health gates",
    source: "gpt",
    implemented: true,
    icon: Activity,
    category: "reliability",
  },
  {
    id: "prompt-variables",
    title: "Prompt Templating System",
    description:
      "Support {{VARIABLE}} placeholders with --fill flag for CLI variable substitution",
    source: "gpt",
    implemented: true,
    icon: Sparkles,
    category: "feature",
  },
  {
    id: "changelog",
    title: "Prompt Changelog/Versioning",
    description:
      "Track changes to prompts with version history and change types",
    source: "gpt",
    implemented: true,
    icon: GitBranch,
    category: "feature",
  },
  {
    id: "live-registry",
    title: "Stale-While-Revalidate Registry",
    description:
      "CLI phones home for updated prompts without blocking startup",
    source: "gemini",
    implemented: true,
    icon: Zap,
    category: "architecture",
  },
  {
    id: "pwa",
    title: "Progressive Web App",
    description: "Service worker for offline access and installability",
    source: "gpt",
    implemented: false,
    icon: Smartphone,
    category: "feature",
  },
  {
    id: "workflow-builder",
    title: "Workflow Builder UI",
    description: "Drag-and-drop interface for chaining prompts into workflows",
    source: "gpt",
    implemented: false,
    icon: Layers,
    category: "feature",
  },
];

const categoryColors = {
  architecture: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  feature: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  reliability: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  performance: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
};

function FeedbackCard({
  item,
  index,
}: {
  item: FeedbackItem;
  index: number;
}) {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={cn(
        "relative p-4 rounded-xl border transition-all",
        "bg-white dark:bg-zinc-900",
        item.implemented
          ? "border-emerald-200 dark:border-emerald-800/50"
          : "border-zinc-200 dark:border-zinc-800"
      )}
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3">
        {item.implemented ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
        )}
      </div>

      {/* Icon and title */}
      <div className="flex items-start gap-3 mb-2 pr-8">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            categoryColors[item.category]
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
            {item.title}
          </h4>
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              item.source === "gpt"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
            )}
          >
            {item.source === "gpt" ? "GPT-4" : "Gemini"}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400 ml-11">
        {item.description}
      </p>
    </motion.div>
  );
}

export function MultiModelFeedback() {
  const implemented = feedbackItems.filter((item) => item.implemented).length;
  const total = feedbackItems.length;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-zinc-700 dark:text-zinc-300">
            Multi-Model Feedback Loop
          </span>
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Refined by Multiple AI Models
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          After Claude created the initial plan, it was reviewed by GPT-4 and
          Gemini for architectural improvements, bug fixes, and feature ideas.
        </p>
      </div>

      {/* Process flow */}
      <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
          <MessageSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
            Claude Plan
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-400" />
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30">
          <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            GPT Review
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-400" />
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Gemini Review
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-400" />
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
          <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
            Claude Build
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {implemented}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Implemented
          </div>
        </div>
        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
        <div className="text-center">
          <div className="text-3xl font-bold text-zinc-400">
            {total - implemented}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Future Work
          </div>
        </div>
        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {Math.round((implemented / total) * 100)}%
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Adoption Rate
          </div>
        </div>
      </div>

      {/* Feedback grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {feedbackItems.map((item, index) => (
          <FeedbackCard key={item.id} item={item} index={index} />
        ))}
      </div>

      {/* Note */}
      <div className="mt-8 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
          <strong className="text-zinc-900 dark:text-zinc-100">
            The meta-demonstration:
          </strong>{" "}
          This multi-model review process is itself a prompt engineering pattern
          — using diverse AI perspectives to catch blind spots and improve
          architectural decisions.
        </p>
      </div>
    </section>
  );
}
