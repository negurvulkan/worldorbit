import { WorldOrbitError } from "./errors.js";
import {
  getFieldSchema,
  supportsObjectType,
  unitFamilyAllowsUnit,
} from "./schema.js";
import type {
  AstDocument,
  AstFieldNode,
  AstInfoEntryNode,
  AstObjectNode,
  AstThemeNode,
  AtReference,
  LagrangeReference,
  NormalizedTheme,
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

const UNIT_PATTERN = /^(-?\d+(?:\.\d+)?)(kpc|min|mj|rj|ky|my|gy|au|km|me|re|pc|ly|deg|sol|K|m|s|h|d|y)?$/;
const BOOLEAN_VALUES = new Map<string, boolean>([
  ["true", true],
  ["false", false],
  ["yes", true],
  ["no", false],
]);
const URL_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:/;

export function normalizeDocument(ast: AstDocument): WorldOrbitDocument {
  let system: WorldOrbitSystem | null = null;
  const objects: WorldOrbitObject[] = [];

  const theme = ast.theme ? normalizeTheme(ast.theme) : null;

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
    version: "1.0",
    schemaVersion: "1.0",
    theme,
    system,
    groups: [],
    relations: [],
    events: [],
    trajectories: [],
    objects,
  };
}

function normalizeTheme(node: AstThemeNode): NormalizedTheme {
  const styles: Record<string, Record<string, NormalizedValue>> = {};

  for (const block of node.blocks) {
    const fieldMap = collectFields(block.fields);
    styles[block.target] = normalizeThemeProperties(fieldMap);
  }

  return {
    preset: node.preset,
    styles,
  };
}

function normalizeThemeProperties(
  fieldMap: Map<string, AstFieldNode>,
): Record<string, NormalizedValue> {
  const result: Record<string, NormalizedValue> = {};

  for (const [key, field] of fieldMap.entries()) {
    if (field.values.length === 1) {
      const rawValue = field.values[0];
      if (rawValue === "true") {
        result[key] = true;
        continue;
      }
      if (rawValue === "false") {
        result[key] = false;
        continue;
      }
      const num = Number(rawValue);
      if (!Number.isNaN(num) && rawValue.trim() !== "") {
        result[key] = num;
        continue;
      }
    }
    result[key] = field.values.join(" ");
  }

  return result;
}

function normalizeObject(
  node: AstObjectNode,
): WorldOrbitSystem | WorldOrbitObject {
  const mergedFields = [...node.inlineFields, ...node.blockFields];
  validateFieldCompatibility(node.objectType, mergedFields);

  const fieldMap = collectFields(mergedFields);
  const placement = extractPlacement(node.objectType, fieldMap);
  const properties = normalizeProperties(fieldMap);
  const info = normalizeInfo(node.infoEntries);

  if (node.objectType === "system") {
    return {
      type: "system",
      id: node.name,
      title: typeof properties.title === "string" ? properties.title : null,
      description: null,
      epoch: null,
      referencePlane: null,
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

function validateFieldCompatibility(
  objectType: WorldOrbitObjectType,
  fields: AstFieldNode[],
): void {
  for (const field of fields) {
    const schema = getFieldSchema(field.key);

    if (!schema) {
      throw WorldOrbitError.fromLocation(`Unknown field "${field.key}"`, field.location);
    }

    if (!supportsObjectType(schema, objectType)) {
      throw WorldOrbitError.fromLocation(
        `Field "${field.key}" is not valid on "${objectType}"`,
        field.location,
      );
    }

    if (schema.arity === "single" && field.values.length !== 1) {
      throw WorldOrbitError.fromLocation(
        `Field "${field.key}" expects exactly one value`,
        field.location,
      );
    }
  }
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

function extractPlacement(
  objectType: WorldOrbitObjectType,
  fieldMap: Map<string, AstFieldNode>,
): Placement | null {
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

  if (objectType === "system" && count > 0) {
    throw WorldOrbitError.fromLocation(
      "System objects cannot declare placement",
      [...fieldMap.values()][0]?.location,
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
    const schema = getFieldSchema(key);
    if (!schema || schema.placement) {
      continue;
    }

    switch (schema.kind) {
      case "list":
        result[key] = field.values;
        break;
      case "boolean":
        result[key] = parseBoolean(field);
        break;
      case "number":
        result[key] = parseNumber(singleFieldValue(field), key, field.location);
        break;
      case "unit":
        result[key] = parseUnitValue(singleFieldValue(field), field.location, key);
        break;
      case "string":
        result[key] = normalizeStringValue(key, field);
        break;
    }
  }

  return result;
}

function normalizeStringValue(key: string, field: AstFieldNode): string {
  const value = field.values.join(" ").trim();

  if (key === "image") {
    validateImageSource(value, field.location);
  }

  return value;
}

function validateImageSource(
  value: string,
  location: AstFieldNode["location"],
): void {
  if (!value) {
    throw WorldOrbitError.fromLocation('Field "image" must not be empty', location);
  }

  if (value.startsWith("//")) {
    throw WorldOrbitError.fromLocation(
      'Field "image" must use a relative path, root-relative path, or an http/https URL',
      location,
    );
  }

  const schemeMatch = value.match(URL_SCHEME_PATTERN);

  if (!schemeMatch) {
    return;
  }

  const scheme = schemeMatch[0].slice(0, -1).toLowerCase();

  if (scheme !== "http" && scheme !== "https") {
    throw WorldOrbitError.fromLocation(
      `Field "image" does not support the "${scheme}" scheme`,
      location,
    );
  }
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
  if (/^[A-Za-z0-9._-]+-[A-Za-z0-9._-]+:L\d+$/i.test(target)) {
    throw WorldOrbitError.fromLocation(
      `Invalid special position "${target}"`,
      location,
    );
  }

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

  if (/^[A-Za-z0-9._-]+:L\d+$/i.test(target)) {
    throw WorldOrbitError.fromLocation(
      `Invalid special position "${target}"`,
      location,
    );
  }

  const anchorMatch = target.match(/^([A-Za-z0-9._-]+):([A-Za-z0-9._-]+)$/);
  if (anchorMatch) {
    return {
      kind: "anchor",
      objectId: anchorMatch[1],
      anchor: anchorMatch[2],
    };
  }

  return {
    kind: "named",
    name: target,
  };
}

function parseUnitValue(
  input: string,
  location?: AstFieldNode["location"],
  fieldKey?: string,
): UnitValue {
  const match = input.match(UNIT_PATTERN);

  if (!match) {
    throw WorldOrbitError.fromLocation(`Invalid unit value "${input}"`, location);
  }

  const unitValue = {
    value: Number(match[1]),
    unit: (match[2] as Unit | undefined) ?? null,
  };

  if (fieldKey) {
    const schema = getFieldSchema(fieldKey);
    if (schema?.unitFamily && !unitFamilyAllowsUnit(schema.unitFamily, unitValue.unit)) {
      throw WorldOrbitError.fromLocation(
        `Unit "${unitValue.unit ?? "none"}" is not valid for "${fieldKey}"`,
        location,
      );
    }
  }

  return unitValue;
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
  return parseUnitValue(singleFieldValue(field), field.location, key);
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
