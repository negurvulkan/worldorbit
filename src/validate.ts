import { WorldOrbitError } from "./errors.js";
import type {
  LagrangeReference,
  WorldOrbitDocument,
  WorldOrbitObject,
} from "./types.js";

export function validateDocument(doc: WorldOrbitDocument): void {
  const knownIds = new Set<string>();

  for (const obj of doc.objects) {
    if (knownIds.has(obj.id)) {
      throw new WorldOrbitError(`Duplicate object id "${obj.id}"`);
    }

    knownIds.add(obj.id);
  }

  for (const obj of doc.objects) {
    if (!obj.placement) {
      continue;
    }

    if (obj.placement.mode === "orbit" || obj.placement.mode === "surface") {
      if (!knownIds.has(obj.placement.target)) {
        throw new WorldOrbitError(
          `Unknown placement target "${obj.placement.target}" on "${obj.id}"`,
        );
      }
    }

    if (obj.placement.mode === "at" && obj.placement.reference.kind === "lagrange") {
      validateLagrangeReference(obj, obj.placement.reference, knownIds);
    }
  }
}

function validateLagrangeReference(
  obj: WorldOrbitObject,
  reference: LagrangeReference,
  knownIds: Set<string>,
): void {
  if (!knownIds.has(reference.primary)) {
    throw new WorldOrbitError(
      `Unknown Lagrange reference "${reference.primary}" on "${obj.id}"`,
    );
  }

  if (reference.secondary && !knownIds.has(reference.secondary)) {
    throw new WorldOrbitError(
      `Unknown Lagrange reference "${reference.secondary}" on "${obj.id}"`,
    );
  }
}
