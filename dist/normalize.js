import { BOOLEAN_KEYS, LIST_KEYS, NUMBER_KEYS, PLACEMENT_KEYS, UNIT_VALUE_KEYS, } from "./constants.js";
import { WorldOrbitError } from "./errors.js";
const UNIT_PATTERN = /^(-?\d+(?:\.\d+)?)(au|km|re|sol|me|d|y|h|deg)?$/;
const BOOLEAN_VALUES = new Map([
    ["true", true],
    ["false", false],
    ["yes", true],
    ["no", false],
]);
export function normalizeDocument(ast) {
    let system = null;
    const objects = [];
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
        version: "0.1",
        system,
        objects,
    };
}
function normalizeObject(node) {
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
        type: node.objectType,
        id: node.name,
        properties,
        placement,
        info,
    };
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
function extractPlacement(fieldMap) {
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
    if (target.includes(":L")) {
        throw WorldOrbitError.fromLocation(`Invalid special position "${target}"`, location);
    }
    return {
        kind: "named",
        name: target,
    };
}
function parseUnitValue(input, location) {
    const match = input.match(UNIT_PATTERN);
    if (!match) {
        throw WorldOrbitError.fromLocation(`Invalid unit value "${input}"`, location);
    }
    return {
        value: Number(match[1]),
        unit: match[2] ?? null,
    };
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
    return parseUnitValue(singleFieldValue(field), field.location);
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
