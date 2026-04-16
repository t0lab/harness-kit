import type { Metadata } from "next";

import { CommandBlock } from "@/components/command-block";
import { CLI_INIT_COMMAND, CLI_PACKAGE, CLI_VERSION_TAG } from "@/lib/commands";

export const metadata: Metadata = {
  title: "Troubleshooting",
  description: "Common Harness Kit setup failures with quick symptom-to-fix guidance.",
};

export default function TroubleshootingPage() {
  return (
    <article className="bundle-content">
      <h1>Troubleshooting</h1>
      <p>Use this page when a command fails during setup. Start from the symptom closest to your error output.</p>

      <h2>Symptom: harness.json not found</h2>
      <ul>
        <li>
          <strong>Cause:</strong> you ran a command that expects an initialized harness before running{" "}
          <code>harness-kit init</code>.
        </li>
        <li>
          <strong>Fix:</strong> initialize first, then retry.
        </li>
      </ul>
      <CommandBlock command={CLI_INIT_COMMAND} label="Initialize harness first" />

      <h2>Symptom: Unknown category in list command</h2>
      <ul>
        <li>
          <strong>Cause:</strong> using docs grouping names (<code>workflow</code>, <code>stack</code>,{" "}
          <code>techstack</code>) with CLI <code>--category</code>.
        </li>
        <li>
          <strong>Fix:</strong> use valid CLI categories.
        </li>
      </ul>
      <CommandBlock command="harness-kit list --category workflow-preset" label="Use a valid CLI category" />

      <h2>Symptom: command not found (harness-kit)</h2>
      <ul>
        <li>
          <strong>Cause:</strong> CLI is not globally installed or global bin path is not available in your shell.
        </li>
        <li>
          <strong>Fix:</strong> use <code>npx</code> directly, or install globally and restart shell.
        </li>
      </ul>
      <CommandBlock command={`npx ${CLI_PACKAGE}@${CLI_VERSION_TAG} --help`} label="Run CLI via npx" />

      <h2>Symptom: setup works but files seem incomplete</h2>
      <ul>
        <li>
          <strong>Cause:</strong> expected bundles were not selected in the wizard, or were not added yet.
        </li>
        <li>
          <strong>Fix:</strong> inspect installed bundles, then add missing ones explicitly.
        </li>
      </ul>
      <CommandBlock command="harness-kit list --installed" label="Inspect installed bundles" />
      <CommandBlock command="harness-kit add security-review" label="Add a missing bundle" className="mt-3" />

      <h2>Symptom: unsure if current state is healthy</h2>
      <ul>
        <li>
          <strong>Fix:</strong> run status to audit drift and required files, then resolve reported issues.
        </li>
      </ul>
      <CommandBlock command="harness-kit status" label="Audit current harness state" />
    </article>
  );
}
