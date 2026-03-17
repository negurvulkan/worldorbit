import type {
  AtReference,
  CoordinatePoint,
  NormalizedValue,
  RenderBounds,
  RenderLeaderLine,
  RenderPresetName,
  RenderSceneGroup,
  RenderSceneLabel,
  RenderSceneLayer,
  RenderSceneViewpoint,
  RenderSceneViewpointFilter,
  RenderOrbitVisual,
  RenderScaleModel,
  RenderScene,
  RenderSceneObject,
  SceneLayoutPreset,
  SceneRenderOptions,
  UnitValue,
  ViewProjection,
  WorldOrbitDocument,
  WorldOrbitObject,
} from "./types.js";

interface PositionedObject {
  object: WorldOrbitObject;
  x: number;
  y: number;
  radius: number;
  sortKey: number;
  anchorX?: number;
  anchorY?: number;
}

interface OrbitVisualDraft {
  object: WorldOrbitObject;
  parentId: string;
  kind: "circle" | "ellipse";
  cx: number;
  cy: number;
  radius?: number;
  rx?: number;
  ry?: number;
  rotationDeg: number;
  band: boolean;
  bandThickness?: number;
  frontArcPath?: string;
  backArcPath?: string;
}

interface LeaderLineDraft {
  object: WorldOrbitObject;
  groupId: string | null;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mode: "surface" | "at" | "free";
}

interface PlacementContext {
  orbitChildren: Map<string, WorldOrbitObject[]>;
  surfaceChildren: Map<string, WorldOrbitObject[]>;
  objectMap: Map<string, WorldOrbitObject>;
  spacingFactor: number;
  projection: ViewProjection;
  scaleModel: RenderScaleModel;
}

interface OrbitMetricContext {
  metrics: Array<number | null>;
  minMetric: number;
  maxMetric: number;
  metricSpread: number;
  innerPx: number;
  stepPx: number;
  pixelSpread: number;
}

interface SceneRelationshipContext {
  parentIds: Map<string, string | null>;
  childIds: Map<string, string[]>;
  ancestorIds: Map<string, string[]>;
  groupIds: Map<string, string>;
  groupRoots: Map<string, string | null>;
}

interface SceneFrame {
  width: number;
  height: number;
  padding: number;
  preset: RenderPresetName | null;
}

interface ViewpointConfigDraft {
  id: string;
  label?: string;
  summary?: string;
  focus?: string;
  select?: string;
  projection?: ViewProjection;
  preset?: RenderPresetName | null;
  rotationDeg?: number;
  scale?: number | null;
  layers?: Partial<Record<RenderSceneLayer["id"], boolean>>;
  filter?: RenderSceneViewpointFilter | null;
}

const AU_IN_KM = 149_597_870.7;
const EARTH_RADIUS_IN_KM = 6_371;
const JUPITER_RADIUS_IN_KM = 71_492;
const SOLAR_RADIUS_IN_KM = 695_700;
const LY_IN_AU = 63_241.077;
const PC_IN_AU = 206_264.806;
const KPC_IN_AU = 206_264_806;
const ISO_FLATTENING = 0.68;
const MIN_ISO_MINOR_SCALE = 0.2;
const ARC_SAMPLE_COUNT = 28;

export function renderDocumentToScene(
  document: WorldOrbitDocument,
  options: SceneRenderOptions = {},
): RenderScene {
  const frame = resolveSceneFrame(options);
  const width = frame.width;
  const height = frame.height;
  const padding = frame.padding;
  const layoutPreset = resolveLayoutPreset(document);
  const projection = resolveProjection(document, options.projection);
  const scaleModel = resolveScaleModel(layoutPreset, options.scaleModel);
  const spacingFactor = layoutPresetSpacing(layoutPreset);
  const systemId = document.system?.id ?? null;

  const objectMap = new Map(document.objects.map((object) => [object.id, object]));
  const relationships = buildSceneRelationships(document.objects, objectMap);
  const positions = new Map<string, PositionedObject>();
  const orbitDrafts: OrbitVisualDraft[] = [];
  const leaderDrafts: LeaderLineDraft[] = [];

  const rootObjects: WorldOrbitObject[] = [];
  const freeObjects: WorldOrbitObject[] = [];
  const atObjects: WorldOrbitObject[] = [];
  const surfaceChildren = new Map<string, WorldOrbitObject[]>();
  const orbitChildren = new Map<string, WorldOrbitObject[]>();

  for (const object of document.objects) {
    const placement = object.placement;

    if (!placement) {
      rootObjects.push(object);
      continue;
    }

    if (placement.mode === "orbit") {
      pushGrouped(orbitChildren, placement.target, object);
      continue;
    }

    if (placement.mode === "surface") {
      pushGrouped(surfaceChildren, placement.target, object);
      continue;
    }

    if (placement.mode === "at") {
      atObjects.push(object);
      continue;
    }

    freeObjects.push(object);
  }

  const centerX = freeObjects.length > 0 ? width * 0.42 : width / 2;
  const centerY = height / 2;
  const context: PlacementContext = {
    orbitChildren,
    surfaceChildren,
    objectMap,
    spacingFactor,
    projection,
    scaleModel,
  };
  const primaryRoot =
    rootObjects.find((object) => object.type === "star") ?? rootObjects[0] ?? null;

  if (primaryRoot) {
    placeObject(primaryRoot, centerX, centerY, 0, positions, orbitDrafts, leaderDrafts, context);
  }

  const secondaryRoots = rootObjects.filter((object) => object.id !== primaryRoot?.id);
  if (secondaryRoots.length > 0) {
    const rootRingRadius =
      Math.min(width, height) *
      0.28 *
      spacingFactor *
      scaleModel.orbitDistanceMultiplier;

    secondaryRoots.forEach((object, index) => {
      const angle = angleForIndex(index, secondaryRoots.length, -Math.PI / 2);
      const offset = projectPolarOffset(angle, rootRingRadius, projection, 1);
      placeObject(
        object,
        centerX + offset.x,
        centerY + offset.y,
        0,
        positions,
        orbitDrafts,
        leaderDrafts,
        context,
      );
    });
  }

  freeObjects.forEach((object, index) => {
    const x =
      width -
      padding -
      140 -
      freePlacementOffsetPx(
        object.placement?.mode === "free" ? object.placement.distance : undefined,
        scaleModel,
      );
    const rowStep =
      Math.max(
        76,
        ((height - padding * 2 - 180) / Math.max(1, freeObjects.length)) * spacingFactor,
      ) * scaleModel.freePlacementMultiplier;
    const y = padding + 92 + index * rowStep;

    positions.set(object.id, {
      object,
      x,
      y,
      radius: visualRadiusFor(object, 0, scaleModel),
      sortKey: computeSortKey(x, y, 0),
    });

    leaderDrafts.push({
      object,
      groupId: relationships.groupIds.get(object.id) ?? null,
      x1: x - 60,
      y1: y,
      x2: x - 18,
      y2: y,
      mode: "free",
    });

    placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, context, 1);
  });

  atObjects.forEach((object, index) => {
    if (positions.has(object.id) || !object.placement || object.placement.mode !== "at") {
      return;
    }

    const resolved = resolveAtPosition(
      object.placement.reference,
      positions,
      objectMap,
      index,
      atObjects.length,
      width,
      height,
      padding,
      context,
    );

    positions.set(object.id, {
      object,
      x: resolved.x,
      y: resolved.y,
      radius: visualRadiusFor(object, 2, scaleModel),
      sortKey: computeSortKey(resolved.x, resolved.y, 2),
      anchorX: resolved.anchorX,
      anchorY: resolved.anchorY,
    });

    if (resolved.anchorX !== undefined && resolved.anchorY !== undefined) {
      leaderDrafts.push({
        object,
        groupId: relationships.groupIds.get(object.id) ?? null,
        x1: resolved.anchorX,
        y1: resolved.anchorY,
        x2: resolved.x,
        y2: resolved.y,
        mode: "at",
      });
    }

    placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, context, 2);
  });

  const objects = [...positions.values()].map((position) =>
    createSceneObject(position, scaleModel, relationships),
  );
  const orbitVisuals = orbitDrafts.map((draft) =>
    createOrbitVisual(draft, relationships.groupIds.get(draft.object.id) ?? null),
  );
  const leaders = leaderDrafts.map((draft) => createLeaderLine(draft));
  const labels = createSceneLabels(objects, height, scaleModel.labelMultiplier);
  const layers = createSceneLayers(orbitVisuals, leaders, objects, labels);
  const groups = createSceneGroups(objects, orbitVisuals, leaders, labels, relationships);
  const viewpoints = createSceneViewpoints(
    document,
    projection,
    frame.preset,
    relationships,
    objectMap,
  );
  const contentBounds = calculateContentBounds(
    width,
    height,
    objects,
    orbitVisuals,
    leaders,
    labels,
  );

  return {
    width,
    height,
    padding,
    renderPreset: frame.preset,
    projection,
    scaleModel,
    title:
      String(document.system?.properties.title ?? document.system?.id ?? "WorldOrbit") ||
      "WorldOrbit",
    subtitle: `${capitalizeLabel(projection)} view - ${capitalizeLabel(layoutPreset)} layout`,
    systemId,
    viewMode: projection,
    layoutPreset,
    metadata: {
      format: document.format,
      version: document.version,
      view: projection,
      scale: String(document.system?.properties.scale ?? layoutPreset),
      units: String(document.system?.properties.units ?? "mixed"),
      preset: frame.preset ?? "custom",
    },
    contentBounds,
    layers,
    groups,
    viewpoints,
    objects,
    orbitVisuals,
    leaders,
    labels,
  };
}

export function rotatePoint(
  point: CoordinatePoint,
  center: CoordinatePoint,
  rotationDeg: number,
): CoordinatePoint {
  const radians = degreesToRadians(rotationDeg);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function resolveLayoutPreset(document: WorldOrbitDocument): SceneLayoutPreset {
  const rawScale = String(document.system?.properties.scale ?? "balanced").toLowerCase();

  switch (rawScale) {
    case "compressed":
    case "compact":
      return "compact";
    case "expanded":
    case "presentation":
      return "presentation";
    default:
      return "balanced";
  }
}

function resolveSceneFrame(options: SceneRenderOptions): SceneFrame {
  const defaults = scenePresetDefaults(options.preset);
  return {
    width: options.width ?? defaults.width,
    height: options.height ?? defaults.height,
    padding: options.padding ?? defaults.padding,
    preset: options.preset ?? null,
  };
}

function scenePresetDefaults(
  preset: RenderPresetName | undefined,
): { width: number; height: number; padding: number } {
  switch (preset) {
    case "presentation":
      return { width: 1440, height: 900, padding: 88 };
    case "atlas-card":
      return { width: 960, height: 560, padding: 56 };
    case "markdown":
      return { width: 920, height: 540, padding: 48 };
    case "diagram":
    default:
      return { width: 1200, height: 780, padding: 72 };
  }
}

function resolveProjection(
  document: WorldOrbitDocument,
  projection: SceneRenderOptions["projection"],
): ViewProjection {
  if (projection === "topdown" || projection === "isometric") {
    return projection;
  }

  return String(document.system?.properties.view ?? "topdown").toLowerCase() === "isometric"
    ? "isometric"
    : "topdown";
}

function resolveScaleModel(
  layoutPreset: SceneLayoutPreset,
  overrides: Partial<RenderScaleModel> | undefined,
): RenderScaleModel {
  const defaults = defaultScaleModel(layoutPreset);
  return {
    ...defaults,
    ...overrides,
  };
}

function defaultScaleModel(layoutPreset: SceneLayoutPreset): RenderScaleModel {
  switch (layoutPreset) {
    case "compact":
      return {
        orbitDistanceMultiplier: 0.84,
        bodyRadiusMultiplier: 0.92,
        labelMultiplier: 0.9,
        freePlacementMultiplier: 0.9,
        ringThicknessMultiplier: 0.92,
        minBodyRadius: 4,
        maxBodyRadius: 36,
      };
    case "presentation":
      return {
        orbitDistanceMultiplier: 1.2,
        bodyRadiusMultiplier: 1.18,
        labelMultiplier: 1.08,
        freePlacementMultiplier: 1.05,
        ringThicknessMultiplier: 1.16,
        minBodyRadius: 5,
        maxBodyRadius: 48,
      };
    default:
      return {
        orbitDistanceMultiplier: 1,
        bodyRadiusMultiplier: 1,
        labelMultiplier: 1,
        freePlacementMultiplier: 1,
        ringThicknessMultiplier: 1,
        minBodyRadius: 4,
        maxBodyRadius: 40,
      };
  }
}

function layoutPresetSpacing(layoutPreset: SceneLayoutPreset): number {
  switch (layoutPreset) {
    case "compact":
      return 0.84;
    case "presentation":
      return 1.2;
    default:
      return 1;
  }
}

function createSceneObject(
  position: PositionedObject,
  scaleModel: RenderScaleModel,
  relationships: SceneRelationshipContext,
): RenderSceneObject {
  const { object, x, y, radius, sortKey, anchorX, anchorY } = position;
  return {
    renderId: createRenderId(object.id),
    objectId: object.id,
    object,
    parentId: relationships.parentIds.get(object.id) ?? null,
    ancestorIds: relationships.ancestorIds.get(object.id) ?? [],
    childIds: relationships.childIds.get(object.id) ?? [],
    groupId: relationships.groupIds.get(object.id) ?? null,
    x,
    y,
    radius,
    visualRadius: visualExtentForObject(object, radius, scaleModel),
    sortKey,
    anchorX,
    anchorY,
    label: object.id,
    secondaryLabel:
      object.type === "structure" ? String(object.properties.kind ?? object.type) : object.type,
    fillColor: customColorFor(object.properties.color),
    imageHref:
      typeof object.properties.image === "string" && object.properties.image.trim()
        ? object.properties.image
        : undefined,
    hidden: object.properties.hidden === true,
  };
}

function createOrbitVisual(
  draft: OrbitVisualDraft,
  groupId: string | null,
): RenderOrbitVisual {
  return {
    renderId: `${createRenderId(draft.object.id)}-orbit`,
    objectId: draft.object.id,
    object: draft.object,
    parentId: draft.parentId,
    groupId,
    kind: draft.kind,
    cx: draft.cx,
    cy: draft.cy,
    radius: draft.radius,
    rx: draft.rx,
    ry: draft.ry,
    rotationDeg: draft.rotationDeg,
    band: draft.band,
    bandThickness: draft.bandThickness,
    frontArcPath: draft.frontArcPath,
    backArcPath: draft.backArcPath,
    hidden: draft.object.properties.hidden === true,
  };
}

function createLeaderLine(draft: LeaderLineDraft): RenderLeaderLine {
  return {
    renderId: `${createRenderId(draft.object.id)}-leader-${draft.mode}`,
    objectId: draft.object.id,
    object: draft.object,
    groupId: draft.groupId,
    x1: draft.x1,
    y1: draft.y1,
    x2: draft.x2,
    y2: draft.y2,
    mode: draft.mode,
    hidden: draft.object.properties.hidden === true,
  };
}

function createSceneLabels(
  objects: RenderSceneObject[],
  sceneHeight: number,
  labelMultiplier: number,
): RenderSceneLabel[] {
  const labels: RenderSceneLabel[] = [];
  const occupied: Array<{ left: number; right: number; top: number; bottom: number }> = [];
  const visibleObjects = [...objects]
    .filter((object) => !object.hidden)
    .sort((left, right) => left.sortKey - right.sortKey);

  for (const object of visibleObjects) {
    const direction = object.y > sceneHeight * 0.62 ? -1 : 1;
    const labelHalfWidth = estimateLabelHalfWidth(object, labelMultiplier);
    let labelY = object.y + direction * (object.radius + 18 * labelMultiplier);
    let secondaryY = labelY + direction * (16 * labelMultiplier);
    let bounds = createLabelRect(object.x, labelY, secondaryY, labelHalfWidth, direction);
    let attempts = 0;

    while (occupied.some((entry) => rectsOverlap(entry, bounds)) && attempts < 10) {
      labelY += direction * 14 * labelMultiplier;
      secondaryY += direction * 14 * labelMultiplier;
      bounds = createLabelRect(object.x, labelY, secondaryY, labelHalfWidth, direction);
      attempts += 1;
    }

    occupied.push(bounds);
    labels.push({
      renderId: `${object.renderId}-label`,
      objectId: object.objectId,
      object: object.object,
      groupId: object.groupId,
      label: object.label,
      secondaryLabel: object.secondaryLabel,
      x: object.x,
      y: labelY,
      secondaryY,
      textAnchor: "middle",
      direction: direction < 0 ? "above" : "below",
      hidden: object.hidden,
    });
  }

  return labels;
}

function createSceneLayers(
  orbitVisuals: RenderOrbitVisual[],
  leaders: RenderLeaderLine[],
  objects: RenderSceneObject[],
  labels: RenderSceneLabel[],
): RenderSceneLayer[] {
  const backOrbitIds = orbitVisuals
    .filter((visual) => !visual.hidden && Boolean(visual.backArcPath))
    .map((visual) => visual.renderId);
  const frontOrbitIds = orbitVisuals
    .filter((visual) => !visual.hidden)
    .map((visual) => visual.renderId);

  return [
    { id: "background", renderIds: ["wo-bg", "wo-bg-glow", "wo-grid"] },
    {
      id: "guides",
      renderIds: leaders.filter((leader) => !leader.hidden).map((leader) => leader.renderId),
    },
    { id: "orbits-back", renderIds: backOrbitIds },
    { id: "orbits-front", renderIds: frontOrbitIds },
    {
      id: "objects",
      renderIds: objects.filter((object) => !object.hidden).map((object) => object.renderId),
    },
    {
      id: "labels",
      renderIds: labels.filter((label) => !label.hidden).map((label) => label.renderId),
    },
    { id: "metadata", renderIds: ["wo-title", "wo-subtitle", "wo-meta"] },
  ];
}

function createSceneGroups(
  objects: RenderSceneObject[],
  orbitVisuals: RenderOrbitVisual[],
  leaders: RenderLeaderLine[],
  labels: RenderSceneLabel[],
  relationships: SceneRelationshipContext,
): RenderSceneGroup[] {
  const groups = new Map<string, RenderSceneGroup>();

  const ensureGroup = (groupId: string | null): RenderSceneGroup | null => {
    if (!groupId) {
      return null;
    }

    const existing = groups.get(groupId);
    if (existing) {
      return existing;
    }

    const rootObjectId = relationships.groupRoots.get(groupId) ?? null;
    const created: RenderSceneGroup = {
      renderId: groupId,
      rootObjectId,
      label: rootObjectId ?? groupId,
      objectIds: [],
      orbitIds: [],
      labelIds: [],
      leaderIds: [],
      contentBounds: createBounds(0, 0, 0, 0),
    };
    groups.set(groupId, created);
    return created;
  };

  for (const object of objects) {
    const group = ensureGroup(object.groupId);
    if (group && !object.hidden) {
      group.objectIds.push(object.objectId);
    }
  }

  for (const orbit of orbitVisuals) {
    const group = ensureGroup(orbit.groupId);
    if (group && !orbit.hidden) {
      group.orbitIds.push(orbit.objectId);
    }
  }

  for (const leader of leaders) {
    const group = ensureGroup(leader.groupId);
    if (group && !leader.hidden) {
      group.leaderIds.push(leader.objectId);
    }
  }

  for (const label of labels) {
    const group = ensureGroup(label.groupId);
    if (group && !label.hidden) {
      group.labelIds.push(label.objectId);
    }
  }

  for (const group of groups.values()) {
    group.contentBounds = calculateGroupBounds(group, objects, orbitVisuals, leaders, labels);
  }

  return [...groups.values()].sort((left, right) => left.label.localeCompare(right.label));
}

function createSceneViewpoints(
  document: WorldOrbitDocument,
  projection: ViewProjection,
  preset: RenderPresetName | null,
  relationships: SceneRelationshipContext,
  objectMap: Map<string, WorldOrbitObject>,
): RenderSceneViewpoint[] {
  const generatedOverview = createGeneratedOverviewViewpoint(document, projection, preset);
  const drafts = new Map<string, ViewpointConfigDraft>();

  for (const [key, value] of Object.entries(document.system?.info ?? {})) {
    if (!key.startsWith("viewpoint.")) {
      continue;
    }

    const [prefix, rawId, ...fieldParts] = key.split(".");
    if (prefix !== "viewpoint" || !rawId || fieldParts.length === 0) {
      continue;
    }

    const id = normalizeViewpointId(rawId);
    if (!id) {
      continue;
    }

    const field = fieldParts.join(".").toLowerCase();
    const draft = drafts.get(id) ?? { id };
    applyViewpointField(
      draft,
      field,
      value,
      projection,
      preset,
      relationships,
      objectMap,
    );
    drafts.set(id, draft);
  }

  const viewpoints = [...drafts.values()]
    .map((draft) => finalizeViewpointDraft(draft, projection, preset, objectMap))
    .filter(Boolean) as RenderSceneViewpoint[];
  const overviewIndex = viewpoints.findIndex((viewpoint) => viewpoint.id === generatedOverview.id);

  if (overviewIndex >= 0) {
    viewpoints.splice(overviewIndex, 1, {
      ...generatedOverview,
      ...viewpoints[overviewIndex],
      layers: {
        ...generatedOverview.layers,
        ...viewpoints[overviewIndex].layers,
      },
      filter: viewpoints[overviewIndex].filter ?? generatedOverview.filter,
      generated: false,
    });
  } else {
    viewpoints.unshift(generatedOverview);
  }

  return viewpoints.sort((left, right) => {
    if (left.id === "overview") return -1;
    if (right.id === "overview") return 1;
    return left.label.localeCompare(right.label);
  });
}

function createGeneratedOverviewViewpoint(
  document: WorldOrbitDocument,
  projection: ViewProjection,
  preset: RenderPresetName | null,
): RenderSceneViewpoint {
  const label = document.system?.properties.title
    ? `${String(document.system.properties.title)} Overview`
    : "Overview";
  return {
    id: "overview",
    label,
    summary: "Fit the whole system with the current atlas defaults.",
    objectId: null,
    selectedObjectId: null,
    projection,
    preset,
    rotationDeg: 0,
    scale: null,
    layers: {},
    filter: null,
    generated: true,
  };
}

function applyViewpointField(
  draft: ViewpointConfigDraft,
  field: string,
  value: string,
  projection: ViewProjection,
  preset: RenderPresetName | null,
  relationships: SceneRelationshipContext,
  objectMap: Map<string, WorldOrbitObject>,
): void {
  const normalizedValue = value.trim();

  switch (field) {
    case "label":
    case "title":
      if (normalizedValue) {
        draft.label = normalizedValue;
      }
      return;
    case "summary":
    case "description":
      if (normalizedValue) {
        draft.summary = normalizedValue;
      }
      return;
    case "focus":
    case "object":
      if (normalizedValue) {
        draft.focus = normalizedValue;
      }
      return;
    case "select":
    case "selection":
      if (normalizedValue) {
        draft.select = normalizedValue;
      }
      return;
    case "projection":
    case "view":
      draft.projection = parseViewProjection(normalizedValue) ?? projection;
      return;
    case "preset":
      draft.preset = parseRenderPreset(normalizedValue) ?? preset;
      return;
    case "rotation":
    case "angle":
      draft.rotationDeg = parseFiniteNumber(normalizedValue) ?? draft.rotationDeg ?? 0;
      return;
    case "zoom":
    case "scale":
      draft.scale = parsePositiveNumber(normalizedValue);
      return;
    case "layers":
      draft.layers = parseViewpointLayers(normalizedValue);
      return;
    case "query":
      draft.filter = {
        ...(draft.filter ?? createEmptyViewpointFilter()),
        query: normalizedValue || null,
      };
      return;
    case "types":
    case "objecttypes":
      draft.filter = {
        ...(draft.filter ?? createEmptyViewpointFilter()),
        objectTypes: parseViewpointObjectTypes(normalizedValue),
      };
      return;
    case "tags":
      draft.filter = {
        ...(draft.filter ?? createEmptyViewpointFilter()),
        tags: splitListValue(normalizedValue),
      };
      return;
    case "groups":
      draft.filter = {
        ...(draft.filter ?? createEmptyViewpointFilter()),
        groupIds: parseViewpointGroups(normalizedValue, relationships, objectMap),
      };
      return;
  }
}

function finalizeViewpointDraft(
  draft: ViewpointConfigDraft,
  projection: ViewProjection,
  preset: RenderPresetName | null,
  objectMap: Map<string, WorldOrbitObject>,
): RenderSceneViewpoint | null {
  const objectId = draft.focus && objectMap.has(draft.focus) ? draft.focus : null;
  const selectedObjectId =
    draft.select && objectMap.has(draft.select)
      ? draft.select
      : objectId;
  const filter = normalizeViewpointFilter(draft.filter);
  const label = draft.label?.trim() || humanizeIdentifier(draft.id);

  return {
    id: draft.id,
    label,
    summary: draft.summary?.trim() || createViewpointSummary(label, objectId, filter),
    objectId,
    selectedObjectId,
    projection: draft.projection ?? projection,
    preset: draft.preset ?? preset,
    rotationDeg: draft.rotationDeg ?? 0,
    scale: draft.scale ?? null,
    layers: draft.layers ?? {},
    filter,
    generated: false,
  };
}

function createEmptyViewpointFilter(): RenderSceneViewpointFilter {
  return {
    query: null,
    objectTypes: [],
    tags: [],
    groupIds: [],
  };
}

function normalizeViewpointFilter(
  filter: RenderSceneViewpointFilter | null | undefined,
): RenderSceneViewpointFilter | null {
  if (!filter) {
    return null;
  }

  const normalized: RenderSceneViewpointFilter = {
    query: filter.query?.trim() || null,
    objectTypes: [...new Set(filter.objectTypes)],
    tags: [...new Set(filter.tags)],
    groupIds: [...new Set(filter.groupIds)],
  };

  return normalized.query ||
    normalized.objectTypes.length > 0 ||
    normalized.tags.length > 0 ||
    normalized.groupIds.length > 0
    ? normalized
    : null;
}

function parseViewProjection(value: string): ViewProjection | null {
  return value.toLowerCase() === "isometric"
    ? "isometric"
    : value.toLowerCase() === "topdown"
      ? "topdown"
      : null;
}

function parseRenderPreset(value: string): RenderPresetName | null {
  const normalized = value.toLowerCase();
  if (
    normalized === "diagram" ||
    normalized === "presentation" ||
    normalized === "atlas-card" ||
    normalized === "markdown"
  ) {
    return normalized;
  }

  return null;
}

function parseFiniteNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePositiveNumber(value: string): number | null {
  const parsed = parseFiniteNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function parseViewpointLayers(
  value: string,
): Partial<Record<RenderSceneLayer["id"], boolean>> {
  const next: Partial<Record<RenderSceneLayer["id"], boolean>> = {};

  for (const token of splitListValue(value)) {
    const enabled = !token.startsWith("-") && !token.startsWith("!");
    const rawLayer = token.replace(/^[-!]+/, "").toLowerCase();

    if (rawLayer === "orbits") {
      next["orbits-back"] = enabled;
      next["orbits-front"] = enabled;
      continue;
    }

    if (
      rawLayer === "background" ||
      rawLayer === "guides" ||
      rawLayer === "orbits-back" ||
      rawLayer === "orbits-front" ||
      rawLayer === "objects" ||
      rawLayer === "labels" ||
      rawLayer === "metadata"
    ) {
      next[rawLayer] = enabled;
    }
  }

  return next;
}

function parseViewpointObjectTypes(
  value: string,
): Array<Exclude<WorldOrbitObject["type"], never>> {
  return splitListValue(value).filter((entry): entry is WorldOrbitObject["type"] =>
    entry === "star" ||
    entry === "planet" ||
    entry === "moon" ||
    entry === "belt" ||
    entry === "asteroid" ||
    entry === "comet" ||
    entry === "ring" ||
    entry === "structure" ||
    entry === "phenomenon",
  );
}

function parseViewpointGroups(
  value: string,
  relationships: SceneRelationshipContext,
  objectMap: Map<string, WorldOrbitObject>,
): string[] {
  return splitListValue(value).map((entry) => {
    if (entry.startsWith("wo-") && entry.endsWith("-group")) {
      return entry;
    }

    if (relationships.groupIds.has(entry)) {
      return relationships.groupIds.get(entry) ?? createGroupId(entry);
    }

    return objectMap.has(entry) ? createGroupId(entry) : createGroupId(entry);
  });
}

function splitListValue(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeViewpointId(value: string): string {
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

function createViewpointSummary(
  label: string,
  objectId: string | null,
  filter: RenderSceneViewpointFilter | null,
): string {
  const parts = [label];

  if (objectId) {
    parts.push(`focus ${objectId}`);
  }

  if (filter?.objectTypes.length) {
    parts.push(filter.objectTypes.join("/"));
  }

  if (filter?.tags.length) {
    parts.push(`tags ${filter.tags.join(", ")}`);
  }

  if (filter?.query) {
    parts.push(`query "${filter.query}"`);
  }

  return parts.join(" - ");
}

function calculateContentBounds(
  width: number,
  height: number,
  objects: RenderSceneObject[],
  orbitVisuals: RenderOrbitVisual[],
  leaders: RenderLeaderLine[],
  labels: RenderSceneLabel[],
): RenderBounds {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  const include = (x: number, y: number): void => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  for (const orbit of orbitVisuals) {
    if (orbit.hidden) continue;
    includeOrbitBounds(orbit, include);
  }

  for (const leader of leaders) {
    if (leader.hidden) continue;
    include(leader.x1, leader.y1);
    include(leader.x2, leader.y2);
  }

  for (const object of objects) {
    if (object.hidden) continue;
    includeObjectBounds(object, include);
  }

  for (const label of labels) {
    if (label.hidden) continue;
    includeLabelBounds(label, include);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return createBounds(0, 0, width, height);
  }

  return createBounds(minX, minY, maxX, maxY);
}

function includeOrbitBounds(
  orbit: RenderOrbitVisual,
  include: (x: number, y: number) => void,
): void {
  const strokePadding =
    orbit.bandThickness !== undefined
      ? orbit.bandThickness / 2 + 4
      : orbit.band
        ? 10
        : 3;

  if (orbit.kind === "circle" && orbit.radius !== undefined) {
    include(orbit.cx - orbit.radius - strokePadding, orbit.cy - orbit.radius - strokePadding);
    include(orbit.cx + orbit.radius + strokePadding, orbit.cy + orbit.radius + strokePadding);
    return;
  }

  const rx = orbit.rx ?? orbit.radius ?? 0;
  const ry = orbit.ry ?? orbit.radius ?? 0;
  const points = sampleEllipseArcPoints(
    orbit.cx,
    orbit.cy,
    rx,
    ry,
    orbit.rotationDeg,
    0,
    Math.PI * 2,
    ARC_SAMPLE_COUNT * 2,
  );

  for (const point of points) {
    include(point.x - strokePadding, point.y - strokePadding);
    include(point.x + strokePadding, point.y + strokePadding);
  }
}

function createBounds(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): RenderBounds {
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: minX + (maxX - minX) / 2,
    centerY: minY + (maxY - minY) / 2,
  };
}

function includeObjectBounds(
  object: RenderSceneObject,
  include: (x: number, y: number) => void,
): void {
  include(
    object.x - object.visualRadius - 24,
    object.y - object.visualRadius - 16,
  );
  include(
    object.x + object.visualRadius + 24,
    object.y + object.visualRadius + 36,
  );
}

function includeLabelBounds(
  label: RenderSceneLabel,
  include: (x: number, y: number) => void,
): void {
  const labelScale = 1;
  const labelHalfWidth = estimateLabelHalfWidthFromText(
    label.label,
    label.secondaryLabel,
    labelScale,
  );

  include(label.x - labelHalfWidth, label.y - 18);
  include(label.x + labelHalfWidth, label.y + 8);
  include(label.x - labelHalfWidth, label.secondaryY - 14);
  include(label.x + labelHalfWidth, label.secondaryY + 8);
}

function placeObject(
  object: WorldOrbitObject,
  x: number,
  y: number,
  depth: number,
  positions: Map<string, PositionedObject>,
  orbitDrafts: OrbitVisualDraft[],
  leaderDrafts: LeaderLineDraft[],
  context: PlacementContext,
): void {
  if (positions.has(object.id)) {
    return;
  }

  positions.set(object.id, {
    object,
    x,
    y,
    radius: visualRadiusFor(object, depth, context.scaleModel),
    sortKey: computeSortKey(x, y, depth),
  });

  placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, context, depth + 1);
}

function placeOrbitingChildren(
  object: WorldOrbitObject,
  positions: Map<string, PositionedObject>,
  orbitDrafts: OrbitVisualDraft[],
  leaderDrafts: LeaderLineDraft[],
  context: PlacementContext,
  depth: number,
): void {
  const parent = positions.get(object.id);
  if (!parent) {
    return;
  }

  const orbiting = [...(context.orbitChildren.get(object.id) ?? [])].sort(compareOrbiting);
  const orbitMetricContext = computeOrbitMetricContext(
    orbiting,
    parent.radius,
    context.spacingFactor,
    context.scaleModel,
  );

  orbiting.forEach((child, index) => {
    const orbitGeometry = resolveOrbitGeometry(
      child,
      index,
      orbiting.length,
      parent,
      orbitMetricContext,
      context,
    );

    orbitDrafts.push({
      object: child,
      parentId: object.id,
      kind: orbitGeometry.kind,
      cx: orbitGeometry.cx,
      cy: orbitGeometry.cy,
      radius: orbitGeometry.radius,
      rx: orbitGeometry.rx,
      ry: orbitGeometry.ry,
      rotationDeg: orbitGeometry.rotationDeg,
      band: orbitGeometry.band,
      bandThickness: orbitGeometry.bandThickness,
      frontArcPath: orbitGeometry.frontArcPath,
      backArcPath: orbitGeometry.backArcPath,
    });

    placeObject(
      child,
      orbitGeometry.objectX,
      orbitGeometry.objectY,
      depth,
      positions,
      orbitDrafts,
      leaderDrafts,
      context,
    );
  });

  const surfaceObjects = [...(context.surfaceChildren.get(object.id) ?? [])];
  surfaceObjects.forEach((child, index) => {
    const angle = angleForIndex(index, surfaceObjects.length, -Math.PI / 3);
    const leaderDistance = 28 * context.spacingFactor;
    const anchorOffset = projectPolarOffset(
      angle,
      parent.radius,
      context.projection,
      context.projection === "isometric" ? 0.9 : 1,
    );
    const bodyOffset = projectPolarOffset(
      angle,
      parent.radius + leaderDistance,
      context.projection,
      context.projection === "isometric" ? 0.9 : 1,
    );
    const anchorX = parent.x + anchorOffset.x;
    const anchorY = parent.y + anchorOffset.y;
    const x = parent.x + bodyOffset.x;
    const y = parent.y + bodyOffset.y;

    positions.set(child.id, {
      object: child,
      x,
      y,
      radius: visualRadiusFor(child, depth + 1, context.scaleModel),
      sortKey: computeSortKey(x, y, depth + 1),
      anchorX,
      anchorY,
    });

    leaderDrafts.push({
      object: child,
      groupId: context.objectMap.has(child.id) ? createGroupId(resolveGroupRootObjectId(child, context.objectMap)) : null,
      x1: anchorX,
      y1: anchorY,
      x2: x,
      y2: y,
      mode: "surface",
    });

    placeOrbitingChildren(child, positions, orbitDrafts, leaderDrafts, context, depth + 1);
  });
}

function compareOrbiting(left: WorldOrbitObject, right: WorldOrbitObject): number {
  const leftMetric = orbitMetric(left);
  const rightMetric = orbitMetric(right);

  if (leftMetric !== null && rightMetric !== null && leftMetric !== rightMetric) {
    return leftMetric - rightMetric;
  }
  if (leftMetric !== null && rightMetric === null) return -1;
  if (leftMetric === null && rightMetric !== null) return 1;
  return left.id.localeCompare(right.id);
}

function computeOrbitMetricContext(
  objects: WorldOrbitObject[],
  parentRadius: number,
  spacingFactor: number,
  scaleModel: RenderScaleModel,
): OrbitMetricContext {
  const metrics = objects.map((object) => orbitMetric(object));
  const presentMetrics = metrics.filter((value): value is number => value !== null);
  const innerPx =
    parentRadius + 56 * spacingFactor * scaleModel.orbitDistanceMultiplier;
  const stepPx =
    (objects.length > 2 ? 54 : 64) * spacingFactor * scaleModel.orbitDistanceMultiplier;

  if (presentMetrics.length === 0) {
    return {
      metrics,
      minMetric: 0,
      maxMetric: 0,
      metricSpread: 0,
      innerPx,
      stepPx,
      pixelSpread: Math.max(stepPx * Math.max(objects.length - 1, 1), stepPx),
    };
  }

  const minMetric = Math.min(...presentMetrics);
  const maxMetric = Math.max(...presentMetrics);
  const metricSpread = maxMetric - minMetric;

  return {
    metrics,
    minMetric,
    maxMetric,
    metricSpread,
    innerPx,
    stepPx,
    pixelSpread: Math.max(stepPx * Math.max(objects.length - 1, 1), stepPx),
  };
}

function resolveOrbitGeometry(
  object: WorldOrbitObject,
  index: number,
  count: number,
  parent: PositionedObject,
  metricContext: OrbitMetricContext,
  context: PlacementContext,
): {
  kind: "circle" | "ellipse";
  cx: number;
  cy: number;
  radius?: number;
  rx?: number;
  ry?: number;
  rotationDeg: number;
  band: boolean;
  bandThickness?: number;
  frontArcPath?: string;
  backArcPath?: string;
  objectX: number;
  objectY: number;
} {
  const placement = object.placement;
  const band = object.type === "belt" || object.type === "ring";
  if (!placement || placement.mode !== "orbit") {
    const fallbackRadius = metricContext.innerPx + index * metricContext.stepPx;
    return {
      kind: "circle",
      cx: parent.x,
      cy: parent.y,
      radius: fallbackRadius,
      rotationDeg: 0,
      band,
      bandThickness: band
        ? 12 * context.scaleModel.ringThicknessMultiplier
        : undefined,
      objectX: parent.x,
      objectY: parent.y - fallbackRadius,
    };
  }

  const eccentricity = clampNumber(
    typeof placement.eccentricity === "number" ? placement.eccentricity : 0,
    0,
    0.92,
  );
  const semiMajor = resolveOrbitRadiusPx(object, index, metricContext);
  const baseMinor = Math.max(
    semiMajor * Math.sqrt(1 - eccentricity * eccentricity),
    semiMajor * 0.18,
  );
  const inclinationDeg = unitValueToDegrees(placement.inclination) ?? 0;
  const inclinationScale =
    context.projection === "isometric"
      ? Math.max(MIN_ISO_MINOR_SCALE, Math.cos(degreesToRadians(inclinationDeg))) *
        ISO_FLATTENING
      : 1;
  const semiMinor = Math.max(baseMinor * inclinationScale, semiMajor * 0.14);
  const rotationDeg = unitValueToDegrees(placement.angle) ?? 0;
  const focusOffset = semiMajor * eccentricity;
  const centerOffset = rotateOffset(-focusOffset, 0, rotationDeg);
  const cx = parent.x + centerOffset.x;
  const cy = parent.y + centerOffset.y;
  const phase = resolveOrbitPhase(placement.phase, index, count);
  const objectPoint = ellipsePoint(cx, cy, semiMajor, semiMinor, rotationDeg, phase);
  const useCircle =
    context.projection === "topdown" &&
    eccentricity <= 0.0001 &&
    Math.abs(rotationDeg) <= 0.0001;
  const bandThickness = band
    ? resolveBandThickness(object, semiMajor, metricContext, context.scaleModel)
    : undefined;

  return {
    kind: useCircle ? "circle" : "ellipse",
    cx: useCircle ? parent.x : cx,
    cy: useCircle ? parent.y : cy,
    radius: useCircle ? semiMajor : undefined,
    rx: useCircle ? undefined : semiMajor,
    ry: useCircle ? undefined : semiMinor,
    rotationDeg,
    band,
    bandThickness,
    frontArcPath:
      context.projection === "isometric" || band
        ? buildEllipseArcPath(cx, cy, semiMajor, semiMinor, rotationDeg, 0, Math.PI)
        : undefined,
    backArcPath:
      context.projection === "isometric" || band
        ? buildEllipseArcPath(cx, cy, semiMajor, semiMinor, rotationDeg, Math.PI, Math.PI * 2)
        : undefined,
    objectX: objectPoint.x,
    objectY: objectPoint.y,
  };
}

function resolveOrbitRadiusPx(
  object: WorldOrbitObject,
  index: number,
  metricContext: OrbitMetricContext,
): number {
  const metric = orbitMetric(object);
  if (metric === null) {
    return metricContext.innerPx + index * metricContext.stepPx;
  }

  if (metricContext.metricSpread > 0) {
    return (
      metricContext.innerPx +
      ((metric - metricContext.minMetric) / metricContext.metricSpread) *
        metricContext.pixelSpread
    );
  }

  return metricContext.innerPx + Math.log10(metric + 1) * metricContext.stepPx;
}

function orbitMetric(object: WorldOrbitObject): number | null {
  if (!object.placement || object.placement.mode !== "orbit") {
    return null;
  }

  return toDistanceMetric(object.placement.semiMajor ?? object.placement.distance ?? null);
}

function resolveOrbitPhase(
  phase: UnitValue | undefined,
  index: number,
  count: number,
): number {
  const degreeValue = phase ? unitValueToDegrees(phase) : null;
  if (degreeValue !== null) {
    return degreesToRadians(degreeValue - 90);
  }

  return angleForIndex(index, count, -Math.PI / 2);
}

function resolveBandThickness(
  object: WorldOrbitObject,
  orbitRadius: number,
  metricContext: OrbitMetricContext,
  scaleModel: RenderScaleModel,
): number {
  const innerMetric = toDistanceMetric(toUnitValue(object.properties.inner));
  const outerMetric = toDistanceMetric(toUnitValue(object.properties.outer));
  if (innerMetric !== null && outerMetric !== null) {
    const thicknessMetric = Math.abs(outerMetric - innerMetric);
    if (metricContext.metricSpread > 0) {
      return clampNumber(
        (thicknessMetric / metricContext.metricSpread) *
          metricContext.pixelSpread *
          scaleModel.ringThicknessMultiplier,
        8,
        54,
      );
    }
    const referenceMetric = Math.max(Math.max(innerMetric, outerMetric), 0.0001);
    return clampNumber(
      (thicknessMetric / referenceMetric) *
        orbitRadius *
        0.75 *
        scaleModel.ringThicknessMultiplier,
      8,
      48,
    );
  }

  const fallbackBase = object.type === "belt" ? 18 : 12;
  return fallbackBase * scaleModel.ringThicknessMultiplier;
}

function resolveAtPosition(
  reference: AtReference,
  positions: Map<string, PositionedObject>,
  objectMap: Map<string, WorldOrbitObject>,
  index: number,
  count: number,
  width: number,
  height: number,
  padding: number,
  context: PlacementContext,
): { x: number; y: number; anchorX?: number; anchorY?: number } {
  if (reference.kind === "lagrange") {
    return resolveLagrangePosition(reference, positions, objectMap, width, height);
  }

  if (reference.kind === "anchor") {
    const anchor = positions.get(reference.objectId);
    if (anchor) {
      const angle = angleForIndex(index, count, Math.PI / 5);
      const distance = (anchor.radius + 36) * context.scaleModel.labelMultiplier;
      const offset = projectPolarOffset(
        angle,
        distance,
        context.projection,
        context.projection === "isometric" ? 0.92 : 1,
      );
      return {
        x: anchor.x + offset.x,
        y: anchor.y + offset.y,
        anchorX: anchor.x,
        anchorY: anchor.y,
      };
    }
  }

  if (reference.kind === "named") {
    const anchor = positions.get(reference.name);
    if (anchor) {
      const angle = angleForIndex(index, count, Math.PI / 6);
      const distance = (anchor.radius + 36) * context.scaleModel.labelMultiplier;
      const offset = projectPolarOffset(
        angle,
        distance,
        context.projection,
        context.projection === "isometric" ? 0.92 : 1,
      );
      return {
        x: anchor.x + offset.x,
        y: anchor.y + offset.y,
        anchorX: anchor.x,
        anchorY: anchor.y,
      };
    }
  }

  return {
    x: width - padding - 170,
    y:
      height -
      padding -
      86 -
      index * 58 * context.scaleModel.freePlacementMultiplier,
  };
}

function resolveLagrangePosition(
  reference: Extract<AtReference, { kind: "lagrange" }>,
  positions: Map<string, PositionedObject>,
  objectMap: Map<string, WorldOrbitObject>,
  width: number,
  height: number,
): { x: number; y: number; anchorX?: number; anchorY?: number } {
  const primary = reference.secondary
    ? positions.get(reference.primary)
    : deriveParentAnchor(reference.primary, positions, objectMap);
  const secondary = positions.get(reference.secondary ?? reference.primary);

  if (!primary || !secondary) {
    return {
      x: width * 0.7,
      y: height * 0.25,
    };
  }

  const dx = secondary.x - primary.x;
  const dy = secondary.y - primary.y;
  const distance = Math.hypot(dx, dy) || 1;
  const ux = dx / distance;
  const uy = dy / distance;
  const nx = -uy;
  const ny = ux;
  const offset = clampNumber(distance * 0.25, 24, 68);

  switch (reference.point) {
    case "L1":
      return {
        x: secondary.x - ux * offset,
        y: secondary.y - uy * offset,
        anchorX: secondary.x,
        anchorY: secondary.y,
      };
    case "L2":
      return {
        x: secondary.x + ux * offset,
        y: secondary.y + uy * offset,
        anchorX: secondary.x,
        anchorY: secondary.y,
      };
    case "L3":
      return {
        x: primary.x - ux * offset,
        y: primary.y - uy * offset,
        anchorX: primary.x,
        anchorY: primary.y,
      };
    case "L4":
      return {
        x: secondary.x + (ux * 0.5 - nx * 0.8660254) * offset,
        y: secondary.y + (uy * 0.5 - ny * 0.8660254) * offset,
        anchorX: secondary.x,
        anchorY: secondary.y,
      };
    case "L5":
      return {
        x: secondary.x + (ux * 0.5 + nx * 0.8660254) * offset,
        y: secondary.y + (uy * 0.5 + ny * 0.8660254) * offset,
        anchorX: secondary.x,
        anchorY: secondary.y,
      };
  }
}

function buildSceneRelationships(
  objects: WorldOrbitObject[],
  objectMap: Map<string, WorldOrbitObject>,
): SceneRelationshipContext {
  const parentIds = new Map<string, string | null>();
  const childIds = new Map<string, string[]>();

  for (const object of objects) {
    const parentId = resolveParentId(object, objectMap);
    parentIds.set(object.id, parentId);
    if (parentId) {
      const existing = childIds.get(parentId);
      if (existing) {
        existing.push(object.id);
      } else {
        childIds.set(parentId, [object.id]);
      }
    }
    if (!childIds.has(object.id)) {
      childIds.set(object.id, []);
    }
  }

  const ancestorIds = new Map<string, string[]>();
  const groupIds = new Map<string, string>();
  const groupRoots = new Map<string, string | null>();

  const buildAncestors = (objectId: string): string[] => {
    const cached = ancestorIds.get(objectId);
    if (cached) {
      return cached;
    }

    const seen = new Set<string>();
    const results: string[] = [];
    let cursor = parentIds.get(objectId) ?? null;

    while (cursor && !seen.has(cursor)) {
      results.push(cursor);
      seen.add(cursor);
      cursor = parentIds.get(cursor) ?? null;
    }

    ancestorIds.set(objectId, results);
    return results;
  };

  const resolveGroupRootObjectId = (objectId: string): string => {
    const cached = groupRoots.get(groupIds.get(objectId) ?? "");
    if (cached) {
      return cached;
    }

    const parentId = parentIds.get(objectId) ?? null;
    const object = objectMap.get(objectId);
    let rootObjectId = objectId;

    if (object?.placement && object.placement.mode !== "free" && parentId) {
      rootObjectId = resolveGroupRootObjectId(parentId);
    }

    return rootObjectId;
  };

  for (const object of objects) {
    buildAncestors(object.id);
    const rootObjectId = resolveGroupRootObjectId(object.id);
    const groupId = createGroupId(rootObjectId);
    groupIds.set(object.id, groupId);
    groupRoots.set(groupId, rootObjectId);
  }

  return {
    parentIds,
    childIds,
    ancestorIds,
    groupIds,
    groupRoots,
  };
}

function resolveParentId(
  object: WorldOrbitObject,
  objectMap: Map<string, WorldOrbitObject>,
): string | null {
  const placement = object.placement;
  if (!placement) {
    return null;
  }

  switch (placement.mode) {
    case "orbit":
    case "surface":
      return objectMap.has(placement.target) ? placement.target : null;
    case "at":
      switch (placement.reference.kind) {
        case "anchor":
          return objectMap.has(placement.reference.objectId) ? placement.reference.objectId : null;
        case "named":
          return objectMap.has(placement.reference.name) ? placement.reference.name : null;
        case "lagrange":
          if (placement.reference.secondary && objectMap.has(placement.reference.secondary)) {
            return placement.reference.secondary;
          }
          return objectMap.has(placement.reference.primary) ? placement.reference.primary : null;
      }
    case "free":
      return null;
  }
}

function calculateGroupBounds(
  group: RenderSceneGroup,
  objects: RenderSceneObject[],
  orbitVisuals: RenderOrbitVisual[],
  leaders: RenderLeaderLine[],
  labels: RenderSceneLabel[],
): RenderBounds {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  const include = (x: number, y: number): void => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  for (const object of objects) {
    if (!object.hidden && group.objectIds.includes(object.objectId)) {
      includeObjectBounds(object, include);
    }
  }

  for (const orbit of orbitVisuals) {
    if (!orbit.hidden && group.orbitIds.includes(orbit.objectId)) {
      includeOrbitBounds(orbit, include);
    }
  }

  for (const leader of leaders) {
    if (!leader.hidden && group.leaderIds.includes(leader.objectId)) {
      include(leader.x1, leader.y1);
      include(leader.x2, leader.y2);
    }
  }

  for (const label of labels) {
    if (!label.hidden && group.labelIds.includes(label.objectId)) {
      includeLabelBounds(label, include);
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return createBounds(0, 0, 0, 0);
  }

  return createBounds(minX, minY, maxX, maxY);
}

function resolveGroupRootObjectId(
  object: WorldOrbitObject,
  objectMap: Map<string, WorldOrbitObject>,
): string {
  let current = object;
  const seen = new Set<string>();

  while (current.placement && current.placement.mode !== "free" && !seen.has(current.id)) {
    seen.add(current.id);
    const parentId = resolveParentId(current, objectMap);
    if (!parentId) {
      break;
    }
    const parent = objectMap.get(parentId);
    if (!parent) {
      break;
    }
    current = parent;
  }

  return current.id;
}

function createLabelRect(
  x: number,
  labelY: number,
  secondaryY: number,
  labelHalfWidth: number,
  direction: number,
): { left: number; right: number; top: number; bottom: number } {
  return {
    left: x - labelHalfWidth,
    right: x + labelHalfWidth,
    top: Math.min(labelY, secondaryY) - (direction < 0 ? 18 : 12),
    bottom: Math.max(labelY, secondaryY) + (direction < 0 ? 8 : 12),
  };
}

function rectsOverlap(
  left: { left: number; right: number; top: number; bottom: number },
  right: { left: number; right: number; top: number; bottom: number },
): boolean {
  return !(
    left.right < right.left ||
    right.right < left.left ||
    left.bottom < right.top ||
    right.bottom < left.top
  );
}

function deriveParentAnchor(
  objectId: string,
  positions: Map<string, PositionedObject>,
  objectMap: Map<string, WorldOrbitObject>,
): PositionedObject | undefined {
  const object = objectMap.get(objectId);
  if (!object?.placement || object.placement.mode !== "orbit") {
    return positions.get(objectId);
  }

  return positions.get(object.placement.target);
}

function visualRadiusFor(
  object: WorldOrbitObject,
  depth: number,
  scaleModel: RenderScaleModel,
): number {
  const explicitRadius = toVisualSizeMetric(object.properties.radius, scaleModel);
  if (explicitRadius !== null) {
    return explicitRadius;
  }

  const multiplier = scaleModel.bodyRadiusMultiplier;
  switch (object.type) {
    case "star":
      return clampNumber(
        (depth === 0 ? 28 : 20) * multiplier,
        scaleModel.minBodyRadius,
        scaleModel.maxBodyRadius,
      );
    case "planet":
      return clampNumber(12 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
    case "moon":
      return clampNumber(7 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
    case "belt":
      return clampNumber(5 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
    case "asteroid":
      return clampNumber(5 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
    case "comet":
      return clampNumber(6 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
    case "ring":
      return clampNumber(5 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
    case "structure":
      return clampNumber(6 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
    case "phenomenon":
      return clampNumber(8 * multiplier, scaleModel.minBodyRadius, scaleModel.maxBodyRadius);
  }
}

function visualExtentForObject(
  object: WorldOrbitObject,
  radius: number,
  scaleModel: RenderScaleModel,
): number {
  const atmosphereBoost = typeof object.properties.atmosphere === "string" ? 4 : 0;
  switch (object.type) {
    case "star":
      return radius * 2.4;
    case "phenomenon":
      return radius * 1.25;
    case "structure":
      return radius + 2;
    default:
      return Math.min(radius + atmosphereBoost, scaleModel.maxBodyRadius + 10);
  }
}

function toDistanceMetric(value: UnitValue | null): number | null {
  if (!value) return null;

  switch (value.unit) {
    case "au":
      return value.value;
    case "km":
      return value.value / AU_IN_KM;
    case "m":
      return (value.value / 1_000) / AU_IN_KM;
    case "ly":
      return value.value * LY_IN_AU;
    case "pc":
      return value.value * PC_IN_AU;
    case "kpc":
      return value.value * KPC_IN_AU;
    case "re":
      return (value.value * EARTH_RADIUS_IN_KM) / AU_IN_KM;
    case "rj":
      return (value.value * JUPITER_RADIUS_IN_KM) / AU_IN_KM;
    case "sol":
      return (value.value * SOLAR_RADIUS_IN_KM) / AU_IN_KM;
    default:
      // Unitless or non-distance units (me, mj, s, min, h, d, y, ky, my, gy, K, deg):
      // return raw value — renderer treats it as an abstract metric
      return value.value;
  }
}

function freePlacementOffsetPx(
  distance: UnitValue | undefined,
  scaleModel: RenderScaleModel,
): number {
  const metric = toDistanceMetric(distance ?? null);
  if (metric === null || metric <= 0) {
    return 0;
  }

  return clampNumber(metric * 96 * scaleModel.freePlacementMultiplier, 0, 420);
}

function toVisualSizeMetric(
  value: NormalizedValue | undefined,
  scaleModel: RenderScaleModel,
): number | null {
  const unitValue = toUnitValue(value);
  if (!unitValue) {
    return null;
  }

  let size: number;
  switch (unitValue.unit) {
    case "sol":
      size = clampNumber(unitValue.value * 22, 14, 40);
      break;
    case "re":
      size = clampNumber(unitValue.value * 10, 6, 18);
      break;
    case "km":
      size = clampNumber(Math.log10(Math.max(unitValue.value, 1)) * 2.6, 4, 16);
      break;
    default:
      size = clampNumber(unitValue.value * 4, 4, 20);
      break;
  }

  return clampNumber(
    size * scaleModel.bodyRadiusMultiplier,
    scaleModel.minBodyRadius,
    scaleModel.maxBodyRadius,
  );
}

function toUnitValue(value: NormalizedValue | undefined): UnitValue | null {
  if (!value || typeof value !== "object" || !("value" in value)) {
    return null;
  }

  return value as UnitValue;
}

function unitValueToDegrees(value: UnitValue | undefined): number | null {
  if (!value) {
    return null;
  }
  return value.unit === "deg" || value.unit === null ? value.value : null;
}

function angleForIndex(index: number, count: number, startAngle: number): number {
  if (count <= 1) return startAngle;
  return startAngle + (index * Math.PI * 2) / count;
}

function buildEllipseArcPath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotationDeg: number,
  start: number,
  end: number,
): string {
  const points = sampleEllipseArcPoints(cx, cy, rx, ry, rotationDeg, start, end, ARC_SAMPLE_COUNT);
  if (points.length === 0) {
    return "";
  }

  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${formatNumber(point.x)} ${formatNumber(point.y)}`,
    )
    .join(" ");
}

function sampleEllipseArcPoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotationDeg: number,
  start: number,
  end: number,
  segments: number,
): CoordinatePoint[] {
  const points: CoordinatePoint[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const t = start + ((end - start) * index) / segments;
    points.push(ellipsePoint(cx, cy, rx, ry, rotationDeg, t));
  }
  return points;
}

function ellipsePoint(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotationDeg: number,
  angle: number,
): CoordinatePoint {
  const localX = rx * Math.cos(angle);
  const localY = ry * Math.sin(angle);
  const rotated = rotateOffset(localX, localY, rotationDeg);
  return {
    x: cx + rotated.x,
    y: cy + rotated.y,
  };
}

function rotateOffset(x: number, y: number, rotationDeg: number): CoordinatePoint {
  const radians = degreesToRadians(rotationDeg);
  return {
    x: x * Math.cos(radians) - y * Math.sin(radians),
    y: x * Math.sin(radians) + y * Math.cos(radians),
  };
}

function projectPolarOffset(
  angle: number,
  distance: number,
  projection: ViewProjection,
  verticalFactor: number,
): CoordinatePoint {
  const yScale = projection === "isometric" ? ISO_FLATTENING * verticalFactor : verticalFactor;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance * yScale,
  };
}

function computeSortKey(x: number, y: number, depth: number): number {
  return y * 1_000 + x + depth * 0.01;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function pushGrouped(
  map: Map<string, WorldOrbitObject[]>,
  key: string,
  value: WorldOrbitObject,
): void {
  const existing = map.get(key);
  if (existing) {
    existing.push(value);
  } else {
    map.set(key, [value]);
  }
}

function createRenderId(objectId: string): string {
  const normalized =
    objectId
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "object";

  return `wo-${normalized}`;
}

function createGroupId(objectId: string): string {
  return `${createRenderId(objectId)}-group`;
}

function customColorFor(value: NormalizedValue | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function estimateLabelHalfWidth(object: RenderSceneObject, labelMultiplier: number): number {
  const primaryWidth = object.label.length * 4.6 * labelMultiplier + 18;
  const secondaryWidth = object.secondaryLabel.length * 3.9 * labelMultiplier + 18;
  return Math.max(primaryWidth, secondaryWidth, object.visualRadius + 18);
}

function estimateLabelHalfWidthFromText(
  label: string,
  secondaryLabel: string,
  labelMultiplier: number,
): number {
  const primaryWidth = label.length * 4.6 * labelMultiplier + 18;
  const secondaryWidth = secondaryLabel.length * 3.9 * labelMultiplier + 18;
  return Math.max(primaryWidth, secondaryWidth, 24);
}

function capitalizeLabel(value: string): string {
  return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
