import type {
  RenderScene,
  RenderSceneObject,
  RenderSceneViewpoint,
  WorldOrbitObject,
} from "@worldorbit/core";

import type {
  ViewerAtlasState,
  ViewerBookmark,
  ViewerFilter,
  ViewerLayerOptions,
  ViewerRenderOptions,
  ViewerSearchResult,
  ViewerState,
} from "./types.js";

export function normalizeViewerFilter(filter: ViewerFilter | null | undefined): ViewerFilter | null {
  if (!filter) {
    return null;
  }

  const normalized: ViewerFilter = {
    query: filter.query?.trim() || undefined,
    objectTypes: dedupeList(filter.objectTypes ?? []),
    tags: dedupeList((filter.tags ?? []).map((tag) => tag.trim()).filter(Boolean)),
    groupIds: dedupeList((filter.groupIds ?? []).map((groupId) => groupId.trim()).filter(Boolean)),
    includeAncestors: filter.includeAncestors ?? true,
  };

  return isViewerFilterActive(normalized) ? normalized : null;
}

export function isViewerFilterActive(filter: ViewerFilter | null | undefined): boolean {
  return Boolean(
    filter &&
      (filter.query?.trim() ||
        filter.objectTypes?.length ||
        filter.tags?.length ||
        filter.groupIds?.length),
  );
}

export function computeVisibleObjectIds(
  scene: RenderScene,
  filter: ViewerFilter | null | undefined,
): Set<string> {
  const normalized = normalizeViewerFilter(filter);
  const visible = new Set<string>();

  for (const object of scene.objects) {
    if (object.hidden) {
      continue;
    }

    if (matchesObjectFilter(object, normalized)) {
      visible.add(object.objectId);
      if (normalized?.includeAncestors !== false) {
        for (const ancestorId of object.ancestorIds) {
          visible.add(ancestorId);
        }
      }
    }
  }

  if (!normalized) {
    return new Set(scene.objects.filter((object) => !object.hidden).map((object) => object.objectId));
  }

  return visible;
}

export function searchSceneObjects(
  scene: RenderScene,
  query: string,
  limit = 12,
): ViewerSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return scene.objects
      .filter((object) => !object.hidden)
      .slice()
      .sort((left, right) => left.label.localeCompare(right.label))
      .slice(0, limit)
      .map((object) => createSearchResult(object, 1));
  }

  return scene.objects
    .filter((object) => !object.hidden)
    .map((object) => ({
      object,
      score: scoreSearchMatch(object, normalizedQuery),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.object.label.localeCompare(right.object.label))
    .slice(0, limit)
    .map((entry) => createSearchResult(entry.object, entry.score));
}

export function createAtlasStateSnapshot(
  viewerState: ViewerState,
  renderOptions: ViewerRenderOptions,
  filter: ViewerFilter | null,
  viewpointId: string | null,
): ViewerAtlasState {
  return {
    version: "1.0",
    viewpointId,
    viewerState: { ...viewerState },
    renderOptions: {
      preset: renderOptions.preset,
      projection: renderOptions.projection,
      layers: renderOptions.layers ? { ...renderOptions.layers } : undefined,
      scaleModel: renderOptions.scaleModel ? { ...renderOptions.scaleModel } : undefined,
    },
    filter: normalizeViewerFilter(filter),
  };
}

export function serializeViewerAtlasState(state: ViewerAtlasState): string {
  return encodeURIComponent(JSON.stringify(state));
}

export function deserializeViewerAtlasState(serialized: string): ViewerAtlasState {
  return JSON.parse(decodeURIComponent(serialized)) as ViewerAtlasState;
}

export function createViewerBookmark(
  name: string,
  label: string | undefined,
  atlasState: ViewerAtlasState,
): ViewerBookmark {
  const normalizedName = name.trim() || "bookmark";
  return {
    id: normalizedName
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "bookmark",
    label: label?.trim() || normalizedName,
    atlasState: {
      ...atlasState,
      viewerState: { ...atlasState.viewerState },
      renderOptions: {
        ...atlasState.renderOptions,
        layers: atlasState.renderOptions.layers ? { ...atlasState.renderOptions.layers } : undefined,
        scaleModel: atlasState.renderOptions.scaleModel
          ? { ...atlasState.renderOptions.scaleModel }
          : undefined,
      },
      filter: atlasState.filter ? { ...atlasState.filter } : null,
    },
  };
}

export function sceneViewpointToLayerOptions(
  viewpoint: RenderSceneViewpoint | null | undefined,
): ViewerLayerOptions | undefined {
  if (!viewpoint) {
    return undefined;
  }

  const hasLayerState = Object.keys(viewpoint.layers).length > 0;
  if (!hasLayerState) {
    return undefined;
  }

  return {
    background: viewpoint.layers.background,
    guides: viewpoint.layers.guides,
    orbits:
      viewpoint.layers["orbits-front"] === undefined && viewpoint.layers["orbits-back"] === undefined
        ? undefined
        : viewpoint.layers["orbits-front"] !== false || viewpoint.layers["orbits-back"] !== false,
    objects: viewpoint.layers.objects,
    labels: viewpoint.layers.labels,
    metadata: viewpoint.layers.metadata,
  };
}

export function viewpointToViewerFilter(
  viewpoint: RenderSceneViewpoint | null | undefined,
): ViewerFilter | null {
  if (!viewpoint?.filter) {
    return null;
  }

  return normalizeViewerFilter({
    query: viewpoint.filter.query ?? undefined,
    objectTypes: viewpoint.filter.objectTypes,
    tags: viewpoint.filter.tags,
    groupIds: viewpoint.filter.groupIds,
    includeAncestors: true,
  });
}

function createSearchResult(
  object: RenderSceneObject,
  score: number,
): ViewerSearchResult {
  return {
    objectId: object.objectId,
    label: object.label,
    type: object.object.type,
    score,
    groupId: object.groupId,
    parentId: object.parentId,
    tags: Array.isArray(object.object.properties.tags)
      ? object.object.properties.tags.filter((entry): entry is string => typeof entry === "string")
      : [],
  };
}

function matchesObjectFilter(
  object: RenderSceneObject,
  filter: ViewerFilter | null,
): boolean {
  if (!filter) {
    return true;
  }

  if (filter.objectTypes?.length && !filter.objectTypes.includes(object.object.type)) {
    return false;
  }

  if (filter.groupIds?.length && (!object.groupId || !filter.groupIds.includes(object.groupId))) {
    return false;
  }

  if (filter.tags?.length) {
    const objectTags = Array.isArray(object.object.properties.tags)
      ? object.object.properties.tags.filter((entry): entry is string => typeof entry === "string")
      : [];

    if (!filter.tags.every((tag) => objectTags.includes(tag))) {
      return false;
    }
  }

  if (filter.query?.trim()) {
    const haystack = buildSearchText(object.object, object.label).toLowerCase();
    const tokens = filter.query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!tokens.every((token) => haystack.includes(token))) {
      return false;
    }
  }

  return true;
}

function scoreSearchMatch(object: RenderSceneObject, query: string): number {
  const id = object.objectId.toLowerCase();
  const label = object.label.toLowerCase();
  const haystack = buildSearchText(object.object, object.label).toLowerCase();
  let score = 0;

  if (id === query || label === query) {
    score += 120;
  } else if (id.startsWith(query) || label.startsWith(query)) {
    score += 96;
  } else if (id.includes(query) || label.includes(query)) {
    score += 72;
  }

  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.every((token) => haystack.includes(token))) {
    score += 32;
  }

  if (object.object.type === query) {
    score += 24;
  }

  const tags = Array.isArray(object.object.properties.tags)
    ? object.object.properties.tags.filter((entry): entry is string => typeof entry === "string")
    : [];
  if (tags.some((tag) => tag.toLowerCase() === query)) {
    score += 18;
  }

  return score;
}

function buildSearchText(object: WorldOrbitObject, label: string): string {
  const infoValues = Object.values(object.info);
  const propertyValues = Object.values(object.properties)
    .flatMap((value) => {
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === "object" && value && "value" in value) {
        return [String(value.value), String(value.unit ?? "")];
      }
      return [String(value)];
    })
    .filter(Boolean);

  return [
    object.id,
    label,
    object.type,
    ...propertyValues,
    ...infoValues,
  ].join(" ");
}

function dedupeList<T>(values: T[]): T[] {
  return [...new Set(values)];
}
