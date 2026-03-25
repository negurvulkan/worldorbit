import type { WorldOrbitDiagnostic } from "@worldorbit/core";
import type { EditorPosition } from "obsidian";
export declare function inferFenceContentStartLine(section: {
    text: string;
    lineStart: number;
}): number;
export declare function resolveDiagnosticEditorPosition(contentStartLine: number, diagnostic: WorldOrbitDiagnostic): EditorPosition | null;
