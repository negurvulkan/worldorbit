import {
  BOOLEAN_KEYS,
  LIST_KEYS,
  NUMBER_KEYS,
  PLACEMENT_KEYS,
  UNIT_VALUE_KEYS,
} from "./constants.js";
import { WorldOrbitError } from "./errors.js";
import type {
  AstDocument,
  AstFieldNode,
  AstInfoEntryNode,
  AstObjectNode,
  AtReference,
  LagrangeReference,
  NormalizedValue,
  Placement,
  SpecialPoint,
  Unit,
  UnitValue,
  WorldOrbitDocument,
  WorldOrbitObject,
  WorldOrbitObjectType,
  WorldOrbitSystem,
} from "./types.js";

const UNIT_PATTERN = /^(-?\d+(?:\.\d+)?)(au|km|re|sol|me|d|y|h|deg)?$/;
const BOOLEAN_VALUES = new Map<string, boolean>([
  ["true", true],
  ["false", false],
  ["yes", true],
  ["no", false],
]);

export function normalizeDocument(ast: AstDocument): WorldOrbitDocument {
  let system: WorldOrbitSystem | null = null;
  const objects: WorldOrbitObject[] = [];

  for (const node of ast.objects) {
    const normalized = normalizeObject(node);

    if (node.objectType === "system") {
      if (system) {
        throw WorldOrbitError.fromLocation(
          "Only one system object is allowed",
          node.location,
        );
      }
      system = normalized as WorldOrbitSystem;
    } else {
      objects.push(normalized as WorldOrbitObject);
    }
  }

  return {
    format: "worldorbit",
    version: "0.1",
    system,
    objects,
  };
}

function normalizeObject(
  node: AstObjectNode,
): WorldOrbitSystem | WorldOrbitObject {
  const mergedFields = [...node.inlineFields, ...node.blockFields];
  const fieldMap = collectFields(mergedFields);
  const placement = extractPlacement(fieldMap);
  const properties = normalizeProperties(fieldMap);
  const info = normalizeInfo(node.infoEntries);

  if (node.objectType === "system") {
    return {
      type: "system",
      id: node.name,
      properties,
      info,
    };
  }

  return {
    type: node.objectType as Exclude<WorldOrbitObjectType, "system">,
    id: node.name,
    properties,
    placement,
    info,
  };
}

function collectFields(fields: AstFieldNode[]): Map<string, AstFieldNode> {
  const map = new Map<string, AstFieldNode>();

  for (const field of fields) {
    if (map.has(field.key)) {
      throw WorldOrbitError.fromLocation(
        `Duplicate field "${field.key}"`,
        field.location,
      );
    }

    map.set(field.key, field);
  }

  return map;
}

function extractPlacement(fieldMap: Map<string, AstFieldNode>): Placement | null {
  const hasOrbit = fieldMap.has("orbit");
  const hasAt = fieldMap.has("at");
  const hasSurface = fieldMap.has("surface");
  const hasFree = fieldMap.has("free");

  const count = [hasOrbit, hasAt, hasSurface, hasFree].filter(Boolean).length;

  if (count > 1) {
    const conflictingField =
      fieldMap.get("orbit") ??
      fieldMap.get("at") ??
      fieldMap.get("surface") ??
      fieldMap.get("free");

    throw WorldOrbitError.fromLocation(
      "Object has multiple placement modes",
      conflictingField?.location,
    );
  }

  if (hasOrbit) {
    return {
      mode: "orbit",
      target: singleValue(fieldMap, "orbit"),
      distance: parseOptionalUnitValue(fieldMap, "distance"),
      semiMajor: parseOptionalUnitValue(fieldMap, "semiMajor"),
      eccentricity: parseOptionalNumber(fieldMap, "eccentricity"),
      period: parseOptionalUnitValue(fieldMap, "period"),
      angle: parseOptionalUnitValue(fieldMap, "angle"),
      inclination: parseOptionalUnitValue(fieldMap, "inclination"),
      phase: parseOptionalUnitValue(fieldMap, "phase"),
    };
  }

  if (hasAt) {
    const field = getField(fieldMap, "at");
    const target = singleValue(fieldMap, "at");

    return {
      mode: "at",
      target,
      reference: parseAtReference(target, field.location),
    };
  }

  if (hasSurface) {
    return {
      mode: "surface",
      target: singleValue(fieldMap, "surface"),
    };
  }

  if (hasFree) {
    const raw = singleValue(fieldMap, "free");
    const distance = tryParseUnitValue(raw);

    return {
      mode: "free",
      distance: distance ?? undefined,
      descriptor: distance ? undefined : raw,
    };
  }

  return null;
}

function normalizeProperties(
  fieldMap: Map<string, AstFieldNode>,
): Record<string, NormalizedValue> {
  const result: Record<string, NormalizedValue> = {};

  for (const [key, field] of fieldMap.entries()) {
    if (PLACEMENT_KEYS.has(key)) {
      continue;
    }

    if (LIST_KEYS.has(key)) {
      result[key] = field.values;
      continue;
    }

    if (BOOLEAN_KEYS.has(key)) {
      result[key] = parseBoolean(field);
      continue;
    }

    if (NUMBER_KEYS.has(key)) {
      result[key] = parseNumber(singleFieldValue(field), key, field.location);
      continue;
    }

    if (UNIT_VALUE_KEYS.has(key)) {
      result[key] = parseUnitValue(singleFieldValue(field), field.location);
      continue;
    }

    result[key] = field.values.join(" ");
  }

  return result;
}

function normalizeInfo(entries: AstInfoEntryNode[]): Record<string, string> {
  const info: Record<string, string> = {};

  for (const entry of entries) {
    if (entry.key in info) {
      throw WorldOrbitError.fromLocation(
        `Duplicate info key "${entry.key}"`,
        entry.location,
      );
    }

    info[entry.key] = entry.value;
  }

  return info;
}

function parseAtReference(
  target: string,
  location: AstFieldNode["location"],
): AtReference {
  const pairedMatch = target.match(
    /^([A-Za-z0-9._-]+)-([A-Za-z0-9._-]+):(L[1-5])$/,
  );

  if (pairedMatch) {
    return {
      kind: "lagrange",
      primary: pairedMatch[1],
      secondary: pairedMatch[2],
      point: pairedMatch[3] as SpecialPoint,
    } satisfies LagrangeReference;
  }

  const simpleMatch = target.match(/^([A-Za-z0-9._-]+):(L[1-5])$/);

  if (simpleMatch) {
    return {
      kind: "lagrange",
      primary: simpleMatch[1],
      secondary: null,
      point: simpleMatch[2] as SpecialPoint,
    } satisfies LagrangeReference;
  }

  if (target.includes(":L")) {
    throw WorldOrbitError.fromLocation(
      `Invalid special position "${target}"`,
      location,
    );
  }

  return {
    kind: "named",
    name: target,
  };
}

function parseUnitValue(
  input: string,
  location?: AstFieldNode["location"],
): UnitValue {
  const match = input.match(UNIT_PATTERN);

  if (!match) {
    throw WorldOrbitError.fromLocation(`Invalid unit value "${input}"`, location);
  }

  return {
    value: Number(match[1]),
    unit: (match[2] as Unit | undefined) ?? null,
  };
}

function tryParseUnitValue(input: string): UnitValue | null {
  const match = input.match(UNIT_PATTERN);

  if (!match) {
    return null;
  }

  return {
    value: Number(match[1]),
    unit: (match[2] as Unit | undefined) ?? null,
  };
}

function parseOptionalUnitValue(
  fieldMap: Map<string, AstFieldNode>,
  key: string,
): UnitValue | undefined {
  if (!fieldMap.has(key)) {
    return undefined;
  }

  const field = getField(fieldMap, key);
  return parseUnitValue(singleFieldValue(field), field.location);
}

function parseOptionalNumber(
  fieldMap: Map<string, AstFieldNode>,
  key: string,
): number | undefined {
  if (!fieldMap.has(key)) {
    return undefined;
  }

  const field = getField(fieldMap, key);
  return parseNumber(singleFieldValue(field), key, field.location);
}

function parseNumber(
  input: string,
  key: string,
  location?: AstFieldNode["location"],
): number {
  const value = Number(input);

  if (!Number.isFinite(value)) {
    throw WorldOrbitError.fromLocation(
      `Invalid numeric value "${input}" for "${key}"`,
      location,
    );
  }

  return value;
}

function parseBoolean(field: AstFieldNode): boolean {
  const rawValue = singleFieldValue(field).toLowerCase();
  const parsed = BOOLEAN_VALUES.get(rawValue);

  if (parsed === undefined) {
    throw WorldOrbitError.fromLocation(
      `Invalid boolean value "${rawValue}" for "${field.key}"`,
      field.location,
    );
  }

  return parsed;
}

function getField(
  fieldMap: Map<string, AstFieldNode>,
  key: string,
): AstFieldNode {
  const field = fieldMap.get(key);

  if (!field) {
    throw new WorldOrbitError(`Missing value for key "${key}"`);
  }

  return field;
}

function singleValue(fieldMap: Map<string, AstFieldNode>, key: string): string {
  return singleFieldValue(getField(fieldMap, key));
}

function singleFieldValue(field: AstFieldNode): string {
  if (field.values.length !== 1) {
    throw WorldOrbitError.fromLocation(
      `Field "${field.key}" expects exactly one value`,
      field.location,
    );
  }

  return field.values[0];
}
