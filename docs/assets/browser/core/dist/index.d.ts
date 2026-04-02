export * from "./types.js";
export * from "./errors.js";
export * from "./schema.js";
export { tokenizeLine, tokenizeLineDetailed } from "./tokenize.js";
export { parseWorldOrbit } from "./parse.js";
export { normalizeDocument } from "./normalize.js";
export { validateDocument } from "./validate.js";
export { createDiagnostic, diagnosticFromError, normalizeWithDiagnostics, parseWithDiagnostics, validateDocumentWithDiagnostics, } from "./diagnostics.js";
export { renderDocumentToScene, rotatePoint } from "./scene.js";
export { evaluateSpatialSceneAtTime, renderDocumentToSpatialScene, } from "./spatial-scene.js";
export { createTrajectorySolverSnapshot } from "./solver.js";
export { formatAtlasDocument, formatDocument, formatDraftDocument } from "./format.js";
export { materializeAtlasDocument, materializeDraftDocument, upgradeDocumentToDraftV2, upgradeDocumentToV2, } from "./draft.js";
export { parseWorldOrbitAtlas, parseWorldOrbitDraft } from "./draft-parse.js";
export { cloneAtlasDocument, createEmptyAtlasDocument, getAtlasDocumentNode, listAtlasDocumentPaths, removeAtlasDocumentNode, resolveAtlasDiagnosticPath, resolveAtlasDiagnostics, updateAtlasDocumentNode, upsertAtlasDocumentNode, validateAtlasDocumentWithDiagnostics, } from "./atlas-edit.js";
export { detectWorldOrbitSchemaVersion, loadWorldOrbitSource, loadWorldOrbitSourceWithDiagnostics, } from "./load.js";
export { extractWorldOrbitBlocks } from "./markdown.js";
import type { AstDocument, FormatDocumentOptions, FormattableWorldOrbitDocument, RenderScene, WorldOrbitDocument } from "./types.js";
export interface ParseResult {
    ast: AstDocument;
    document: WorldOrbitDocument;
}
export interface RenderResult extends ParseResult {
    scene: RenderScene;
}
export declare function parse(source: string): ParseResult;
export declare function render(source: string): RenderResult;
export declare function load(source: string): import("./types.js").LoadedWorldOrbitSource;
export declare function parseSafe(source: string): import("./types.js").DiagnosticResult<import("./diagnostics.js").ParsedWorldOrbitDocument>;
export declare function stringify(document: FormattableWorldOrbitDocument, options?: FormatDocumentOptions): string;
