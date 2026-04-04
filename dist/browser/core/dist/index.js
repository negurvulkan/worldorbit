export * from "./types.js";
export * from "./errors.js";
export * from "./schema.js";
export { tokenizeLine, tokenizeLineDetailed } from "./tokenize.js";
export { parseWorldOrbit } from "./parse.js";
export { normalizeDocument } from "./normalize.js";
export { validateDocument } from "./validate.js";
export { createDiagnostic, diagnosticFromError, normalizeWithDiagnostics, parseWithDiagnostics, validateDocumentWithDiagnostics, } from "./diagnostics.js";
export { renderDocumentToScene, rotatePoint } from "./scene.js";
export { renderHierarchyDocumentToScene } from "./hierarchy-scene.js";
export { evaluateSpatialSceneAtTime, renderDocumentToSpatialScene, } from "./spatial-scene.js";
export { createTrajectorySolverSnapshot } from "./solver.js";
export { formatAtlasDocument, formatDocument, formatDraftDocument } from "./format.js";
export { materializeAtlasDocument, materializeDraftDocument, upgradeDocumentToDraftV2, upgradeDocumentToV2, } from "./draft.js";
export { parseWorldOrbitAtlas, parseWorldOrbitDraft } from "./draft-parse.js";
export { parseWorldOrbitHierarchyDocument } from "./hierarchy-parse.js";
export { detectWorldOrbitHierarchySchemaVersion, loadWorldOrbitHierarchySource, loadWorldOrbitHierarchySourceWithDiagnostics, } from "./hierarchy-load.js";
export { cloneAtlasDocument, createEmptyAtlasDocument, getAtlasDocumentNode, listAtlasDocumentPaths, removeAtlasDocumentNode, resolveAtlasDiagnosticPath, resolveAtlasDiagnostics, updateAtlasDocumentNode, upsertAtlasDocumentNode, validateAtlasDocumentWithDiagnostics, } from "./atlas-edit.js";
export { detectWorldOrbitSchemaVersion, loadWorldOrbitSource, loadWorldOrbitSourceWithDiagnostics, } from "./load.js";
export { extractWorldOrbitBlocks } from "./markdown.js";
import { parseWithDiagnostics } from "./diagnostics.js";
import { formatDocument } from "./format.js";
import { loadWorldOrbitSource } from "./load.js";
import { normalizeDocument } from "./normalize.js";
import { parseWorldOrbit } from "./parse.js";
import { renderDocumentToScene } from "./scene.js";
import { validateDocument } from "./validate.js";
export function parse(source) {
    const ast = parseWorldOrbit(source);
    const document = normalizeDocument(ast);
    validateDocument(document);
    return { ast, document };
}
export function render(source) {
    const result = parse(source);
    return {
        ...result,
        scene: renderDocumentToScene(result.document),
    };
}
export function load(source) {
    return loadWorldOrbitSource(source);
}
export function parseSafe(source) {
    return parseWithDiagnostics(source);
}
export function stringify(document, options = {}) {
    return formatDocument(document, options);
}
