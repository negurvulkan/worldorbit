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
