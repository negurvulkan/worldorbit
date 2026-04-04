import type { WorldOrbitDiagnostic, WorldOrbitHierarchyDocument, WorldOrbitHierarchyScope } from "@worldorbit/core";
import type { WorldOrbitViewMode } from "@worldorbit/viewer";

export interface WorldOrbitHierarchyEditorOptions {
  source?: string;
  width?: number;
  height?: number;
  onChange?: (snapshot: {
    source: string;
    document: WorldOrbitHierarchyDocument | null;
    diagnostics: WorldOrbitDiagnostic[];
    dirty: boolean;
    scope: WorldOrbitHierarchyScope;
  }) => void;
  onDiagnosticsChange?: (diagnostics: WorldOrbitDiagnostic[]) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export interface WorldOrbitHierarchyEditor {
  getSource(): string;
  setSource(source: string): void;
  getDocument(): WorldOrbitHierarchyDocument | null;
  getDiagnostics(): WorldOrbitDiagnostic[];
  getViewMode(): WorldOrbitViewMode;
  setViewMode(mode: WorldOrbitViewMode): void;
  setScope(scope: WorldOrbitHierarchyScope): void;
  isDirty(): boolean;
  markSaved(): void;
  exportSvg(): string;
  exportEmbedMarkup(): string;
  destroy(): void;
}
