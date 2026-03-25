import type { RenderScene } from "@worldorbit/core/types";
import type { SvgRenderOptions, ViewerState } from "./types.js";
export interface InteractiveViewer2DOptions extends Pick<SvgRenderOptions, "width" | "height" | "padding" | "preset" | "theme" | "layers" | "subtitle"> {
    pointer?: boolean;
    touch?: boolean;
    selection?: boolean;
    minScale?: number;
    maxScale?: number;
    fitPadding?: number;
}
export interface WorldOrbitViewer2D {
    getState(): ViewerState;
    setState(state: Partial<ViewerState>): void;
    setRenderOptions(options: Partial<InteractiveViewer2DOptions>): void;
    fitToSystem(): void;
    destroy(): void;
}
export { renderSceneToSvg } from "./render.js";
export { resolveTheme } from "./theme.js";
export type { WorldOrbitTheme } from "./types.js";
export declare function createInteractiveViewer2D(container: HTMLElement, scene: RenderScene, options?: InteractiveViewer2DOptions): WorldOrbitViewer2D;
