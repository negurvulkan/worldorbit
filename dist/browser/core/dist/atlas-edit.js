import { collectAtlasDiagnostics } from "./atlas-validate.js";
export function createEmptyAtlasDocument(systemId = "WorldOrbit", version = "3.0") {
    return {
        format: "worldorbit",
        version,
        schemaVersion: version,
        sourceVersion: "1.0",
        theme: {
            preset: "blueprint",
            styles: {},
        },
        system: {
            type: "system",
            id: systemId,
            title: systemId,
            description: null,
            epoch: null,
            referencePlane: null,
            defaults: {
                view: "topdown",
                scale: null,
                units: null,
                preset: null,
                theme: null,
            },
            atlasMetadata: {},
            viewpoints: [],
            annotations: [],
        },
        groups: [],
        relations: [],
        events: [],
        trajectories: [],
        objects: [],
        diagnostics: [],
    };
}
export function cloneAtlasDocument(document) {
    return structuredClone(document);
}
export function listAtlasDocumentPaths(document) {
    const paths = [{ kind: "system" }, { kind: "defaults" }];
    if (document.system) {
        for (const key of Object.keys(document.system.atlasMetadata).sort()) {
            paths.push({ kind: "metadata", key });
        }
        for (const viewpoint of [...document.system.viewpoints].sort(compareIdLike)) {
            paths.push({ kind: "viewpoint", id: viewpoint.id });
        }
        for (const annotation of [...document.system.annotations].sort(compareIdLike)) {
            paths.push({ kind: "annotation", id: annotation.id });
        }
    }
    for (const group of [...document.groups].sort(compareIdLike)) {
        paths.push({ kind: "group", id: group.id });
    }
    for (const relation of [...document.relations].sort(compareIdLike)) {
        paths.push({ kind: "relation", id: relation.id });
    }
    for (const event of [...document.events].sort(compareIdLike)) {
        paths.push({ kind: "event", id: event.id });
        for (const pose of [...event.positions].sort(comparePoseObjectId)) {
            paths.push({ kind: "event-pose", id: event.id, key: pose.objectId });
        }
    }
    for (const trajectory of [...document.trajectories].sort(compareIdLike)) {
        paths.push({ kind: "trajectory", id: trajectory.id });
        for (const segment of [...trajectory.segments].sort(compareIdLike)) {
            paths.push({ kind: "trajectory-segment", id: trajectory.id, key: segment.id });
            for (const maneuver of [...segment.maneuvers].sort(compareIdLike)) {
                paths.push({
                    kind: "trajectory-maneuver",
                    id: trajectory.id,
                    key: `${segment.id}:${maneuver.id}`,
                });
            }
        }
    }
    for (const object of [...document.objects].sort(compareIdLike)) {
        paths.push({ kind: "object", id: object.id });
    }
    return paths;
}
export function getAtlasDocumentNode(document, path) {
    switch (path.kind) {
        case "system":
            return document.system;
        case "defaults":
            return document.system?.defaults ?? null;
        case "metadata":
            return path.key ? (document.system?.atlasMetadata[path.key] ?? null) : null;
        case "group":
            return path.id ? findGroup(document, path.id) : null;
        case "event":
            return path.id ? findEvent(document, path.id) : null;
        case "event-pose":
            return path.id && path.key ? findEventPose(document, path.id, path.key) : null;
        case "trajectory":
            return path.id ? findTrajectory(document, path.id) : null;
        case "trajectory-segment":
            return path.id && path.key ? findTrajectorySegment(document, path.id, path.key) : null;
        case "trajectory-maneuver":
            return path.id && path.key ? findTrajectoryManeuver(document, path.id, path.key) : null;
        case "object":
            return path.id ? findObject(document, path.id) : null;
        case "viewpoint":
            return path.id ? findViewpoint(document.system, path.id) : null;
        case "annotation":
            return path.id ? findAnnotation(document.system, path.id) : null;
        case "relation":
            return path.id ? findRelation(document, path.id) : null;
    }
}
export function upsertAtlasDocumentNode(document, path, value) {
    const next = cloneAtlasDocument(document);
    const system = ensureSystem(next);
    switch (path.kind) {
        case "system":
            next.system = value;
            return next;
        case "defaults":
            system.defaults = {
                ...system.defaults,
                ...value,
            };
            return next;
        case "metadata":
            if (!path.key) {
                throw new Error('Metadata updates require a "key" value.');
            }
            if (value === null || value === undefined || value === "") {
                delete system.atlasMetadata[path.key];
            }
            else {
                system.atlasMetadata[path.key] = String(value);
            }
            return next;
        case "group":
            if (!path.id) {
                throw new Error('Group updates require an "id" value.');
            }
            upsertById(next.groups, value);
            return next;
        case "event":
            if (!path.id) {
                throw new Error('Event updates require an "id" value.');
            }
            upsertById(next.events, value);
            return next;
        case "event-pose":
            if (!path.id || !path.key) {
                throw new Error('Event pose updates require an event "id" and pose "key" value.');
            }
            upsertEventPose(next.events, path.id, value);
            return next;
        case "trajectory":
            if (!path.id) {
                throw new Error('Trajectory updates require an "id" value.');
            }
            upsertById(next.trajectories, value);
            return next;
        case "trajectory-segment":
            if (!path.id || !path.key) {
                throw new Error('Trajectory segment updates require a trajectory "id" and segment "key" value.');
            }
            upsertTrajectorySegment(next.trajectories, path.id, value);
            return next;
        case "trajectory-maneuver":
            if (!path.id || !path.key) {
                throw new Error('Trajectory maneuver updates require a trajectory "id" and maneuver "key" value.');
            }
            upsertTrajectoryManeuver(next.trajectories, path.id, path.key, value);
            return next;
        case "object":
            if (!path.id) {
                throw new Error('Object updates require an "id" value.');
            }
            upsertById(next.objects, value);
            return next;
        case "viewpoint":
            if (!path.id) {
                throw new Error('Viewpoint updates require an "id" value.');
            }
            upsertById(system.viewpoints, value);
            return next;
        case "annotation":
            if (!path.id) {
                throw new Error('Annotation updates require an "id" value.');
            }
            upsertById(system.annotations, value);
            return next;
        case "relation":
            if (!path.id) {
                throw new Error('Relation updates require an "id" value.');
            }
            upsertById(next.relations, value);
            return next;
    }
}
export function updateAtlasDocumentNode(document, path, updater) {
    return upsertAtlasDocumentNode(document, path, updater(getAtlasDocumentNode(document, path)));
}
export function removeAtlasDocumentNode(document, path) {
    const next = cloneAtlasDocument(document);
    const system = ensureSystem(next);
    switch (path.kind) {
        case "metadata":
            if (path.key) {
                delete system.atlasMetadata[path.key];
            }
            return next;
        case "object":
            if (path.id) {
                next.objects = next.objects.filter((object) => object.id !== path.id);
            }
            return next;
        case "group":
            if (path.id) {
                next.groups = next.groups.filter((group) => group.id !== path.id);
            }
            return next;
        case "event":
            if (path.id) {
                next.events = next.events.filter((event) => event.id !== path.id);
            }
            return next;
        case "event-pose":
            if (path.id && path.key) {
                const event = findEvent(next, path.id);
                if (event) {
                    event.positions = event.positions.filter((pose) => pose.objectId !== path.key);
                }
            }
            return next;
        case "trajectory":
            if (path.id) {
                next.trajectories = next.trajectories.filter((trajectory) => trajectory.id !== path.id);
            }
            return next;
        case "trajectory-segment":
            if (path.id && path.key) {
                const trajectory = findTrajectory(next, path.id);
                if (trajectory) {
                    trajectory.segments = trajectory.segments.filter((segment) => segment.id !== path.key);
                }
            }
            return next;
        case "trajectory-maneuver":
            if (path.id && path.key) {
                const maneuver = splitTrajectoryManeuverKey(path.key);
                if (maneuver) {
                    const segment = findTrajectorySegment(next, path.id, maneuver.segmentId);
                    if (segment) {
                        segment.maneuvers = segment.maneuvers.filter((entry) => entry.id !== maneuver.maneuverId);
                    }
                }
            }
            return next;
        case "viewpoint":
            if (path.id) {
                system.viewpoints = system.viewpoints.filter((viewpoint) => viewpoint.id !== path.id);
            }
            return next;
        case "annotation":
            if (path.id) {
                system.annotations = system.annotations.filter((annotation) => annotation.id !== path.id);
            }
            return next;
        case "relation":
            if (path.id) {
                next.relations = next.relations.filter((relation) => relation.id !== path.id);
            }
            return next;
        default:
            return next;
    }
}
export function resolveAtlasDiagnostics(document, diagnostics) {
    return diagnostics.map((diagnostic) => ({
        diagnostic,
        path: resolveAtlasDiagnosticPath(document, diagnostic),
    }));
}
export function resolveAtlasDiagnosticPath(document, diagnostic) {
    if (diagnostic.objectId && findObject(document, diagnostic.objectId)) {
        return {
            kind: "object",
            id: diagnostic.objectId,
        };
    }
    if (diagnostic.field?.startsWith("group.")) {
        const parts = diagnostic.field.split(".");
        if (parts[1] && findGroup(document, parts[1])) {
            return {
                kind: "group",
                id: parts[1],
            };
        }
    }
    if (diagnostic.field?.startsWith("viewpoint.")) {
        const parts = diagnostic.field.split(".");
        if (parts[1] && findViewpoint(document.system, parts[1])) {
            return {
                kind: "viewpoint",
                id: parts[1],
            };
        }
    }
    if (diagnostic.field?.startsWith("annotation.")) {
        const parts = diagnostic.field.split(".");
        if (parts[1] && findAnnotation(document.system, parts[1])) {
            return {
                kind: "annotation",
                id: parts[1],
            };
        }
    }
    if (diagnostic.field?.startsWith("relation.")) {
        const parts = diagnostic.field.split(".");
        if (parts[1] && findRelation(document, parts[1])) {
            return {
                kind: "relation",
                id: parts[1],
            };
        }
    }
    if (diagnostic.field?.startsWith("event.")) {
        const parts = diagnostic.field.split(".");
        if (parts[1] && findEvent(document, parts[1])) {
            if (parts[2] === "pose" && parts[3] && findEventPose(document, parts[1], parts[3])) {
                return {
                    kind: "event-pose",
                    id: parts[1],
                    key: parts[3],
                };
            }
            return {
                kind: "event",
                id: parts[1],
            };
        }
    }
    if (diagnostic.field?.startsWith("trajectory.")) {
        const parts = diagnostic.field.split(".");
        if (parts[1] && findTrajectory(document, parts[1])) {
            if (parts[2] === "segment" && parts[3] && findTrajectorySegment(document, parts[1], parts[3])) {
                if (parts[4] === "maneuver" &&
                    parts[5] &&
                    findTrajectoryManeuver(document, parts[1], `${parts[3]}:${parts[5]}`)) {
                    return {
                        kind: "trajectory-maneuver",
                        id: parts[1],
                        key: `${parts[3]}:${parts[5]}`,
                    };
                }
                return {
                    kind: "trajectory-segment",
                    id: parts[1],
                    key: parts[3],
                };
            }
            return {
                kind: "trajectory",
                id: parts[1],
            };
        }
    }
    if (diagnostic.field && diagnostic.field in ensureSystem(document).atlasMetadata) {
        return {
            kind: "metadata",
            key: diagnostic.field,
        };
    }
    return null;
}
export function validateAtlasDocumentWithDiagnostics(document) {
    const diagnostics = [
        ...document.diagnostics,
        ...collectAtlasDiagnostics(document, document.version),
    ];
    return resolveAtlasDiagnostics(document, diagnostics);
}
function ensureSystem(document) {
    if (document.system) {
        return document.system;
    }
    document.system = createEmptyAtlasDocument().system;
    return document.system;
}
function findObject(document, objectId) {
    return document.objects.find((object) => object.id === objectId) ?? null;
}
function findGroup(document, groupId) {
    return document.groups.find((group) => group.id === groupId) ?? null;
}
function findRelation(document, relationId) {
    return document.relations.find((relation) => relation.id === relationId) ?? null;
}
function findEvent(document, eventId) {
    return document.events.find((event) => event.id === eventId) ?? null;
}
function findEventPose(document, eventId, objectId) {
    return findEvent(document, eventId)?.positions.find((pose) => pose.objectId === objectId) ?? null;
}
function findTrajectory(document, trajectoryId) {
    return document.trajectories.find((trajectory) => trajectory.id === trajectoryId) ?? null;
}
function findTrajectorySegment(document, trajectoryId, segmentId) {
    return findTrajectory(document, trajectoryId)?.segments.find((segment) => segment.id === segmentId) ?? null;
}
function findTrajectoryManeuver(document, trajectoryId, combinedKey) {
    const parsed = splitTrajectoryManeuverKey(combinedKey);
    if (!parsed) {
        return null;
    }
    return findTrajectorySegment(document, trajectoryId, parsed.segmentId)
        ?.maneuvers.find((maneuver) => maneuver.id === parsed.maneuverId) ?? null;
}
function findViewpoint(system, viewpointId) {
    return system?.viewpoints.find((viewpoint) => viewpoint.id === viewpointId) ?? null;
}
function findAnnotation(system, annotationId) {
    return system?.annotations.find((annotation) => annotation.id === annotationId) ?? null;
}
function upsertById(items, value) {
    const index = items.findIndex((item) => item.id === value.id);
    if (index === -1) {
        items.push(value);
        items.sort(compareIdLike);
        return;
    }
    items[index] = value;
}
function upsertEventPose(events, eventId, value) {
    const event = events.find((entry) => entry.id === eventId);
    if (!event) {
        throw new Error(`Unknown event "${eventId}" for pose update.`);
    }
    const index = event.positions.findIndex((entry) => entry.objectId === value.objectId);
    if (index === -1) {
        event.positions.push(value);
        event.positions.sort(comparePoseObjectId);
        return;
    }
    event.positions[index] = value;
}
function upsertTrajectorySegment(trajectories, trajectoryId, value) {
    const trajectory = trajectories.find((entry) => entry.id === trajectoryId);
    if (!trajectory) {
        throw new Error(`Unknown trajectory "${trajectoryId}" for segment update.`);
    }
    const index = trajectory.segments.findIndex((entry) => entry.id === value.id);
    if (index === -1) {
        trajectory.segments.push(value);
        trajectory.segments.sort(compareIdLike);
        return;
    }
    trajectory.segments[index] = value;
}
function upsertTrajectoryManeuver(trajectories, trajectoryId, combinedKey, value) {
    const parsed = splitTrajectoryManeuverKey(combinedKey);
    if (!parsed) {
        throw new Error(`Invalid trajectory maneuver key "${combinedKey}".`);
    }
    const trajectory = trajectories.find((entry) => entry.id === trajectoryId);
    if (!trajectory) {
        throw new Error(`Unknown trajectory "${trajectoryId}" for maneuver update.`);
    }
    const segment = trajectory.segments.find((entry) => entry.id === parsed.segmentId);
    if (!segment) {
        throw new Error(`Unknown trajectory segment "${parsed.segmentId}" on "${trajectoryId}".`);
    }
    const index = segment.maneuvers.findIndex((entry) => entry.id === value.id);
    if (index === -1) {
        segment.maneuvers.push(value);
        segment.maneuvers.sort(compareIdLike);
        return;
    }
    segment.maneuvers[index] = value;
}
function splitTrajectoryManeuverKey(key) {
    const separator = key.indexOf(":");
    if (separator <= 0 || separator >= key.length - 1) {
        return null;
    }
    return {
        segmentId: key.slice(0, separator),
        maneuverId: key.slice(separator + 1),
    };
}
function compareIdLike(left, right) {
    return left.id.localeCompare(right.id);
}
function comparePoseObjectId(left, right) {
    return left.objectId.localeCompare(right.objectId);
}
