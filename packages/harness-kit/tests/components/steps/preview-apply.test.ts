import { describe, expect, it } from "vitest";
import {
  APPLY_EXIT_SEQUENCE,
  buildInitSuccessPanel,
} from "../../../src/components/steps/preview-apply.js";

describe("preview apply output helpers", () => {
  it("uses exit sequence that clears restored primary screen", () => {
    expect(APPLY_EXIT_SEQUENCE).toBe("\u001b[?1049l\u001b[2J\u001b[H");
  });

  it("renders a consistently bordered success panel", () => {
    const panel = buildInitSuccessPanel(6, 12);
    const lines = panel.split("\n");

    expect(lines[0]?.startsWith("╭─ ✓ harness-kit initialized ")).toBe(true);
    expect(lines[1]?.startsWith("│ ")).toBe(true);
    expect(lines[1]?.endsWith(" │")).toBe(true);
    expect(lines[2]?.startsWith("│ ")).toBe(true);
    expect(lines[2]?.endsWith(" │")).toBe(true);
    expect(lines[3]?.startsWith("╰")).toBe(true);
    expect(lines[3]?.endsWith("╯")).toBe(true);

    const uniqueLengths = new Set(lines.map((line) => line.length));
    expect(uniqueLengths.size).toBe(1);
  });

  it("omits bundle line when no bundles are installed", () => {
    const panel = buildInitSuccessPanel(2, 0);
    expect(panel.includes("bundles installed")).toBe(false);
  });

});
