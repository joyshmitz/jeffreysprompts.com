"use client";

import { useState } from "react";
import { ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface FeatureVotePanelProps {
  featureId: string;
  initialVoteCount: number;
  initialHasVoted: boolean;
}

export function FeatureVotePanel({
  featureId,
  initialVoteCount,
  initialHasVoted,
}: FeatureVotePanelProps) {
  const { error: toastError } = useToast();
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVoteToggle = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/roadmap/${encodeURIComponent(featureId)}/vote`, {
        method: hasVoted ? "DELETE" : "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        voteCount?: number;
      };

      if (!response.ok || typeof payload.voteCount !== "number") {
        throw new Error(
          payload.message ??
            (hasVoted ? "Failed to remove vote" : "Failed to register vote")
        );
      }

      setVoteCount(payload.voteCount);
      setHasVoted((current) => !current);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again in a moment.";
      toastError("Vote failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center border-r pr-6">
      <Button
        type="button"
        variant={hasVoted ? "default" : "ghost"}
        size="sm"
        className="flex flex-col h-auto py-2"
        aria-label={hasVoted ? "Remove vote" : "Vote for this feature"}
        aria-pressed={hasVoted}
        disabled={isSubmitting}
        onClick={handleVoteToggle}
      >
        {isSubmitting ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <ChevronUp className="h-6 w-6" />
        )}
      </Button>
      <span className="text-2xl font-bold">{voteCount}</span>
      <span className="text-xs text-muted-foreground">votes</span>
    </div>
  );
}
