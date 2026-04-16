import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          harness-kit docs
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/docs" className={buttonVariants({ variant: "ghost", size: "sm" }) + " text-sm"}>
            Docs
          </Link>
          <Link href="/docs" className={buttonVariants({ size: "sm" }) + " text-sm"}>
            Browse Bundles
          </Link>
        </div>
      </div>
    </header>
  );
}
