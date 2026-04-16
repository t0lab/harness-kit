import Link from "next/link";
import { notFound } from "next/navigation";

import { BundleInstallCommand } from "@/components/bundle-install-command";
import { CategoryBadge } from "@/components/category-badge";
import { MdxContent } from "@/components/mdx-content";
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
    <div className="space-y-4">
      <Link href="/docs" className="inline-block text-sm text-muted-foreground hover:text-foreground">
        Back to docs
      </Link>
      <div className="glass-panel rounded-2xl p-5 md:p-7">
        <div className="mb-5 space-y-4 border-b border-border/70 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={entry.category} />
            <span className="rounded-full border border-elevated-border bg-surface-glass px-2.5 py-1 text-xs text-muted-foreground">
              {entry.slug}
            </span>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{entry.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{entry.description}</p>
          <BundleInstallCommand slug={entry.slug} className="max-w-md" />
          <div className="rounded-lg border border-elevated-border bg-surface-soft px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Source:</span> {entry.sourceReadme}
          </div>
        </div>
        <MdxContent source={source} />
      </div>
    </div>
  );
}
