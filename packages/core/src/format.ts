import type {
  AtReference,
  NormalizedValue,
  UnitValue,
  WorldOrbitDocument,
  WorldOrbitObject,
  WorldOrbitSystem,
} from "./types.js";

const CANONICAL_FIELD_ORDER = [
  "title",
  "view",
  "scale",
  "units",
  "kind",
  "class",
  "tags",
  "color",
  "hidden",
  "orbit",
  "distance",
  "semiMajor",
  "eccentricity",
  "period",
  "angle",
  "inclination",
  "phase",
  "at",
  "surface",
  "free",
  "radius",
  "mass",
  "density",
  "gravity",
  "temperature",
  "albedo",
  "atmosphere",
  "inner",
  "outer",
  "on",
  "source",
  "cycle",
];

export function formatDocument(document: WorldOrbitDocument): string {
  const lines: string[] = [];

  if (document.system) {
    lines.push(...formatSystem(document.system));
  }

  const sortedObjects = [...document.objects].sort(compareObjects);
  for (const object of sortedObjects) {
    if (lines.length > 0) {
      lines.push("");
    }
    lines.push(...formatObject(object));
  }

  return lines.join("\n");
}

function formatSystem(system: WorldOrbitSystem): string[] {
  return formatLines("system", system.id, system.properties, null, system.info);
}

function formatObject(object: WorldOrbitObject): string[] {
  return formatLines(object.type, object.id, object.properties, object.placement, object.info);
}

function formatLines(
  objectType: string,
  id: string,
  properties: Record<string, NormalizedValue>,
  placement: WorldOrbitObject["placement"],
  info: Record<string, string>,
): string[] {
  const lines = [`${objectType} ${id}`];
  const fieldLines = [...formatPlacement(placement), ...formatProperties(properties)];

  for (const fieldLine of fieldLines) {
    lines.push(`  ${fieldLine}`);
  }

  const infoEntries = Object.entries(info).sort(([left], [right]) => left.localeCompare(right));
  if (infoEntries.length > 0) {
    if (fieldLines.length > 0) {
      lines.push("");
    }
    lines.push("  info");
    for (const [key, value] of infoEntries) {
      lines.push(`    ${key} ${quoteIfNeeded(value)}`);
    }
  }

  return lines;
}

function formatPlacement(placement: WorldOrbitObject["placement"]): string[] {
  if (!placement) return [];

  switch (placement.mode) {
    case "orbit":
      return [
        `orbit ${placement.target}`,
        ...formatOptionalUnit("distance", placement.distance),
        ...formatOptionalUnit("semiMajor", placement.semiMajor),
        ...formatOptionalNumber("eccentricity", placement.eccentricity),
        ...formatOptionalUnit("period", placement.period),
        ...formatOptionalUnit("angle", placement.angle),
        ...formatOptionalUnit("inclination", placement.inclination),
        ...formatOptionalUnit("phase", placement.phase),
      ];
    case "at":
      return [`at ${formatAtReference(placement.reference)}`];
    case "surface":
      return [`surface ${placement.target}`];
    case "free":
      return [`free ${placement.distance ? formatUnitValue(placement.distance) : placement.descriptor ?? ""}`.trim()];
  }
}

function formatProperties(properties: Record<string, NormalizedValue>): string[] {
  return Object.keys(properties)
    .sort(compareFieldKeys)
    .map((key) => `${key} ${formatValue(properties[key])}`);
}

function formatValue(value: NormalizedValue): string {
  if (Array.isArray(value)) {
    return value.map((item) => quoteIfNeeded(item)).join(" ");
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    return quoteIfNeeded(value);
  }
  return formatUnitValue(value);
}

function formatUnitValue(value: UnitValue): string {
  return `${value.value}${value.unit ?? ""}`;
}

function formatOptionalUnit(key: string, value?: UnitValue): string[] {
  return value ? [`${key} ${formatUnitValue(value)}`] : [];
}

function formatOptionalNumber(key: string, value?: number): string[] {
  return value === undefined ? [] : [`${key} ${value}`];
}

function formatAtReference(reference: AtReference): string {
  switch (reference.kind) {
    case "lagrange":
      return reference.secondary
        ? `${reference.primary}-${reference.secondary}:${reference.point}`
        : `${reference.primary}:${reference.point}`;
    case "anchor":
      return `${reference.objectId}:${reference.anchor}`;
    case "named":
      return reference.name;
  }
}

function compareFieldKeys(left: string, right: string): number {
  const leftIndex = CANONICAL_FIELD_ORDER.indexOf(left);
  const rightIndex = CANONICAL_FIELD_ORDER.indexOf(right);

  if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
  if (leftIndex === -1) return 1;
  if (rightIndex === -1) return -1;
  return leftIndex - rightIndex;
}

function compareObjects(left: WorldOrbitObject, right: WorldOrbitObject): number {
  const leftIndex = objectTypeIndex(left.type);
  const rightIndex = objectTypeIndex(right.type);
  if (leftIndex !== rightIndex) return leftIndex - rightIndex;
  return left.id.localeCompare(right.id);
}

function objectTypeIndex(objectType: WorldOrbitObject["type"]): number {
  switch (objectType) {
    case "star":
      return 0;
    case "planet":
      return 1;
    case "moon":
      return 2;
    case "belt":
      return 3;
    case "asteroid":
      return 4;
    case "comet":
      return 5;
    case "ring":
      return 6;
    case "structure":
      return 7;
    case "phenomenon":
      return 8;
  }
}

function quoteIfNeeded(value: string): string {
  if (!/\s/.test(value) && !value.includes('"')) {
    return value;
  }

  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}
