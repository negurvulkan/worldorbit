export * from "./types.js";
export * from "./errors.js";
export * from "./schema.js";
export { tokenizeLine, tokenizeLineDetailed } from "./tokenize.js";
export { parseWorldOrbit } from "./parse.js";
export { normalizeDocument } from "./normalize.js";
export { validateDocument } from "./validate.js";
export { renderDocumentToScene, rotatePoint } from "./scene.js";
export { formatDocument } from "./format.js";
export { extractWorldOrbitBlocks } from "./markdown.js";

import { formatDocument } from "./format.js";
import { normalizeDocument } from "./normalize.js";
import { parseWorldOrbit } from "./parse.js";
import { renderDocumentToScene } from "./scene.js";
import type { AstDocument, RenderScene, WorldOrbitDocument } from "./types.js";
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

export function stringify(document: WorldOrbitDocument): string {
  return formatDocument(document);
}
