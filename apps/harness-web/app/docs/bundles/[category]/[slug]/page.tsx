import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommandBlock } from "@/components/command-block";
import { CategoryBadge } from "@/components/category-badge";
import { MdxContent } from "@/components/mdx-content";
import { bundleInstallCommand } from "@/lib/commands";
import { readBundleDoc, readBundleIndex } from "@/lib/bundles";

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export function generateStaticParams() {
  return readBundleIndex().map((item) => ({
    category: item.category,
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const entry = readBundleIndex().find((item) => item.category === category && item.slug === slug);

  if (!entry) {
    return {
      title: "Bundle not found",
      description: "This harness-kit bundle documentation page does not exist.",
    };
  }

  return {
    title: entry.title,
    description: entry.description,
  };
}

export default async function BundleDocPage({ params }: PageProps) {
  const { category, slug } = await params;
  const entry = readBundleIndex().find((item) => item.category === category && item.slug === slug);
  if (!entry) notFound();

  let source = "";
  try {
    source = readBundleDoc(category, slug);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-5 md:space-y-6 flex flex-col flex-1 overflow-hidden">
      <Link href="/docs" className="inline-block text-sm text-muted-foreground hover:text-foreground">
        Back to docs
      </Link>
      <div className="glass-panel rounded-xl h-full overflow-hidden p-5 md:p-7">
        <div className="mb-6 space-y-4 border-b border-border/70 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={entry.category} />
            <span className="rounded-full border border-elevated-border bg-surface-glass px-2.5 py-1 text-xs text-muted-foreground">
              {entry.slug}
            </span>
          </div>
          <CommandBlock command={bundleInstallCommand(entry.slug)} label="Install" className="max-w-md" />
          <div className="rounded-lg border border-elevated-border bg-surface-soft px-3 py-2 text-xs text-muted-foreground truncate">
            <span className="font-medium text-foreground">Source:</span> {entry.sourceReadme}
          </div>
        </div>
        <MdxContent source={source} />
      </div>
    </div>
  );
}
