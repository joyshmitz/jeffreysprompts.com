import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Clock, MessageSquare, Wrench, FileCode } from "lucide-react";
import { StatsDashboard } from "@/components/transcript/stats-dashboard";
import { TranscriptTimeline } from "@/components/transcript/timeline";
import { InsightCard } from "@/components/transcript/insight-card";
import { getAnnotations } from "@/data/annotations";
import { type ProcessedTranscript } from "@/lib/transcript/types";

export const metadata: Metadata = {
  title: "How It Was Made | JeffreysPrompts.com",
  description:
    "The complete story of how JeffreysPrompts.com was designed, planned, and implemented in a single day using Claude Code.",
  openGraph: {
    title: "How It Was Made | JeffreysPrompts.com",
    description:
      "See the full Claude Code session transcript that built this site.",
    type: "article",
  },
};

// Placeholder transcript data - replace with actual data loading
const placeholderTranscript: ProcessedTranscript = {
  meta: {
    sessionId: "session-001",
    startTime: "2025-01-09T09:00:00Z",
    endTime: "2025-01-09T17:30:00Z",
    duration: "8h 30m",
    model: "claude-opus-4-5-20251101",
    stats: {
      userMessages: 42,
      assistantMessages: 84,
      toolCalls: 312,
      filesEdited: 47,
      linesWritten: 8500,
      tokensUsed: 850000,
    },
  },
  sections: [
    {
      id: "section-1",
      title: "Planning & Architecture",
      summary: "Initial discussion and system design",
      startIndex: 0,
      endIndex: 10,
      tags: ["planning", "architecture"],
    },
    {
      id: "section-2",
      title: "Core Implementation",
      summary: "Building the prompt registry and search",
      startIndex: 11,
      endIndex: 30,
      tags: ["implementation", "core"],
    },
    {
      id: "section-3",
      title: "UI Components",
      summary: "React components and styling",
      startIndex: 31,
      endIndex: 50,
      tags: ["ui", "components"],
    },
  ],
  messages: [
    {
      id: "msg-1",
      type: "user",
      timestamp: "2025-01-09T09:00:00Z",
      content: "Let's build JeffreysPrompts.com today. I want a beautiful website to showcase my prompts.",
    },
    {
      id: "msg-2",
      type: "assistant",
      timestamp: "2025-01-09T09:05:00Z",
      content: "I'll help you build JeffreysPrompts.com. Let me start by creating a comprehensive plan...",
      thinking: "This is an ambitious project. I should break it down into clear phases: planning, architecture, implementation, and polish.",
    },
  ],
  highlights: getAnnotations(),
};

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
              <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HowItWasMadePage() {
  const transcript = placeholderTranscript;
  const highlights = transcript.highlights;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Back navigation */}
      <div className="container mx-auto px-4 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to prompts
        </Link>
      </div>

      {/* Hero section */}
      <section className="relative overflow-hidden border-b dark:border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-amber-500/10" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
              Built in a Single Day
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-6">
              The complete, unedited Claude Code session transcript that designed,
              planned, and implemented this entire site.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Clock className="w-4 h-4 text-violet-500" />
                <span>{transcript.meta.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <MessageSquare className="w-4 h-4 text-violet-500" />
                <span>
                  {transcript.meta.stats.userMessages +
                    transcript.meta.stats.assistantMessages}{" "}
                  messages
                </span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Wrench className="w-4 h-4 text-violet-500" />
                <span>{transcript.meta.stats.toolCalls} tool calls</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <FileCode className="w-4 h-4 text-violet-500" />
                <span>{transcript.meta.stats.filesEdited} files</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats dashboard */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
          Session Statistics
        </h2>
        <StatsDashboard transcript={transcript} />
      </section>

      {/* Introduction */}
      <section className="container mx-auto px-4 py-12 border-t dark:border-zinc-800">
        <div className="max-w-3xl mx-auto prose prose-zinc dark:prose-invert">
          <h2>Why This Exists</h2>
          <p>
            <strong>Transparency.</strong> AI-assisted development shouldn't be a
            black box. This page shows exactly how Claude Code was used to build
            this site, including every prompt, tool call, and decision point.
          </p>
          <p>
            <strong>Education.</strong> Learn prompt engineering from hundreds of
            real examples. See what works, what doesn't, and how to iterate
            effectively.
          </p>
          <p>
            <strong>Meta-demonstration.</strong> The prompts on this site helped
            build this site. It's prompts all the way down.
          </p>
        </div>
      </section>

      {/* Key insights */}
      {highlights.length > 0 && (
        <section className="container mx-auto px-4 py-12 border-t dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
            Key Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <InsightCard key={highlight.messageId} highlight={highlight} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="container mx-auto px-4 py-12 border-t dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
          Session Timeline
        </h2>
        <Suspense fallback={<TimelineSkeleton />}>
          <TranscriptTimeline
            messages={transcript.messages}
            sections={transcript.sections}
          />
        </Suspense>
      </section>

      {/* Footer CTA */}
      <section className="container mx-auto px-4 py-16 border-t dark:border-zinc-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            Ready to supercharge your development?
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            These prompts helped build this site. Now they can help you too.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
          >
            Browse Prompts
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
