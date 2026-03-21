import type { CoordinatePoint3D, SpatialScene, SpatialSceneRenderOptions, WorldOrbitDocument } from "./types.js";
export declare function renderDocumentToSpatialScene(document: WorldOrbitDocument, options?: SpatialSceneRenderOptions): SpatialScene;
export declare function evaluateSpatialSceneAtTime(scene: SpatialScene, timeSeconds: number): Map<string, CoordinatePoint3D>;
