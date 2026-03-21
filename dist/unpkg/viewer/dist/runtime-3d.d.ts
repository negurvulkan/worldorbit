import { type CoordinatePoint, type SpatialScene } from "@worldorbit/core";
import type { ViewerRenderOptions, ViewerState } from "./types.js";
interface Viewer3DRuntimeUpdate {
    spatialScene: SpatialScene;
    renderOptions: ViewerRenderOptions;
    visibleObjectIds: Set<string>;
    selectedObjectId: string | null;
    hoveredObjectId: string | null;
    state: ViewerState;
    timeSeconds: number;
}
export interface Viewer3DRuntime {
    update(next: Viewer3DRuntimeUpdate): void;
    hitTest(clientX: number, clientY: number): string | null;
    projectObjectToContainer(objectId: string): CoordinatePoint | null;
    destroy(): void;
}
export declare function createViewer3DRuntime(container: HTMLElement): Viewer3DRuntime;
export {};
