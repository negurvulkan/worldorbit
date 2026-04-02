import type { AtlasDocumentPath, AtlasResolvedDiagnostic, WorldOrbitAtlasDocument, WorldOrbitEvent, WorldOrbitAtlasSystem, WorldOrbitAtlasViewpoint, WorldOrbitObject } from "@worldorbit/core";
import type { WorldOrbitViewMode } from "@worldorbit/viewer";
export interface WorldOrbitEditorSelection {
    path: AtlasDocumentPath | null;
}
export interface WorldOrbitEditorSnapshot {
    source: string;
    atlasDocument: WorldOrbitAtlasDocument;
    diagnostics: AtlasResolvedDiagnostic[];
    selection: WorldOrbitEditorSelection | null;
}
export type WorldOrbitEditorObjectType = WorldOrbitObject["type"] | "craft";
export interface WorldOrbitEditorOptions {
    source?: string;
    atlasDocument?: WorldOrbitAtlasDocument;
    showTextPane?: boolean;
    showInspector?: boolean;
    showPreview?: boolean;
    viewerWidth?: number;
    viewerHeight?: number;
    viewMode?: WorldOrbitViewMode;
    shortcuts?: boolean;
    onChange?: (snapshot: WorldOrbitEditorSnapshot) => void;
    onDiagnosticsChange?: (diagnostics: AtlasResolvedDiagnostic[]) => void;
    onSelectionChange?: (selection: WorldOrbitEditorSelection | null) => void;
    onDirtyChange?: (dirty: boolean) => void;
}
export interface WorldOrbitEditor {
    setSource(source: string): void;
    setAtlasDocument(document: WorldOrbitAtlasDocument): void;
    getSource(): string;
    getAtlasDocument(): WorldOrbitAtlasDocument;
    getDiagnostics(): AtlasResolvedDiagnostic[];
    getSelection(): WorldOrbitEditorSelection | null;
    getViewMode(): WorldOrbitViewMode;
    setViewMode(mode: WorldOrbitViewMode): void;
    isDirty(): boolean;
    markSaved(): void;
    selectPath(path: AtlasDocumentPath | null): void;
    canUndo(): boolean;
    canRedo(): boolean;
    undo(): boolean;
    redo(): boolean;
    addObject(type?: WorldOrbitEditorObjectType): string;
    addEvent(): string;
    addViewpoint(): string;
    addAnnotation(): string;
    addMetadata(key?: string, value?: string): string;
    removeSelection(): boolean;
    exportSvg(): string;
    exportEmbedMarkup(): string;
    destroy(): void;
}
export interface WorldOrbitEditorFormState {
    selection: WorldOrbitEditorSelection | null;
    system: WorldOrbitAtlasSystem | null;
    viewpoints: WorldOrbitAtlasViewpoint[];
    events: WorldOrbitEvent[];
    objects: WorldOrbitObject[];
}
