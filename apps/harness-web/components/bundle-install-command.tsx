"use client";

import { useState, type MouseEvent } from "react";
import { CheckIcon, CopyIcon, TerminalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function bundleInstallCommand(slug: string) {
  return `harness-kit add ${slug}`;
}

export function BundleInstallCommand({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const command = bundleInstallCommand(slug);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  function handleCopyClick(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    void handleCopy();
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-elevated-border bg-background/70 px-3 py-2 text-xs text-foreground/90",
        className
      )}
      aria-label={`Install command for ${slug}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <TerminalIcon className="size-3" />
          Install
        </span>
        <Button
          type="button"
          variant={copied ? "secondary" : "outline"}
          size="xs"
          onClick={handleCopyClick}
          className="h-6 cursor-pointer px-2 text-[11px]"
          aria-label={`Copy install command for ${slug}`}
        >
          {copied ? (
            <>
              <CheckIcon className="size-3" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="size-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <button
        type="button"
        onClick={handleCopyClick}
        className="mt-1 w-full cursor-pointer overflow-hidden rounded-md border border-transparent bg-surface-soft px-2 py-1 text-left font-mono transition-colors duration-200 hover:border-elevated-border hover:bg-surface-strong"
        aria-label={`Copy install command ${command}`}
      >
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{command}</span>
      </button>
    </div>
  );
}
