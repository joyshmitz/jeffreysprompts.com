"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, User, Bot, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TranscriptMessage, type TranscriptSection } from "@/lib/transcript/types";
import { formatTime } from "@/lib/transcript/utils";

interface TimelineProps {
  messages: TranscriptMessage[];
  sections: TranscriptSection[];
  onSelectMessage?: (id: string) => void;
}

interface MessagePreviewProps {
  message: TranscriptMessage;
  onClick?: () => void;
}

function MessagePreview({ message, onClick }: MessagePreviewProps) {
  const isUser = message.type === "user";
  const hasTools = message.toolCalls && message.toolCalls.length > 0;
  const Icon = isUser ? User : Bot;

  // Truncate content for preview
  const previewContent = message.content.length > 100
    ? message.content.slice(0, 100) + "..."
    : message.content;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-all",
        "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isUser
          ? "border-l-2 border-violet-500"
          : "border-l-2 border-zinc-400 dark:border-zinc-600"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn(
          "w-4 h-4",
          isUser ? "text-violet-500" : "text-zinc-500"
        )} />
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {isUser ? "Human" : "Claude"}
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {formatTime(message.timestamp)}
        </span>
        {hasTools && (
          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 ml-auto">
            <Wrench className="w-3 h-3" />
            {message.toolCalls!.length}
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">
        {previewContent}
      </p>
    </button>
  );
}

interface SectionGroupProps {
  section: TranscriptSection;
  messages: TranscriptMessage[];
  sectionIndex: number;
  onSelectMessage?: (id: string) => void;
}

function SectionGroup({ section, messages, sectionIndex, onSelectMessage }: SectionGroupProps) {
  const [isExpanded, setIsExpanded] = useState(sectionIndex === 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: sectionIndex * 0.1, duration: 0.4 }}
      className="relative"
    >
      {/* Section header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg",
          "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
          "transition-colors duration-200"
        )}
      >
        {/* Section number circle */}
        <div className="relative z-10 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">
          {sectionIndex + 1}
        </div>

        {/* Section info */}
        <div className="flex-1 text-left">
          <div className="font-medium text-zinc-900 dark:text-zinc-100">
            {section.title}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {section.summary}
          </div>
        </div>

        {/* Expand/collapse */}
        <div className="text-zinc-400">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Messages */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pl-11 space-y-2 py-2">
              {messages.map((msg) => (
                <MessagePreview
                  key={msg.id}
                  message={msg}
                  onClick={() => onSelectMessage?.(msg.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function TranscriptTimeline({ messages, sections, onSelectMessage }: TimelineProps) {
  // If no sections provided, create a default one
  const effectiveSections = sections.length > 0
    ? sections
    : [{
        id: "all",
        title: "Session",
        summary: `${messages.length} messages`,
        startIndex: 0,
        endIndex: messages.length - 1,
        tags: [],
      }];

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[1.125rem] top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-violet-400 to-violet-500 opacity-30" />

      {/* Section groups */}
      <div className="space-y-4">
        {effectiveSections.map((section, index) => {
          const sectionMessages = messages.slice(section.startIndex, section.endIndex + 1);
          return (
            <SectionGroup
              key={section.id}
              section={section}
              messages={sectionMessages}
              sectionIndex={index}
              onSelectMessage={onSelectMessage}
            />
          );
        })}
      </div>
    </div>
  );
}
