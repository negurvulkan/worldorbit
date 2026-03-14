export * from "./types.js";
export * from "./errors.js";
export { tokenizeLine, tokenizeLineDetailed } from "./tokenize.js";
export { parseWorldOrbit } from "./parse.js";
export { normalizeDocument } from "./normalize.js";
export { validateDocument } from "./validate.js";
export { renderDocumentToScene, renderSceneToSvg, renderDocumentToSvg, renderSourceToSvg, } from "./render.js";
export { createInteractiveViewer } from "./viewer.js";
import type { AstDocument, WorldOrbitDocument } from "./types.js";
export interface ParseResult {
    ast: AstDocument;
    document: WorldOrbitDocument;
}
export interface RenderResult extends ParseResult {
    svg: string;
}
export declare function parse(source: string): ParseResult;
export declare function render(source: string): RenderResult;
