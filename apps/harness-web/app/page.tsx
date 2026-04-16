import Link from "next/link";

import { CommandBlock } from "@/components/command-block";
import { Logo } from "@/components/logo";
import { bundleInstallCommand } from "@/lib/commands";
import { CategoryBadge } from "@/components/category-badge";
import { readBundleIndex } from "@/lib/bundles";

export default function Home() {
  const bundles = readBundleIndex();
  const featured = bundles.slice(0, 6);

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16 md:py-24">
      <section className="glass-panel rounded-3xl border-2 p-8 md:p-12">
        <Logo showText={false} className="relative mb-4" iconClassName="size-10 rounded-md" />
        <div className="relative flex flex-wrap items-center gap-2">
          <span className="inline-flex h-6 items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 pt-px text-[11px]/none font-semibold uppercase tracking-[0.16em] text-primary">
            harness-kit
          </span>
          <span className="inline-flex h-6 items-center rounded-full border border-elevated-border bg-surface-glass px-2.5 pt-px text-[11px]/none font-medium text-muted-foreground">
            metadata-driven docs
          </span>
          <span className="inline-flex h-6 items-center rounded-full border border-elevated-border bg-surface-glass px-2.5 pt-px text-[11px]/none font-medium text-muted-foreground">
            copy-ready install commands
          </span>
        </div>
        <h1 className="relative mt-4 max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
          Build and ship AI harness workflows with a clean bundle-first documentation hub.
        </h1>
        <p className="relative mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          `harness-web` powers discovery across workflow, stack, and tech-stack bundles. Everything stays in sync
          with source READMEs so docs remain accurate by default.
        </p>
        <div className="relative mt-8 flex w-full flex-wrap justify-end gap-3">
          <Link href="/docs" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Documentation
          </Link>
        </div>
      </section>
      <section className="mt-6">
        <article className="card-frame rounded-2xl p-5">
          <h2 className="text-base font-semibold tracking-tight">Quick install</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Start immediately with the latest CLI and run project initialization in one command.
          </p>
          <CommandBlock command="npx @harness-kit/cli@latest init" label="Bootstrap command" className="mt-4 w-full" />
        </article>
      </section>
      <section className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Bundle-first docs",
            body: "Each catalog entry maps directly to registry content for transparent setup guidance.",
          },
          {
            title: "Fast category navigation",
            body: "Scan workflows, language stacks, and tool stacks with a responsive docs IA.",
          },
          {
            title: "Readable by design",
            body: "Glass surfaces, strong contrast, and reduced-motion support for calmer reading.",
          },
        ].map((item) => (
          <article key={item.title} className="card-frame rounded-2xl p-5">
            <h2 className="text-base font-semibold tracking-tight">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
          </article>
        ))}
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <article className="card-frame rounded-2xl p-6">
          <h2 className="text-xl font-semibold tracking-tight">How installation works</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pick a bundle from the docs, run the install command, and harness-kit updates your project artifacts.
            The command format stays consistent across all bundles.
          </p>
          <CommandBlock command={bundleInstallCommand("tdd")} label="Install" className="mt-4 w-full" />
          <p className="mt-3 text-xs text-muted-foreground">
            Replace <code>tdd</code> with any bundle slug such as <code>nextjs</code>, <code>security-review</code>
            , or <code>langgraph</code>.
          </p>
        </article>
        <article className="card-frame rounded-2xl p-6">
          <h2 className="text-xl font-semibold tracking-tight">What you get</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Bundle docs synced from source README files</li>
            <li>Workflow, stack, and tech-stack coverage in one catalog</li>
            <li>Production-minded guardrails for quality, tests, and security</li>
            <li>Responsive docs navigation for desktop and mobile</li>
          </ul>
        </article>
      </section>
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Featured bundles</h2>
          <Link href="/docs" className="text-sm font-medium text-primary hover:underline">
            Explore full catalog
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((bundle) => (
            <article key={`${bundle.category}-${bundle.slug}`} className="card-frame rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold tracking-tight">{bundle.title}</h3>
                <CategoryBadge category={bundle.category} />
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{bundle.description}</p>
              <CommandBlock command={bundleInstallCommand(bundle.slug)} label="Install" className="mt-3 w-full" />
              <Link
                href={`/docs/bundles/${bundle.category}/${bundle.slug}`}
                className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
              >
                Read bundle docs
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
