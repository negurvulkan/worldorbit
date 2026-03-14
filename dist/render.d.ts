import type { CoordinatePoint, RenderScene, SvgRenderOptions, WorldOrbitDocument } from "./types.js";
export declare function renderDocumentToScene(document: WorldOrbitDocument, options?: SvgRenderOptions): RenderScene;
export declare function renderSceneToSvg(scene: RenderScene): string;
export declare function renderDocumentToSvg(document: WorldOrbitDocument, options?: SvgRenderOptions): string;
export declare function renderSourceToSvg(source: string, options?: SvgRenderOptions): string;
export declare function rotatePoint(point: CoordinatePoint, center: CoordinatePoint, rotationDeg: number): CoordinatePoint;
