import type { AstDocument, DiagnosticResult, WorldOrbitDiagnostic, WorldOrbitDiagnosticSource, WorldOrbitDocument } from "./types.js";
export interface ParsedWorldOrbitDocument {
    ast: AstDocument;
    document: WorldOrbitDocument;
}
export declare function createDiagnostic(diagnostic: WorldOrbitDiagnostic): WorldOrbitDiagnostic;
export declare function diagnosticFromError(error: unknown, source: WorldOrbitDiagnosticSource, code?: string): WorldOrbitDiagnostic;
export declare function parseWithDiagnostics(source: string): DiagnosticResult<ParsedWorldOrbitDocument>;
export declare function normalizeWithDiagnostics(ast: AstDocument): DiagnosticResult<WorldOrbitDocument>;
export declare function validateDocumentWithDiagnostics(document: WorldOrbitDocument): DiagnosticResult<WorldOrbitDocument>;
