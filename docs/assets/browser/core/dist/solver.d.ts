import type { UnitValue, WorldOrbitTrajectory, WorldOrbitTrajectorySegment } from "./types.js";
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
export declare function createTrajectorySolverSnapshot(trajectory: WorldOrbitTrajectory): SolverTrajectorySnapshot;
