import type { DiagnosticResult, LoadedWorldOrbitSource } from "./types.js";
export declare function detectWorldOrbitHierarchySchemaVersion(source: string): "4.0" | null;
export declare function loadWorldOrbitHierarchySource(source: string): LoadedWorldOrbitSource;
export declare function loadWorldOrbitHierarchySourceWithDiagnostics(source: string): DiagnosticResult<LoadedWorldOrbitSource>;
