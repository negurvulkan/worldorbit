import { materializeAtlasDocument } from "./draft.js";
import { collectAtlasDiagnostics } from "./atlas-validate.js";
import type {
  AtlasDocumentPath,
  AtlasResolvedDiagnostic,
  WorldOrbitAtlasAnnotation,
  WorldOrbitAtlasDocument,
  WorldOrbitAtlasDocumentVersion,
  WorldOrbitEvent,
  WorldOrbitEventPose,
  WorldOrbitAtlasSystem,
  WorldOrbitGroup,
  WorldOrbitManeuver,
  WorldOrbitAtlasViewpoint,
  WorldOrbitDiagnostic,
  WorldOrbitRelation,
  WorldOrbitObject,
  WorldOrbitTrajectory,
  WorldOrbitTrajectorySegment,
} from "./types.js";

export function createEmptyAtlasDocument(
  systemId = "WorldOrbit",
  version: WorldOrbitAtlasDocumentVersion = "3.0",
): WorldOrbitAtlasDocument {
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

export function cloneAtlasDocument(document: WorldOrbitAtlasDocument): WorldOrbitAtlasDocument {
  return structuredClone(document);
}

export function listAtlasDocumentPaths(document: WorldOrbitAtlasDocument): AtlasDocumentPath[] {
  const paths: AtlasDocumentPath[] = [{ kind: "system" }, { kind: "defaults" }];

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

export function getAtlasDocumentNode(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
): unknown {
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

export function upsertAtlasDocumentNode(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
  value: unknown,
): WorldOrbitAtlasDocument {
  const next = cloneAtlasDocument(document);
  const system = ensureSystem(next);

  switch (path.kind) {
    case "system":
      next.system = value as WorldOrbitAtlasSystem;
      return next;
    case "defaults":
      system.defaults = {
        ...system.defaults,
        ...(value as Partial<WorldOrbitAtlasSystem["defaults"]>),
      };
      return next;
    case "metadata":
      if (!path.key) {
        throw new Error('Metadata updates require a "key" value.');
      }
      if (value === null || value === undefined || value === "") {
        delete system.atlasMetadata[path.key];
      } else {
        system.atlasMetadata[path.key] = String(value);
      }
      return next;
    case "group":
      if (!path.id) {
        throw new Error('Group updates require an "id" value.');
      }
      upsertById(next.groups, value as WorldOrbitGroup);
      return next;
    case "event":
      if (!path.id) {
        throw new Error('Event updates require an "id" value.');
      }
      upsertById(next.events, value as WorldOrbitEvent);
      return next;
    case "event-pose":
      if (!path.id || !path.key) {
        throw new Error('Event pose updates require an event "id" and pose "key" value.');
      }
      upsertEventPose(next.events, path.id, value as WorldOrbitEventPose);
      return next;
    case "trajectory":
      if (!path.id) {
        throw new Error('Trajectory updates require an "id" value.');
      }
      upsertById(next.trajectories, value as WorldOrbitTrajectory);
      return next;
    case "trajectory-segment":
      if (!path.id || !path.key) {
        throw new Error('Trajectory segment updates require a trajectory "id" and segment "key" value.');
      }
      upsertTrajectorySegment(next.trajectories, path.id, value as WorldOrbitTrajectorySegment);
      return next;
    case "trajectory-maneuver":
      if (!path.id || !path.key) {
        throw new Error('Trajectory maneuver updates require a trajectory "id" and maneuver "key" value.');
      }
      upsertTrajectoryManeuver(next.trajectories, path.id, path.key, value as WorldOrbitManeuver);
      return next;
    case "object":
      if (!path.id) {
        throw new Error('Object updates require an "id" value.');
      }
      upsertById(next.objects, value as WorldOrbitObject);
      return next;
    case "viewpoint":
      if (!path.id) {
        throw new Error('Viewpoint updates require an "id" value.');
      }
      upsertById(system.viewpoints, value as WorldOrbitAtlasViewpoint);
      return next;
    case "annotation":
      if (!path.id) {
        throw new Error('Annotation updates require an "id" value.');
      }
      upsertById(system.annotations, value as WorldOrbitAtlasAnnotation);
      return next;
    case "relation":
      if (!path.id) {
        throw new Error('Relation updates require an "id" value.');
      }
      upsertById(next.relations, value as WorldOrbitRelation);
      return next;
  }
}

export function updateAtlasDocumentNode(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
  updater: (value: unknown) => unknown,
): WorldOrbitAtlasDocument {
  return upsertAtlasDocumentNode(document, path, updater(getAtlasDocumentNode(document, path)));
}

export function removeAtlasDocumentNode(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
): WorldOrbitAtlasDocument {
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

export function resolveAtlasDiagnostics(
  document: WorldOrbitAtlasDocument,
  diagnostics: WorldOrbitDiagnostic[],
): AtlasResolvedDiagnostic[] {
  return diagnostics.map((diagnostic) => ({
    diagnostic,
    path: resolveAtlasDiagnosticPath(document, diagnostic),
  }));
}

export function resolveAtlasDiagnosticPath(
  document: WorldOrbitAtlasDocument,
  diagnostic: WorldOrbitDiagnostic,
): AtlasDocumentPath | null {
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
        if (
          parts[4] === "maneuver" &&
          parts[5] &&
          findTrajectoryManeuver(document, parts[1], `${parts[3]}:${parts[5]}`)
        ) {
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

export function validateAtlasDocumentWithDiagnostics(
  document: WorldOrbitAtlasDocument,
): AtlasResolvedDiagnostic[] {
  const diagnostics = [
    ...document.diagnostics,
    ...collectAtlasDiagnostics(document, document.version),
  ];
  return resolveAtlasDiagnostics(document, diagnostics);
}

function ensureSystem(document: WorldOrbitAtlasDocument): WorldOrbitAtlasSystem {
  if (document.system) {
    return document.system;
  }

  document.system = createEmptyAtlasDocument().system;
  return document.system!;
}

function findObject(
  document: WorldOrbitAtlasDocument,
  objectId: string,
): WorldOrbitObject | null {
  return document.objects.find((object) => object.id === objectId) ?? null;
}

function findGroup(
  document: WorldOrbitAtlasDocument,
  groupId: string,
): WorldOrbitGroup | null {
  return document.groups.find((group) => group.id === groupId) ?? null;
}

function findRelation(
  document: WorldOrbitAtlasDocument,
  relationId: string,
): WorldOrbitRelation | null {
  return document.relations.find((relation) => relation.id === relationId) ?? null;
}

function findEvent(
  document: WorldOrbitAtlasDocument,
  eventId: string,
): WorldOrbitEvent | null {
  return document.events.find((event) => event.id === eventId) ?? null;
}

function findEventPose(
  document: WorldOrbitAtlasDocument,
  eventId: string,
  objectId: string,
): WorldOrbitEventPose | null {
  return findEvent(document, eventId)?.positions.find((pose) => pose.objectId === objectId) ?? null;
}

function findTrajectory(
  document: WorldOrbitAtlasDocument,
  trajectoryId: string,
): WorldOrbitTrajectory | null {
  return document.trajectories.find((trajectory) => trajectory.id === trajectoryId) ?? null;
}

function findTrajectorySegment(
  document: WorldOrbitAtlasDocument,
  trajectoryId: string,
  segmentId: string,
): WorldOrbitTrajectorySegment | null {
  return findTrajectory(document, trajectoryId)?.segments.find((segment) => segment.id === segmentId) ?? null;
}

function findTrajectoryManeuver(
  document: WorldOrbitAtlasDocument,
  trajectoryId: string,
  combinedKey: string,
): WorldOrbitManeuver | null {
  const parsed = splitTrajectoryManeuverKey(combinedKey);
  if (!parsed) {
    return null;
  }

  return findTrajectorySegment(document, trajectoryId, parsed.segmentId)
    ?.maneuvers.find((maneuver) => maneuver.id === parsed.maneuverId) ?? null;
}

function findViewpoint(
  system: WorldOrbitAtlasSystem | null,
  viewpointId: string,
): WorldOrbitAtlasViewpoint | null {
  return system?.viewpoints.find((viewpoint) => viewpoint.id === viewpointId) ?? null;
}

function findAnnotation(
  system: WorldOrbitAtlasSystem | null,
  annotationId: string,
): WorldOrbitAtlasAnnotation | null {
  return system?.annotations.find((annotation) => annotation.id === annotationId) ?? null;
}

function upsertById<T extends { id: string }>(items: T[], value: T): void {
  const index = items.findIndex((item) => item.id === value.id);
  if (index === -1) {
    items.push(value);
    items.sort(compareIdLike);
    return;
  }

  items[index] = value;
}

function upsertEventPose(
  events: WorldOrbitEvent[],
  eventId: string,
  value: WorldOrbitEventPose,
): void {
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

function upsertTrajectorySegment(
  trajectories: WorldOrbitTrajectory[],
  trajectoryId: string,
  value: WorldOrbitTrajectorySegment,
): void {
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

function upsertTrajectoryManeuver(
  trajectories: WorldOrbitTrajectory[],
  trajectoryId: string,
  combinedKey: string,
  value: WorldOrbitManeuver,
): void {
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

function splitTrajectoryManeuverKey(
  key: string,
): { segmentId: string; maneuverId: string } | null {
  const separator = key.indexOf(":");
  if (separator <= 0 || separator >= key.length - 1) {
    return null;
  }

  return {
    segmentId: key.slice(0, separator),
    maneuverId: key.slice(separator + 1),
  };
}

function compareIdLike(left: { id: string }, right: { id: string }): number {
  return left.id.localeCompare(right.id);
}

function comparePoseObjectId(
  left: WorldOrbitEventPose,
  right: WorldOrbitEventPose,
): number {
  return left.objectId.localeCompare(right.objectId);
}
