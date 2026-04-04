import type { CosmosDiagnosticResult, LoadedCosmosSource } from "./types.js";
export declare function detectCosmosSchemaVersion(source: string): "4.0" | null;
export declare function loadCosmosSource(source: string): LoadedCosmosSource;
export declare function loadCosmosSourceWithDiagnostics(source: string): CosmosDiagnosticResult<LoadedCosmosSource>;
