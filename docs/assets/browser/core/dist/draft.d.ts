import type { SceneRenderOptions, WorldOrbitAtlasDocument, WorldOrbitEvent, WorldOrbitAtlasSystem, WorldOrbitDiagnostic, WorldOrbitDocument, WorldOrbitObject, WorldOrbitTrajectory } from "./types.js";
interface UpgradeOptions extends Pick<SceneRenderOptions, "preset" | "projection"> {
}
export declare function upgradeDocumentToV2(document: WorldOrbitDocument, options?: UpgradeOptions): WorldOrbitAtlasDocument;
export declare function upgradeDocumentToDraftV2(document: WorldOrbitDocument, options?: UpgradeOptions): {
    version: "2.0-draft";
    schemaVersion: "2.0-draft";
    format: "worldorbit";
    sourceVersion: import("./types.js").WorldOrbitDocumentVersion;
    theme: import("./types.js").NormalizedTheme | null;
    system: WorldOrbitAtlasSystem | null;
    groups: import("./types.js").WorldOrbitGroup[];
    relations: import("./types.js").WorldOrbitRelation[];
    events: WorldOrbitEvent[];
    trajectories: WorldOrbitTrajectory[];
    objects: WorldOrbitObject[];
    diagnostics: WorldOrbitDiagnostic[];
};
export declare function materializeAtlasDocument(document: WorldOrbitAtlasDocument, options?: {
    activeEventId?: string | null;
}): WorldOrbitDocument;
export declare function materializeDraftDocument(document: WorldOrbitAtlasDocument): WorldOrbitDocument;
export {};
