import type {
  RenderSceneViewpointFilter,
  UnitValue,
  ViewProjection,
  WorldOrbitAnyDocumentVersion,
  WorldOrbitAtlasDocument,
  WorldOrbitAtlasViewpoint,
  WorldOrbitDiagnostic,
  WorldOrbitDraftDocument,
  WorldOrbitDraftSystem,
  WorldOrbitEvent,
  WorldOrbitEventPose,
  WorldOrbitManeuver,
  WorldOrbitObject,
  WorldOrbitRelation,
  WorldOrbitTrajectory,
  WorldOrbitTrajectorySegment,
  WorldOrbitViewCamera,
} from "./types.js";

const SURFACE_TARGET_TYPES = new Set(["star", "planet", "moon", "asteroid", "comet"]);
const EARTH_MASSES_PER_SOLAR = 332_946.0487;
const JUPITER_MASSES_PER_SOLAR = 1_047.3486;
const AU_IN_KM = 149_597_870.7;
const EARTH_RADIUS_IN_KM = 6_371;
const SOLAR_RADIUS_IN_KM = 695_700;
const LY_IN_AU = 63_241.077;
const PC_IN_AU = 206_264.806;
const KPC_IN_AU = 206_264_806;

export function collectAtlasDiagnostics(
  document: WorldOrbitAtlasDocument | WorldOrbitDraftDocument,
  sourceSchemaVersion?: WorldOrbitAnyDocumentVersion,
): WorldOrbitDiagnostic[] {
  const diagnostics: WorldOrbitDiagnostic[] = [];
  const objectMap = new Map(document.objects.map((object) => [object.id, object]));
  const groupIds = new Set(document.groups.map((group) => group.id));
  const eventIds = new Set(document.events.map((event) => event.id));
  const trajectoryMap = new Map(document.trajectories.map((trajectory) => [trajectory.id, trajectory]));

  if (!document.system) {
    diagnostics.push(error("validate.system.required", "Atlas documents must declare exactly one system."));
  }

  const knownIds = new Map<string, string>();
  for (const [kind, ids] of [
    ["group", document.groups.map((group) => group.id)],
    ["viewpoint", document.system?.viewpoints.map((viewpoint) => viewpoint.id) ?? []],
    ["annotation", document.system?.annotations.map((annotation) => annotation.id) ?? []],
    ["relation", document.relations.map((relation) => relation.id)],
    ["event", document.events.map((event) => event.id)],
    ["trajectory", document.trajectories.map((trajectory) => trajectory.id)],
    ["object", document.objects.map((object) => object.id)],
  ] as const) {
    for (const id of ids) {
      const previous = knownIds.get(id);
      if (previous) {
        diagnostics.push(error("validate.id.duplicate", `Duplicate ${kind} id "${id}" already used by ${previous}.`));
      } else {
        knownIds.set(id, kind);
      }
    }
  }

  for (const relation of document.relations) {
    validateRelation(relation, objectMap, diagnostics);
  }

  for (const viewpoint of document.system?.viewpoints ?? []) {
    validateViewpoint(
      viewpoint,
      groupIds,
      eventIds,
      sourceSchemaVersion,
      diagnostics,
      objectMap,
    );
  }

  for (const object of document.objects) {
    validateObject(object, document.system, objectMap, groupIds, trajectoryMap, diagnostics);
  }

  for (const event of document.events) {
    validateEvent(event, document.system, objectMap, trajectoryMap, diagnostics);
  }

  for (const trajectory of document.trajectories) {
    validateTrajectory(trajectory, objectMap, diagnostics);
  }

  return diagnostics;
}

function validateRelation(
  relation: WorldOrbitRelation,
  objectMap: Map<string, WorldOrbitObject>,
  diagnostics: WorldOrbitDiagnostic[],
): void {
  if (!relation.from) {
    diagnostics.push(error("validate.relation.from.required", `Relation "${relation.id}" is missing a "from" target.`));
  } else if (!objectMap.has(relation.from)) {
    diagnostics.push(error("validate.relation.from.unknown", `Unknown relation source "${relation.from}" on "${relation.id}".`));
  }

  if (!relation.to) {
    diagnostics.push(error("validate.relation.to.required", `Relation "${relation.id}" is missing a "to" target.`));
  } else if (!objectMap.has(relation.to)) {
    diagnostics.push(error("validate.relation.to.unknown", `Unknown relation target "${relation.to}" on "${relation.id}".`));
  }

  if (!relation.kind) {
    diagnostics.push(error("validate.relation.kind.required", `Relation "${relation.id}" is missing a "kind" value.`));
  }
}

function validateViewpoint(
  viewpoint: WorldOrbitAtlasViewpoint,
  groupIds: Set<string>,
  eventIds: Set<string>,
  sourceSchemaVersion: WorldOrbitAnyDocumentVersion | undefined,
  diagnostics: WorldOrbitDiagnostic[],
  objectMap: Map<string, WorldOrbitObject>,
): void {
  const filter = viewpoint.filter;

  if (sourceSchemaVersion === "2.1" || sourceSchemaVersion === "2.5" || sourceSchemaVersion === "2.6") {
    if (filter) {
      for (const groupId of filter.groupIds) {
        if (!groupIds.has(groupId)) {
          diagnostics.push(warn("validate.viewpoint.group.unknown", `Unknown group "${groupId}" in viewpoint "${viewpoint.id}".`, undefined, `viewpoint.${viewpoint.id}.groups`));
        }
      }
    }

    for (const eventId of viewpoint.events ?? []) {
      if (!eventIds.has(eventId)) {
        diagnostics.push(warn("validate.viewpoint.event.unknown", `Unknown event "${eventId}" in viewpoint "${viewpoint.id}".`, undefined, `viewpoint.${viewpoint.id}.events`));
      }
    }
  }

  validateProjection(viewpoint.projection, diagnostics, `viewpoint.${viewpoint.id}.projection`, viewpoint.id);
  validateCamera(
    viewpoint.camera,
    viewpoint.projection,
    viewpoint.rotationDeg,
    diagnostics,
    viewpoint.id,
    viewpoint.focusObjectId,
    viewpoint.selectedObjectId,
    filter,
    objectMap,
  );
}

function validateObject(
  object: WorldOrbitObject,
  system: WorldOrbitAtlasDocument["system"] | WorldOrbitDraftSystem | null,
  objectMap: Map<string, WorldOrbitObject>,
  groupIds: Set<string>,
  trajectoryMap: Map<string, WorldOrbitTrajectory>,
  diagnostics: WorldOrbitDiagnostic[],
): void {
  const placement = object.placement;
  const orbitPlacement = placement?.mode === "orbit" ? placement : null;
  const parentObject = placement?.mode === "orbit" ? objectMap.get(placement.target) ?? null : null;

  if (object.groups) {
    for (const groupId of object.groups) {
      if (!groupIds.has(groupId)) {
        diagnostics.push(warn("validate.group.unknown", `Unknown group "${groupId}" on "${object.id}".`, object.id, "groups"));
      }
    }
  }

  if (typeof object.epoch === "string" && !object.epoch.trim()) {
    diagnostics.push(warn("validate.epoch.empty", `Object "${object.id}" defines an empty epoch string.`, object.id, "epoch"));
  }

  if (typeof object.referencePlane === "string" && !object.referencePlane.trim()) {
    diagnostics.push(warn("validate.referencePlane.empty", `Object "${object.id}" defines an empty reference plane string.`, object.id, "referencePlane"));
  }

  if (object.trajectoryId) {
    if (!trajectoryMap.has(object.trajectoryId)) {
      diagnostics.push(error("validate.trajectory.object.unknown", `Unknown trajectory "${object.trajectoryId}" on "${object.id}".`, object.id, "trajectory"));
    } else if (!isTrajectoryCapableObject(object)) {
      diagnostics.push(error("validate.trajectory.object.invalidType", `Only craft or legacy ship-like structures may reference trajectories; found "${object.type}" on "${object.id}".`, object.id, "trajectory"));
    }
  }

  if (orbitPlacement) {
    if (!objectMap.has(orbitPlacement.target)) {
      diagnostics.push(error("validate.orbit.target.unknown", `Unknown placement target "${orbitPlacement.target}" on "${object.id}".`, object.id, "orbit"));
    }
    if (orbitPlacement.distance && orbitPlacement.semiMajor) {
      diagnostics.push(error("validate.orbit.distanceConflict", `Object "${object.id}" cannot declare both "distance" and "semiMajor".`, object.id, "distance"));
    }
    if (orbitPlacement.phase && !object.epoch && !system?.epoch) {
      diagnostics.push(warn("validate.phase.epochMissing", `Object "${object.id}" sets "phase" without an object or system epoch.`, object.id, "phase"));
    }
    if (orbitPlacement.inclination && !object.referencePlane && !system?.referencePlane) {
      diagnostics.push(warn("validate.inclination.referencePlaneMissing", `Object "${object.id}" sets "inclination" without an object or system reference plane.`, object.id, "inclination"));
    }
    if (orbitPlacement.period && !massInSolar(parentObject?.properties.mass)) {
      diagnostics.push(warn("validate.period.massMissing", `Object "${object.id}" sets "period" but its central mass cannot be derived.`, object.id, "period"));
    }
  }

  if (placement?.mode === "surface") {
    const target = objectMap.get(placement.target);
    if (!target) {
      diagnostics.push(error("validate.surface.target.unknown", `Unknown placement target "${placement.target}" on "${object.id}".`, object.id, "surface"));
    } else if (!SURFACE_TARGET_TYPES.has(target.type)) {
      diagnostics.push(error("validate.surface.target.invalid", `Surface target "${placement.target}" on "${object.id}" is not surface-capable.`, object.id, "surface"));
    }
  }

  if (placement?.mode === "at") {
    if (object.type !== "craft" && object.type !== "structure" && object.type !== "phenomenon") {
      diagnostics.push(error("validate.at.objectType", `Only craft, structures, and phenomena may use "at" placement; found "${object.type}" on "${object.id}".`, object.id, "at"));
    }
    if (!validateAtTarget(object, objectMap, diagnostics)) {
      diagnostics.push(error("validate.at.target.unknown", `Unknown at-reference target "${placement.target}" on "${object.id}".`, object.id, "at"));
    }
  }

  if (object.resonance) {
    const target = objectMap.get(object.resonance.targetObjectId);
    if (!target) {
      diagnostics.push(error("validate.resonance.target.unknown", `Unknown resonance target "${object.resonance.targetObjectId}" on "${object.id}".`, object.id, "resonance"));
    } else if (
      object.placement?.mode !== "orbit" ||
      target.placement?.mode !== "orbit" ||
      object.placement.target !== target.placement.target
    ) {
      diagnostics.push(warn("validate.resonance.orbitMismatch", `Resonance target "${object.resonance.targetObjectId}" on "${object.id}" does not share a compatible orbital parent.`, object.id, "resonance"));
    }
  }

  for (const rule of object.deriveRules ?? []) {
    if (rule.field !== "period" || rule.strategy !== "kepler") {
      diagnostics.push(warn("validate.derive.unsupported", `Unsupported derive rule "${rule.field} ${rule.strategy}" on "${object.id}".`, object.id, "derive"));
      continue;
    }

    const derivedPeriodDays = keplerPeriodDays(object, parentObject);
    if (derivedPeriodDays === null) {
      diagnostics.push(warn("validate.derive.inputsMissing", `Object "${object.id}" requests "derive period kepler" but lacks enough input data.`, object.id, "derive"));
      continue;
    }

    if (!orbitPlacement?.period) {
      diagnostics.push(info("validate.derive.period.available", `Object "${object.id}" can derive a Kepler period of ${formatDays(derivedPeriodDays)}.`, object.id, "derive"));
    }
  }

  for (const rule of object.validationRules ?? []) {
    if (rule.rule !== "kepler") {
      diagnostics.push(warn("validate.rule.unsupported", `Unsupported validation rule "${rule.rule}" on "${object.id}".`, object.id, "validate"));
      continue;
    }

    const actualPeriodDays = durationInDays(orbitPlacement?.period);
    const derivedPeriodDays = keplerPeriodDays(object, parentObject);
    if (actualPeriodDays === null || derivedPeriodDays === null) {
      continue;
    }

    const toleranceDays = toleranceForField(object, "period");
    if (Math.abs(actualPeriodDays - derivedPeriodDays) > toleranceDays) {
      diagnostics.push(error("validate.kepler.mismatch", `Object "${object.id}" fails Kepler validation for "period".`, object.id, "validate"));
    }
  }
}

function validateEvent(
  event: WorldOrbitEvent,
  system: WorldOrbitAtlasDocument["system"] | WorldOrbitDraftSystem | null,
  objectMap: Map<string, WorldOrbitObject>,
  trajectoryMap: Map<string, WorldOrbitTrajectory>,
  diagnostics: WorldOrbitDiagnostic[],
): void {
  const fieldPrefix = `event.${event.id}`;
  const referencedIds = new Set<string>();

  if (!event.kind.trim()) {
    diagnostics.push(error("validate.event.kind.required", `Event "${event.id}" is missing a "kind" value.`, undefined, `${fieldPrefix}.kind`));
  }

  if (typeof event.epoch === "string" && !event.epoch.trim()) {
    diagnostics.push(warn("validate.event.epoch.empty", `Event "${event.id}" defines an empty epoch string.`, undefined, `${fieldPrefix}.epoch`));
  }

  if (typeof event.referencePlane === "string" && !event.referencePlane.trim()) {
    diagnostics.push(warn("validate.event.referencePlane.empty", `Event "${event.id}" defines an empty reference plane string.`, undefined, `${fieldPrefix}.referencePlane`));
  }

  if (event.trajectoryId && !trajectoryMap.has(event.trajectoryId)) {
    diagnostics.push(error("validate.event.trajectory.unknown", `Unknown trajectory "${event.trajectoryId}" on event "${event.id}".`, undefined, `${fieldPrefix}.trajectory`));
  }

  if (!event.targetObjectId && event.participantObjectIds.length === 0) {
    diagnostics.push(error("validate.event.references.required", `Event "${event.id}" must define a "target" or at least one participant.`, undefined, `${fieldPrefix}.participants`));
  }

  if (event.targetObjectId) {
    referencedIds.add(event.targetObjectId);
    if (!objectMap.has(event.targetObjectId)) {
      diagnostics.push(error("validate.event.target.unknown", `Unknown event target "${event.targetObjectId}" on "${event.id}".`, undefined, `${fieldPrefix}.target`));
    }
  }

  const seenParticipants = new Set<string>();
  for (const participantId of event.participantObjectIds) {
    referencedIds.add(participantId);
    if (seenParticipants.has(participantId)) {
      diagnostics.push(warn("validate.event.participants.duplicate", `Event "${event.id}" repeats participant "${participantId}".`, undefined, `${fieldPrefix}.participants`));
      continue;
    }
    seenParticipants.add(participantId);
    if (!objectMap.has(participantId)) {
      diagnostics.push(error("validate.event.participants.unknown", `Unknown event participant "${participantId}" on "${event.id}".`, undefined, `${fieldPrefix}.participants`));
    }
  }

  if (
    event.targetObjectId &&
    event.participantObjectIds.length > 0 &&
    !event.participantObjectIds.includes(event.targetObjectId)
  ) {
    diagnostics.push(warn("validate.event.target.notParticipant", `Event "${event.id}" defines a target outside its participants list.`, undefined, `${fieldPrefix}.target`));
  }

  if (event.positions.length === 0) {
    diagnostics.push(warn("validate.event.positions.missing", `Event "${event.id}" has no positions block and cannot drive a scene snapshot.`, undefined, `${fieldPrefix}.positions`));
  }

  if (/(?:^|[-_])(solar-eclipse|lunar-eclipse|transit|occultation)(?:$|[-_])/.test(event.kind) && referencedIds.size < 3) {
    diagnostics.push(warn("validate.event.kind.participants", `Event "${event.id}" looks like an eclipse or transit but references fewer than three bodies.`, undefined, `${fieldPrefix}.participants`));
  }

  const poseIds = new Set<string>();
  for (const pose of event.positions) {
    const poseFieldPrefix = `${fieldPrefix}.pose.${pose.objectId}`;
    if (poseIds.has(pose.objectId)) {
      diagnostics.push(error("validate.event.pose.duplicate", `Event "${event.id}" defines "${pose.objectId}" more than once in positions.`, undefined, poseFieldPrefix));
      continue;
    }
    poseIds.add(pose.objectId);

    const object = objectMap.get(pose.objectId);
    if (!object) {
      diagnostics.push(error("validate.event.pose.object.unknown", `Unknown event pose object "${pose.objectId}" on "${event.id}".`, undefined, poseFieldPrefix));
      continue;
    }

    if (!referencedIds.has(pose.objectId)) {
      diagnostics.push(warn("validate.event.pose.unreferenced", `Event pose "${pose.objectId}" on "${event.id}" is not listed in target/participants.`, undefined, poseFieldPrefix));
    }

    validateEventPose(pose, object, event, system, objectMap, trajectoryMap, diagnostics, poseFieldPrefix, event.id);
  }

  const missingPoseIds = [...referencedIds].filter((objectId) => !poseIds.has(objectId));
  if (event.positions.length > 0 && missingPoseIds.length > 0) {
    diagnostics.push(warn("validate.event.positions.partial", `Event "${event.id}" leaves ${missingPoseIds.length} referenced object(s) on their base placement.`, undefined, `${fieldPrefix}.positions`));
  }
}

function validateEventPose(
  pose: WorldOrbitEventPose,
  object: WorldOrbitObject,
  event: WorldOrbitEvent,
  system: WorldOrbitAtlasDocument["system"] | WorldOrbitDraftSystem | null,
  objectMap: Map<string, WorldOrbitObject>,
  trajectoryMap: Map<string, WorldOrbitTrajectory>,
  diagnostics: WorldOrbitDiagnostic[],
  fieldPrefix: string,
  eventId: string,
): void {
  const placement = pose.placement;
  if (!placement) {
    diagnostics.push(error("validate.event.pose.placement.required", `Event "${eventId}" pose "${pose.objectId}" is missing a placement mode.`, undefined, fieldPrefix));
    return;
  }

  if (pose.trajectorySegmentId && !findTrajectorySegment(trajectoryMap, pose.trajectorySegmentId)) {
    diagnostics.push(error("validate.event.pose.segment.unknown", `Unknown trajectory segment "${pose.trajectorySegmentId}" on "${eventId}:${pose.objectId}".`, undefined, `${fieldPrefix}.segment`));
  }

  if (pose.trajectoryManeuverId && !findTrajectoryManeuver(trajectoryMap, pose.trajectoryManeuverId)) {
    diagnostics.push(error("validate.event.pose.maneuver.unknown", `Unknown trajectory maneuver "${pose.trajectoryManeuverId}" on "${eventId}:${pose.objectId}".`, undefined, `${fieldPrefix}.maneuver`));
  }

  if (placement.mode === "orbit") {
    if (!objectMap.has(placement.target)) {
      diagnostics.push(error("validate.event.pose.orbit.target.unknown", `Unknown event orbit target "${placement.target}" on "${eventId}:${pose.objectId}".`, undefined, `${fieldPrefix}.orbit`));
    }
    if (placement.distance && placement.semiMajor) {
      diagnostics.push(error("validate.event.pose.orbit.distanceConflict", `Event "${eventId}" pose "${pose.objectId}" cannot declare both "distance" and "semiMajor".`, undefined, `${fieldPrefix}.distance`));
    }
    if (placement.phase && !resolveEffectiveEpoch(system, object, event, pose)) {
      diagnostics.push(warn("validate.event.pose.phase.epochMissing", `Event "${eventId}" pose "${pose.objectId}" sets "phase" without an effective epoch.`, undefined, `${fieldPrefix}.phase`));
    }
    if (placement.inclination && !resolveEffectiveReferencePlane(system, object, event, pose)) {
      diagnostics.push(warn("validate.event.pose.inclination.referencePlaneMissing", `Event "${eventId}" pose "${pose.objectId}" sets "inclination" without an effective reference plane.`, undefined, `${fieldPrefix}.inclination`));
    }
    if (placement.period && !massInSolar(objectMap.get(placement.target)?.properties.mass)) {
      diagnostics.push(warn("validate.event.pose.period.massMissing", `Event "${eventId}" pose "${pose.objectId}" sets "period" but its central mass cannot be derived.`, undefined, `${fieldPrefix}.period`));
    }
    return;
  }

  if (placement.mode === "surface") {
    const target = objectMap.get(placement.target);
    if (!target) {
      diagnostics.push(error("validate.event.pose.surface.target.unknown", `Unknown event surface target "${placement.target}" on "${eventId}:${pose.objectId}".`, undefined, `${fieldPrefix}.surface`));
    } else if (!SURFACE_TARGET_TYPES.has(target.type)) {
      diagnostics.push(error("validate.event.pose.surface.target.invalid", `Event surface target "${placement.target}" on "${eventId}:${pose.objectId}" is not surface-capable.`, undefined, `${fieldPrefix}.surface`));
    }
    return;
  }

  if (placement.mode === "at") {
    if (object.type !== "craft" && object.type !== "structure" && object.type !== "phenomenon") {
      diagnostics.push(error("validate.event.pose.at.objectType", `Only craft, structures, and phenomena may use "at" placement in events; found "${object.type}" on "${eventId}:${pose.objectId}".`, undefined, `${fieldPrefix}.at`));
    }
    const reference = placement.reference;
    if (reference.kind === "named" && !objectMap.has(reference.name)) {
      diagnostics.push(error("validate.event.pose.at.target.unknown", `Unknown event at-reference target "${placement.target}" on "${eventId}:${pose.objectId}".`, undefined, `${fieldPrefix}.at`));
    } else if (reference.kind === "anchor" && !objectMap.has(reference.objectId)) {
      diagnostics.push(error("validate.event.pose.anchor.target.unknown", `Unknown event anchor target "${reference.objectId}" on "${eventId}:${pose.objectId}".`, undefined, `${fieldPrefix}.at`));
    } else if (reference.kind === "lagrange") {
      if (!objectMap.has(reference.primary)) {
        diagnostics.push(error("validate.event.pose.lagrange.primary.unknown", `Unknown event Lagrange target "${reference.primary}" on "${eventId}:${pose.objectId}".`, undefined, `${fieldPrefix}.at`));
      } else if (reference.secondary && !objectMap.has(reference.secondary)) {
        diagnostics.push(error("validate.event.pose.lagrange.secondary.unknown", `Unknown event Lagrange target "${reference.secondary}" on "${eventId}:${pose.objectId}".`, undefined, `${fieldPrefix}.at`));
      }
    }
  }
}

function validateTrajectory(
  trajectory: WorldOrbitTrajectory,
  objectMap: Map<string, WorldOrbitObject>,
  diagnostics: WorldOrbitDiagnostic[],
): void {
  if (trajectory.craftObjectId) {
    const craft = objectMap.get(trajectory.craftObjectId);
    if (!craft) {
      diagnostics.push(error("validate.trajectory.craft.unknown", `Unknown craft "${trajectory.craftObjectId}" on trajectory "${trajectory.id}".`, undefined, `trajectory.${trajectory.id}.craft`));
    } else if (!isTrajectoryCapableObject(craft)) {
      diagnostics.push(error("validate.trajectory.craft.invalidType", `Trajectory "${trajectory.id}" targets "${trajectory.craftObjectId}", which is not craft-like.`, undefined, `trajectory.${trajectory.id}.craft`));
    }
  }

  for (const segment of trajectory.segments) {
    validateTrajectorySegment(trajectory.id, segment, objectMap, diagnostics);
  }
}

function validateTrajectorySegment(
  trajectoryId: string,
  segment: WorldOrbitTrajectorySegment,
  objectMap: Map<string, WorldOrbitObject>,
  diagnostics: WorldOrbitDiagnostic[],
): void {
  const fieldPrefix = `trajectory.${trajectoryId}.segment.${segment.id}`;

  for (const [field, objectId] of [
    ["from", segment.fromObjectId],
    ["to", segment.toObjectId],
    ["around", segment.aroundObjectId],
  ] as const) {
    if (objectId && !objectMap.has(objectId)) {
      diagnostics.push(error(`validate.trajectory.segment.${field}.unknown`, `Unknown ${field} object "${objectId}" on trajectory "${trajectoryId}" segment "${segment.id}".`, undefined, `${fieldPrefix}.${field}`));
    }
  }

  if (segment.assist?.objectId && !objectMap.has(segment.assist.objectId)) {
    diagnostics.push(error("validate.trajectory.segment.assist.unknown", `Unknown assist object "${segment.assist.objectId}" on trajectory "${trajectoryId}" segment "${segment.id}".`, undefined, `${fieldPrefix}.assist`));
  }

  if (segment.kind === "flyby" && !segment.assist?.objectId) {
    diagnostics.push(error("validate.trajectory.segment.assist.required", `Trajectory "${trajectoryId}" segment "${segment.id}" is a flyby and requires an "assist" object.`, undefined, `${fieldPrefix}.assist`));
  }

  if ((segment.kind === "capture" || segment.kind === "departure") && !segment.toObjectId && !segment.aroundObjectId) {
    diagnostics.push(error("validate.trajectory.segment.target.required", `Trajectory "${trajectoryId}" segment "${segment.id}" requires a target reference.`, undefined, `${fieldPrefix}.to`));
  }

  for (const maneuver of segment.maneuvers) {
    validateTrajectoryManeuver(trajectoryId, segment.id, maneuver, diagnostics);
  }
}

function validateTrajectoryManeuver(
  trajectoryId: string,
  segmentId: string,
  maneuver: WorldOrbitManeuver,
  diagnostics: WorldOrbitDiagnostic[],
): void {
  if (!maneuver.kind.trim()) {
    diagnostics.push(error("validate.trajectory.maneuver.kind.required", `Trajectory "${trajectoryId}" segment "${segmentId}" maneuver "${maneuver.id}" is missing a kind.`, undefined, `trajectory.${trajectoryId}.segment.${segmentId}.maneuver.${maneuver.id}.kind`));
  }
}

function isTrajectoryCapableObject(object: WorldOrbitObject): boolean {
  if (object.type === "craft") {
    return true;
  }

  if (object.type !== "structure") {
    return false;
  }

  const kind = typeof object.properties.kind === "string" ? object.properties.kind.toLowerCase() : "";
  return kind === "ship" || kind === "probe" || kind === "station";
}

function findTrajectorySegment(
  trajectories: Map<string, WorldOrbitTrajectory>,
  segmentId: string,
): WorldOrbitTrajectorySegment | null {
  for (const trajectory of trajectories.values()) {
    const match = trajectory.segments.find((segment) => segment.id === segmentId);
    if (match) {
      return match;
    }
  }

  return null;
}

function findTrajectoryManeuver(
  trajectories: Map<string, WorldOrbitTrajectory>,
  maneuverId: string,
): WorldOrbitManeuver | null {
  for (const trajectory of trajectories.values()) {
    for (const segment of trajectory.segments) {
      const match = segment.maneuvers.find((maneuver) => maneuver.id === maneuverId);
      if (match) {
        return match;
      }
    }
  }

  return null;
}

function validateAtTarget(
  object: WorldOrbitObject,
  objectMap: Map<string, WorldOrbitObject>,
  diagnostics: WorldOrbitDiagnostic[],
): boolean {
  const reference = object.placement?.mode === "at" ? object.placement.reference : null;
  if (!reference) {
    return true;
  }

  if (reference.kind === "named") {
    return objectMap.has(reference.name);
  }
  if (reference.kind === "anchor") {
    if (!objectMap.has(reference.objectId)) {
      diagnostics.push(error("validate.anchor.target.unknown", `Unknown anchor target "${reference.objectId}" on "${object.id}".`, object.id, "at"));
      return false;
    }
    return true;
  }

  if (!objectMap.has(reference.primary)) {
    diagnostics.push(error("validate.lagrange.primary.unknown", `Unknown Lagrange reference "${reference.primary}" on "${object.id}".`, object.id, "at"));
    return false;
  }
  if (reference.secondary && !objectMap.has(reference.secondary)) {
    diagnostics.push(error("validate.lagrange.secondary.unknown", `Unknown Lagrange reference "${reference.secondary}" on "${object.id}".`, object.id, "at"));
    return false;
  }

  return true;
}

function keplerPeriodDays(object: WorldOrbitObject, parentObject: WorldOrbitObject | null): number | null {
  const placement = object.placement;
  if (!placement || placement.mode !== "orbit") {
    return null;
  }

  const semiMajorAu = distanceInAu(placement.semiMajor ?? placement.distance);
  const centralMassSolar = massInSolar(parentObject?.properties.mass);
  if (semiMajorAu === null || centralMassSolar === null || centralMassSolar <= 0) {
    return null;
  }

  const periodYears = Math.sqrt((semiMajorAu ** 3) / centralMassSolar);
  return periodYears * 365.25;
}

function distanceInAu(value: UnitValue | undefined): number | null {
  if (!value) return null;
  switch (value.unit) {
    case null:
    case "au":
      return value.value;
    case "km":
      return value.value / AU_IN_KM;
    case "m":
      return value.value / (AU_IN_KM * 1000);
    case "ly":
      return value.value * LY_IN_AU;
    case "pc":
      return value.value * PC_IN_AU;
    case "kpc":
      return value.value * KPC_IN_AU;
    case "re":
      return (value.value * EARTH_RADIUS_IN_KM) / AU_IN_KM;
    case "sol":
      return (value.value * SOLAR_RADIUS_IN_KM) / AU_IN_KM;
    default:
      return null;
  }
}

function massInSolar(value: unknown): number | null {
  if (!value || typeof value !== "object" || !("value" in value)) {
    return null;
  }

  const unitValue = value as UnitValue;
  switch (unitValue.unit) {
    case null:
    case "sol":
      return unitValue.value;
    case "me":
      return unitValue.value / EARTH_MASSES_PER_SOLAR;
    case "mj":
      return unitValue.value / JUPITER_MASSES_PER_SOLAR;
    default:
      return null;
  }
}

function durationInDays(value: UnitValue | undefined): number | null {
  if (!value) return null;
  switch (value.unit) {
    case null:
    case "d":
      return value.value;
    case "s":
      return value.value / 86_400;
    case "min":
      return value.value / 1_440;
    case "h":
      return value.value / 24;
    case "y":
      return value.value * 365.25;
    case "ky":
      return value.value * 365_250;
    case "my":
      return value.value * 365_250_000;
    case "gy":
      return value.value * 365_250_000_000;
    default:
      return null;
  }
}

function validateProjection(
  projection: ViewProjection | null | undefined,
  diagnostics: WorldOrbitDiagnostic[],
  field: string,
  viewpointId: string,
): void {
  if (
    projection !== "topdown" &&
    projection !== "isometric" &&
    projection !== "orthographic" &&
    projection !== "perspective"
  ) {
    diagnostics.push(error("validate.viewpoint.projection.invalid", `Unknown projection "${String(projection)}" in viewpoint "${viewpointId}".`, undefined, field));
  }
}

function validateCamera(
  camera: WorldOrbitViewCamera | null,
  projection: ViewProjection,
  rotationDeg: number,
  diagnostics: WorldOrbitDiagnostic[],
  viewpointId: string,
  focusObjectId: string | null,
  selectedObjectId: string | null,
  filter: RenderSceneViewpointFilter | null,
  objectMap: Map<string, WorldOrbitObject>,
): void {
  if (!camera) {
    return;
  }

  const prefix = `viewpoint.${viewpointId}.camera`;
  for (const [key, value] of [
    ["azimuth", camera.azimuth],
    ["elevation", camera.elevation],
    ["roll", camera.roll],
    ["distance", camera.distance],
  ] as const) {
    if (value !== null && (!Number.isFinite(value) || (key === "distance" && value <= 0))) {
      diagnostics.push(error("validate.viewpoint.camera.invalid", `Invalid camera ${key} "${String(value)}" in viewpoint "${viewpointId}".`, undefined, `${prefix}.${key}`));
    }
  }

  if (camera.distance !== null && projection !== "perspective") {
    diagnostics.push(warn("validate.viewpoint.camera.distance.partialEffect", `Camera "distance" only has a semantic effect in perspective viewpoints; "${viewpointId}" uses "${projection}".`, undefined, `${prefix}.distance`));
  }

  if (
    projection === "topdown" &&
    (camera.elevation !== null || camera.roll !== null)
  ) {
    diagnostics.push(warn("validate.viewpoint.camera.topdownPartial", `Camera elevation/roll on topdown viewpoint "${viewpointId}" are currently stored for future 3D use and only partially affect 2D rendering.`, undefined, prefix));
  }

  if (
    projection === "isometric" &&
    camera.elevation !== null
  ) {
    diagnostics.push(info("validate.viewpoint.camera.isometricStored", `Camera elevation on isometric viewpoint "${viewpointId}" is preserved semantically for future 3D rendering.`, undefined, `${prefix}.elevation`));
  }

  if (camera.azimuth !== null && camera.azimuth !== 0 && rotationDeg !== 0) {
    diagnostics.push(warn("validate.viewpoint.rotation.cameraOverlap", `Viewpoint "${viewpointId}" uses camera.azimuth; keep "rotation" only for 2D screen rotation to avoid ambiguity.`, undefined, `${prefix}.azimuth`));
  }

  const hasAnchor =
    (focusObjectId !== null && objectMap.has(focusObjectId)) ||
    (selectedObjectId !== null && objectMap.has(selectedObjectId)) ||
    !!filter;
  if (!hasAnchor) {
    diagnostics.push(info("validate.viewpoint.camera.anchorMissing", `Viewpoint "${viewpointId}" stores camera settings without a focus object, selection, or filter anchor.`, undefined, prefix));
  }
}

function resolveEffectiveEpoch(
  system: WorldOrbitAtlasDocument["system"] | WorldOrbitDraftSystem | null,
  object: WorldOrbitObject,
  event?: WorldOrbitEvent | null,
  pose?: WorldOrbitEventPose | null,
): string | null {
  return normalizeOptionalContextString(pose?.epoch) ??
    normalizeOptionalContextString(event?.epoch) ??
    normalizeOptionalContextString(object.epoch) ??
    normalizeOptionalContextString(system?.epoch) ??
    null;
}

function resolveEffectiveReferencePlane(
  system: WorldOrbitAtlasDocument["system"] | WorldOrbitDraftSystem | null,
  object: WorldOrbitObject,
  event?: WorldOrbitEvent | null,
  pose?: WorldOrbitEventPose | null,
): string | null {
  return normalizeOptionalContextString(pose?.referencePlane) ??
    normalizeOptionalContextString(event?.referencePlane) ??
    normalizeOptionalContextString(object.referencePlane) ??
    normalizeOptionalContextString(system?.referencePlane) ??
    null;
}

function normalizeOptionalContextString(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toleranceForField(object: WorldOrbitObject, field: string): number {
  const tolerance = object.tolerances?.find((entry) => entry.field === field)?.value;
  if (typeof tolerance === "number") {
    return tolerance;
  }
  if (tolerance && typeof tolerance === "object" && "value" in tolerance) {
    return durationInDays(tolerance as UnitValue) ?? 0;
  }
  return 0;
}

function formatDays(days: number): string {
  return `${Math.round(days * 100) / 100}d`;
}

function error(code: string, message: string, objectId?: string, field?: string): WorldOrbitDiagnostic {
  return { code, severity: "error", source: "validate", message, objectId, field };
}

function warn(code: string, message: string, objectId?: string, field?: string): WorldOrbitDiagnostic {
  return { code, severity: "warning", source: "validate", message, objectId, field };
}

function info(code: string, message: string, objectId?: string, field?: string): WorldOrbitDiagnostic {
  return { code, severity: "info", source: "validate", message, objectId, field };
}
