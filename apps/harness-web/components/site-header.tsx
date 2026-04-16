import Link from "next/link";
import { BookText } from "lucide-react";

import { getBundleGroups } from "@/components/bundle-nav";
import { GithubIcon } from "@/components/icons/github-icon";
import { Logo } from "@/components/logo";
import { MobileDocsNav } from "@/components/mobile-docs-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { readBundleIndex } from "@/lib/bundles";

export function SiteHeader() {
  const groups = getBundleGroups(readBundleIndex());

  return (
    <header className="flex-none border-b border-elevated-border bg-surface-glass/90 supports-backdrop-filter:backdrop-blur-xl">
      <div className="flex h-16 w-full items-center justify-between gap-3 px-3 md:px-4">
        <div className="flex items-center gap-2">
          <MobileDocsNav groups={groups} />
          <Logo className="text-sm md:text-base" />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/docs" className={buttonVariants({ size: "sm", className: "gap-1.5" })}>
            <BookText className="size-4" aria-hidden="true" />
            Docs
          </Link>
          <Link
            href="https://github.com/t0lab/harness-kit"
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              size: "sm",
              variant: "outline",
              className:
                "gap-1.5 !border !border-foreground/60 bg-background/80 shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.35)] hover:!border-foreground/80 hover:bg-accent",
            })}
          >
            <GithubIcon className="size-4" />
            GitHub
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
