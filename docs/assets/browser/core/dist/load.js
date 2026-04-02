import { diagnosticFromError } from "./diagnostics.js";
import { materializeAtlasDocument } from "./draft.js";
import { parseWorldOrbitAtlas } from "./draft-parse.js";
import { WorldOrbitError } from "./errors.js";
import { normalizeDocument } from "./normalize.js";
import { parseWorldOrbit } from "./parse.js";
import { validateDocument } from "./validate.js";
const ATLAS_SCHEMA_PATTERN = /^schema\s+(?:2(?:\.0|\.1|\.5|\.6)?|3(?:\.0|\.1)?)$/i;
const ATLAS_SCHEMA_21_PATTERN = /^schema\s+2\.1$/i;
const ATLAS_SCHEMA_25_PATTERN = /^schema\s+2\.5$/i;
const ATLAS_SCHEMA_26_PATTERN = /^schema\s+2\.6$/i;
const ATLAS_SCHEMA_30_PATTERN = /^schema\s+3(?:\.0)?$/i;
const ATLAS_SCHEMA_31_PATTERN = /^schema\s+3\.1$/i;
const LEGACY_DRAFT_SCHEMA_PATTERN = /^schema\s+2\.0-draft$/i;
export function detectWorldOrbitSchemaVersion(source) {
    for (const line of stripCommentsForSchemaDetection(source).split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }
        if (LEGACY_DRAFT_SCHEMA_PATTERN.test(trimmed)) {
            return "2.0-draft";
        }
        if (ATLAS_SCHEMA_21_PATTERN.test(trimmed)) {
            return "2.1";
        }
        if (ATLAS_SCHEMA_25_PATTERN.test(trimmed)) {
            return "2.5";
        }
        if (ATLAS_SCHEMA_26_PATTERN.test(trimmed)) {
            return "2.6";
        }
        if (ATLAS_SCHEMA_30_PATTERN.test(trimmed)) {
            return "3.0";
        }
        if (ATLAS_SCHEMA_31_PATTERN.test(trimmed)) {
            return "3.1";
        }
        if (ATLAS_SCHEMA_PATTERN.test(trimmed)) {
            return "2.0";
        }
        return "1.0";
    }
    return "1.0";
}
function stripCommentsForSchemaDetection(source) {
    const chars = [...source];
    let inString = false;
    let inBlockComment = false;
    for (let index = 0; index < chars.length; index++) {
        const ch = chars[index];
        const next = chars[index + 1];
        if (inBlockComment) {
            if (ch === "*" && next === "/") {
                chars[index] = " ";
                chars[index + 1] = " ";
                inBlockComment = false;
                index++;
                continue;
            }
            if (ch !== "\n" && ch !== "\r") {
                chars[index] = " ";
            }
            continue;
        }
        if (!inString && ch === "/" && next === "*") {
            chars[index] = " ";
            chars[index + 1] = " ";
            inBlockComment = true;
            index++;
            continue;
        }
        if (!inString && ch === "#") {
            chars[index] = " ";
            let inner = index + 1;
            while (inner < chars.length && chars[inner] !== "\n" && chars[inner] !== "\r") {
                chars[inner] = " ";
                inner++;
            }
            index = inner - 1;
            continue;
        }
        if (ch === '"' && chars[index - 1] !== "\\") {
            inString = !inString;
        }
    }
    return chars.join("");
}
export function loadWorldOrbitSource(source) {
    const result = loadWorldOrbitSourceWithDiagnostics(source);
    if (!result.ok || !result.value) {
        const diagnostic = result.diagnostics[0];
        throw new WorldOrbitError(diagnostic?.message ?? "Failed to load WorldOrbit source", diagnostic?.line, diagnostic?.column);
    }
    return result.value;
}
export function loadWorldOrbitSourceWithDiagnostics(source) {
    const schemaVersion = detectWorldOrbitSchemaVersion(source);
    if (schemaVersion === "2.0" ||
        schemaVersion === "2.0-draft" ||
        schemaVersion === "2.1" ||
        schemaVersion === "2.5" ||
        schemaVersion === "2.6" ||
        schemaVersion === "3.0" ||
        schemaVersion === "3.1") {
        return loadAtlasSourceWithDiagnostics(source, schemaVersion);
    }
    let ast;
    try {
        ast = parseWorldOrbit(source);
    }
    catch (error) {
        return {
            ok: false,
            value: null,
            diagnostics: [diagnosticFromError(error, "parse")],
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
            schemaVersion,
            ast,
            document,
            atlasDocument: null,
            draftDocument: null,
            diagnostics: [],
        },
        diagnostics: [],
    };
}
function loadAtlasSourceWithDiagnostics(source, schemaVersion) {
    let atlasDocument;
    try {
        atlasDocument = parseWorldOrbitAtlas(source);
    }
    catch (error) {
        return {
            ok: false,
            value: null,
            diagnostics: [diagnosticFromError(error, "parse", "load.atlas.failed")],
        };
    }
    const atlasDiagnostics = [...atlasDocument.diagnostics];
    if (atlasDiagnostics.some((diagnostic) => diagnostic.severity === "error")) {
        return {
            ok: false,
            value: null,
            diagnostics: atlasDiagnostics,
        };
    }
    let document;
    try {
        document = materializeAtlasDocument(atlasDocument);
    }
    catch (error) {
        return {
            ok: false,
            value: null,
            diagnostics: [diagnosticFromError(error, "normalize", "load.atlas.materialize.failed")],
        };
    }
    const loaded = {
        schemaVersion,
        ast: null,
        document,
        atlasDocument,
        draftDocument: atlasDocument,
        diagnostics: atlasDiagnostics,
    };
    return {
        ok: true,
        value: loaded,
        diagnostics: atlasDiagnostics,
    };
}
