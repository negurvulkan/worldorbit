import type { SceneRenderOptions, SpatialTrajectory, UnitValue, WorldOrbitDocument, WorldOrbitTrajectory, WorldOrbitTrajectorySegment } from "./types.js";
export interface SolverSegmentSample {
    segmentId: string;
    kind: WorldOrbitTrajectorySegment["kind"];
    fromObjectId: string | null;
    toObjectId: string | null;
    aroundObjectId: string | null;
    assistObjectId: string | null;
    duration: UnitValue | null;
    deltaV: UnitValue | null;
}
export interface SolverManeuverSample {
    segmentId: string;
    maneuverId: string;
    kind: string;
    epoch: string | null;
    deltaV: UnitValue | null;
    duration: UnitValue | null;
}
export interface SolverTrajectorySnapshot {
    trajectoryId: string;
    craftObjectId: string | null;
    segments: SolverSegmentSample[];
    maneuvers: SolverManeuverSample[];
}
export interface TrajectorySamplingOptions extends Pick<SceneRenderOptions, "width" | "height" | "padding" | "preset" | "projection" | "camera" | "scaleModel" | "bodyScaleMode"> {
    trajectoryMode?: "illustrative" | "solver" | "auto";
    showTrajectoryWaypoints?: boolean;
    showTrajectoryLabels?: boolean;
}
export declare function createTrajectorySolverSnapshot(trajectory: WorldOrbitTrajectory): SolverTrajectorySnapshot;
export declare function sampleTrajectory(trajectory: WorldOrbitTrajectory, document: WorldOrbitDocument, options?: TrajectorySamplingOptions): SpatialTrajectory | null;
export declare function sampleDocumentTrajectories(document: WorldOrbitDocument, options?: TrajectorySamplingOptions): SpatialTrajectory[];
