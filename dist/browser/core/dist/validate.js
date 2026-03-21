import { WorldOrbitError } from "./errors.js";
const SURFACE_TARGET_TYPES = new Set([
    "star",
    "planet",
    "moon",
    "asteroid",
    "comet",
]);
export function validateDocument(doc) {
    const knownIds = new Set();
    const objectMap = new Map();
    for (const obj of doc.objects) {
        if (knownIds.has(obj.id)) {
            throw new WorldOrbitError(`Duplicate object id "${obj.id}"`);
        }
        knownIds.add(obj.id);
        objectMap.set(obj.id, obj);
    }
    for (const obj of doc.objects) {
        if (!obj.placement) {
            continue;
        }
        if (obj.placement.mode === "orbit" || obj.placement.mode === "surface") {
            if (!knownIds.has(obj.placement.target)) {
                throw new WorldOrbitError(`Unknown placement target "${obj.placement.target}" on "${obj.id}"`);
            }
        }
        if (obj.placement.mode === "surface") {
            const target = objectMap.get(obj.placement.target);
            if (!target || !SURFACE_TARGET_TYPES.has(target.type)) {
                throw new WorldOrbitError(`Surface target "${obj.placement.target}" on "${obj.id}" is not surface-capable`);
            }
        }
        if (obj.placement.mode === "at") {
            if (obj.placement.reference.kind === "lagrange") {
                validateLagrangeReference(obj, obj.placement.reference, knownIds);
            }
            if (obj.placement.reference.kind === "anchor") {
                validateAnchorReference(obj, obj.placement.reference, knownIds);
            }
        }
    }
}
function validateLagrangeReference(obj, reference, knownIds) {
    if (!knownIds.has(reference.primary)) {
        throw new WorldOrbitError(`Unknown Lagrange reference "${reference.primary}" on "${obj.id}"`);
    }
    if (reference.secondary && !knownIds.has(reference.secondary)) {
        throw new WorldOrbitError(`Unknown Lagrange reference "${reference.secondary}" on "${obj.id}"`);
    }
}
function validateAnchorReference(obj, reference, knownIds) {
    if (!knownIds.has(reference.objectId)) {
        throw new WorldOrbitError(`Unknown anchor target "${reference.objectId}" on "${obj.id}"`);
    }
}
