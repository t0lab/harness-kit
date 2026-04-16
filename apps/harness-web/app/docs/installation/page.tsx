import type { Metadata } from "next";

import { CommandBlock } from "@/components/command-block";

export const metadata: Metadata = {
  title: "Installation",
  description: "Install Harness Kit, initialize your project, and verify generated files.",
};

export default function InstallationPage() {
  return (
    <article className="bundle-content">
      <h1>Installation</h1>
      <p>
        You can run Harness Kit on demand with <code>npx</code> or install the CLI globally. For most teams, the
        on-demand command is enough and keeps upgrades simple.
      </p>
      <h2>Option 1: Run without global install</h2>
      <CommandBlock command="npx @harness-kit/cli@latest init" label="Run init immediately" />
      <h2>Option 2: Install globally</h2>
      <CommandBlock command="pnpm add -g @harness-kit/cli" label="Install CLI globally" />
      <CommandBlock command="harness-kit init" label="Initialize after global install" className="mt-3" />
      <h2>Verify setup</h2>
      <p>
        After running the wizard, confirm that your project now has the expected harness files. Review and commit
        them as part of your project setup.
      </p>
      <CommandBlock command="harness-kit status" label="Check harness status" />
      <h2>After installation</h2>
      <ol>
        <li>Run the setup wizard and select bundles for your team workflow.</li>
        <li>
          Review generated files (<code>CLAUDE.md</code>, <code>AGENTS.md</code>, harness config, and hook scripts).
        </li>
        <li>Use the CLI docs and bundle pages to add capabilities incrementally.</li>
      </ol>
    </article>
  );
}
