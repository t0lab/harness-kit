import type { Metadata } from "next";

import { CommandBlock } from "@/components/command-block";
import { CLI_INIT_COMMAND, cliCommand } from "@/lib/commands";

export const metadata: Metadata = {
  title: "Quickstart",
  description: "First 5-10 minute Harness Kit flow: init, add, verify, and commit.",
};

export default function QuickstartPage() {
  return (
    <article className="bundle-content">
      <h1>Quickstart</h1>
      <p>Use this page for your first run. Copy commands in order and verify each step before continuing.</p>

      <h2>Prerequisites</h2>
      <ul>
        <li>Node.js 18+ installed.</li>
        <li>Run from your project root directory.</li>
        <li>Project tracked in git so you can review generated diffs.</li>
      </ul>

      <h2>Step 1: Initialize baseline</h2>
      <CommandBlock command={CLI_INIT_COMMAND} label="Initialize harness" />
      <p className="text-sm text-muted-foreground">
        Expected outcome: <code>harness.json</code>, <code>CLAUDE.md</code>, and <code>AGENTS.md</code> are generated.
      </p>

      <h2>Step 2: Add one bundle</h2>
      <CommandBlock command={cliCommand("add tdd")} label="Add first bundle" />
      <p className="text-sm text-muted-foreground">
        Start with one high-value bundle to keep the first diff small and easy to audit.
      </p>

      <h2>Step 3: Verify harness health</h2>
      <CommandBlock command={cliCommand("status")} label="Run health check" />
      <p className="text-sm text-muted-foreground">
        Expected outcome: no critical drift; installed bundle appears in harness state.
      </p>

      <h2>Step 4: Confirm installed bundles</h2>
      <CommandBlock command={cliCommand("list --installed")} label="List installed bundles" />

      <h2>Step 5: Commit baseline</h2>
      <ol>
        <li>Review generated files and scripts.</li>
        <li>Commit baseline setup in one commit.</li>
        <li>Add more bundles incrementally and verify after each add.</li>
      </ol>

      <h2>If you are blocked</h2>
      <p>Open <strong>Troubleshooting</strong> for the most common command failures and quick fixes.</p>
    </article>
  );
}
