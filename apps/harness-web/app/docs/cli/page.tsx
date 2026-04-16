import type { Metadata } from "next";

import { CommandBlock } from "@/components/command-block";
import { CLI_INIT_COMMAND, CLI_PACKAGE, CLI_VERSION_TAG, cliCommand } from "@/lib/commands";

export const metadata: Metadata = {
  title: "CLI",
  description: "Practical CLI workflow plus full command and flag reference.",
};

export default function CliPage() {
  return (
    <article className="bundle-content">
      <h1>CLI</h1>
      <p>
        Use the CLI to initialize your harness, add bundles, and verify project health. Start with the quick workflow
        below, then use the reference section for exact commands and flags.
      </p>
      <h2>Quick workflow (first 10 minutes)</h2>
      <CommandBlock command={CLI_INIT_COMMAND} label="1) Initialize baseline" />
      <CommandBlock command={cliCommand("add tdd")} label="2) Add one bundle" className="mt-3" />
      <CommandBlock command={cliCommand("status")} label="3) Verify harness health" className="mt-3" />
      <CommandBlock command={cliCommand("list --installed")} label="4) Confirm installed bundles" className="mt-3" />

      <h2>Global usage</h2>
      <p>
        The commands below assume you already installed the CLI globally. If you did not, prepend commands with{" "}
        <code>npx {CLI_PACKAGE}@{CLI_VERSION_TAG}</code>.
      </p>
      <CommandBlock command="harness-kit --help" label="Show all commands" />
      <CommandBlock command="harness-kit --version" label="Show installed CLI version" className="mt-3" />

      <h2>Category mapping (important)</h2>
      <p>
        Bundle docs pages are grouped by <code>workflow</code>, <code>stack</code>, and <code>techstack</code> for
        browsing. CLI <code>list --category</code> uses install-role categories from the registry.
      </p>
      <ul>
        <li>
          <strong>Docs categories:</strong> <code>workflow</code>, <code>stack</code>, <code>techstack</code>
        </li>
        <li>
          <strong>CLI categories:</strong> <code>git-workflow</code>, <code>workflow-preset</code>, <code>memory</code>
          , <code>browser</code>, <code>search</code>, <code>scrape</code>, <code>mcp-tool</code>
        </li>
      </ul>
      <CommandBlock command={cliCommand("list --category workflow-preset")} label="Example valid category filter" />

      <h2>Command reference</h2>
      <h3>
        <code>init</code>
      </h3>
      <p>Initialize Harness Kit in the current project and run the setup wizard.</p>
      <CommandBlock command={cliCommand("init")} label="Run setup wizard" />
      <p>
        <strong>Flags:</strong> No command-specific flags currently.
      </p>

      <h3>
        <code>add &lt;bundle&gt;</code>
      </h3>
      <p>Add a bundle to the current harness and install its artifacts.</p>
      <CommandBlock command={cliCommand("add tdd")} label="Add bundle by slug" />
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
      <CommandBlock command={cliCommand("list --category workflow-preset")} label="Filter by category" />
      <CommandBlock command={cliCommand("list --installed")} label="Show installed bundles only" className="mt-3" />
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
      <CommandBlock command={cliCommand("status")} label="Run health audit" />
      <p>
        <strong>Flags:</strong> No command-specific flags currently.
      </p>

      <h3>
        <code>activate</code>
      </h3>
      <p>Run idempotent post-install activations for installed bundles (for example Git hook activation).</p>
      <CommandBlock command={cliCommand("activate")} label="Run activation steps" />
      <p>
        <strong>Flags:</strong> No command-specific flags currently.
      </p>

      <h3>
        <code>budget</code>
      </h3>
      <p>Measure context-window token cost of installed harness-managed files.</p>
      <CommandBlock command={cliCommand("budget")} label="Human-readable budget report" />
      <CommandBlock command={cliCommand("budget --json")} label="Machine-readable JSON output" className="mt-3" />
      <CommandBlock
        command={cliCommand("budget --context-window 200000")}
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
        <li>Prefer <code>npx {CLI_PACKAGE}@{CLI_VERSION_TAG}</code> if you want the newest CLI without global upgrades.</li>
        <li>
          Use <code>{CLI_PACKAGE}</code> through <code>npx</code>, or install globally first if you want to run plain{" "}
          <code>harness-kit &lt;command&gt;</code>.
        </li>
        <li>Keep bundle additions small and commit after each logical setup step.</li>
        <li>If category filters fail, verify you are using CLI category names, not docs grouping names.</li>
      </ul>
    </article>
  );
}
