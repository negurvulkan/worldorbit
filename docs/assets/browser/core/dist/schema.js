const ALL_OBJECTS = [
    "system",
    "star",
    "planet",
    "moon",
    "belt",
    "asteroid",
    "comet",
    "ring",
    "craft",
    "structure",
    "phenomenon",
];
const NON_SYSTEM_OBJECTS = ALL_OBJECTS.filter((objectType) => objectType !== "system");
const IMAGE_OBJECTS = [
    "star",
    "planet",
    "moon",
    "asteroid",
    "comet",
    "craft",
    "structure",
    "phenomenon",
];
const ANCHORED_OBJECTS = ["craft", "structure", "phenomenon"];
const ORBITAL_OBJECTS = [
    "star",
    "planet",
    "moon",
    "belt",
    "asteroid",
    "comet",
    "ring",
    "craft",
    "structure",
    "phenomenon",
];
const FREE_OBJECTS = [
    "star",
    "planet",
    "moon",
    "belt",
    "asteroid",
    "comet",
    "ring",
    "craft",
    "structure",
    "phenomenon",
];
function createField(key, options) {
    return {
        key,
        ...options,
    };
}
export const WORLDORBIT_OBJECT_TYPES = new Set(ALL_OBJECTS);
export const WORLDORBIT_FIELD_SCHEMAS = new Map([
    createField("orbit", {
        kind: "string",
        placement: true,
        arity: "single",
        objectTypes: ORBITAL_OBJECTS,
    }),
    createField("distance", {
        kind: "unit",
        placement: true,
        arity: "single",
        objectTypes: ORBITAL_OBJECTS,
        unitFamily: "distance",
    }),
    createField("semiMajor", {
        kind: "unit",
        placement: true,
        arity: "single",
        objectTypes: ORBITAL_OBJECTS,
        unitFamily: "distance",
    }),
    createField("eccentricity", {
        kind: "number",
        placement: true,
        arity: "single",
        objectTypes: ORBITAL_OBJECTS,
    }),
    createField("period", {
        kind: "unit",
        placement: true,
        arity: "single",
        objectTypes: ORBITAL_OBJECTS,
        unitFamily: "duration",
    }),
    createField("angle", {
        kind: "unit",
        placement: true,
        arity: "single",
        objectTypes: ORBITAL_OBJECTS,
        unitFamily: "angle",
    }),
    createField("inclination", {
        kind: "unit",
        placement: true,
        arity: "single",
        objectTypes: ORBITAL_OBJECTS,
        unitFamily: "angle",
    }),
    createField("phase", {
        kind: "unit",
        placement: true,
        arity: "single",
        objectTypes: ORBITAL_OBJECTS,
        unitFamily: "angle",
    }),
    createField("at", {
        kind: "string",
        placement: true,
        arity: "single",
        objectTypes: ANCHORED_OBJECTS,
    }),
    createField("surface", {
        kind: "string",
        placement: true,
        arity: "single",
        objectTypes: ANCHORED_OBJECTS,
    }),
    createField("free", {
        kind: "string",
        placement: true,
        arity: "single",
        objectTypes: FREE_OBJECTS,
    }),
    createField("kind", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: NON_SYSTEM_OBJECTS,
    }),
    createField("class", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: NON_SYSTEM_OBJECTS,
    }),
    createField("culture", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: NON_SYSTEM_OBJECTS,
    }),
    createField("tags", {
        kind: "list",
        placement: false,
        arity: "multiple",
        objectTypes: ALL_OBJECTS,
    }),
    createField("color", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: ALL_OBJECTS,
    }),
    createField("image", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: IMAGE_OBJECTS,
    }),
    createField("hidden", {
        kind: "boolean",
        placement: false,
        arity: "single",
        objectTypes: ALL_OBJECTS,
    }),
    createField("radius", {
        kind: "unit",
        placement: false,
        arity: "single",
        objectTypes: NON_SYSTEM_OBJECTS,
        unitFamily: "radius",
    }),
    createField("mass", {
        kind: "unit",
        placement: false,
        arity: "single",
        objectTypes: NON_SYSTEM_OBJECTS,
        unitFamily: "mass",
    }),
    createField("density", {
        kind: "unit",
        placement: false,
        arity: "single",
        objectTypes: NON_SYSTEM_OBJECTS,
        unitFamily: "generic",
    }),
    createField("gravity", {
        kind: "unit",
        placement: false,
        arity: "single",
        objectTypes: NON_SYSTEM_OBJECTS,
        unitFamily: "generic",
    }),
    createField("temperature", {
        kind: "unit",
        placement: false,
        arity: "single",
        objectTypes: NON_SYSTEM_OBJECTS,
        unitFamily: "generic",
    }),
    createField("albedo", {
        kind: "number",
        placement: false,
        arity: "single",
        objectTypes: NON_SYSTEM_OBJECTS,
    }),
    createField("atmosphere", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: ["planet", "moon", "asteroid", "comet", "phenomenon"],
    }),
    createField("inner", {
        kind: "unit",
        placement: false,
        arity: "single",
        objectTypes: ["belt", "ring", "phenomenon"],
        unitFamily: "distance",
    }),
    createField("outer", {
        kind: "unit",
        placement: false,
        arity: "single",
        objectTypes: ["belt", "ring", "phenomenon"],
        unitFamily: "distance",
    }),
    createField("view", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: ["system"],
    }),
    createField("scale", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: ["system"],
    }),
    createField("units", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: ["system"],
    }),
    createField("title", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: ["system"],
    }),
    createField("on", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: NON_SYSTEM_OBJECTS,
    }),
    createField("source", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: NON_SYSTEM_OBJECTS,
    }),
    createField("cycle", {
        kind: "unit",
        placement: false,
        arity: "single",
        objectTypes: NON_SYSTEM_OBJECTS,
        unitFamily: "duration",
    }),
    createField("trajectory", {
        kind: "string",
        placement: false,
        arity: "single",
        objectTypes: ["craft", "structure"],
    }),
].map((schema) => [schema.key, schema]));
export const WORLDORBIT_FIELD_KEYS = new Set(WORLDORBIT_FIELD_SCHEMAS.keys());
export function getFieldSchema(key) {
    return WORLDORBIT_FIELD_SCHEMAS.get(key);
}
export function isKnownFieldKey(key) {
    return WORLDORBIT_FIELD_KEYS.has(key);
}
export function supportsObjectType(schema, objectType) {
    return schema.objectTypes.includes(objectType);
}
export function unitFamilyAllowsUnit(family, unit) {
    switch (family) {
        case "distance":
            return unit === null || ["au", "km", "m", "ly", "pc", "kpc", "re", "sol"].includes(unit);
        case "radius":
            return unit === null || ["km", "m", "re", "rj", "sol"].includes(unit);
        case "mass":
            return unit === null || ["me", "mj", "sol"].includes(unit);
        case "duration":
            return unit === null || ["s", "min", "h", "d", "y", "ky", "my", "gy"].includes(unit);
        case "angle":
            return unit === null || unit === "deg";
        case "generic":
            return true;
    }
}
