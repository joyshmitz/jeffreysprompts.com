import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { EnhancedHero } from "@/components/transcript/enhanced-hero";
import { EnhancedStats } from "@/components/transcript/enhanced-stats";
import { EnhancedTimeline } from "@/components/transcript/enhanced-timeline";
import { AnnotatedGuide } from "@/components/transcript/annotated-guide";
import { InsightCard } from "@/components/transcript/insight-card";
import { MultiModelFeedback } from "@/components/transcript/multi-model-feedback";
import { getAnnotations, getAnnotationsByType, guideSteps } from "@/data/annotations";
import type { ProcessedTranscript, TranscriptHighlight } from "@/lib/transcript/types";
import { cn } from "@/lib/utils";
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
    <EnhancedHero
      duration={duration}
      messageCount={stats.userMessages + stats.assistantMessages}
      linesWritten={stats.linesWritten}
      toolCalls={stats.toolCalls}
    />
  );
}

function IntroductionSection() {
  const cards = [
    {
      title: "Transparency",
      description:
        "AI-assisted development shouldn't be a black box. By sharing the complete transcript, you can see exactly how the prompts, decisions, and iterations led to this final result. Nothing is hidden or cherry-picked.",
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      title: "Education",
      description:
        "Learn prompt engineering from hundreds of real examples. See how to guide an AI coding agent through complex tasks, handle errors, iterate on designs, and make architectural decisions collaboratively.",
      gradient: "from-violet-500 to-purple-400",
    },
    {
      title: "Meta-Demonstration",
      description:
        "The prompts on this site helped build this site. It's a recursive demonstration of the very techniques we're sharing. The Idea Wizard generated improvements, the Robot-Mode Maker informed the CLI design.",
      gradient: "from-pink-500 to-rose-400",
    },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          Why Share This?
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
          Complete transparency in AI-assisted development
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={cn(
              "group relative rounded-2xl p-6",
              "bg-white/80 dark:bg-neutral-900/80",
              "backdrop-blur-xl",
              "border border-neutral-200/50 dark:border-neutral-700/50",
              "hover:border-neutral-300 dark:hover:border-neutral-600",
              "hover:shadow-xl",
              "transition-all duration-300"
            )}
          >
            {/* Gradient accent */}
            <div
              className={cn(
                "absolute top-0 left-4 right-4 h-1 rounded-b-full",
                "bg-gradient-to-r",
                card.gradient,
                "opacity-0 group-hover:opacity-100 transition-opacity"
              )}
            />

            <div
              className={cn(
                "w-10 h-10 rounded-xl mb-4",
                "bg-gradient-to-br",
                card.gradient,
                "flex items-center justify-center",
                "shadow-lg",
                "transition-transform duration-300 group-hover:scale-110"
              )}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>

            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {card.title}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section id="stats" className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <EnhancedStats transcript={transcript} />
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
    <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          Key Insights
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
          Notable moments and decisions from the development session
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {allHighlights.map((highlight, index) => (
          <InsightCard key={highlight.messageId} highlight={highlight} index={index} />
        ))}
      </div>
    </section>
  );
}

function GuideSection() {
  const { sections, meta } = transcript;
  const totalMessages = meta.stats.userMessages + meta.stats.assistantMessages;

  return (
    <AnnotatedGuide
      sections={sections}
      steps={guideSteps}
      totalMessages={totalMessages}
      duration={meta.duration}
    />
  );
}

function TimelineSection() {
  const { sections, messages } = transcript;

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-neutral-100 dark:bg-neutral-800"
              />
            ))}
          </div>
        }
      >
        <EnhancedTimeline messages={messages} sections={sections} />
      </Suspense>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-blue-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-3xl px-4 py-20 sm:py-28 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-6">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
            Ready to build?
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          Try These Prompts Yourself
        </h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-10 max-w-xl mx-auto">
          The same prompts that built this site are available for you. Browse, copy, or install
          them as Claude Code skills.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className={cn(
              "group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl",
              "bg-neutral-900 dark:bg-white",
              "text-white dark:text-neutral-900",
              "font-medium text-lg",
              "shadow-lg shadow-neutral-900/20 dark:shadow-white/10",
              "hover:shadow-xl hover:scale-[1.02]",
              "transition-all duration-200"
            )}
          >
            Browse Prompts
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/bundles"
            className={cn(
              "inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl",
              "bg-white/60 dark:bg-neutral-800/60",
              "backdrop-blur-md",
              "border border-neutral-200 dark:border-neutral-700",
              "text-neutral-700 dark:text-neutral-300",
              "font-medium text-lg",
              "hover:bg-white dark:hover:bg-neutral-800",
              "hover:shadow-md",
              "transition-all duration-200"
            )}
          >
            View Bundles
          </Link>
        </div>
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
      <GuideSection />
      <MultiModelFeedback />
      <InsightsSection />
      <TimelineSection />
      <CTASection />
    </div>
  );
}
