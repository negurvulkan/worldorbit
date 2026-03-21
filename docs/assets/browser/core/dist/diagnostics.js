import { WorldOrbitError } from "./errors.js";
import { normalizeDocument } from "./normalize.js";
import { parseWorldOrbit } from "./parse.js";
import { validateDocument } from "./validate.js";
export function createDiagnostic(diagnostic) {
    return { ...diagnostic };
}
export function diagnosticFromError(error, source, code = `${source}.failed`) {
    if (error instanceof WorldOrbitError) {
        return {
            code,
            severity: "error",
            source,
            message: error.message,
            line: error.line,
            column: error.column,
        };
    }
    if (error instanceof Error) {
        return {
            code,
            severity: "error",
            source,
            message: error.message,
        };
    }
    return {
        code,
        severity: "error",
        source,
        message: String(error),
    };
}
export function parseWithDiagnostics(source) {
    let ast;
    try {
        ast = parseWorldOrbit(source);
    }
    catch (error) {
        const diagnostic = diagnosticFromError(error, "parse");
        return {
            ok: false,
            value: null,
            diagnostics: [diagnostic],
        };
    }
    let document;
    try {
        document = normalizeDocument(ast);
    }
    catch (error) {
        return {
            ok: false,
            value: null,
            diagnostics: [diagnosticFromError(error, "normalize")],
        };
    }
    try {
        validateDocument(document);
    }
    catch (error) {
        return {
            ok: false,
            value: null,
            diagnostics: [diagnosticFromError(error, "validate")],
        };
    }
    return {
        ok: true,
        value: {
            ast,
            document,
        },
        diagnostics: [],
    };
}
export function normalizeWithDiagnostics(ast) {
    try {
        return {
            ok: true,
            value: normalizeDocument(ast),
            diagnostics: [],
        };
    }
    catch (error) {
        return {
            ok: false,
            value: null,
            diagnostics: [diagnosticFromError(error, "normalize")],
        };
    }
}
export function validateDocumentWithDiagnostics(document) {
    try {
        validateDocument(document);
        return {
            ok: true,
            value: document,
            diagnostics: [],
        };
    }
    catch (error) {
        return {
            ok: false,
            value: null,
            diagnostics: [diagnosticFromError(error, "validate")],
        };
    }
}
