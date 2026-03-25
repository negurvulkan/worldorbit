import type { WorldOrbitTheme } from "@worldorbit/viewer/interactive-2d";
import { resolveTheme } from "@worldorbit/viewer/interactive-2d";

export function createObsidianViewerTheme(): WorldOrbitTheme {
  const base = resolveTheme("atlas");

  return {
    ...base,
    name: "obsidian",
    backgroundStart: "var(--background-primary, #10131a)",
    backgroundEnd: "var(--background-secondary, #171b24)",
    backgroundGlow: "var(--interactive-accent-hover, rgba(143, 202, 255, 0.18))",
    panel: "var(--background-secondary-alt, rgba(10, 16, 24, 0.92))",
    panelLine: "var(--background-modifier-border, rgba(168, 207, 242, 0.2))",
    relation: "var(--text-accent-hover, rgba(240, 180, 100, 0.42))",
    orbit: "var(--text-faint, rgba(163, 209, 255, 0.24))",
    guide: "var(--background-modifier-border-hover, rgba(255, 255, 255, 0.08))",
    leader: "var(--text-muted, rgba(225, 238, 255, 0.4))",
    ink: "var(--text-normal, #e8f0ff)",
    muted: "var(--text-muted, rgba(232, 240, 255, 0.7))",
    accent: "var(--interactive-accent, #f0b464)",
    accentStrong: "var(--text-accent-hover, #ff7f5f)",
    selected: "var(--color-cyan, rgba(255, 214, 139, 0.92))",
    starCore: "var(--color-yellow, #ffcc67)",
    starStroke: "var(--text-normal, rgba(255, 245, 203, 0.85))",
    starGlow: "var(--color-orange, #ffe8a3)",
    objectSpecular: "var(--text-normal, #f5f8ff)",
    selectionHalo: "var(--interactive-accent, rgba(255, 214, 139, 0.9))",
    atmosphere: "var(--color-cyan, rgba(143, 202, 255, 0.4))",
    cometTail: "var(--color-cyan, rgba(193, 243, 255, 0.7))",
    fontFamily: "var(--font-interface, \"Segoe UI\", sans-serif)",
    displayFont: "var(--font-text, var(--font-interface, \"Segoe UI\", sans-serif))",
  };
}
