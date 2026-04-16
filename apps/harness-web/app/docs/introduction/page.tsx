import type { Metadata } from "next";

import { CommandBlock } from "@/components/command-block";

export const metadata: Metadata = {
  title: "Introduction",
  description: "What Harness Kit is, how it works, and how to onboard a project step by step.",
};

export default function IntroductionPage() {
  return (
    <article className="bundle-content">
      <h1>Introduction</h1>
      <p>
        Harness Kit helps teams scaffold repeatable AI engineering guardrails with installable bundles. Instead of
        manually copying prompts, rules, and agent configs across repositories, you define your baseline once and apply
        it consistently with CLI commands.
      </p>
      <h2>Why teams use Harness Kit</h2>
      <ul>
        <li>Standardize AI workflow conventions across multiple projects.</li>
        <li>Reduce setup drift between local repos and team expectations.</li>
        <li>Install capabilities incrementally with explicit, reviewable changes.</li>
        <li>Keep docs, bundle metadata, and install flows aligned in one system.</li>
      </ul>
      <h2>Core concepts</h2>
      <ul>
        <li>
          <strong>Bundle:</strong> a packaged capability (for example <code>tdd</code>, <code>nextjs</code>,{" "}
          <code>security-review</code>) that installs files and configuration for a specific workflow.
        </li>
        <li>
          <strong>Category:</strong> grouping model such as workflow, stack, or tech stack for easier discovery.
        </li>
        <li>
          <strong>Harness config:</strong> a tracked project state file that records which bundles are installed.
        </li>
      </ul>
      <h2>What Harness Kit generates</h2>
      <ul>
        <li>
          Baseline guidance files like <code>CLAUDE.md</code> and <code>AGENTS.md</code>.
        </li>
        <li>
          Project harness configuration (<code>harness.json</code>) for selected bundles and defaults.
        </li>
        <li>Optional automation assets such as hooks, memories, and role-focused instructions.</li>
        <li>MCP and tool settings required by installed bundles.</li>
      </ul>
      <h2>Getting started path</h2>
      <ul>
        <li>
          <strong>Step 1:</strong> Run <code>init</code> in your project root.
        </li>
        <li>
          <strong>Step 2:</strong> Use the wizard to choose stack, workflow, and integration bundles for your team.
        </li>
        <li>
          <strong>Step 3:</strong> Verify generated files, then add more bundles incrementally.
        </li>
      </ul>
      <CommandBlock command="npx @harness-kit/cli@latest init" label="Initialize with npx" />
      <CommandBlock command="harness-kit status" label="Validate generated harness state" className="mt-3" />
      <CommandBlock command="harness-kit add tdd" label="Add one workflow bundle" className="mt-3" />
      <h2>What success looks like</h2>
      <ul>
        <li>Your repository contains the expected Harness Kit files and settings.</li>
        <li>Team members can run the same commands and get consistent outputs.</li>
        <li>New capabilities are added with small, understandable diffs.</li>
        <li>Bundle docs map directly to executable install commands.</li>
      </ul>
      <h2>Recommended onboarding checklist</h2>
      <ol>
        <li>Run <code>harness-kit init</code> in a clean branch.</li>
        <li>Review generated files and commit baseline setup.</li>
        <li>Add one or two critical bundles (for example TDD and security review).</li>
        <li>Run <code>harness-kit status</code> to confirm health.</li>
        <li>Share your selected baseline bundles with the team.</li>
      </ol>
      <h2>What to read next</h2>
      <ol>
        <li>Open <strong>Installation</strong> for setup options and verification flow.</li>
        <li>Open <strong>CLI</strong> for full command and flags reference.</li>
        <li>Open <strong>Bundles</strong> to browse all available capabilities by category.</li>
      </ol>
    </article>
  );
}
