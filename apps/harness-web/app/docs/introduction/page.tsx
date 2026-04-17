import type { Metadata } from "next";
import Link from "next/link";

import { CommandBlock } from "@/components/command-block";
import { CLI_INIT_COMMAND, cliCommand } from "@/lib/commands";

export const metadata: Metadata = {
  title: "Introduction",
  description: "What Harness Kit is and the fastest path from first run to team-ready baseline.",
};

export default function IntroductionPage() {
  return (
    <article className="bundle-content">
      <h1>Introduction</h1>
      <p>
        Harness Kit helps teams install repeatable AI engineering guardrails with small, reviewable diffs. Instead of
        manually copying prompts, rules, and agent configs between repositories, you define a baseline once and keep it
        consistent through CLI commands.
      </p>
      <h2>Why teams adopt it</h2>
      <ul>
        <li>Reduce setup drift across projects and contributors.</li>
        <li>Install capabilities incrementally, not all at once.</li>
        <li>Keep generated artifacts explicit and version controlled.</li>
        <li>Scale team conventions without copy-paste setup debt.</li>
      </ul>
      <h2>What changes in your repository</h2>
      <ul>
        <li>
          Baseline guidance files such as <code>CLAUDE.md</code> and <code>AGENTS.md</code>.
        </li>
        <li>
          A tracked harness state file (<code>harness.json</code>) listing installed bundles.
        </li>
        <li>
          Optional automation artifacts, for example rules, skills, hooks, and MCP settings.
        </li>
      </ul>
      <h2>Core concepts</h2>
      <ul>
        <li>
          <strong>Bundle:</strong> one installable capability (for example <code>tdd</code>, <code>nextjs</code>,{" "}
          <code>security-review</code>) that contributes project artifacts.
        </li>
        <li>Optional automation assets such as hooks, memories, and role-focused instructions.</li>
        <li>
          <strong>Bundle docs category:</strong> docs grouping for discovery (<code>workflow</code>,{" "}
          <code>stack</code>, <code>techstack</code>).
        </li>
        <li>
          <strong>CLI category filter:</strong> install-role filter for <code>harness-kit list --category</code> (for
          example <code>workflow-preset</code>, <code>memory</code>, <code>browser</code>).
        </li>
      </ul>
      <h2>Fastest onboarding path</h2>
      <ul>
        <li>
          <strong>Step 1:</strong> Open <strong>Quickstart</strong> and run the copy-paste flow.
        </li>
        <li>
          <strong>Step 2:</strong> Use <code>init</code> to create the baseline.
        </li>
        <li>
          <strong>Step 3:</strong> Add one bundle, verify with <code>status</code>, then commit.
        </li>
      </ul>
      <CommandBlock command={CLI_INIT_COMMAND} label="Initialize with npx" />
      <CommandBlock command={cliCommand("status")} label="Validate generated harness state" className="mt-3" />
      <CommandBlock command={cliCommand("add tdd")} label="Add one workflow bundle" className="mt-3" />
      <h2>Success criteria</h2>
      <ul>
        <li>Your repo contains expected harness files and no unknown setup drift.</li>
        <li>Teammates can run the same commands and get equivalent output.</li>
        <li>Each added capability lands as a small, auditable diff.</li>
      </ul>
      <h2>Official GitHub repository</h2>
      <p>
        Source code and project history are publicly available at{" "}
        <Link href="https://github.com/t0lab/harness-kit" target="_blank" rel="noreferrer">
          github.com/t0lab/harness-kit
        </Link>
        .
      </p>
      <h2>What to read next</h2>
      <ol>
        <li>Open <strong>Quickstart</strong> for the 5-10 minute first run flow.</li>
        <li>Open <strong>Installation</strong> for prerequisites and setup modes.</li>
        <li>Open <strong>CLI</strong> for command reference and category mapping.</li>
      </ol>
    </article>
  );
}
