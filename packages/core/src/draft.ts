import { renderDocumentToScene } from "./scene.js";
import type {
  RenderPresetName,
  SceneRenderOptions,
  ViewProjection,
  WorldOrbitAtlasAnnotation,
  WorldOrbitAtlasDefaults,
  WorldOrbitAtlasDocument,
  WorldOrbitAtlasSystem,
  WorldOrbitAtlasViewpoint,
  WorldOrbitDiagnostic,
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

export function upgradeDocumentToV2(
  document: WorldOrbitDocument,
  options: UpgradeOptions = {},
): WorldOrbitAtlasDocument {
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
      message: `Promoted ${scene.viewpoints.filter((viewpoint) => !viewpoint.generated).length} document-defined viewpoint(s) into the 2.0 atlas section.`,
    });
  }

  return {
    format: "worldorbit",
    version: "2.0",
    schemaVersion: "2.0",
    sourceVersion: document.version,
    system,
    groups: structuredClone(document.groups ?? []),
    relations: structuredClone(document.relations ?? []),
    objects: document.objects.map(cloneWorldOrbitObject),
    diagnostics,
  };
}

export function upgradeDocumentToDraftV2(
  document: WorldOrbitDocument,
  options: UpgradeOptions = {},
) {
  return convertAtlasDocumentToLegacyDraft(upgradeDocumentToV2(document, options));
}

export function materializeAtlasDocument(
  document: WorldOrbitAtlasDocument,
): WorldOrbitDocument {
  const system = document.system
    ? {
        type: "system" as const,
        id: document.system.id,
        title: document.system.title,
        description: document.system.description,
        epoch: document.system.epoch,
        referencePlane: document.system.referencePlane,
        properties: materializeDraftSystemProperties(document.system),
        info: materializeDraftSystemInfo(document.system),
      }
    : null;

  return {
    format: "worldorbit",
    version: "1.0",
    schemaVersion: document.version,
    system,
    groups: structuredClone(document.groups ?? []),
    relations: structuredClone(document.relations ?? []),
    objects: document.objects.map(cloneWorldOrbitObject),
  };
}

export function materializeDraftDocument(document: WorldOrbitAtlasDocument) {
  return materializeAtlasDocument(document);
}

function createDraftSystem(
  document: WorldOrbitDocument,
  defaults: WorldOrbitAtlasDefaults,
  atlasMetadata: Record<string, string>,
  annotations: WorldOrbitAtlasAnnotation[],
  diagnostics: WorldOrbitDiagnostic[],
  preset: RenderPresetName | null,
): WorldOrbitAtlasSystem {
  const scene = renderDocumentToScene(document, {
    preset: preset ?? undefined,
    projection: defaults.view,
  });

  return {
    type: "system",
    id: document.system?.id ?? "WorldOrbit",
    title: document.system?.title ?? (typeof document.system?.properties.title === "string"
      ? document.system.properties.title
      : null),
    description: document.system?.description ?? null,
    epoch: document.system?.epoch ?? null,
    referencePlane: document.system?.referencePlane ?? null,
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
): WorldOrbitAtlasDefaults {
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
      message: `Preserved ${metadataKeys.length} system info entr${metadataKeys.length === 1 ? "y" : "ies"} as atlas metadata in the 2.0 atlas document.`,
    });
  }

  return metadata;
}

function collectDraftAnnotations(
  document: WorldOrbitDocument,
  diagnostics: WorldOrbitDiagnostic[],
): WorldOrbitAtlasAnnotation[] {
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
      message: `Lifted ${object.id}.info.description into structured atlas annotation "${annotationId}".`,
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
): WorldOrbitAtlasViewpoint {
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
    groups: object.groups ? [...object.groups] : undefined,
    resonance: object.resonance ? { ...object.resonance } : object.resonance,
    renderHints: object.renderHints ? { ...object.renderHints } : object.renderHints,
    deriveRules: object.deriveRules ? object.deriveRules.map((rule) => ({ ...rule })) : undefined,
    validationRules: object.validationRules
      ? object.validationRules.map((rule) => ({ ...rule }))
      : undefined,
    lockedFields: object.lockedFields ? [...object.lockedFields] : undefined,
    tolerances: object.tolerances
      ? object.tolerances.map((entry) => ({
          field: entry.field,
          value:
            entry.value && typeof entry.value === "object" && "value" in entry.value
              ? { value: entry.value.value, unit: entry.value.unit }
              : Array.isArray(entry.value)
                ? [...entry.value]
                : entry.value,
        }))
      : undefined,
    typedBlocks: object.typedBlocks
      ? Object.fromEntries(
          Object.entries(object.typedBlocks).map(([key, block]) => [key, { ...(block ?? {}) }]),
        )
      : undefined,
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

function materializeDraftSystemProperties(
  system: WorldOrbitAtlasSystem,
): NonNullable<WorldOrbitDocument["system"]>["properties"] {
  const properties: NonNullable<WorldOrbitDocument["system"]>["properties"] = {};

  if (system.title) {
    properties.title = system.title;
  }

  properties.view = system.defaults.view;

  if (system.defaults.scale) {
    properties.scale = system.defaults.scale;
  }

  if (system.defaults.units) {
    properties.units = system.defaults.units;
  }

  if (system.description) {
    properties.description = system.description;
  }

  if (system.epoch) {
    properties.epoch = system.epoch;
  }

  if (system.referencePlane) {
    properties.referencePlane = system.referencePlane;
  }

  return properties;
}

function materializeDraftSystemInfo(system: WorldOrbitAtlasSystem): Record<string, string> {
  const info: Record<string, string> = {
    ...system.atlasMetadata,
  };

  if (system.defaults.theme) {
    info["atlas.theme"] = system.defaults.theme;
  }

  for (const viewpoint of system.viewpoints) {
    const prefix = `viewpoint.${viewpoint.id}`;
    info[`${prefix}.label`] = viewpoint.label;

    if (viewpoint.summary) {
      info[`${prefix}.summary`] = viewpoint.summary;
    }
    if (viewpoint.focusObjectId) {
      info[`${prefix}.focus`] = viewpoint.focusObjectId;
    }
    if (viewpoint.selectedObjectId) {
      info[`${prefix}.select`] = viewpoint.selectedObjectId;
    }
    if (viewpoint.projection) {
      info[`${prefix}.projection`] = viewpoint.projection;
    }
    if (viewpoint.preset) {
      info[`${prefix}.preset`] = viewpoint.preset;
    }
    if (viewpoint.zoom !== null) {
      info[`${prefix}.zoom`] = String(viewpoint.zoom);
    }
    if (viewpoint.rotationDeg !== 0) {
      info[`${prefix}.rotation`] = String(viewpoint.rotationDeg);
    }

    const serializedLayers = serializeViewpointLayers(viewpoint.layers);
    if (serializedLayers) {
      info[`${prefix}.layers`] = serializedLayers;
    }

    if (viewpoint.filter?.query) {
      info[`${prefix}.query`] = viewpoint.filter.query;
    }
    if ((viewpoint.filter?.objectTypes.length ?? 0) > 0) {
      info[`${prefix}.types`] = viewpoint.filter?.objectTypes.join(" ") ?? "";
    }
    if ((viewpoint.filter?.tags.length ?? 0) > 0) {
      info[`${prefix}.tags`] = viewpoint.filter?.tags.join(" ") ?? "";
    }
    if ((viewpoint.filter?.groupIds.length ?? 0) > 0) {
      info[`${prefix}.groups`] = viewpoint.filter?.groupIds.join(" ") ?? "";
    }
  }

  for (const annotation of system.annotations) {
    const prefix = `annotation.${annotation.id}`;
    info[`${prefix}.label`] = annotation.label;

    if (annotation.targetObjectId) {
      info[`${prefix}.target`] = annotation.targetObjectId;
    }

    info[`${prefix}.body`] = annotation.body;

    if (annotation.tags.length > 0) {
      info[`${prefix}.tags`] = annotation.tags.join(" ");
    }

    if (annotation.sourceObjectId) {
      info[`${prefix}.source`] = annotation.sourceObjectId;
    }
  }

  return info;
}

function serializeViewpointLayers(
  layers: WorldOrbitAtlasViewpoint["layers"],
): string {
  const tokens: string[] = [];
  const orbitFront = layers["orbits-front"];
  const orbitBack = layers["orbits-back"];

  if (orbitFront !== undefined || orbitBack !== undefined) {
    tokens.push(orbitFront !== false || orbitBack !== false ? "orbits" : "-orbits");
  }

  for (const key of ["background", "guides", "relations", "objects", "labels", "metadata"] as const) {
    if (layers[key] !== undefined) {
      tokens.push(layers[key] ? key : `-${key}`);
    }
  }

  return tokens.join(" ");
}

function convertAtlasDocumentToLegacyDraft(
  document: WorldOrbitAtlasDocument,
) {
  return {
    ...document,
    version: "2.0-draft" as const,
    schemaVersion: "2.0-draft" as const,
  };
}
