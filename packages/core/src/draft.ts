import { renderDocumentToScene } from "./scene.js";
import type {
  RenderPresetName,
  SceneRenderOptions,
  ViewProjection,
  WorldOrbitDiagnostic,
  WorldOrbitDraftAnnotation,
  WorldOrbitDraftDefaults,
  WorldOrbitDraftDocument,
  WorldOrbitDraftSystem,
  WorldOrbitDraftViewpoint,
  WorldOrbitDocument,
  WorldOrbitObject,
} from "./types.js";

interface UpgradeOptions extends Pick<SceneRenderOptions, "preset" | "projection"> {}

interface DraftAnnotationConfig {
  id: string;
  label?: string;
  targetObjectId?: string | null;
  body?: string;
  tags?: string[];
}

export function upgradeDocumentToDraftV2(
  document: WorldOrbitDocument,
  options: UpgradeOptions = {},
): WorldOrbitDraftDocument {
  const scene = renderDocumentToScene(document, options);
  const diagnostics: WorldOrbitDiagnostic[] = [];
  const atlasMetadata = collectAtlasMetadata(document, diagnostics);
  const annotations = collectDraftAnnotations(document, diagnostics);
  const defaults = createDraftDefaults(document, scene.renderPreset ?? options.preset ?? null, scene.projection);
  const system = document.system
    ? createDraftSystem(
        document,
        defaults,
        atlasMetadata,
        annotations,
        diagnostics,
        scene.renderPreset ?? options.preset ?? null,
      )
    : null;

  if (scene.viewpoints.some((viewpoint) => !viewpoint.generated)) {
    diagnostics.push({
      code: "upgrade.viewpoints.structured",
      severity: "info",
      source: "upgrade",
      message: `Promoted ${scene.viewpoints.filter((viewpoint) => !viewpoint.generated).length} document-defined viewpoint(s) into the 2.0-draft atlas section.`,
    });
  }

  return {
    format: "worldorbit",
    version: "2.0-draft",
    sourceVersion: document.version,
    system,
    objects: document.objects.map(cloneWorldOrbitObject),
    diagnostics,
  };
}

function createDraftSystem(
  document: WorldOrbitDocument,
  defaults: WorldOrbitDraftDefaults,
  atlasMetadata: Record<string, string>,
  annotations: WorldOrbitDraftAnnotation[],
  diagnostics: WorldOrbitDiagnostic[],
  preset: RenderPresetName | null,
): WorldOrbitDraftSystem {
  const scene = renderDocumentToScene(document, {
    preset: preset ?? undefined,
    projection: defaults.view,
  });

  return {
    type: "system",
    id: document.system?.id ?? "WorldOrbit",
    title:
      typeof document.system?.properties.title === "string"
        ? document.system.properties.title
        : null,
    defaults,
    atlasMetadata,
    viewpoints: scene.viewpoints.map(mapSceneViewpointToDraftViewpoint),
    annotations,
  };
}

function createDraftDefaults(
  document: WorldOrbitDocument,
  preset: RenderPresetName | null,
  projection: ViewProjection,
): WorldOrbitDraftDefaults {
  return {
    view:
      typeof document.system?.properties.view === "string" &&
      document.system.properties.view.toLowerCase() === "topdown"
        ? "topdown"
        : projection,
    scale:
      typeof document.system?.properties.scale === "string"
        ? document.system.properties.scale
        : null,
    units:
      typeof document.system?.properties.units === "string"
        ? document.system.properties.units
        : null,
    preset,
    theme:
      typeof document.system?.info["atlas.theme"] === "string"
        ? document.system.info["atlas.theme"]
        : null,
  };
}

function collectAtlasMetadata(
  document: WorldOrbitDocument,
  diagnostics: WorldOrbitDiagnostic[],
): Record<string, string> {
  const metadata: Record<string, string> = {};

  for (const [key, value] of Object.entries(document.system?.info ?? {})) {
    if (key.startsWith("viewpoint.") || key.startsWith("annotation.")) {
      continue;
    }

    metadata[key] = value;
  }

  const metadataKeys = Object.keys(metadata);
  if (metadataKeys.length > 0) {
    diagnostics.push({
      code: "upgrade.atlasMetadata.preserved",
      severity: "warning",
      source: "upgrade",
      message: `Preserved ${metadataKeys.length} system info entr${metadataKeys.length === 1 ? "y" : "ies"} as atlas metadata in the 2.0-draft document.`,
    });
  }

  return metadata;
}

function collectDraftAnnotations(
  document: WorldOrbitDocument,
  diagnostics: WorldOrbitDiagnostic[],
): WorldOrbitDraftAnnotation[] {
  const drafts = new Map<string, DraftAnnotationConfig>();

  for (const [key, value] of Object.entries(document.system?.info ?? {})) {
    if (!key.startsWith("annotation.")) {
      continue;
    }

    const [, rawId, ...fieldParts] = key.split(".");
    if (!rawId || fieldParts.length === 0) {
      continue;
    }

    const id = normalizeIdentifier(rawId);
    if (!id) {
      continue;
    }

    const draft = drafts.get(id) ?? { id };
    const field = fieldParts.join(".").toLowerCase();

    switch (field) {
      case "label":
        draft.label = value;
        break;
      case "target":
      case "object":
        draft.targetObjectId = value.trim() || null;
        break;
      case "body":
      case "text":
      case "description":
        draft.body = value;
        break;
      case "tags":
        draft.tags = splitList(value);
        break;
    }

    drafts.set(id, draft);
  }

  for (const object of document.objects) {
    const description = object.info.description;
    if (!description) {
      continue;
    }

    const annotationId = normalizeIdentifier(`${object.id}-notes`);
    if (drafts.has(annotationId)) {
      continue;
    }

    drafts.set(annotationId, {
      id: annotationId,
      label: `${object.id} Notes`,
      targetObjectId: object.id,
      body: description,
      tags: Array.isArray(object.properties.tags)
        ? object.properties.tags.filter((entry): entry is string => typeof entry === "string")
        : [],
    });

    diagnostics.push({
      code: "upgrade.annotation.objectDescription",
      severity: "info",
      source: "upgrade",
      message: `Lifted ${object.id}.info.description into structured draft annotation "${annotationId}".`,
      objectId: object.id,
      field: "description",
    });
  }

  return [...drafts.values()]
    .filter((draft) => draft.body || draft.label)
    .map((draft) => ({
      id: draft.id,
      label: draft.label ?? humanizeIdentifier(draft.id),
      targetObjectId: draft.targetObjectId ?? null,
      body: draft.body ?? "",
      tags: draft.tags ?? [],
      sourceObjectId: draft.targetObjectId ?? null,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function mapSceneViewpointToDraftViewpoint(
  viewpoint: ReturnType<typeof renderDocumentToScene>["viewpoints"][number],
): WorldOrbitDraftViewpoint {
  return {
    id: viewpoint.id,
    label: viewpoint.label,
    summary: viewpoint.summary,
    focusObjectId: viewpoint.objectId,
    selectedObjectId: viewpoint.selectedObjectId,
    projection: viewpoint.projection,
    preset: viewpoint.preset,
    zoom: viewpoint.scale,
    rotationDeg: viewpoint.rotationDeg,
    layers: { ...viewpoint.layers },
    filter: viewpoint.filter
      ? {
          query: viewpoint.filter.query,
          objectTypes: [...viewpoint.filter.objectTypes],
          tags: [...viewpoint.filter.tags],
          groupIds: [...viewpoint.filter.groupIds],
        }
      : null,
  };
}

function cloneWorldOrbitObject(object: WorldOrbitObject): WorldOrbitObject {
  return {
    ...object,
    properties: cloneProperties(object.properties),
    placement: object.placement ? structuredClone(object.placement) : null,
    info: { ...object.info },
  };
}

function cloneProperties(
  properties: WorldOrbitObject["properties"],
): WorldOrbitObject["properties"] {
  const next: WorldOrbitObject["properties"] = {};

  for (const [key, value] of Object.entries(properties)) {
    if (Array.isArray(value)) {
      next[key] = [...value];
      continue;
    }

    if (value && typeof value === "object" && "value" in value) {
      next[key] = {
        value: value.value,
        unit: value.unit,
      };
      continue;
    }

    next[key] = value;
  }

  return next;
}

function splitList(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeIdentifier(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(" ");
}
