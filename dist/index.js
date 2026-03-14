export * from "./types.js";
export * from "./errors.js";
export { tokenizeLine, tokenizeLineDetailed } from "./tokenize.js";
export { parseWorldOrbit } from "./parse.js";
export { normalizeDocument } from "./normalize.js";
export { validateDocument } from "./validate.js";
export { renderDocumentToScene, renderSceneToSvg, renderDocumentToSvg, renderSourceToSvg, } from "./render.js";
export { createInteractiveViewer } from "./viewer.js";
import { normalizeDocument } from "./normalize.js";
import { parseWorldOrbit } from "./parse.js";
import { renderDocumentToSvg } from "./render.js";
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
        svg: renderDocumentToSvg(result.document),
    };
}
