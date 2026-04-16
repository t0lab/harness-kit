import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">harness-kit</p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
        Build and document AI harness workflows with a bundle-first toolkit.
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        `harness-web` is the project website and docs portal. Browse bundles by category, inspect setup
        guidance, and keep docs synced directly from each bundle README.
      </p>
      <div className="flex gap-3">
        <Link href="/docs" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Open Docs
        </Link>
        <Link
          href="/docs"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Browse Bundles
        </Link>
      </div>
    </main>
  );
}
