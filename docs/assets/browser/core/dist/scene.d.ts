import type { CoordinatePoint, RenderScene, SceneRenderOptions, WorldOrbitDocument } from "./types.js";
export declare function renderDocumentToScene(document: WorldOrbitDocument, options?: SceneRenderOptions): RenderScene;
export declare function rotatePoint(point: CoordinatePoint, center: CoordinatePoint, rotationDeg: number): CoordinatePoint;
