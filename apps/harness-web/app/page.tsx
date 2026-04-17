import Link from "next/link";
import { BookText, Rocket } from "lucide-react";

import { CommandBlock } from "@/components/command-block";
import { GithubIcon } from "@/components/icons/github-icon";
import { Logo } from "@/components/logo";
import { bundleInstallVariants, cliCommandVariants } from "@/lib/commands";
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
          Onboard AI coding guardrails in minutes, then scale them safely across projects.
        </h1>
        <p className="relative mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          Harness Kit helps teams reduce setup drift with installable bundles and auditable diffs. Start with one
          command, verify state, and grow capabilities incrementally.
        </p>
        <div className="relative mt-8 flex w-full flex-wrap justify-end gap-3">
          <Link
            href="/docs/quickstart"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Rocket className="size-4" aria-hidden="true" />
            Start in 5 minutes
          </Link>
          <Link href="/docs" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium">
            <BookText className="size-4" aria-hidden="true" />
            Browse docs
          </Link>
          <Link
            href="https://github.com/t0lab/harness-kit"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium"
          >
            <GithubIcon className="size-4" />
            GitHub repo
          </Link>
        </div>
      </section>
      <section className="mt-6">
        <article className="card-frame rounded-2xl p-5">
          <h2 className="text-base font-semibold tracking-tight">Quick install</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Start immediately with the latest CLI and run project initialization in one command.
          </p>
          <CommandBlock variants={cliCommandVariants("init")} label="Bootstrap command" className="mt-4 w-full" />
        </article>
      </section>
      <section className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Small, reviewable diffs",
            body: "Add one capability at a time so setup changes stay understandable and easy to audit.",
          },
          {
            title: "Consistent team baseline",
            body: "Standardize agent rules, skills, and harness state across repositories.",
          },
          {
            title: "Practical onboarding docs",
            body: "Follow quickstart, command reference, and troubleshooting without reading source code first.",
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
            Initialize once, add one bundle, and verify with status checks. The command shape stays consistent across
            bundles so onboarding is predictable for new contributors.
          </p>
          <CommandBlock variants={bundleInstallVariants("tdd")} label="Install" className="mt-4 w-full" />
          <p className="mt-3 text-xs text-muted-foreground">
            Replace <code>tdd</code> with any bundle slug such as <code>nextjs</code>, <code>security-review</code>
            , or <code>langgraph</code>.
          </p>
        </article>
        <article className="card-frame rounded-2xl p-6">
          <h2 className="text-xl font-semibold tracking-tight">What you get</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Project baseline files tracked in git</li>
            <li>Incremental bundle installation with explicit commands</li>
            <li>Verification flow for drift and install health</li>
            <li>Catalog of workflow, stack, and tech-stack capabilities</li>
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
              <CommandBlock variants={bundleInstallVariants(bundle.slug)} label="Install" className="mt-3 w-full" />
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
