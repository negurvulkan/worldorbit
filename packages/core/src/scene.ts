import type {
  AtReference,
  CoordinatePoint,
  NormalizedValue,
  RenderBounds,
  RenderLeaderLine,
  RenderOrbitVisual,
  RenderScene,
  RenderSceneObject,
  SceneLayoutPreset,
  SceneRenderOptions,
  UnitValue,
  WorldOrbitDocument,
  WorldOrbitObject,
} from "./types.js";

interface PositionedObject {
  object: WorldOrbitObject;
  x: number;
  y: number;
  radius: number;
  anchorX?: number;
  anchorY?: number;
}

interface OrbitVisualDraft {
  object: WorldOrbitObject;
  parentId: string;
  cx: number;
  cy: number;
  radius: number;
}

interface LeaderLineDraft {
  object: WorldOrbitObject;
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
}

const AU_IN_KM = 149_597_870.7;
const EARTH_RADIUS_IN_KM = 6_371;
const SOLAR_RADIUS_IN_KM = 695_700;

export function renderDocumentToScene(
  document: WorldOrbitDocument,
  options: SceneRenderOptions = {},
): RenderScene {
  const width = options.width ?? 1200;
  const height = options.height ?? 780;
  const padding = options.padding ?? 72;
  const layoutPreset = resolveLayoutPreset(document);
  const spacingFactor = layoutPresetSpacing(layoutPreset);
  const viewMode = String(document.system?.properties.view ?? "topdown");
  const systemId = document.system?.id ?? null;

  const objectMap = new Map(document.objects.map((object) => [object.id, object]));
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
  };
  const primaryRoot =
    rootObjects.find((object) => object.type === "star") ?? rootObjects[0] ?? null;

  if (primaryRoot) {
    placeObject(primaryRoot, centerX, centerY, 0, positions, orbitDrafts, leaderDrafts, context);
  }

  const secondaryRoots = rootObjects.filter((object) => object.id !== primaryRoot?.id);
  if (secondaryRoots.length > 0) {
    const rootRingRadius = Math.min(width, height) * 0.28 * spacingFactor;

    secondaryRoots.forEach((object, index) => {
      const angle = angleForIndex(index, secondaryRoots.length, -Math.PI / 2);
      placeObject(
        object,
        centerX + Math.cos(angle) * rootRingRadius,
        centerY + Math.sin(angle) * rootRingRadius,
        0,
        positions,
        orbitDrafts,
        leaderDrafts,
        context,
      );
    });
  }

  freeObjects.forEach((object, index) => {
    const x = width - padding - 130;
    const y =
      padding +
      90 +
      index *
        Math.max(
          70,
          ((height - padding * 2 - 180) / Math.max(1, freeObjects.length)) * spacingFactor,
        );

    positions.set(object.id, {
      object,
      x,
      y,
      radius: visualRadiusFor(object),
    });

    leaderDrafts.push({
      object,
      x1: x - 60,
      y1: y,
      x2: x - 18,
      y2: y,
      mode: "free",
    });

    placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, context);
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
      spacingFactor,
    );

    positions.set(object.id, {
      object,
      x: resolved.x,
      y: resolved.y,
      radius: visualRadiusFor(object),
      anchorX: resolved.anchorX,
      anchorY: resolved.anchorY,
    });

    if (resolved.anchorX !== undefined && resolved.anchorY !== undefined) {
      leaderDrafts.push({
        object,
        x1: resolved.anchorX,
        y1: resolved.anchorY,
        x2: resolved.x,
        y2: resolved.y,
        mode: "at",
      });
    }

    placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, context);
  });

  const objects = [...positions.values()].map((position) => createSceneObject(position));
  const orbitVisuals = orbitDrafts.map((draft) => createOrbitVisual(draft));
  const leaders = leaderDrafts.map((draft) => createLeaderLine(draft));
  const contentBounds = calculateContentBounds(width, height, objects, orbitVisuals, leaders);

  return {
    width,
    height,
    padding,
    title:
      String(document.system?.properties.title ?? document.system?.id ?? "WorldOrbit") ||
      "WorldOrbit",
    subtitle: `${capitalizeLabel(viewMode)} view - ${capitalizeLabel(layoutPreset)} layout`,
    systemId,
    viewMode,
    layoutPreset,
    metadata: {
      format: document.format,
      version: document.version,
      view: viewMode,
      scale: String(document.system?.properties.scale ?? layoutPreset),
      units: String(document.system?.properties.units ?? "mixed"),
    },
    contentBounds,
    objects,
    orbitVisuals,
    leaders,
  };
}

export function rotatePoint(
  point: CoordinatePoint,
  center: CoordinatePoint,
  rotationDeg: number,
): CoordinatePoint {
  const radians = (rotationDeg * Math.PI) / 180;
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

function layoutPresetSpacing(layoutPreset: SceneLayoutPreset): number {
  switch (layoutPreset) {
    case "compact":
      return 0.8;
    case "presentation":
      return 1.22;
    default:
      return 1;
  }
}

function createSceneObject(position: PositionedObject): RenderSceneObject {
  const { object, x, y, radius, anchorX, anchorY } = position;
  return {
    renderId: createRenderId(object.id),
    objectId: object.id,
    object,
    x,
    y,
    radius,
    visualRadius: visualExtentForObject(object, radius),
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

function createOrbitVisual(draft: OrbitVisualDraft): RenderOrbitVisual {
  return {
    renderId: `${createRenderId(draft.object.id)}-orbit`,
    objectId: draft.object.id,
    object: draft.object,
    parentId: draft.parentId,
    cx: draft.cx,
    cy: draft.cy,
    radius: draft.radius,
    band: draft.object.type === "belt" || draft.object.type === "ring",
    hidden: draft.object.properties.hidden === true,
  };
}

function createLeaderLine(draft: LeaderLineDraft): RenderLeaderLine {
  return {
    renderId: `${createRenderId(draft.object.id)}-leader-${draft.mode}`,
    objectId: draft.object.id,
    object: draft.object,
    x1: draft.x1,
    y1: draft.y1,
    x2: draft.x2,
    y2: draft.y2,
    mode: draft.mode,
    hidden: draft.object.properties.hidden === true,
  };
}

function calculateContentBounds(
  width: number,
  height: number,
  objects: RenderSceneObject[],
  orbitVisuals: RenderOrbitVisual[],
  leaders: RenderLeaderLine[],
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
    const strokePadding = orbit.band ? 6 : 2;
    include(orbit.cx - orbit.radius - strokePadding, orbit.cy - orbit.radius - strokePadding);
    include(orbit.cx + orbit.radius + strokePadding, orbit.cy + orbit.radius + strokePadding);
  }

  for (const leader of leaders) {
    if (leader.hidden) continue;
    include(leader.x1, leader.y1);
    include(leader.x2, leader.y2);
  }

  for (const object of objects) {
    if (object.hidden) continue;
    includeObjectBounds(object, height, include);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return createBounds(0, 0, width, height);
  }

  return createBounds(minX, minY, maxX, maxY);
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
  sceneHeight: number,
  include: (x: number, y: number) => void,
): void {
  const labelDirection = object.y > sceneHeight * 0.62 ? -1 : 1;
  const labelY = object.y + labelDirection * (object.radius + 18);
  const secondaryY = labelY + labelDirection * 15;
  const labelHalfWidth = estimateLabelHalfWidth(object);

  include(
    object.x - Math.max(object.visualRadius + 24, labelHalfWidth),
    object.y - object.visualRadius - 12,
  );
  include(
    object.x + Math.max(object.visualRadius + 24, labelHalfWidth),
    object.y + object.visualRadius + 34,
  );

  include(object.x - labelHalfWidth, labelY - 16);
  include(object.x + labelHalfWidth, labelY + 6);
  include(object.x - labelHalfWidth, secondaryY - 12);
  include(object.x + labelHalfWidth, secondaryY + 6);
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
    radius: visualRadiusFor(object, depth),
  });

  placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, context);
}

function placeOrbitingChildren(
  object: WorldOrbitObject,
  positions: Map<string, PositionedObject>,
  orbitDrafts: OrbitVisualDraft[],
  leaderDrafts: LeaderLineDraft[],
  context: PlacementContext,
): void {
  const parent = positions.get(object.id);
  if (!parent) {
    return;
  }

  const orbiting = [...(context.orbitChildren.get(object.id) ?? [])].sort(compareOrbiting);
  const orbitRadii = computeOrbitRadii(orbiting, parent.radius, context.spacingFactor);

  orbiting.forEach((child, index) => {
    const angle = resolveOrbitAngle(child, index, orbiting.length);
    const orbitRadius = orbitRadii[index];
    const x = parent.x + Math.cos(angle) * orbitRadius;
    const y = parent.y + Math.sin(angle) * orbitRadius;

    orbitDrafts.push({
      object: child,
      parentId: object.id,
      cx: parent.x,
      cy: parent.y,
      radius: orbitRadius,
    });

    placeObject(child, x, y, 1, positions, orbitDrafts, leaderDrafts, context);
  });

  const surfaceObjects = [...(context.surfaceChildren.get(object.id) ?? [])];
  surfaceObjects.forEach((child, index) => {
    const angle = angleForIndex(index, surfaceObjects.length, -Math.PI / 3);
    const offset = 28 * context.spacingFactor;
    const anchorX = parent.x + Math.cos(angle) * parent.radius;
    const anchorY = parent.y + Math.sin(angle) * parent.radius;
    const x = parent.x + Math.cos(angle) * (parent.radius + offset);
    const y = parent.y + Math.sin(angle) * (parent.radius + offset);

    positions.set(child.id, {
      object: child,
      x,
      y,
      radius: visualRadiusFor(child, 2),
      anchorX,
      anchorY,
    });

    leaderDrafts.push({
      object: child,
      x1: anchorX,
      y1: anchorY,
      x2: x,
      y2: y,
      mode: "surface",
    });

    placeOrbitingChildren(child, positions, orbitDrafts, leaderDrafts, context);
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

function computeOrbitRadii(
  objects: WorldOrbitObject[],
  parentRadius: number,
  spacingFactor: number,
): number[] {
  if (objects.length === 0) {
    return [];
  }

  const metrics = objects.map((object) => orbitMetric(object));
  const presentMetrics = metrics.filter((value): value is number => value !== null);
  const inner = parentRadius + 54 * spacingFactor;
  const step = (objects.length > 2 ? 54 : 64) * spacingFactor;

  if (presentMetrics.length >= 2) {
    const minMetric = Math.min(...presentMetrics);
    const maxMetric = Math.max(...presentMetrics);
    const spread = maxMetric - minMetric || 1;

    return objects.map((_, index) => {
      const metric = metrics[index];
      if (metric === null) {
        return inner + index * step;
      }

      const normalized = (metric - minMetric) / spread;
      return inner + normalized * Math.max(step * (objects.length - 1), step);
    });
  }

  return objects.map((_, index) => inner + index * step);
}

function orbitMetric(object: WorldOrbitObject): number | null {
  if (!object.placement || object.placement.mode !== "orbit") {
    return null;
  }

  return toDistanceMetric(object.placement.semiMajor ?? object.placement.distance ?? null);
}

function resolveOrbitAngle(
  object: WorldOrbitObject,
  index: number,
  count: number,
): number {
  if (!object.placement || object.placement.mode !== "orbit") {
    return angleForIndex(index, count, -Math.PI / 2);
  }

  const directAngle = object.placement.phase ?? object.placement.angle;
  const degreeValue = directAngle ? unitValueToDegrees(directAngle) : null;
  if (degreeValue !== null) {
    return (degreeValue - 90) * (Math.PI / 180);
  }

  return angleForIndex(index, count, -Math.PI / 2);
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
  spacingFactor: number,
): { x: number; y: number; anchorX?: number; anchorY?: number } {
  if (reference.kind === "lagrange") {
    return resolveLagrangePosition(reference, positions, objectMap, width, height);
  }

  if (reference.kind === "anchor") {
    const anchor = positions.get(reference.objectId);
    if (anchor) {
      const angle = angleForIndex(index, count, Math.PI / 5);
      const distance = (anchor.radius + 34) * spacingFactor;
      return {
        x: anchor.x + Math.cos(angle) * distance,
        y: anchor.y + Math.sin(angle) * distance,
        anchorX: anchor.x,
        anchorY: anchor.y,
      };
    }
  }

  if (reference.kind === "named") {
    const anchor = positions.get(reference.name);
    if (anchor) {
      const angle = angleForIndex(index, count, Math.PI / 6);
      const distance = (anchor.radius + 34) * spacingFactor;
      return {
        x: anchor.x + Math.cos(angle) * distance,
        y: anchor.y + Math.sin(angle) * distance,
        anchorX: anchor.x,
        anchorY: anchor.y,
      };
    }
  }

  return {
    x: width - padding - 160,
    y: height - padding - 80 - index * 56,
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
  const offset = clamp(distance * 0.25, 24, 64);

  switch (reference.point) {
    case "L1":
      return { x: secondary.x - ux * offset, y: secondary.y - uy * offset, anchorX: secondary.x, anchorY: secondary.y };
    case "L2":
      return { x: secondary.x + ux * offset, y: secondary.y + uy * offset, anchorX: secondary.x, anchorY: secondary.y };
    case "L3":
      return { x: primary.x - ux * offset, y: primary.y - uy * offset, anchorX: primary.x, anchorY: primary.y };
    case "L4":
      return { x: secondary.x + (ux * 0.5 - nx * 0.8660254) * offset, y: secondary.y + (uy * 0.5 - ny * 0.8660254) * offset, anchorX: secondary.x, anchorY: secondary.y };
    case "L5":
      return { x: secondary.x + (ux * 0.5 + nx * 0.8660254) * offset, y: secondary.y + (uy * 0.5 + ny * 0.8660254) * offset, anchorX: secondary.x, anchorY: secondary.y };
  }
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

function visualRadiusFor(object: WorldOrbitObject, depth = 0): number {
  const explicitRadius = toVisualSizeMetric(object.properties.radius);
  if (explicitRadius !== null) {
    return explicitRadius;
  }

  switch (object.type) {
    case "star":
      return depth === 0 ? 28 : 20;
    case "planet":
      return 12;
    case "moon":
      return 7;
    case "belt":
      return 5;
    case "asteroid":
      return 5;
    case "comet":
      return 6;
    case "ring":
      return 5;
    case "structure":
      return 6;
    case "phenomenon":
      return 8;
  }
}

function visualExtentForObject(object: WorldOrbitObject, radius: number): number {
  switch (object.type) {
    case "star":
      return radius * 2.4;
    case "phenomenon":
      return radius * 1.2;
    case "structure":
      return radius + 2;
    default:
      return radius;
  }
}

function toDistanceMetric(value: UnitValue | null): number | null {
  if (!value) return null;

  switch (value.unit) {
    case "au":
      return value.value;
    case "km":
      return value.value / AU_IN_KM;
    case "re":
      return (value.value * EARTH_RADIUS_IN_KM) / AU_IN_KM;
    case "sol":
      return (value.value * SOLAR_RADIUS_IN_KM) / AU_IN_KM;
    default:
      return value.value;
  }
}

function toVisualSizeMetric(value: NormalizedValue | undefined): number | null {
  if (!value || typeof value !== "object" || !("value" in value)) {
    return null;
  }

  const unitValue = value as UnitValue;
  switch (unitValue.unit) {
    case "sol":
      return clamp(unitValue.value * 22, 14, 40);
    case "re":
      return clamp(unitValue.value * 10, 6, 18);
    case "km":
      return clamp(Math.log10(Math.max(unitValue.value, 1)) * 2.6, 4, 16);
    default:
      return clamp(unitValue.value * 4, 4, 20);
  }
}

function unitValueToDegrees(value: UnitValue): number | null {
  return value.unit === "deg" || value.unit === null ? value.value : null;
}

function angleForIndex(index: number, count: number, startAngle: number): number {
  if (count <= 1) return startAngle;
  return startAngle + (index * Math.PI * 2) / count;
}

function clamp(value: number, min: number, max: number): number {
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

function customColorFor(value: NormalizedValue | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function estimateLabelHalfWidth(object: RenderSceneObject): number {
  const primaryWidth = object.label.length * 4.6 + 18;
  const secondaryWidth = object.secondaryLabel.length * 3.9 + 18;
  return Math.max(primaryWidth, secondaryWidth, object.visualRadius + 18);
}

function capitalizeLabel(value: string): string {
  return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
}
