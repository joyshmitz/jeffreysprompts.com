import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Clock, MessageSquare, Wrench, Code2, ArrowRight } from "lucide-react";
import { StatsDashboard } from "@/components/transcript/stats-dashboard";
import { TranscriptTimeline } from "@/components/transcript/timeline";
import { InsightCard } from "@/components/transcript/insight-card";
import { MultiModelFeedback } from "@/components/transcript/multi-model-feedback";
import { getAnnotations, getAnnotationsByType } from "@/data/annotations";
import type { ProcessedTranscript, TranscriptHighlight } from "@/lib/transcript/types";
// Import the processed transcript data
import processedTranscriptData from "@/data/processed-transcript.json";

export const metadata: Metadata = {
  title: "How It Was Made | JeffreysPrompts.com",
  description:
    "The complete, unedited Claude Code session transcript that designed, planned, and built JeffreysPrompts.com in a single day.",
  openGraph: {
    title: "How It Was Made - JeffreysPrompts.com",
    description:
      "Watch the complete Claude Code session that built this site in a single day",
  },
};

// Use the real processed transcript data
const transcript: ProcessedTranscript = {
  ...processedTranscriptData as unknown as ProcessedTranscript,
  highlights: getAnnotations(),
};

function HeroSection() {
  const { stats, duration } = transcript.meta;

  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-emerald-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-4xl px-4 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
          <Clock className="w-4 h-4" />
          <span>{duration} of live coding</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Built in a{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400">
            Single Day
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8">
          The complete, unedited Claude Code session transcript that designed, planned, and
          implemented this entire site — from first prompt to final deploy.
        </p>

        {/* Quick stats */}
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <MessageSquare className="w-4 h-4 text-violet-500" />
            <span>{stats.userMessages + stats.assistantMessages} messages</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Wrench className="w-4 h-4 text-amber-500" />
            <span>{stats.toolCalls.toLocaleString()} tool calls</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Code2 className="w-4 h-4 text-pink-500" />
            <span>{stats.linesWritten.toLocaleString()} lines</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function IntroductionSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <div className="prose prose-lg dark:prose-invert mx-auto">
        <h2>Why Share This?</h2>

        <h3>Transparency</h3>
        <p>
          AI-assisted development shouldn&apos;t be a black box. By sharing the complete transcript,
          you can see exactly how the prompts, decisions, and iterations led to this final result.
          Nothing is hidden or cherry-picked.
        </p>

        <h3>Education</h3>
        <p>
          Learn prompt engineering from hundreds of real examples. See how to guide an AI coding
          agent through complex tasks, handle errors, iterate on designs, and make architectural
          decisions collaboratively.
        </p>

        <h3>Meta-Demonstration</h3>
        <p>
          The prompts on this site helped build this site. It&apos;s a recursive demonstration of
          the very techniques we&apos;re sharing. The Idea Wizard generated improvements, the
          Robot-Mode Maker informed the CLI design, and the README Reviser shaped the documentation.
        </p>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 text-center">
        Session Statistics
      </h2>
      <StatsDashboard transcript={transcript} />
    </section>
  );
}

function InsightsSection() {
  const annotationsByType = getAnnotationsByType();
  const allHighlights: TranscriptHighlight[] = [
    ...annotationsByType.key_decision,
    ...annotationsByType.interesting_prompt,
    ...annotationsByType.clever_solution,
    ...annotationsByType.lesson_learned,
  ];

  if (allHighlights.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-center">
        Key Insights
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 text-center mb-8">
        Notable moments from the development session
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {allHighlights.map((highlight, index) => (
          <InsightCard key={highlight.messageId} highlight={highlight} index={index} />
        ))}
      </div>
    </section>
  );
}

function TimelineSection() {
  const { sections, messages } = transcript;

  if (messages.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-center">
          Session Timeline
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-center mb-8">
          The complete conversation, organized by development phase
        </p>

        {/* Placeholder for when transcript is available */}
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
          <Wrench className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-600 mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">
            Full transcript coming soon. Check back for the complete message-by-message breakdown.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-center">
        Session Timeline
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 text-center mb-8">
        The complete conversation, organized by development phase
      </p>

      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        }
      >
        <TranscriptTimeline messages={messages} sections={sections} />
      </Suspense>
    </section>
  );
}

function CTASection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Ready to Try These Prompts?
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        The same prompts that built this site are available for you to use. Browse, copy, or install
        them as Claude Code skills.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
        >
          Browse Prompts
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/bundles"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium transition-colors"
        >
          View Bundles
        </Link>
      </div>
    </section>
  );
}

export default function HowItWasMadePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <StatsSection />
      <IntroductionSection />
      <MultiModelFeedback />
      <InsightsSection />
      <TimelineSection />
      <CTASection />
    </div>
  );
}
