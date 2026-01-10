"use client";

/**
 * PromptDetailModal - Full prompt view with variable inputs
 *
 * Features:
 * - Desktop: Dialog modal with scrollable content
 * - Mobile: Bottom sheet (thumb-friendly)
 * - Variable inputs with localStorage persistence per prompt ID
 * - Copy/Install/Download buttons
 * - Context textarea for additional context
 * - Template rendering with variable substitution
 *
 * @module components/PromptDetailModal
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Copy,
  Check,
  Download,
  Terminal,
  Sparkles,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";
import {
  renderPrompt,
  extractVariables,
  formatVariableName,
  getVariablePlaceholder,
} from "@jeffreysprompts/core/template";
import { generateSkillMd } from "@jeffreysprompts/core/export";
import type { Prompt, PromptVariable } from "@jeffreysprompts/core/prompts/types";

interface PromptDetailModalProps {
  prompt: Prompt | null;
  open: boolean;
  onClose: () => void;
}

type VariableValues = Record<string, string>;

export function PromptDetailModal({
  prompt,
  open,
  onClose,
}: PromptDetailModalProps) {
  const isMobile = useIsMobile();
  const { success, error } = useToast();
  const [copied, setCopied] = useState(false);
  const [context, setContext] = useState("");

  // Store variable values per prompt ID in localStorage
  const storageKey = prompt ? `jfp-vars-${prompt.id}` : "";
  const [variableValues, setVariableValues] = useLocalStorage<VariableValues>(
    storageKey,
    {}
  );

  // Extract variables from content and merge with defined variables
  const promptVariables = useMemo(() => {
    if (!prompt) return [];

    // Get variables defined in the prompt
    const defined = prompt.variables ?? [];

    // Extract any additional variables from content that aren't defined
    const extractedNames = extractVariables(prompt.content);
    const definedNames = new Set(defined.map((v) => v.name));

    // Create entries for undefined variables found in content
    const undefinedVars: PromptVariable[] = extractedNames
      .filter((name) => !definedNames.has(name))
      .map((name) => ({
        name,
        label: formatVariableName(name),
        type: "text" as const,
      }));

    return [...defined, ...undefinedVars];
  }, [prompt]);

  // Render prompt with current variable values and context
  const renderedContent = useMemo(() => {
    if (!prompt) return "";
    let content = renderPrompt(prompt, variableValues);
    if (context.trim()) {
      content += `\n\n---\n\n**Context:**\n${context}`;
    }
    return content;
  }, [prompt, variableValues, context]);

  // Update a single variable value
  const updateVariable = useCallback(
    (name: string, value: string) => {
      setVariableValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    [setVariableValues]
  );

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(renderedContent);
      setCopied(true);
      success("Copied to clipboard", prompt?.title ?? "Prompt");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      error("Failed to copy", "Please try again");
    }
  }, [renderedContent, prompt, success, error]);

  // Generate install command and copy
  const handleInstall = useCallback(async () => {
    if (!prompt) return;

    const skillContent = generateSkillMd(prompt);
    // Using quoted heredoc (<<'EOF') so content doesn't need escaping
    const command = `mkdir -p ~/.config/claude/skills/${prompt.id} && cat > ~/.config/claude/skills/${prompt.id}/SKILL.md << 'EOF'\n${skillContent}\nEOF`;

    try {
      await navigator.clipboard.writeText(command);
      success("Install command copied", `Paste in terminal to install "${prompt.title}"`);
    } catch {
      error("Failed to copy", "Please try again");
    }
  }, [prompt, success, error]);

  // Download as markdown
  const handleDownload = useCallback(() => {
    if (!prompt) return;

    const blob = new Blob([renderedContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prompt.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success("Downloaded", `${prompt.id}.md`);
  }, [prompt, renderedContent, success]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCopied(false);
      setContext("");
    }
  }, [open]);

  if (!prompt) return null;

  // Modal content (shared between Dialog and BottomSheet)
  const modalContent = (
    <div className="space-y-6">
      {/* Header info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="capitalize">
            {prompt.category}
          </Badge>
          {prompt.featured && (
            <Badge className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              Featured
            </Badge>
          )}
          {prompt.estimatedTokens && (
            <span className="text-xs text-muted-foreground">
              ~{prompt.estimatedTokens} tokens
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{prompt.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {prompt.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Variable inputs */}
      {promptVariables.length > 0 && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
          <h4 className="text-sm font-medium text-foreground">Variables</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {promptVariables.map((variable) => (
              <div key={variable.name} className="space-y-1.5">
                <Label htmlFor={`var-${variable.name}`} className="text-xs">
                  {variable.label}
                  {variable.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                {variable.type === "multiline" ? (
                  <Textarea
                    id={`var-${variable.name}`}
                    value={variableValues[variable.name] ?? variable.default ?? ""}
                    onChange={(e) => updateVariable(variable.name, e.target.value)}
                    placeholder={getVariablePlaceholder(variable.name, variable.type)}
                    className="h-20 text-sm"
                  />
                ) : (
                  <Input
                    id={`var-${variable.name}`}
                    value={variableValues[variable.name] ?? variable.default ?? ""}
                    onChange={(e) => updateVariable(variable.name, e.target.value)}
                    placeholder={getVariablePlaceholder(variable.name, variable.type)}
                    className="text-sm"
                  />
                )}
                {variable.description && (
                  <p className="text-xs text-muted-foreground">
                    {variable.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context textarea */}
      <div className="space-y-2">
        <Label htmlFor="context" className="text-sm font-medium">
          Additional Context (optional)
        </Label>
        <Textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Paste code, file contents, or other context here..."
          className="h-24 text-sm font-mono"
        />
      </div>

      {/* Prompt content preview */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Rendered Prompt</Label>
        <div className="relative">
          <pre className="p-4 bg-muted/50 rounded-lg text-sm font-mono whitespace-pre-wrap break-words max-h-64 overflow-y-auto border border-border/50">
            {renderedContent}
          </pre>
        </div>
      </div>

      {/* When to use / Tips */}
      {(prompt.whenToUse?.length || prompt.tips?.length) && (
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          {prompt.whenToUse?.length && (
            <div className="space-y-2">
              <h4 className="font-medium">When to Use</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {prompt.whenToUse.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {prompt.tips?.length && (
            <div className="space-y-2">
              <h4 className="font-medium">Tips</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {prompt.tips.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button onClick={handleCopy} className="flex-1 sm:flex-none">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Prompt
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleInstall}
          className="flex-1 sm:flex-none"
        >
          <Terminal className="w-4 h-4 mr-2" />
          Install as Skill
        </Button>
        <Button
          variant="outline"
          onClick={handleDownload}
          className="flex-1 sm:flex-none"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );

  // Render based on device type
  if (isMobile) {
    return (
      <BottomSheet open={open} onClose={onClose} title={prompt.title}>
        {modalContent}
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader separated>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {prompt.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and customize the {prompt.title} prompt
          </DialogDescription>
        </DialogHeader>
        <DialogBody scrollable className="flex-1">
          {modalContent}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export default PromptDetailModal;
