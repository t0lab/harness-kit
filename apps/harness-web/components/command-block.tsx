"use client";

import { useState, type MouseEvent } from "react";
import { CheckCheck, CopyIcon, TerminalIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
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
  const [activeIndex, setActiveIndex] = useState(0);

  const activeCommand = variants ? (variants[activeIndex]?.command ?? "") : (command ?? "");

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  function handleCopyClick(event?: MouseEvent<HTMLElement>) {
    event?.preventDefault();
    event?.stopPropagation();
    void copyText(activeCommand);
  }

  function handleVariantCopy(index: number) {
    setActiveIndex(index);
    void copyText(variants![index].command);
  }

  const copyButtonContent = copied ? (
    <>
      <CheckCheck className="size-3" />
      Copied
    </>
  ) : (
    <>
      <CopyIcon className="size-3" />
      Copy
    </>
  );

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
                buttonVariants({ variant: copied ? "secondary" : "outline", size: "xs" }),
                "cursor-pointer text-[11px]"
              )}
              aria-label="Copy command"
            >
              {copyButtonContent}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-28">
              {variants.map((variant, i) => (
                <DropdownMenuItem key={variant.label} onClick={() => handleVariantCopy(i)}>
                  <span className="text-xs font-medium">{variant.label}</span>
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
            {copyButtonContent}
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
