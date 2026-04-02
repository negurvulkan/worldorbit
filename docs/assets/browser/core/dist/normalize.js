import { WorldOrbitError } from "./errors.js";
import { getFieldSchema, supportsObjectType, unitFamilyAllowsUnit, } from "./schema.js";
const UNIT_PATTERN = /^(-?\d+(?:\.\d+)?)(kpc|min|mj|rj|ky|my|gy|au|km|me|re|pc|ly|deg|sol|K|m|s|h|d|y)?$/;
const BOOLEAN_VALUES = new Map([
    ["true", true],
    ["false", false],
    ["yes", true],
    ["no", false],
]);
const URL_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:/;
export function normalizeDocument(ast) {
    let system = null;
    const objects = [];
    const theme = ast.theme ? normalizeTheme(ast.theme) : null;
    for (const node of ast.objects) {
        const normalized = normalizeObject(node);
        if (node.objectType === "system") {
            if (system) {
                throw WorldOrbitError.fromLocation("Only one system object is allowed", node.location);
            }
            system = normalized;
        }
        else {
            objects.push(normalized);
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
function normalizeTheme(node) {
    const styles = {};
    for (const block of node.blocks) {
        const fieldMap = collectFields(block.fields);
        styles[block.target] = normalizeThemeProperties(fieldMap);
    }
    return {
        preset: node.preset,
        styles,
    };
}
function normalizeThemeProperties(fieldMap) {
    const result = {};
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
function normalizeObject(node) {
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
        type: node.objectType,
        id: node.name,
        properties,
        placement,
        info,
    };
}
function validateFieldCompatibility(objectType, fields) {
    for (const field of fields) {
        const schema = getFieldSchema(field.key);
        if (!schema) {
            throw WorldOrbitError.fromLocation(`Unknown field "${field.key}"`, field.location);
        }
        if (!supportsObjectType(schema, objectType)) {
            throw WorldOrbitError.fromLocation(`Field "${field.key}" is not valid on "${objectType}"`, field.location);
        }
        if (schema.arity === "single" && field.values.length !== 1) {
            throw WorldOrbitError.fromLocation(`Field "${field.key}" expects exactly one value`, field.location);
        }
    }
}
function collectFields(fields) {
    const map = new Map();
    for (const field of fields) {
        if (map.has(field.key)) {
            throw WorldOrbitError.fromLocation(`Duplicate field "${field.key}"`, field.location);
        }
        map.set(field.key, field);
    }
    return map;
}
function extractPlacement(objectType, fieldMap) {
    const hasOrbit = fieldMap.has("orbit");
    const hasAt = fieldMap.has("at");
    const hasSurface = fieldMap.has("surface");
    const hasFree = fieldMap.has("free");
    const count = [hasOrbit, hasAt, hasSurface, hasFree].filter(Boolean).length;
    if (count > 1) {
        const conflictingField = fieldMap.get("orbit") ??
            fieldMap.get("at") ??
            fieldMap.get("surface") ??
            fieldMap.get("free");
        throw WorldOrbitError.fromLocation("Object has multiple placement modes", conflictingField?.location);
    }
    if (objectType === "system" && count > 0) {
        throw WorldOrbitError.fromLocation("System objects cannot declare placement", [...fieldMap.values()][0]?.location);
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
function normalizeProperties(fieldMap) {
    const result = {};
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
function normalizeStringValue(key, field) {
    const value = field.values.join(" ").trim();
    if (key === "image") {
        validateImageSource(value, field.location);
    }
    return value;
}
function validateImageSource(value, location) {
    if (!value) {
        throw WorldOrbitError.fromLocation('Field "image" must not be empty', location);
    }
    if (value.startsWith("//")) {
        throw WorldOrbitError.fromLocation('Field "image" must use a relative path, root-relative path, or an http/https URL', location);
    }
    const schemeMatch = value.match(URL_SCHEME_PATTERN);
    if (!schemeMatch) {
        return;
    }
    const scheme = schemeMatch[0].slice(0, -1).toLowerCase();
    if (scheme !== "http" && scheme !== "https") {
        throw WorldOrbitError.fromLocation(`Field "image" does not support the "${scheme}" scheme`, location);
    }
}
function normalizeInfo(entries) {
    const info = {};
    for (const entry of entries) {
        if (entry.key in info) {
            throw WorldOrbitError.fromLocation(`Duplicate info key "${entry.key}"`, entry.location);
        }
        info[entry.key] = entry.value;
    }
    return info;
}
function parseAtReference(target, location) {
    if (/^[A-Za-z0-9._-]+-[A-Za-z0-9._-]+:L\d+$/i.test(target)) {
        throw WorldOrbitError.fromLocation(`Invalid special position "${target}"`, location);
    }
    const pairedMatch = target.match(/^([A-Za-z0-9._-]+)-([A-Za-z0-9._-]+):(L[1-5])$/);
    if (pairedMatch) {
        return {
            kind: "lagrange",
            primary: pairedMatch[1],
            secondary: pairedMatch[2],
            point: pairedMatch[3],
        };
    }
    const simpleMatch = target.match(/^([A-Za-z0-9._-]+):(L[1-5])$/);
    if (simpleMatch) {
        return {
            kind: "lagrange",
            primary: simpleMatch[1],
            secondary: null,
            point: simpleMatch[2],
        };
    }
    if (/^[A-Za-z0-9._-]+:L\d+$/i.test(target)) {
        throw WorldOrbitError.fromLocation(`Invalid special position "${target}"`, location);
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
function parseUnitValue(input, location, fieldKey) {
    const match = input.match(UNIT_PATTERN);
    if (!match) {
        throw WorldOrbitError.fromLocation(`Invalid unit value "${input}"`, location);
    }
    const unitValue = {
        value: Number(match[1]),
        unit: match[2] ?? null,
    };
    if (fieldKey) {
        const schema = getFieldSchema(fieldKey);
        if (schema?.unitFamily && !unitFamilyAllowsUnit(schema.unitFamily, unitValue.unit)) {
            throw WorldOrbitError.fromLocation(`Unit "${unitValue.unit ?? "none"}" is not valid for "${fieldKey}"`, location);
        }
    }
    return unitValue;
}
function tryParseUnitValue(input) {
    const match = input.match(UNIT_PATTERN);
    if (!match) {
        return null;
    }
    return {
        value: Number(match[1]),
        unit: match[2] ?? null,
    };
}
function parseOptionalUnitValue(fieldMap, key) {
    if (!fieldMap.has(key)) {
        return undefined;
    }
    const field = getField(fieldMap, key);
    return parseUnitValue(singleFieldValue(field), field.location, key);
}
function parseOptionalNumber(fieldMap, key) {
    if (!fieldMap.has(key)) {
        return undefined;
    }
    const field = getField(fieldMap, key);
    return parseNumber(singleFieldValue(field), key, field.location);
}
function parseNumber(input, key, location) {
    const value = Number(input);
    if (!Number.isFinite(value)) {
        throw WorldOrbitError.fromLocation(`Invalid numeric value "${input}" for "${key}"`, location);
    }
    return value;
}
function parseBoolean(field) {
    const rawValue = singleFieldValue(field).toLowerCase();
    const parsed = BOOLEAN_VALUES.get(rawValue);
    if (parsed === undefined) {
        throw WorldOrbitError.fromLocation(`Invalid boolean value "${rawValue}" for "${field.key}"`, field.location);
    }
    return parsed;
}
function getField(fieldMap, key) {
    const field = fieldMap.get(key);
    if (!field) {
        throw new WorldOrbitError(`Missing value for key "${key}"`);
    }
    return field;
}
function singleValue(fieldMap, key) {
    return singleFieldValue(getField(fieldMap, key));
}
function singleFieldValue(field) {
    if (field.values.length !== 1) {
        throw WorldOrbitError.fromLocation(`Field "${field.key}" expects exactly one value`, field.location);
    }
    return field.values[0];
}
