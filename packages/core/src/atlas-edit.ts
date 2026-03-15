import { materializeAtlasDocument } from "./draft.js";
import { validateDocumentWithDiagnostics } from "./diagnostics.js";
import type {
  AtlasDocumentPath,
  AtlasResolvedDiagnostic,
  WorldOrbitAtlasAnnotation,
  WorldOrbitAtlasDocument,
  WorldOrbitAtlasSystem,
  WorldOrbitAtlasViewpoint,
  WorldOrbitDiagnostic,
  WorldOrbitObject,
} from "./types.js";

export function createEmptyAtlasDocument(systemId = "WorldOrbit"): WorldOrbitAtlasDocument {
  return {
    format: "worldorbit",
    version: "2.0",
    sourceVersion: "1.0",
    system: {
      type: "system",
      id: systemId,
      title: systemId,
      defaults: {
        view: "topdown",
        scale: null,
        units: null,
        preset: null,
        theme: null,
      },
      atlasMetadata: {},
      viewpoints: [],
      annotations: [],
    },
    objects: [],
    diagnostics: [],
  };
}

export function cloneAtlasDocument(document: WorldOrbitAtlasDocument): WorldOrbitAtlasDocument {
  return structuredClone(document);
}

export function listAtlasDocumentPaths(document: WorldOrbitAtlasDocument): AtlasDocumentPath[] {
  const paths: AtlasDocumentPath[] = [{ kind: "system" }, { kind: "defaults" }];

  if (document.system) {
    for (const key of Object.keys(document.system.atlasMetadata).sort()) {
      paths.push({ kind: "metadata", key });
    }

    for (const viewpoint of [...document.system.viewpoints].sort(compareIdLike)) {
      paths.push({ kind: "viewpoint", id: viewpoint.id });
    }

    for (const annotation of [...document.system.annotations].sort(compareIdLike)) {
      paths.push({ kind: "annotation", id: annotation.id });
    }
  }

  for (const object of [...document.objects].sort(compareIdLike)) {
    paths.push({ kind: "object", id: object.id });
  }

  return paths;
}

export function getAtlasDocumentNode(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
): unknown {
  switch (path.kind) {
    case "system":
      return document.system;
    case "defaults":
      return document.system?.defaults ?? null;
    case "metadata":
      return path.key ? (document.system?.atlasMetadata[path.key] ?? null) : null;
    case "object":
      return path.id ? findObject(document, path.id) : null;
    case "viewpoint":
      return path.id ? findViewpoint(document.system, path.id) : null;
    case "annotation":
      return path.id ? findAnnotation(document.system, path.id) : null;
  }
}

export function upsertAtlasDocumentNode(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
  value: unknown,
): WorldOrbitAtlasDocument {
  const next = cloneAtlasDocument(document);
  const system = ensureSystem(next);

  switch (path.kind) {
    case "system":
      next.system = value as WorldOrbitAtlasSystem;
      return next;
    case "defaults":
      system.defaults = {
        ...system.defaults,
        ...(value as Partial<WorldOrbitAtlasSystem["defaults"]>),
      };
      return next;
    case "metadata":
      if (!path.key) {
        throw new Error('Metadata updates require a "key" value.');
      }
      if (value === null || value === undefined || value === "") {
        delete system.atlasMetadata[path.key];
      } else {
        system.atlasMetadata[path.key] = String(value);
      }
      return next;
    case "object":
      if (!path.id) {
        throw new Error('Object updates require an "id" value.');
      }
      upsertById(next.objects, value as WorldOrbitObject);
      return next;
    case "viewpoint":
      if (!path.id) {
        throw new Error('Viewpoint updates require an "id" value.');
      }
      upsertById(system.viewpoints, value as WorldOrbitAtlasViewpoint);
      return next;
    case "annotation":
      if (!path.id) {
        throw new Error('Annotation updates require an "id" value.');
      }
      upsertById(system.annotations, value as WorldOrbitAtlasAnnotation);
      return next;
  }
}

export function updateAtlasDocumentNode(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
  updater: (value: unknown) => unknown,
): WorldOrbitAtlasDocument {
  return upsertAtlasDocumentNode(document, path, updater(getAtlasDocumentNode(document, path)));
}

export function removeAtlasDocumentNode(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
): WorldOrbitAtlasDocument {
  const next = cloneAtlasDocument(document);
  const system = ensureSystem(next);

  switch (path.kind) {
    case "metadata":
      if (path.key) {
        delete system.atlasMetadata[path.key];
      }
      return next;
    case "object":
      if (path.id) {
        next.objects = next.objects.filter((object) => object.id !== path.id);
      }
      return next;
    case "viewpoint":
      if (path.id) {
        system.viewpoints = system.viewpoints.filter((viewpoint) => viewpoint.id !== path.id);
      }
      return next;
    case "annotation":
      if (path.id) {
        system.annotations = system.annotations.filter((annotation) => annotation.id !== path.id);
      }
      return next;
    default:
      return next;
  }
}

export function resolveAtlasDiagnostics(
  document: WorldOrbitAtlasDocument,
  diagnostics: WorldOrbitDiagnostic[],
): AtlasResolvedDiagnostic[] {
  return diagnostics.map((diagnostic) => ({
    diagnostic,
    path: resolveAtlasDiagnosticPath(document, diagnostic),
  }));
}

export function resolveAtlasDiagnosticPath(
  document: WorldOrbitAtlasDocument,
  diagnostic: WorldOrbitDiagnostic,
): AtlasDocumentPath | null {
  if (diagnostic.objectId && findObject(document, diagnostic.objectId)) {
    return {
      kind: "object",
      id: diagnostic.objectId,
    };
  }

  if (diagnostic.field?.startsWith("viewpoint.")) {
    const parts = diagnostic.field.split(".");
    if (parts[1] && findViewpoint(document.system, parts[1])) {
      return {
        kind: "viewpoint",
        id: parts[1],
      };
    }
  }

  if (diagnostic.field?.startsWith("annotation.")) {
    const parts = diagnostic.field.split(".");
    if (parts[1] && findAnnotation(document.system, parts[1])) {
      return {
        kind: "annotation",
        id: parts[1],
      };
    }
  }

  if (diagnostic.field && diagnostic.field in ensureSystem(document).atlasMetadata) {
    return {
      kind: "metadata",
      key: diagnostic.field,
    };
  }

  return null;
}

export function validateAtlasDocumentWithDiagnostics(
  document: WorldOrbitAtlasDocument,
): AtlasResolvedDiagnostic[] {
  const materialized = materializeAtlasDocument(document);
  const result = validateDocumentWithDiagnostics(materialized);
  return resolveAtlasDiagnostics(document, result.diagnostics);
}

function ensureSystem(document: WorldOrbitAtlasDocument): WorldOrbitAtlasSystem {
  if (document.system) {
    return document.system;
  }

  document.system = createEmptyAtlasDocument().system;
  return document.system!;
}

function findObject(
  document: WorldOrbitAtlasDocument,
  objectId: string,
): WorldOrbitObject | null {
  return document.objects.find((object) => object.id === objectId) ?? null;
}

function findViewpoint(
  system: WorldOrbitAtlasSystem | null,
  viewpointId: string,
): WorldOrbitAtlasViewpoint | null {
  return system?.viewpoints.find((viewpoint) => viewpoint.id === viewpointId) ?? null;
}

function findAnnotation(
  system: WorldOrbitAtlasSystem | null,
  annotationId: string,
): WorldOrbitAtlasAnnotation | null {
  return system?.annotations.find((annotation) => annotation.id === annotationId) ?? null;
}

function upsertById<T extends { id: string }>(items: T[], value: T): void {
  const index = items.findIndex((item) => item.id === value.id);
  if (index === -1) {
    items.push(value);
    items.sort(compareIdLike);
    return;
  }

  items[index] = value;
}

function compareIdLike(left: { id: string }, right: { id: string }): number {
  return left.id.localeCompare(right.id);
}
