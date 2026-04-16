import type { Metadata } from "next";

import { CommandBlock } from "@/components/command-block";

export const metadata: Metadata = {
  title: "CLI",
  description: "Command reference for initializing, extending, and inspecting Harness Kit setups.",
};

export default function CliPage() {
  return (
    <article className="bundle-content">
      <h1>CLI</h1>
      <p>
        Use the CLI to initialize your harness, add bundles, and audit project health. This page documents commands and
        flags supported by the current CLI implementation.
      </p>
      <h2>Global usage</h2>
      <CommandBlock command="harness-kit --help" label="Show all commands" />
      <CommandBlock command="harness-kit --version" label="Show CLI version" className="mt-3" />
      <h2>Core commands</h2>
      <CommandBlock command="harness-kit init" label="Initialize harness in current project" />
      <CommandBlock command="harness-kit add <bundle>" label="Add one bundle by slug" className="mt-3" />
      <CommandBlock command="harness-kit list" label="List available bundles" className="mt-3" />
      <CommandBlock command="harness-kit status" label="Inspect installed harness state" className="mt-3" />
      <CommandBlock command="harness-kit activate" label="Run post-install activations" className="mt-3" />
      <CommandBlock command="harness-kit budget" label="Measure context-window cost" className="mt-3" />

      <h2>Command reference</h2>
      <h3>
        <code>init</code>
      </h3>
      <p>Initialize Harness Kit in the current project and run the setup wizard.</p>
      <CommandBlock command="harness-kit init" label="Run setup wizard" />
      <p>
        <strong>Flags:</strong> No command-specific flags currently.
      </p>

      <h3>
        <code>add &lt;bundle&gt;</code>
      </h3>
      <p>Add a bundle to the current harness and install its artifacts.</p>
      <CommandBlock command="harness-kit add tdd" label="Add bundle by slug" />
      <p>
        <strong>Flags:</strong>
      </p>
      <ul>
        <li>
          <code>--role &lt;role&gt;</code>: override default bundle role.
        </li>
        <li>
          <code>-y</code>, <code>--yes</code>: skip re-install confirmation prompt.
        </li>
        <li>
          <code>--interactive-skills</code>: run skills setup interactively (instead of default non-interactive mode).
        </li>
      </ul>

      <h3>
        <code>list</code>
      </h3>
      <p>List available bundles, optionally filtered by category or installed state.</p>
      <CommandBlock command="harness-kit list --category workflow-preset" label="Filter by category" />
      <CommandBlock command="harness-kit list --installed" label="Show installed bundles only" className="mt-3" />
      <p>
        <strong>Flags:</strong>
      </p>
      <ul>
        <li>
          <code>--category &lt;cat&gt;</code>: filter by category.
        </li>
        <li>
          <code>--installed</code>: show only installed bundles.
        </li>
      </ul>

      <h3>
        <code>status</code>
      </h3>
      <p>Audit harness health: bundle drift, required core files, and environment variable readiness.</p>
      <CommandBlock command="harness-kit status" label="Run health audit" />
      <p>
        <strong>Flags:</strong> No command-specific flags currently.
      </p>

      <h3>
        <code>activate</code>
      </h3>
      <p>Run idempotent post-install activations for installed bundles (for example Git hook activation).</p>
      <CommandBlock command="harness-kit activate" label="Run activation steps" />
      <p>
        <strong>Flags:</strong> No command-specific flags currently.
      </p>

      <h3>
        <code>budget</code>
      </h3>
      <p>Measure context-window token cost of installed harness-managed files.</p>
      <CommandBlock command="harness-kit budget" label="Human-readable budget report" />
      <CommandBlock command="harness-kit budget --json" label="Machine-readable JSON output" className="mt-3" />
      <CommandBlock
        command="harness-kit budget --context-window 200000"
        label="Override context window for calculation"
        className="mt-3"
      />
      <p>
        <strong>Flags:</strong>
      </p>
      <ul>
        <li>
          <code>--json</code>: output JSON report.
        </li>
        <li>
          <code>--context-window &lt;tokens&gt;</code>: override context window used for budget math.
        </li>
      </ul>

      <h2>Recommended workflow</h2>
      <ol>
        <li>Run <code>init</code> once to scaffold baseline files and defaults.</li>
        <li>
          Add bundles incrementally with <code>add</code> so each change set stays reviewable.
        </li>
        <li>
          Use <code>status</code> after each update to verify expected artifacts are in sync.
        </li>
      </ol>
      <h2>Usage tips</h2>
      <ul>
        <li>Prefer <code>npx @harness-kit/cli@latest</code> if you want the newest CLI without global upgrades.</li>
        <li>
          Use <code>harness-kit &lt;command&gt; --help</code> to inspect command usage directly from your installed
          version.
        </li>
        <li>Keep bundle additions small and commit after each logical setup step.</li>
        <li>Cross-check bundle docs pages for role-specific installation guidance.</li>
      </ul>
    </article>
  );
}
