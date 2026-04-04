import { diagnosticFromError } from "./diagnostics.js";
import { parseWorldOrbitHierarchyDocument } from "./hierarchy-parse.js";
export function detectWorldOrbitHierarchySchemaVersion(source) {
    for (const line of source.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }
        return /^schema\s+4\.0$/i.test(trimmed) ? "4.0" : null;
    }
    return null;
}
export function loadWorldOrbitHierarchySource(source) {
    const result = loadWorldOrbitHierarchySourceWithDiagnostics(source);
    if (!result.ok || !result.value) {
        const diagnostic = result.diagnostics[0];
        const error = new Error(diagnostic?.message ?? "Failed to load WorldOrbit hierarchy source");
        error.line = diagnostic?.line;
        error.column = diagnostic?.column;
        throw error;
    }
    return result.value;
}
export function loadWorldOrbitHierarchySourceWithDiagnostics(source) {
    const schemaVersion = detectWorldOrbitHierarchySchemaVersion(source);
    if (!schemaVersion) {
        const diagnostics = [
            {
                code: "hierarchy.schema.unsupported",
                severity: "error",
                source: "parse",
                message: 'WorldOrbit hierarchy expects "schema 4.0".',
                line: 1,
                column: 1,
            },
        ];
        return { ok: false, value: null, diagnostics };
    }
    try {
        const hierarchyDocument = parseWorldOrbitHierarchyDocument(source);
        const firstSystem = hierarchyDocument.universe.galaxies[0]?.systems[0]?.materializedDocument ?? {
            format: "worldorbit",
            version: "1.0",
            schemaVersion: "4.0",
            theme: null,
            system: null,
            groups: [],
            relations: [],
            events: [],
            trajectories: [],
            objects: [],
        };
        return {
            ok: true,
            value: {
                schemaVersion,
                ast: null,
                document: firstSystem,
                atlasDocument: null,
                draftDocument: null,
                hierarchyDocument,
                diagnostics: hierarchyDocument.diagnostics,
            },
            diagnostics: hierarchyDocument.diagnostics,
        };
    }
    catch (error) {
        return {
            ok: false,
            value: null,
            diagnostics: [diagnosticFromError(error, "parse", "hierarchy.load.failed")],
        };
    }
}
