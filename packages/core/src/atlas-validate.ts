import type {
  RenderSceneViewpointFilter,
  UnitValue,
  WorldOrbitAnyDocumentVersion,
  WorldOrbitAtlasDocument,
  WorldOrbitDiagnostic,
  WorldOrbitDraftDocument,
  WorldOrbitDraftSystem,
  WorldOrbitObject,
  WorldOrbitRelation,
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

  if (!document.system) {
    diagnostics.push(error("validate.system.required", "Atlas documents must declare exactly one system."));
  }

  const knownIds = new Map<string, string>();
  for (const [kind, ids] of [
    ["group", document.groups.map((group) => group.id)],
    ["viewpoint", document.system?.viewpoints.map((viewpoint) => viewpoint.id) ?? []],
    ["annotation", document.system?.annotations.map((annotation) => annotation.id) ?? []],
    ["relation", document.relations.map((relation) => relation.id)],
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
    validateViewpointFilter(viewpoint.filter, groupIds, sourceSchemaVersion, diagnostics, viewpoint.id);
  }

  for (const object of document.objects) {
    validateObject(object, document.system, objectMap, groupIds, diagnostics);
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

function validateViewpointFilter(
  filter: RenderSceneViewpointFilter | null,
  groupIds: Set<string>,
  sourceSchemaVersion: WorldOrbitAnyDocumentVersion | undefined,
  diagnostics: WorldOrbitDiagnostic[],
  viewpointId: string,
): void {
  if (!filter || sourceSchemaVersion !== "2.1") {
    return;
  }

  for (const groupId of filter.groupIds) {
    if (!groupIds.has(groupId)) {
      diagnostics.push(warn("validate.viewpoint.group.unknown", `Unknown group "${groupId}" in viewpoint "${viewpointId}".`));
    }
  }
}

function validateObject(
  object: WorldOrbitObject,
  system: WorldOrbitAtlasDocument["system"] | WorldOrbitDraftSystem | null,
  objectMap: Map<string, WorldOrbitObject>,
  groupIds: Set<string>,
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
    if (object.type !== "structure" && object.type !== "phenomenon") {
      diagnostics.push(error("validate.at.objectType", `Only structures and phenomena may use "at" placement; found "${object.type}" on "${object.id}".`, object.id, "at"));
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
