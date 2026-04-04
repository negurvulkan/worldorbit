import { diagnosticFromError } from "@worldorbit/core";
import { parseCosmosDocument } from "./parse.js";
export function detectCosmosSchemaVersion(source) {
    for (const line of source.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }
        return /^schema\s+4\.0$/i.test(trimmed) ? "4.0" : null;
    }
    return null;
}
export function loadCosmosSource(source) {
    const result = loadCosmosSourceWithDiagnostics(source);
    if (!result.ok || !result.value) {
        const diagnostic = result.diagnostics[0];
        const error = new Error(diagnostic?.message ?? "Failed to load WorldOrbit Cosmos source");
        error.line = diagnostic?.line;
        error.column = diagnostic?.column;
        throw error;
    }
    return result.value;
}
export function loadCosmosSourceWithDiagnostics(source) {
    const schemaVersion = detectCosmosSchemaVersion(source);
    if (!schemaVersion) {
        const diagnostics = [
            {
                code: "cosmos.schema.unsupported",
                severity: "error",
                source: "parse",
                message: 'WorldOrbit Cosmos expects "schema 4.0".',
                line: 1,
                column: 1,
            },
        ];
        return { ok: false, value: null, diagnostics };
    }
    try {
        const document = parseCosmosDocument(source);
        return {
            ok: true,
            value: {
                schemaVersion,
                document,
                diagnostics: document.diagnostics,
            },
            diagnostics: document.diagnostics,
        };
    }
    catch (error) {
        return {
            ok: false,
            value: null,
            diagnostics: [diagnosticFromError(error, "parse", "cosmos.load.failed")],
        };
    }
}
