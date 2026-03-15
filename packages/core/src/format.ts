import type {
  AtReference,
  FormattableWorldOrbitDocument,
  FormatDocumentOptions,
  NormalizedValue,
  UnitValue,
  WorldOrbitAtlasAnnotation,
  WorldOrbitAtlasDocument,
  WorldOrbitAtlasSystem,
  WorldOrbitAtlasViewpoint,
  WorldOrbitDraftDocument,
  WorldOrbitDocument,
  WorldOrbitObject,
  WorldOrbitSystem,
} from "./types.js";
import { upgradeDocumentToDraftV2, upgradeDocumentToV2 } from "./draft.js";

const CANONICAL_FIELD_ORDER = [
  "title",
  "view",
  "scale",
  "units",
  "kind",
  "class",
  "tags",
  "color",
  "image",
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

export function formatDocument(
  document: FormattableWorldOrbitDocument,
  options: FormatDocumentOptions = {},
): string {
  const schema = options.schema ?? "auto";
  const useDraft =
    schema === "2.0" ||
    schema === "2.0-draft" ||
    document.version === "2.0" ||
    document.version === "2.0-draft";

  if (useDraft) {
    if (schema === "2.0-draft") {
      const legacyDraftDocument =
        document.version === "2.0-draft"
          ? document
          : document.version === "2.0"
            ? {
                ...document,
                version: "2.0-draft" as const,
              }
            : upgradeDocumentToDraftV2(document as WorldOrbitDocument);
      return formatDraftDocument(legacyDraftDocument);
    }

    const atlasDocument =
      document.version === "2.0"
        ? document
        : document.version === "2.0-draft"
          ? {
              ...document,
              version: "2.0" as const,
            }
          : upgradeDocumentToV2(document as WorldOrbitDocument);
    return formatAtlasDocument(atlasDocument);
  }

  const lines: string[] = [];
  const stableDocument = document as WorldOrbitDocument;

  if (stableDocument.system) {
    lines.push(...formatSystem(stableDocument.system));
  }

  const sortedObjects = [...stableDocument.objects].sort(compareObjects);
  for (const object of sortedObjects) {
    if (lines.length > 0) {
      lines.push("");
    }
    lines.push(...formatObject(object));
  }

  return lines.join("\n");
}

export function formatAtlasDocument(document: WorldOrbitAtlasDocument): string {
  const lines = ["schema 2.0", ""];

  if (document.system) {
    lines.push(...formatAtlasSystem(document.system));
  }

  const sortedObjects = [...document.objects].sort(compareObjects);
  if (sortedObjects.length > 0 && lines.at(-1) !== "") {
    lines.push("");
  }

  sortedObjects.forEach((object, index) => {
    if (index > 0) {
      lines.push("");
    }
    lines.push(...formatAtlasObject(object));
  });

  return lines.join("\n");
}

export function formatDraftDocument(
  document: WorldOrbitAtlasDocument | WorldOrbitDraftDocument,
): string {
  const legacy: WorldOrbitDraftDocument =
    document.version === "2.0-draft"
      ? document
      : {
          ...document,
          version: "2.0-draft",
        };
  const lines = ["schema 2.0-draft", ""];

  if (legacy.system) {
    lines.push(...formatAtlasSystem(legacy.system));
  }

  const sortedObjects = [...legacy.objects].sort(compareObjects);
  if (sortedObjects.length > 0 && lines.at(-1) !== "") {
    lines.push("");
  }

  sortedObjects.forEach((object, index) => {
    if (index > 0) {
      lines.push("");
    }
    lines.push(...formatAtlasObject(object));
  });

  return lines.join("\n");
}

function formatSystem(system: WorldOrbitSystem): string[] {
  return formatLines("system", system.id, system.properties, null, system.info);
}

function formatAtlasSystem(system: WorldOrbitAtlasSystem): string[] {
  const lines = [`system ${system.id}`];

  if (system.title) {
    lines.push(`  title ${quoteIfNeeded(system.title)}`);
  }

  lines.push("");
  lines.push("defaults");
  lines.push(`  view ${system.defaults.view}`);
  if (system.defaults.scale) {
    lines.push(`  scale ${quoteIfNeeded(system.defaults.scale)}`);
  }
  if (system.defaults.units) {
    lines.push(`  units ${quoteIfNeeded(system.defaults.units)}`);
  }
  if (system.defaults.preset) {
    lines.push(`  preset ${system.defaults.preset}`);
  }
  if (system.defaults.theme) {
    lines.push(`  theme ${quoteIfNeeded(system.defaults.theme)}`);
  }

  if (Object.keys(system.atlasMetadata).length > 0) {
    lines.push("");
    lines.push("atlas");
    lines.push("  metadata");
    for (const [key, value] of Object.entries(system.atlasMetadata).sort(([left], [right]) =>
      left.localeCompare(right),
    )) {
      lines.push(`    ${key} ${quoteIfNeeded(value)}`);
    }
  }

  for (const viewpoint of system.viewpoints) {
    lines.push("");
    lines.push(...formatAtlasViewpoint(viewpoint));
  }

  for (const annotation of system.annotations) {
    lines.push("");
    lines.push(...formatAtlasAnnotation(annotation));
  }

  return lines;
}

function formatObject(object: WorldOrbitObject): string[] {
  return formatLines(object.type, object.id, object.properties, object.placement, object.info);
}

function formatAtlasObject(object: WorldOrbitObject): string[] {
  return formatLines(`object ${object.type}`, object.id, object.properties, object.placement, object.info);
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

function formatAtlasViewpoint(viewpoint: WorldOrbitAtlasViewpoint): string[] {
  const lines = [`viewpoint ${viewpoint.id}`, `  label ${quoteIfNeeded(viewpoint.label)}`];

  if (viewpoint.focusObjectId) {
    lines.push(`  focus ${viewpoint.focusObjectId}`);
  }
  if (viewpoint.selectedObjectId && viewpoint.selectedObjectId !== viewpoint.focusObjectId) {
    lines.push(`  select ${viewpoint.selectedObjectId}`);
  }
  if (viewpoint.summary) {
    lines.push(`  summary ${quoteIfNeeded(viewpoint.summary)}`);
  }
  if (viewpoint.projection) {
    lines.push(`  projection ${viewpoint.projection}`);
  }
  if (viewpoint.preset) {
    lines.push(`  preset ${viewpoint.preset}`);
  }
  if (viewpoint.zoom !== null) {
    lines.push(`  zoom ${viewpoint.zoom}`);
  }
  if (viewpoint.rotationDeg !== 0) {
    lines.push(`  rotation ${viewpoint.rotationDeg}`);
  }

  const layerTokens = formatDraftLayers(viewpoint.layers);
  if (layerTokens.length > 0) {
    lines.push(`  layers ${layerTokens.join(" ")}`);
  }

  if (viewpoint.filter) {
    lines.push("  filter");
    if (viewpoint.filter.query) {
      lines.push(`    query ${quoteIfNeeded(viewpoint.filter.query)}`);
    }
    if (viewpoint.filter.objectTypes.length > 0) {
      lines.push(`    objectTypes ${viewpoint.filter.objectTypes.join(" ")}`);
    }
    if (viewpoint.filter.tags.length > 0) {
      lines.push(`    tags ${viewpoint.filter.tags.map(quoteIfNeeded).join(" ")}`);
    }
    if (viewpoint.filter.groupIds.length > 0) {
      lines.push(`    groups ${viewpoint.filter.groupIds.join(" ")}`);
    }
  }

  return lines;
}

function formatAtlasAnnotation(annotation: WorldOrbitAtlasAnnotation): string[] {
  const lines = [`annotation ${annotation.id}`, `  label ${quoteIfNeeded(annotation.label)}`];

  if (annotation.targetObjectId) {
    lines.push(`  target ${annotation.targetObjectId}`);
  }
  lines.push(`  body ${quoteIfNeeded(annotation.body)}`);
  if (annotation.tags.length > 0) {
    lines.push(`  tags ${annotation.tags.map(quoteIfNeeded).join(" ")}`);
  }

  return lines;
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

function formatDraftLayers(
  layers: WorldOrbitAtlasViewpoint["layers"],
): string[] {
  const tokens: string[] = [];
  const orbitFront = layers["orbits-front"];
  const orbitBack = layers["orbits-back"];

  if (orbitFront !== undefined || orbitBack !== undefined) {
    tokens.push(
      orbitFront !== false || orbitBack !== false
        ? "orbits"
        : "-orbits",
    );
  }

  for (const key of ["background", "guides", "objects", "labels", "metadata"] as const) {
    if (layers[key] !== undefined) {
      tokens.push(layers[key] ? key : `-${key}`);
    }
  }

  return tokens;
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
