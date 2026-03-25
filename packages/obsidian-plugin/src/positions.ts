import type { WorldOrbitDiagnostic } from "@worldorbit/core";
import type { EditorPosition } from "obsidian";

export function inferFenceContentStartLine(section: {
  text: string;
  lineStart: number;
}): number {
  const lines = section.text.split(/\r?\n/);
  const openerIndex = lines.findIndex((line) => /^\s*(```+|~~~+)\s*worldorbit(?:\s+.*)?$/i.test(line));
  return section.lineStart + (openerIndex >= 0 ? openerIndex + 1 : 1);
}

export function resolveDiagnosticEditorPosition(
  contentStartLine: number,
  diagnostic: WorldOrbitDiagnostic,
): EditorPosition | null {
  if (!diagnostic.line || diagnostic.line < 1) {
    return null;
  }

  return {
    line: contentStartLine + diagnostic.line - 1,
    ch: Math.max((diagnostic.column ?? 1) - 1, 0),
  };
}
