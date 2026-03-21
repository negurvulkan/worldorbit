import { WorldOrbitError } from "./errors.js";
import { getFieldSchema, unitFamilyAllowsUnit } from "./schema.js";
const UNIT_PATTERN = /^(-?\d+(?:\.\d+)?)(kpc|min|mj|rj|ky|my|gy|au|km|me|re|pc|ly|deg|sol|K|m|s|h|d|y)?$/;
const BOOLEAN_VALUES = new Map([
    ["true", true],
    ["false", false],
    ["yes", true],
    ["no", false],
]);
const URL_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:/;
export function normalizeIdentifier(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
export function humanizeIdentifier(value) {
    return value
        .split(/[-_]+/)
        .filter(Boolean)
        .map((segment) => segment[0].toUpperCase() + segment.slice(1))
        .join(" ");
}
export function parseAtlasUnitValue(input, location, fieldKey) {
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
export function tryParseAtlasUnitValue(input) {
    const match = input.match(UNIT_PATTERN);
    if (!match) {
        return null;
    }
    return {
        value: Number(match[1]),
        unit: match[2] ?? null,
    };
}
export function parseAtlasNumber(input, key, location) {
    const value = Number(input);
    if (!Number.isFinite(value)) {
        throw WorldOrbitError.fromLocation(`Invalid numeric value "${input}" for "${key}"`, location);
    }
    return value;
}
export function parseAtlasBoolean(input, key, location) {
    const parsed = BOOLEAN_VALUES.get(input.toLowerCase());
    if (parsed === undefined) {
        throw WorldOrbitError.fromLocation(`Invalid boolean value "${input}" for "${key}"`, location);
    }
    return parsed;
}
export function parseAtlasFieldBoolean(field) {
    return parseAtlasBoolean(singleAtlasFieldValue(field), field.key, field.location);
}
export function parseAtlasAtReference(target, location) {
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
export function validateAtlasImageSource(value, location) {
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
export function normalizeLegacyScalarValue(key, values, location) {
    const schema = getFieldSchema(key);
    if (!schema) {
        throw WorldOrbitError.fromLocation(`Unknown field "${key}"`, location);
    }
    if (schema.arity === "single" && values.length !== 1) {
        throw WorldOrbitError.fromLocation(`Field "${key}" expects exactly one value`, location);
    }
    switch (schema.kind) {
        case "list":
            return values;
        case "boolean":
            return parseAtlasBoolean(singleAtlasValue(values, key, location), key, location);
        case "number":
            return parseAtlasNumber(singleAtlasValue(values, key, location), key, location);
        case "unit":
            return parseAtlasUnitValue(singleAtlasValue(values, key, location), location, key);
        case "string": {
            const value = values.join(" ").trim();
            if (key === "image") {
                validateAtlasImageSource(value, location);
            }
            return value;
        }
    }
}
export function ensureAtlasFieldSupported(key, objectType, location) {
    const schema = getFieldSchema(key);
    if (!schema) {
        throw WorldOrbitError.fromLocation(`Unknown field "${key}"`, location);
    }
    if (!schema.objectTypes.includes(objectType)) {
        throw WorldOrbitError.fromLocation(`Field "${key}" is not valid on "${objectType}"`, location);
    }
}
export function singleAtlasFieldValue(field) {
    return singleAtlasValue(field.values, field.key, field.location);
}
export function singleAtlasValue(values, key, location) {
    if (values.length !== 1) {
        throw WorldOrbitError.fromLocation(`Field "${key}" expects exactly one value`, location);
    }
    return values[0];
}
export function isStructureLikeObjectType(objectType) {
    return objectType === "structure" || objectType === "phenomenon";
}
export function cloneNormalizedValue(value) {
    if (Array.isArray(value)) {
        return [...value];
    }
    if (value && typeof value === "object" && "value" in value) {
        return {
            value: value.value,
            unit: value.unit,
        };
    }
    return value;
}
export function cloneFieldNode(field) {
    return {
        type: "field",
        key: field.key,
        values: [...field.values],
        location: { ...field.location },
    };
}
