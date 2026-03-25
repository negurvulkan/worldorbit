import type { WorldOrbitDiagnostic } from "@worldorbit/core/types";
import {
  MarkdownView,
  TFile,
  type App,
  type MarkdownPostProcessorContext,
} from "obsidian";

import type {
  BlockNavigationContext,
  DiagnosticNavigationTarget,
} from "./types.js";
import {
  inferFenceContentStartLine,
  resolveDiagnosticEditorPosition,
} from "./positions.js";

export function resolveFenceNavigationContext(
  ctx: MarkdownPostProcessorContext,
  el: HTMLElement,
): BlockNavigationContext | null {
  if (!ctx.sourcePath) {
    return null;
  }

  const sectionInfo = ctx.getSectionInfo(el);
  if (!sectionInfo) {
    return null;
  }

  return {
    sourcePath: ctx.sourcePath,
    contentStartLine: inferFenceContentStartLine(sectionInfo),
  };
}

export function createDiagnosticNavigationTarget(
  contentStartLine: number | null,
  diagnostic: WorldOrbitDiagnostic,
): DiagnosticNavigationTarget {
  return {
    diagnostic,
    position:
      contentStartLine === null
        ? null
        : resolveDiagnosticEditorPosition(contentStartLine, diagnostic),
  };
}

export async function navigateToWorldOrbitDiagnostic(
  app: App,
  sourcePath: string,
  contentStartLine: number,
  diagnostic: WorldOrbitDiagnostic,
): Promise<boolean> {
  const position = resolveDiagnosticEditorPosition(contentStartLine, diagnostic);
  if (!position) {
    return false;
  }

  const file = app.vault.getAbstractFileByPath(sourcePath);
  if (!(file instanceof TFile)) {
    return false;
  }

  const leaf = app.workspace.getMostRecentLeaf() ?? app.workspace.getLeaf(true);
  await leaf.openFile(file);

  const view =
    leaf.view instanceof MarkdownView
      ? leaf.view
      : app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) {
    return false;
  }

  view.editor.setCursor(position);
  view.editor.focus();
  return true;
}
