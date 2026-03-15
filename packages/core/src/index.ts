export * from "./types.js";
export * from "./errors.js";
export * from "./schema.js";
export { tokenizeLine, tokenizeLineDetailed } from "./tokenize.js";
export { parseWorldOrbit } from "./parse.js";
export { normalizeDocument } from "./normalize.js";
export { validateDocument } from "./validate.js";
export {
  createDiagnostic,
  diagnosticFromError,
  normalizeWithDiagnostics,
  parseWithDiagnostics,
  validateDocumentWithDiagnostics,
} from "./diagnostics.js";
export { renderDocumentToScene, rotatePoint } from "./scene.js";
export { formatAtlasDocument, formatDocument, formatDraftDocument } from "./format.js";
export {
  materializeAtlasDocument,
  materializeDraftDocument,
  upgradeDocumentToDraftV2,
  upgradeDocumentToV2,
} from "./draft.js";
export { parseWorldOrbitAtlas, parseWorldOrbitDraft } from "./draft-parse.js";
export {
  detectWorldOrbitSchemaVersion,
  loadWorldOrbitSource,
  loadWorldOrbitSourceWithDiagnostics,
} from "./load.js";
export { extractWorldOrbitBlocks } from "./markdown.js";

import { parseWithDiagnostics } from "./diagnostics.js";
import { formatDocument } from "./format.js";
import { loadWorldOrbitSource } from "./load.js";
import { normalizeDocument } from "./normalize.js";
import { parseWorldOrbit } from "./parse.js";
import { renderDocumentToScene } from "./scene.js";
import type {
  AstDocument,
  FormatDocumentOptions,
  FormattableWorldOrbitDocument,
  RenderScene,
  WorldOrbitDocument,
} from "./types.js";
import { validateDocument } from "./validate.js";

export interface ParseResult {
  ast: AstDocument;
  document: WorldOrbitDocument;
}

export interface RenderResult extends ParseResult {
  scene: RenderScene;
}

export function parse(source: string): ParseResult {
  const ast = parseWorldOrbit(source);
  const document = normalizeDocument(ast);
  validateDocument(document);
  return { ast, document };
}

export function render(source: string): RenderResult {
  const result = parse(source);
  return {
    ...result,
    scene: renderDocumentToScene(result.document),
  };
}

export function load(source: string) {
  return loadWorldOrbitSource(source);
}

export function parseSafe(source: string) {
  return parseWithDiagnostics(source);
}

export function stringify(
  document: FormattableWorldOrbitDocument,
  options: FormatDocumentOptions = {},
): string {
  return formatDocument(document, options);
}
