import { renderDocumentToScene } from "./scene.js";
export function createTrajectorySolverSnapshot(trajectory) {
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
        maneuvers: trajectory.segments.flatMap((segment) => segment.maneuvers.map((maneuver) => mapManeuver(segment.id, maneuver))),
    };
}
export function sampleTrajectory(trajectory, document, options = {}) {
    const scene = renderDocumentToScene(document, {
        ...options,
        trajectoryMode: options.trajectoryMode ?? trajectory.renderMode ?? "auto",
        showTrajectoryWaypoints: options.showTrajectoryWaypoints ?? true,
        showTrajectoryLabels: options.showTrajectoryLabels ?? true,
    });
    const rendered = scene.trajectories.find((entry) => entry.trajectoryId === trajectory.id);
    return rendered ? mapRenderTrajectoryToSpatial(rendered) : null;
}
export function sampleDocumentTrajectories(document, options = {}) {
    const scene = renderDocumentToScene(document, {
        ...options,
        trajectoryMode: options.trajectoryMode ?? "auto",
        showTrajectoryWaypoints: options.showTrajectoryWaypoints ?? true,
        showTrajectoryLabels: options.showTrajectoryLabels ?? true,
    });
    return scene.trajectories.map(mapRenderTrajectoryToSpatial);
}
function mapRenderTrajectoryToSpatial(trajectory) {
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
function mapManeuver(segmentId, maneuver) {
    return {
        segmentId,
        maneuverId: maneuver.id,
        kind: maneuver.kind,
        epoch: maneuver.epoch,
        deltaV: maneuver.deltaV ?? null,
        duration: maneuver.duration ?? null,
    };
}
function samplePathPoints(path) {
    const matches = [...path.matchAll(/[MLQ]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?))?(?:\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?))?/g)];
    if (matches.length === 0) {
        return [];
    }
    const points = [];
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
