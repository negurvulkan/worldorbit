import { type RenderScene, type WorldOrbitDocument } from "@worldorbit/core/types";
import type { SvgRenderOptions } from "./types.js";
export declare const WORLD_LAYER_ID = "worldorbit-camera-root";
export declare function renderSceneToSvg(scene: RenderScene, options?: SvgRenderOptions): string;
export declare function renderDocumentToSvg(document: WorldOrbitDocument, options?: SvgRenderOptions): string;
export declare function renderSourceToSvg(source: string, options?: SvgRenderOptions): string;
