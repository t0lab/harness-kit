import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Change log",
  description: "Release-style notes for docs and CLI experience updates.",
};

export default function ChangelogPage() {
  return (
    <article className="bundle-content">
      <h1>Change log</h1>
      <p>Track notable updates to documentation and CLI guidance with clear impact and required actions.</p>

      <h2>2026-04-16</h2>
      <h3>Docs onboarding rewrite</h3>
      <ul>
        <li>
          <strong>Changed:</strong> Introduction, Installation, and CLI pages were rewritten for first-time users.
        </li>
        <li>
          <strong>Added:</strong> dedicated Quickstart and Troubleshooting pages.
        </li>
        <li>
          <strong>Clarified:</strong> docs bundle grouping vs CLI category filters to avoid command confusion.
        </li>
        <li>
          <strong>Breaking:</strong> No.
        </li>
        <li>
          <strong>Action required:</strong> No action for existing installs. New users should follow Quickstart first.
        </li>
      </ul>

      <h2>2026-04-10</h2>
      <h3>Catalog and navigation polish</h3>
      <ul>
        <li>
          <strong>Changed:</strong> docs navigation and command presentation were refined for faster scanning.
        </li>
        <li>
          <strong>Breaking:</strong> No.
        </li>
        <li>
          <strong>Action required:</strong> None.
        </li>
      </ul>

      <p>For full implementation history, review repository commit history.</p>
    </article>
  );
}
