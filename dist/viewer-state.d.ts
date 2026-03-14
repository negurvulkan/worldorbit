import type { CoordinatePoint, RenderScene, ViewerState } from "./types.js";
export interface ViewerConstraints {
    minScale: number;
    maxScale: number;
    fitPadding: number;
}
export declare const DEFAULT_VIEWER_STATE: ViewerState;
export declare function normalizeRotation(rotationDeg: number): number;
export declare function clampScale(scale: number, constraints: ViewerConstraints): number;
export declare function panViewerState(state: ViewerState, dx: number, dy: number): ViewerState;
export declare function rotateViewerState(state: ViewerState, deltaDeg: number): ViewerState;
export declare function zoomViewerStateAt(scene: RenderScene, state: ViewerState, factor: number, anchor: CoordinatePoint, constraints: ViewerConstraints): ViewerState;
export declare function fitViewerState(scene: RenderScene, state: ViewerState, constraints: ViewerConstraints): ViewerState;
export declare function focusViewerState(scene: RenderScene, state: ViewerState, objectId: string, constraints: ViewerConstraints): ViewerState;
export declare function composeViewerTransform(scene: RenderScene, state: ViewerState): string;
export declare function getSceneCenter(scene: RenderScene): CoordinatePoint;
