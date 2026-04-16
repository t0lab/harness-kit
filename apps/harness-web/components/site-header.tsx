import Link from "next/link";
import { CommandIcon } from "lucide-react";

import { getBundleGroups } from "@/components/bundle-nav";
import { MobileDocsNav } from "@/components/mobile-docs-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { readBundleIndex } from "@/lib/bundles";

export function SiteHeader() {
  const groups = getBundleGroups(readBundleIndex());

  return (
    <header className="sticky top-0 z-30 border-b border-elevated-border bg-surface-glass/90 supports-backdrop-filter:backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <MobileDocsNav groups={groups} />
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight md:text-base">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <CommandIcon className="size-3.5" />
            </span>
            <span>harness-kit docs</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/docs" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Docs
          </Link>
          <Link href="/docs" className={buttonVariants({ size: "sm" })}>
            Browse Bundles
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
