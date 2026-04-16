import { useEffect, useState } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { execa } from "execa";
import { execSync } from "node:child_process";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { Listr } from "listr2";
import { WizardShell } from "@/components/ui/WizardShell.js";
import { ConfirmPrompt } from "@/components/confirm-prompt.js";
import { runInk } from "@/lib/run-ink.js";
import { writeScaffoldFile } from "@/engine/scaffolder.js";
import { renderTemplate } from "@/engine/template-renderer.js";
import { getBundle } from "@/registry/index.js";
import { getRoleData } from "@/utils/bundle-utils.js";
import { executeAdd } from "@/commands/add.js";
import type { Artifact } from "@/registry/types.js";
import type { WizardContext } from "@/wizard/types.js";
import type { BudgetState } from "@/store/budget-state.js";
import type { ScaffoldFile } from "@/engine/scaffolder.js";
import type { SummaryItem } from "@/components/ui/Summary.js";

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

interface McpConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export const APPLY_EXIT_SEQUENCE = "\x1b[?1049l\x1b[2J\x1b[H";

function fitDisplayLine(text: string, width: number): string {
  const safeWidth = Math.max(12, width);
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= safeWidth) return clean.padEnd(safeWidth, " ");
  return `${clean.slice(0, safeWidth - 3)}...`;
}

export function buildInitSuccessPanel(
  fileCount: number,
  bundleCount: number,
): string {
  const title = "✓ harness-kit initialized";
  const lines = [`↳ ${fileCount} file${fileCount !== 1 ? "s" : ""} written`];
  if (bundleCount > 0) {
    lines.push(
      `↳ ${bundleCount} bundle${bundleCount !== 1 ? "s" : ""} installed`,
    );
  }

  const innerWidth = Math.max(58, ...lines.map((line) => line.length));
  const top = `╭─ ${title} ${"─".repeat(Math.max(0, innerWidth - title.length - 1))}╮`;
  const body = lines.map((line) => `│ ${line.padEnd(innerWidth)} │`).join("\n");
  const bottom = `╰${"─".repeat(innerWidth + 2)}╯`;
  return [top, body, bottom].join("\n");
}

export function allSelectedBundleNames(ctx: WizardContext): string[] {
  return [
    ...ctx.selectedTech,
    ...ctx.gitWorkflow,
    ...ctx.workflowPresets,
    ...ctx.browserTools,
    ...ctx.webSearch,
    ...ctx.webScrape,
    ...(ctx.memory !== "no-memory" ? [ctx.memory] : []),
  ];
}

export async function installAllSelectedBundles(
  cwd: string,
  ctx: WizardContext,
): Promise<void> {
  for (const name of allSelectedBundleNames(ctx)) {
    try {
      getBundle(name);
    } catch {
      continue;
    }
    await executeAdd(cwd, name, { yes: true, silent: true });
  }
}

export function collectSelectedBundles(
  ctx: WizardContext,
): Array<{ name: string; role: string }> {
  const names = [
    ...ctx.browserTools,
    ...ctx.webSearch,
    ...ctx.webScrape,
    ...(ctx.memory !== "no-memory" ? [ctx.memory] : []),
  ];
  return names
    .filter((name) => {
      try {
        getBundle(name);
        return true;
      } catch {
        return false;
      }
    })
    .map((name) => ({ name, role: getBundle(name).defaultRole }));
}

function resolveArtifacts(name: string, role: string): Artifact[] {
  const bundle = getBundle(name);
  const roleArtifacts = getRoleData(bundle, role)?.artifacts ?? [];
  return [...bundle.common.artifacts, ...roleArtifacts];
}

function buildMcpConfigs(
  selected: Array<{ name: string; role: string }>,
): McpConfig[] {
  return selected.flatMap(({ name, role }) =>
    resolveArtifacts(name, role)
      .filter((a): a is Extract<Artifact, { type: "mcp" }> => a.type === "mcp")
      .map((a) => {
        const config: McpConfig = { name, command: a.command, args: a.args };
        if (a.env) config.env = a.env;
        return config;
      }),
  );
}

function buildDependencyWarnings(
  selected: Array<{ name: string; role: string }>,
): string[] {
  return selected.flatMap(({ name, role }) => {
    const bundle = getBundle(name);
    const requires = [
      ...(bundle.common.requires ?? []),
      ...(getRoleData(bundle, role)?.requires ?? []),
    ];
    return requires.length > 0
      ? [`${name} — needs ${requires.join(" + ")}`]
      : [];
  });
}

interface PreviewData {
  allBundles: string[];
  mcpConfigs: McpConfig[];
  depWarnings: string[];
  hasDocs: boolean;
  toolsToInstall: WizardContext["toolsToInstall"];
  files: ScaffoldFile[];
  conflicts: string[];
}

async function buildPreview(
  ctx: WizardContext,
  cwd: string,
): Promise<PreviewData> {
  const selectedBundles = collectSelectedBundles(ctx);
  const mcpConfigs = buildMcpConfigs(selectedBundles);
  const depWarnings = buildDependencyWarnings(selectedBundles);
  const hasDocs = ctx.workflowPresets.includes("docs-as-code");
  const allBundles = allSelectedBundleNames(ctx);
  const toolsToInstall = ctx.toolsToInstall ?? [];

  const templateCtx = {
    ...ctx,
    mcp: mcpConfigs.map((m) => m.name),
    mcpConfigs,
    bundles: selectedBundles.map((b) => b.name),
  };
  const files: ScaffoldFile[] = [
    {
      relativePath: "CLAUDE.md",
      content: await renderTemplate("CLAUDE.md.hbs", templateCtx),
    },
    {
      relativePath: "AGENTS.md",
      content: await renderTemplate("AGENTS.md.hbs", templateCtx),
    },
    {
      relativePath: "harness.json",
      content: await renderTemplate("harness.json.hbs", templateCtx),
    },
    {
      relativePath: "llms.txt",
      content: await renderTemplate("llms.txt.hbs", templateCtx),
    },
    {
      relativePath: ".claude/settings.json",
      content: await renderTemplate("settings.json.hbs", templateCtx),
    },
  ];
  if (mcpConfigs.length > 0) {
    files.push({
      relativePath: ".mcp.json",
      content: await renderTemplate("mcp.json.hbs", templateCtx),
    });
  }
  if (hasDocs) {
    files.push({
      relativePath: "docs/DESIGN.md",
      content: `# ${ctx.projectName} — Design\n\n${ctx.projectPurpose}\n`,
    });
  }

  const conflicts: string[] = [];
  for (const file of files) {
    if (await fileExists(join(cwd, file.relativePath)))
      conflicts.push(file.relativePath);
  }

  return {
    allBundles,
    mcpConfigs,
    depWarnings,
    hasDocs,
    toolsToInstall,
    files,
    conflicts,
  };
}

interface PreviewDecision {
  confirmed: boolean;
  conflictResolutions: Map<string, "overwrite" | "skip">;
}

interface PreviewProps {
  preview: PreviewData;
  budget: BudgetState;
  onDone: (d: PreviewDecision) => void;
  onCancel: () => void;
}

function PreviewScreen({ preview, budget, onDone, onCancel }: PreviewProps) {
  const { stdout } = useStdout();
  const [, setResizeTick] = useState(0);

  useEffect(() => {
    const onResize = () => setResizeTick((n) => n + 1);
    stdout.on("resize", onResize);
    return () => {
      stdout.off("resize", onResize);
    };
  }, [stdout]);

  const cols = stdout.columns ?? 80;
  const rows = stdout.rows ?? 24;
  const showSummary = cols >= 80;
  const summaryWidth = showSummary
    ? Math.min(40, Math.max(24, Math.floor(cols * 0.3)))
    : 0;
  const contentWidth = Math.max(20, cols - summaryWidth - 14);

  type Phase = "review" | "conflict";
  const [phase, setPhase] = useState<Phase>("review");
  const [conflictIdx, setConflictIdx] = useState(0);
  const [resolutions, setResolutions] = useState<
    Map<string, "overwrite" | "skip">
  >(new Map());
  const [applyYes, setApplyYes] = useState(true);

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      onCancel();
      return;
    }

    if (phase === "review") {
      if (key.leftArrow || input === "y" || input === "Y") {
        setApplyYes(true);
        return;
      }
      if (key.rightArrow || input === "n" || input === "N") {
        setApplyYes(false);
        return;
      }
      if (key.return) {
        if (!applyYes) {
          onCancel();
          return;
        }
        if (preview.conflicts.length > 0) setPhase("conflict");
        else onDone({ confirmed: true, conflictResolutions: resolutions });
      }
      return;
    }
  });

  const summaryItems: SummaryItem[] = [
    { label: "Project info", status: "done" },
    { label: "Tech stack", status: "done" },
    { label: "Detect tooling", status: "done" },
    { label: "Harness config", status: "done" },
    { label: "Preview", status: "active" },
  ];

  if (phase === "conflict") {
    const file = preview.conflicts[conflictIdx]!;
    const decide = (choice: "overwrite" | "skip") => {
      const next = new Map(resolutions);
      next.set(file, choice);
      setResolutions(next);
      if (conflictIdx + 1 < preview.conflicts.length) {
        setConflictIdx(conflictIdx + 1);
      } else {
        onDone({ confirmed: true, conflictResolutions: next });
      }
    };
    return (
      <WizardShell
        stepCurrent={5}
        stepTotal={5}
        stepTitle="Resolve conflict"
        summaryItems={summaryItems}
        budget={budget}
      >
        <ConfirmPrompt
          message={`${file} already exists. Overwrite?`}
          hint={`${conflictIdx + 1} / ${preview.conflicts.length}`}
          border={false}
          onConfirm={() => decide("overwrite")}
          onCancel={() => decide("skip")}
        />
      </WizardShell>
    );
  }

  const tools = preview.toolsToInstall ?? [];
  const requirementLines = [
    ...preview.mcpConfigs.map((m) => `MCP: ${m.name}`),
    ...tools.map((t) => `Tool: ${t.label}`),
    ...preview.depWarnings.map((w) => `Need: ${w}`),
  ];
  const totalBudget = Math.max(8, rows - 11);
  const staticRows = requirementLines.length > 0 ? 8 : 6;
  const listBudget = Math.max(4, totalBudget - staticRows);
  const requirementBudget =
    requirementLines.length > 0 ? Math.max(1, Math.floor(listBudget * 0.25)) : 0;
  const remaining = listBudget - requirementBudget;
  const maxFileRows = Math.max(2, Math.floor(remaining / 2));
  const maxBundleRows = Math.max(2, remaining - maxFileRows);
  const maxRequirementRows = requirementBudget;
  const visibleFiles = preview.files.slice(0, maxFileRows);
  const hiddenFiles = Math.max(0, preview.files.length - visibleFiles.length);
  const visibleBundles = preview.allBundles.slice(0, maxBundleRows);
  const hiddenBundles = Math.max(0, preview.allBundles.length - visibleBundles.length);
  const visibleRequirements = requirementLines.slice(0, maxRequirementRows);
  const hiddenRequirements = Math.max(
    0,
    requirementLines.length - visibleRequirements.length,
  );

  return (
    <WizardShell
      stepCurrent={5}
      stepTotal={5}
      stepTitle="Preview"
      summaryItems={summaryItems}
      budget={budget}
    >
      <Box flexDirection="column" gap={1}>
        {/* Planned changes */}
        <Box
          flexDirection="column"
          paddingX={1}
          gap={0}
        >
          <Text bold>{fitDisplayLine("Preview summary", contentWidth)}</Text>
          <Text dimColor>
            {fitDisplayLine(
              `${preview.files.length} files, ${preview.allBundles.length} bundles`,
              contentWidth,
            )}
          </Text>
          <Text dimColor>
            {fitDisplayLine(
              `Files (${visibleFiles.length}/${preview.files.length})`,
              contentWidth,
            )}
          </Text>
          {visibleFiles.map((f) => {
            const hasConflict = preview.conflicts.includes(f.relativePath);
            return (
              <Text key={f.relativePath} color={hasConflict ? "yellow" : "white"}>
                {fitDisplayLine(
                  `- ${f.relativePath}${hasConflict ? "  conflict" : ""}`,
                  contentWidth,
                )}
              </Text>
            );
          })}
          {hiddenFiles > 0 && (
            <Text dimColor>
              {fitDisplayLine(`... +${hiddenFiles} more files`, contentWidth)}
            </Text>
          )}
          <Text dimColor>
            {fitDisplayLine(
              `Bundles (${visibleBundles.length}/${preview.allBundles.length})`,
              contentWidth,
            )}
          </Text>
          {visibleBundles.length > 0 ? (
            visibleBundles.map((b) => (
              <Text key={b} color="white">
                {fitDisplayLine(`- ${b}`, contentWidth)}
              </Text>
            ))
          ) : (
            <Text dimColor>{fitDisplayLine("none", contentWidth)}</Text>
          )}
          {hiddenBundles > 0 && (
            <Text dimColor>
              {fitDisplayLine(`... +${hiddenBundles} more bundles`, contentWidth)}
            </Text>
          )}
        </Box>

        {/* Requirements */}
        {requirementLines.length > 0 && (
          <Box
            flexDirection="column"
            paddingX={1}
            gap={0}
          >
            <Text bold color="yellow">
              {fitDisplayLine("Requirements", contentWidth)}
            </Text>
            <Text dimColor>
              {fitDisplayLine(
                `${visibleRequirements.length}/${requirementLines.length} items`,
                contentWidth,
              )}
            </Text>
            {visibleRequirements.map((line, idx) => (
              <Text key={`${line}-${idx}`} color="yellow">
                {fitDisplayLine(`- ${line}`, contentWidth)}
              </Text>
            ))}
            {hiddenRequirements > 0 && (
              <Text dimColor>
                {fitDisplayLine(
                  `... +${hiddenRequirements} more requirements`,
                  contentWidth,
                )}
              </Text>
            )}
          </Box>
        )}

        {/* Apply confirm — inline Y/N selector */}
        <Box gap={2} paddingX={1}>
          <Text bold>Apply?</Text>
          <Text color={applyYes ? "green" : "gray"} bold={applyYes}>
            {applyYes ? "▶ Yes" : "  Yes"}
          </Text>
          <Text color={!applyYes ? "red" : "gray"} bold={!applyYes}>
            {!applyYes ? "▶ No" : "  No"}
          </Text>
          {preview.conflicts.length > 0 && (
            <Text color="yellow">
              ⚠ {preview.conflicts.length} conflict
              {preview.conflicts.length !== 1 ? "s" : ""}
            </Text>
          )}
          <Text dimColor>[←/→ · y/n] select [Enter] confirm</Text>
        </Box>
      </Box>
    </WizardShell>
  );
}

export async function stepPreviewApply(
  ctx: WizardContext,
  budget: BudgetState,
): Promise<void> {
  const cwd = process.cwd();
  const preview = await buildPreview(ctx, cwd);

  const decision = await runInk<PreviewDecision>(
    (resolve: (v: PreviewDecision) => void, reject: (e: Error) => void) => (
      <PreviewScreen
        preview={preview}
        budget={budget}
        onDone={resolve}
        onCancel={() => reject(new Error("Cancelled"))}
      />
    ),
  );

  if (!decision.confirmed) return;

  // Disable terminal echo at the kernel tty layer before exiting alt-screen.
  // process.stdin.setRawMode() is insufficient: Ink pauses stdin on exit and
  // chars already in the kernel line-buffer get echoed before Node's setRawMode
  // takes effect. `stty -echo` operates directly on the controlling tty.
  const isTTY = process.stdin.isTTY;
  if (isTTY) {
    try { execSync("stty -echo", { stdio: "inherit" }); } catch {}
  }

  // Exit alt-screen and clear restored primary to avoid stale shell prompt
  // appearing before apply output.
  process.stdout.write(APPLY_EXIT_SEQUENCE);

  const toolsToInstall = preview.toolsToInstall ?? [];
  const toolErrors: string[] = [];

  await new Listr(
    [
      {
        title: `Writing ${preview.files.length} file${preview.files.length !== 1 ? "s" : ""}`,
        task: (_, task) =>
          task.newListr(
            preview.files.map((file) => ({
              title: file.relativePath,
              task: async () =>
                writeScaffoldFile(
                  cwd,
                  file,
                  decision.conflictResolutions.get(file.relativePath) ??
                    "overwrite",
                ),
            })),
            { concurrent: false },
          ),
      },
      {
        title: `Installing ${preview.allBundles.length} bundle${preview.allBundles.length !== 1 ? "s" : ""}`,
        skip: () => preview.allBundles.length === 0,
        task: (_, task) =>
          task.newListr(
            allSelectedBundleNames(ctx).map((name) => ({
              title: name,
              task: async () => {
                try {
                  getBundle(name);
                } catch {
                  return;
                }
                await executeAdd(cwd, name, { yes: true, silent: true });
              },
            })),
            { concurrent: false },
          ),
      },
      {
        title: `Installing ${toolsToInstall.length} system tool${toolsToInstall.length !== 1 ? "s" : ""}`,
        skip: () => toolsToInstall.length === 0,
        task: (_, task) =>
          task.newListr(
            toolsToInstall
              .filter((t) => t.installCmd)
              .map((tool) => ({
                title: tool.label,
                task: async () => {
                  try {
                    await execa(tool.installCmd!, { shell: true, cwd });
                  } catch (err) {
                    toolErrors.push(`${tool.label}: ${(err as Error).message}`);
                    throw err;
                  }
                },
              })),
            { concurrent: false },
          ),
      },
    ],
    { renderer: "default" },
  ).run();

  // Restore echo before final output
  if (isTTY) {
    try { execSync("stty echo", { stdio: "inherit" }); } catch {}
  }

  // Listr2 intercepts stdout during rendering; one setImmediate gives it time
  // to release its hooks before we write the final summary panel.
  await new Promise<void>((resolve) => setImmediate(resolve));

  // Final summary — plain box drawing keeps terminal output stable after Listr2.
  const C = "\x1b[36m",
    D = "\x1b[2m",
    Y = "\x1b[33m",
    R = "\x1b[0m";
  process.stdout.write(
    `${buildInitSuccessPanel(preview.files.length, preview.allBundles.length)}\n`,
  );
  if (toolErrors.length > 0) {
    process.stdout.write(`${Y}⚠ Tool install errors:${R}\n`);
    for (const e of toolErrors) process.stdout.write(`  ${Y}• ${e}${R}\n`);
    process.stdout.write("\n");
  }
  process.stdout.write(
    `  ${D}Run ${R}${C}harness-kit status${R}${D} to verify your harness.${R}\n\n`,
  );
  // Ensure both streams flush before returning control to the shell prompt.
  await new Promise<void>((resolve) => process.stdout.write("", () => resolve()));
  await new Promise<void>((resolve) => process.stderr.write("", () => resolve()));
}
