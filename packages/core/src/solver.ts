import type {
  UnitValue,
  WorldOrbitManeuver,
  WorldOrbitTrajectory,
  WorldOrbitTrajectorySegment,
} from "./types.js";

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

export function createTrajectorySolverSnapshot(
  trajectory: WorldOrbitTrajectory,
): SolverTrajectorySnapshot {
  return {
    trajectoryId: trajectory.id,
    craftObjectId: trajectory.craftObjectId,
    segments: trajectory.segments.map((segment) => ({
      segmentId: segment.id,
      kind: segment.kind,
      fromObjectId: segment.fromObjectId,
      toObjectId: segment.toObjectId,
      aroundObjectId: segment.aroundObjectId,
      assistObjectId: segment.assist?.objectId ?? null,
      duration: segment.duration ?? null,
      deltaV: segment.deltaV ?? null,
    })),
    maneuvers: trajectory.segments.flatMap((segment) =>
      segment.maneuvers.map((maneuver) => mapManeuver(segment.id, maneuver)),
    ),
  };
}

function mapManeuver(
  segmentId: string,
  maneuver: WorldOrbitManeuver,
): SolverManeuverSample {
  return {
    segmentId,
    maneuverId: maneuver.id,
    kind: maneuver.kind,
    epoch: maneuver.epoch,
    deltaV: maneuver.deltaV ?? null,
    duration: maneuver.duration ?? null,
  };
}
