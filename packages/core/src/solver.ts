import { renderDocumentToScene } from "./scene.js";
import type {
  RenderSceneTrajectory,
  SceneRenderOptions,
  SpatialTrajectory,
  UnitValue,
  WorldOrbitDocument,
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

export interface TrajectorySamplingOptions extends Pick<
  SceneRenderOptions,
  "width" | "height" | "padding" | "preset" | "projection" | "camera" | "scaleModel" | "bodyScaleMode"
> {
  trajectoryMode?: "illustrative" | "solver" | "auto";
  showTrajectoryWaypoints?: boolean;
  showTrajectoryLabels?: boolean;
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

export function sampleTrajectory(
  trajectory: WorldOrbitTrajectory,
  document: WorldOrbitDocument,
  options: TrajectorySamplingOptions = {},
): SpatialTrajectory | null {
  const scene = renderDocumentToScene(document, {
    ...options,
    trajectoryMode: options.trajectoryMode ?? trajectory.renderMode ?? "auto",
    showTrajectoryWaypoints: options.showTrajectoryWaypoints ?? true,
    showTrajectoryLabels: options.showTrajectoryLabels ?? true,
  });
  const rendered = scene.trajectories.find((entry) => entry.trajectoryId === trajectory.id);
  return rendered ? mapRenderTrajectoryToSpatial(rendered) : null;
}

export function sampleDocumentTrajectories(
  document: WorldOrbitDocument,
  options: TrajectorySamplingOptions = {},
): SpatialTrajectory[] {
  const scene = renderDocumentToScene(document, {
    ...options,
    trajectoryMode: options.trajectoryMode ?? "auto",
    showTrajectoryWaypoints: options.showTrajectoryWaypoints ?? true,
    showTrajectoryLabels: options.showTrajectoryLabels ?? true,
  });
  return scene.trajectories.map(mapRenderTrajectoryToSpatial);
}

function mapRenderTrajectoryToSpatial(
  trajectory: RenderSceneTrajectory,
): SpatialTrajectory {
  return {
    trajectoryId: trajectory.trajectoryId,
    trajectory: trajectory.trajectory,
    craftObjectId: trajectory.craftObjectId,
    mode: trajectory.mode,
    stroke: trajectory.stroke,
    strokeWidth: trajectory.strokeWidth,
    marker: trajectory.marker,
    labelMode: trajectory.labelMode,
    showWaypoints: trajectory.showWaypoints,
    samples: samplePathPoints(trajectory.path).map((point) => ({
      x: point.x,
      y: 0,
      z: point.y,
    })),
    waypoints: trajectory.waypoints.map((waypoint) => ({
      trajectoryId: waypoint.trajectoryId,
      segmentId: waypoint.segmentId,
      maneuverId: waypoint.maneuverId,
      objectId: waypoint.objectId,
      position: {
        x: waypoint.x,
        y: 0,
        z: waypoint.y,
      },
      label: waypoint.label,
      dateLabel: waypoint.dateLabel,
      hidden: waypoint.hidden,
    })),
    hidden: trajectory.hidden,
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

function samplePathPoints(path: string): Array<{ x: number; y: number }> {
  const matches = [...path.matchAll(/[MLQ]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?))?(?:\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?))?/g)];
  if (matches.length === 0) {
    return [];
  }

  const points: Array<{ x: number; y: number }> = [];
  for (const match of matches) {
    const command = match[0][0];
    if (command === "M" || command === "L") {
      points.push({ x: Number(match[1]), y: Number(match[2]) });
      continue;
    }
    if (command === "Q") {
      points.push({ x: Number(match[1]), y: Number(match[2]) });
      points.push({ x: Number(match[5]), y: Number(match[6]) });
    }
  }
  return points;
}
