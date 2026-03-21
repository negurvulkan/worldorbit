import type { DiagnosticResult, LoadedWorldOrbitSource, WorldOrbitAnyDocumentVersion } from "./types.js";
export declare function detectWorldOrbitSchemaVersion(source: string): WorldOrbitAnyDocumentVersion;
export declare function loadWorldOrbitSource(source: string): LoadedWorldOrbitSource;
export declare function loadWorldOrbitSourceWithDiagnostics(source: string): DiagnosticResult<LoadedWorldOrbitSource>;
