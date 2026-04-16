import Link from "next/link";
import { notFound } from "next/navigation";

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
      <div className="rounded-xl border bg-card p-5 md:p-7">
        <MdxContent source={source} />
      </div>
    </div>
  );
}
