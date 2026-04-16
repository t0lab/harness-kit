import Link from "next/link";

import { getBundleGroups } from "@/components/bundle-nav";
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
          <Link href="/docs" className={buttonVariants({ size: "sm" })}>
            Docs
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
