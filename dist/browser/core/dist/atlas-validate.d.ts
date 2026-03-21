import type { WorldOrbitAnyDocumentVersion, WorldOrbitAtlasDocument, WorldOrbitDiagnostic, WorldOrbitDraftDocument } from "./types.js";
export declare function collectAtlasDiagnostics(document: WorldOrbitAtlasDocument | WorldOrbitDraftDocument, sourceSchemaVersion?: WorldOrbitAnyDocumentVersion): WorldOrbitDiagnostic[];
