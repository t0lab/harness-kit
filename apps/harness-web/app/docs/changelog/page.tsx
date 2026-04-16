import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Change log",
  description: "Recent docs and CLI-facing updates in Harness Kit.",
};

export default function ChangelogPage() {
  return (
    <article className="bundle-content">
      <h1>Change log</h1>
      <p>Track notable updates to the CLI and documentation experience to plan upgrades with confidence.</p>
      <h2>Latest docs updates</h2>
      <ul>
        <li>Getting Started pages were expanded with step-by-step guidance and clearer onboarding flow.</li>
        <li>Command blocks now include copy buttons to reduce friction when running setup commands.</li>
        <li>CLI page now documents a practical workflow: init, add, list, then status verification.</li>
      </ul>
      <h2>Previous improvements</h2>
      <ul>
        <li>Docs navigation now includes foundational pages (Introduction, Installation, Components, CLI).</li>
        <li>Bundle docs metadata and naming were aligned across pages and header labels.</li>
        <li>Docs layout was refined for independent sidebar/main scroll containers.</li>
      </ul>
      <p>For full history and implementation details, check git commit history in the repository root.</p>
    </article>
  );
}
