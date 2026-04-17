"use client";

import { useState, type MouseEvent } from "react";
import { CheckCheck, ChevronDown, CopyIcon, TerminalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type CommandVariant = {
  label: string;
  command: string;
};

type CommandBlockProps = {
  command?: string;
  variants?: CommandVariant[];
  label?: string;
  className?: string;
};

export function CommandBlock({ command, variants, label = "Command", className }: CommandBlockProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeCommand = variants ? (variants[activeIndex]?.command ?? "") : (command ?? "");

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setCopiedLabel(null);
      }, 1200);
    } catch {
      setCopied(false);
      setCopiedLabel(null);
    }
  }

  function handleCopyClick(event?: MouseEvent<HTMLElement>) {
    event?.preventDefault();
    event?.stopPropagation();
    void copyText(activeCommand);
  }

  function handleVariantCopy(index: number) {
    const variant = variants![index];
    setActiveIndex(index);
    setCopiedLabel(variant.label);
    void copyText(variant.command);
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-elevated-border bg-background/70 px-3 py-2 text-xs text-foreground/90",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <TerminalIcon className="size-3" />
          {label}
        </span>
        {variants && variants.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex h-6 cursor-pointer items-center gap-1 rounded-md border px-2 text-[11px] font-medium transition-colors outline-none",
                copied
                  ? "border-transparent bg-secondary text-secondary-foreground"
                  : "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              aria-label="Copy command"
            >
              {copied ? (
                <>
                  <CheckCheck className="size-3" />
                  Copied{copiedLabel ? ` ${copiedLabel}` : ""}
                </>
              ) : (
                <>
                  <CopyIcon className="size-3" />
                  Copy
                  <ChevronDown className="size-3 opacity-60" />
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-50">
              {variants.map((variant, i) => (
                <DropdownMenuItem
                  key={variant.label}
                  onClick={() => handleVariantCopy(i)}
                  className="flex flex-col items-start gap-0.5 py-1.5"
                >
                  <span className="text-xs font-medium">{variant.label}</span>
                  <span className="max-w-55 truncate font-mono text-[10px] text-muted-foreground">
                    {variant.command}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            type="button"
            variant={copied ? "secondary" : "outline"}
            size="xs"
            onClick={handleCopyClick}
            className="h-6 cursor-pointer px-2 text-[11px]"
            aria-label={`Copy command ${activeCommand}`}
          >
            {copied ? (
              <>
                <CheckCheck className="size-3" />
                Copied
              </>
            ) : (
              <>
                <CopyIcon className="size-3" />
                Copy
              </>
            )}
          </Button>
        )}
      </div>
      <button
        type="button"
        onClick={handleCopyClick}
        className="mt-1 w-full cursor-pointer overflow-hidden rounded-md border border-transparent bg-surface-soft px-2 py-1 text-left font-mono transition-colors duration-200 hover:border-elevated-border hover:bg-surface-strong"
        aria-label={`Copy command ${activeCommand}`}
      >
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{activeCommand}</span>
      </button>
    </div>
  );
}
