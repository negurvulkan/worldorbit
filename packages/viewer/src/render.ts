import {
  loadWorldOrbitSource,
  renderDocumentToScene,
  type NormalizedValue,
  type LoadedWorldOrbitSource,
  type RenderScene,
  type RenderSceneObject,
  type UnitValue,
  type WorldOrbitDocument,
  type WorldOrbitObject,
} from "@worldorbit/core";

import { computeVisibleObjectIds } from "./atlas-state.js";
import { resolveLayers, resolveTheme } from "./theme.js";
import type { SvgRenderOptions } from "./types.js";

interface LabelPlacement {
  labelY: number;
  secondaryY: number;
}

interface ObjectPalette {
  fill: string;
  stroke: string;
  glow?: string;
  atmosphere?: string;
  tail?: string;
}

export const WORLD_LAYER_ID = "worldorbit-camera-root";

export function renderSceneToSvg(scene: RenderScene, options: SvgRenderOptions = {}): string {
  const theme = resolveTheme(options.theme);
  const presetDefaults = resolveRenderPreset(options.preset ?? scene.renderPreset ?? undefined);
  const layers = resolveLayers({
    ...presetDefaults.layers,
    ...options.layers,
  });
  const subtitle = options.subtitle ?? scene.subtitle;
  const visibleObjectIds = computeVisibleObjectIds(scene, options.filter ?? null);
  const visibleObjects = scene.objects
    .filter((object) => !object.hidden)
    .filter((object) => visibleObjectIds.has(object.objectId))
    .filter((object) => layers.structures || !isStructureLike(object.object))
    .sort((left, right) => left.sortKey - right.sortKey);
  const visibleLabels = scene.labels
    .filter((label) => !label.hidden)
    .filter((label) => visibleObjectIds.has(label.objectId))
    .filter((label) => layers.structures || !isStructureLike(label.object));
  const imageDefinitions = buildImageDefinitions(visibleObjects);
  const orbitMarkup = layers.orbits
    ? renderOrbitLayer(scene, visibleObjectIds, layers.structures)
    : { back: "", front: "" };
  const leaderMarkup = layers.guides
    ? scene.leaders
        .filter((leader) => !leader.hidden)
        .filter((leader) => visibleObjectIds.has(leader.objectId))
        .filter((leader) => layers.structures || !isStructureLike(leader.object))
        .map(
          (leader) =>
            `<line class="wo-leader wo-leader-${leader.mode}" x1="${leader.x1}" y1="${leader.y1}" x2="${leader.x2}" y2="${leader.y2}" data-render-id="${escapeXml(leader.renderId)}" data-group-id="${escapeAttribute(leader.groupId ?? "")}" />`,
        )
        .join("")
    : "";
  const objectMarkup = layers.objects
    ? visibleObjects
        .map((object) => renderSceneObject(object, options.selectedObjectId ?? null, theme))
        .join("")
    : "";
  const labelMarkup = layers.labels
    ? visibleLabels
        .map((label) => renderSceneLabel(scene, label, options.selectedObjectId ?? null))
        .join("")
    : "";

  const metadataMarkup = layers.metadata
    ? `<text class="wo-title" x="56" y="64">${escapeXml(scene.title)}</text>
  <text class="wo-subtitle" x="56" y="88">${escapeXml(subtitle)}</text>
  <text class="wo-meta" x="56" y="${scene.height - 42}">${escapeXml(renderMetadata(scene))}</text>`
    : "";

  const backgroundMarkup = layers.background
    ? `<rect class="wo-bg" x="0" y="0" width="${scene.width}" height="${scene.height}" rx="28" ry="28" />
  <rect class="wo-bg-glow" x="0" y="0" width="${scene.width}" height="${scene.height}" rx="28" ry="28" />
  ${layers.guides ? renderBackdrop(scene.width, scene.height) : ""}`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" data-worldorbit-svg="true" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="worldorbit-title worldorbit-desc">
  <title id="worldorbit-title">${escapeXml(scene.title)}</title>
  <desc id="worldorbit-desc">A ${escapeXml(scene.viewMode)} WorldOrbit render with ${visibleObjects.length} visible objects.</desc>
  <defs>
    <linearGradient id="wo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.backgroundStart}" />
      <stop offset="100%" stop-color="${theme.backgroundEnd}" />
    </linearGradient>
    <radialGradient id="wo-star-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${theme.starGlow}" stop-opacity="0.95" />
      <stop offset="100%" stop-color="${theme.starCore}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="wo-bg-glow" cx="20%" cy="10%" r="90%">
      <stop offset="0%" stop-color="${theme.backgroundGlow}" />
      <stop offset="100%" stop-color="transparent" />
    </radialGradient>
    ${imageDefinitions}
  </defs>
  <style>
    .wo-bg { fill: url(#wo-bg); }
    .wo-bg-glow { fill: url(#wo-bg-glow); }
    .wo-grid { fill: none; stroke: ${theme.guide}; stroke-width: 1; }
    .wo-orbit { fill: none; stroke: ${theme.orbit}; stroke-width: 1.5; }
    .wo-orbit-back { opacity: 0.38; stroke-dasharray: 8 6; }
    .wo-orbit-front { opacity: 0.9; }
    .wo-orbit-band { stroke: ${theme.orbitBand}; stroke-linecap: round; }
    .wo-leader { stroke: ${theme.leader}; stroke-width: 1.5; stroke-dasharray: 6 5; }
    .wo-label { fill: ${theme.ink}; font-family: ${theme.fontFamily}; font-weight: 600; letter-spacing: 0.02em; }
    .wo-label-secondary { fill: ${theme.muted}; font-family: ${theme.fontFamily}; font-weight: 500; }
    .wo-title { fill: ${theme.ink}; font: 700 24px ${theme.displayFont}; letter-spacing: 0.06em; text-transform: uppercase; }
    .wo-subtitle { fill: ${theme.muted}; font: 500 12px ${theme.fontFamily}; letter-spacing: 0.14em; text-transform: uppercase; }
    .wo-meta { fill: ${theme.muted}; font: 500 11px ${theme.fontFamily}; letter-spacing: 0.06em; }
    .wo-object { cursor: pointer; outline: none; }
    .wo-object:focus-visible .wo-selection-ring,
    .wo-object:hover .wo-selection-ring,
    .wo-object-selected .wo-selection-ring { display: block; }
    .wo-object-selected .wo-selection-ring { stroke: ${theme.selected}; }
    .wo-object-label-selected .wo-label { fill: ${theme.accent}; }
    .wo-object-label-selected .wo-label-secondary { fill: ${theme.selected}; }
    .wo-chain-selected .wo-selection-ring,
    .wo-chain-hover .wo-selection-ring { display: block; }
    .wo-ancestor-selected .wo-selection-ring,
    .wo-ancestor-hover .wo-selection-ring { display: block; opacity: 0.66; }
    .wo-chain-selected .wo-label,
    .wo-chain-hover .wo-label { fill: ${theme.accent}; }
    .wo-ancestor-selected .wo-label,
    .wo-ancestor-hover .wo-label { fill: ${theme.ink}; opacity: 0.82; }
    .wo-orbit-related-selected,
    .wo-orbit-related-hover { stroke: ${theme.accentStrong}; opacity: 1; }
    .wo-selection-ring { display: none; fill: none; stroke-width: 2; stroke-dasharray: 6 5; }
    .wo-object-image { pointer-events: none; }
  </style>
  ${backgroundMarkup}
  ${metadataMarkup}
  <g data-worldorbit-world="true">
    <g data-worldorbit-camera-root="${WORLD_LAYER_ID}" id="${WORLD_LAYER_ID}">
      <g data-worldorbit-world-content="true">
        ${layers.orbits ? `<g data-layer-id="orbits-back">${orbitMarkup.back}</g>` : ""}
        ${layers.guides ? `<g data-layer-id="guides">${leaderMarkup}</g>` : ""}
        ${layers.objects ? `<g data-layer-id="objects">${objectMarkup}</g>` : ""}
        ${layers.orbits ? `<g data-layer-id="orbits-front">${orbitMarkup.front}</g>` : ""}
        ${layers.labels ? `<g data-layer-id="labels">${labelMarkup}</g>` : ""}
      </g>
    </g>
  </g>
</svg>`;
}

export function renderDocumentToSvg(
  document: WorldOrbitDocument,
  options: SvgRenderOptions = {},
): string {
  return renderSceneToSvg(renderDocumentToScene(document, options), options);
}

export function renderSourceToSvg(source: string, options: SvgRenderOptions = {}): string {
  const loaded = loadWorldOrbitSource(source);
  return renderDocumentToSvg(loaded.document, resolveSourceRenderOptions(loaded, options));
}

function resolveSourceRenderOptions(
  loaded: LoadedWorldOrbitSource,
  options: SvgRenderOptions,
): SvgRenderOptions {
  const atlasDocument = loaded.atlasDocument ?? loaded.draftDocument;

  if (options.preset || !atlasDocument?.system?.defaults.preset) {
    return options;
  }

  return {
    ...options,
    preset: atlasDocument.system.defaults.preset,
  };
}

function renderOrbitLayer(
  scene: RenderScene,
  visibleObjectIds: Set<string>,
  includeStructures: boolean,
): { back: string; front: string } {
  const backParts: string[] = [];
  const frontParts: string[] = [];

  for (const visual of scene.orbitVisuals.filter(
    (entry) =>
      !entry.hidden &&
      visibleObjectIds.has(entry.objectId) &&
      (includeStructures || !isStructureLike(entry.object)),
  )) {
    const strokeWidth = visual.bandThickness ?? (visual.band ? 10 : 1.5);
    const orbitClass = visual.band ? "wo-orbit wo-orbit-band wo-orbit-node" : "wo-orbit wo-orbit-node";
    const dataAttributes = `data-render-id="${escapeXml(visual.renderId)}" data-orbit-object-id="${escapeAttribute(visual.objectId)}" data-parent-id="${escapeAttribute(visual.parentId)}" data-group-id="${escapeAttribute(visual.groupId ?? "")}"`;

    if (visual.backArcPath || visual.frontArcPath) {
      if (visual.backArcPath) {
        backParts.push(
          `<path class="${orbitClass} wo-orbit-back" d="${visual.backArcPath}" stroke-width="${strokeWidth}" ${dataAttributes} />`,
        );
      }
      if (visual.frontArcPath) {
        frontParts.push(
          `<path class="${orbitClass} wo-orbit-front" d="${visual.frontArcPath}" stroke-width="${strokeWidth}" ${dataAttributes} />`,
        );
      }
      continue;
    }

    if (visual.kind === "ellipse") {
      const rx = visual.rx ?? visual.radius ?? 0;
      const ry = visual.ry ?? visual.radius ?? 0;
      frontParts.push(
        `<ellipse class="${orbitClass} wo-orbit-front" cx="${visual.cx}" cy="${visual.cy}" rx="${rx}" ry="${ry}" transform="rotate(${visual.rotationDeg} ${visual.cx} ${visual.cy})" stroke-width="${strokeWidth}" ${dataAttributes} />`,
      );
      continue;
    }

    frontParts.push(
      `<circle class="${orbitClass} wo-orbit-front" cx="${visual.cx}" cy="${visual.cy}" r="${visual.radius ?? 0}" stroke-width="${strokeWidth}" ${dataAttributes} />`,
    );
  }

  return {
    back: backParts.join(""),
    front: frontParts.join(""),
  };
}

function buildImageDefinitions(objects: RenderSceneObject[]): string {
  return objects
    .filter((object) => Boolean(object.imageHref))
    .map((object) => renderImageClipPath(object))
    .join("");
}

function renderSceneObject(
  sceneObject: RenderSceneObject,
  selectedObjectId: string | null,
  theme: ReturnType<typeof resolveTheme>,
): string {
  const { object, x, y, radius, visualRadius } = sceneObject;
  const selectionClass = selectedObjectId === sceneObject.objectId ? " wo-object-selected" : "";
  const palette = resolveObjectPalette(sceneObject, theme);
  const imageMarkup = renderObjectImage(sceneObject);
  const outlineMarkup = imageMarkup
    ? renderObjectBody(object, x, y, radius, palette, { outlineOnly: true })
    : "";
  return `<g class="wo-object wo-object-${object.type}${selectionClass}" data-object-id="${escapeXml(sceneObject.objectId)}" data-parent-id="${escapeAttribute(sceneObject.parentId ?? "")}" data-group-id="${escapeAttribute(sceneObject.groupId ?? "")}" data-render-id="${escapeXml(sceneObject.renderId)}" tabindex="0" role="button" aria-label="${escapeXml(`${object.type} ${sceneObject.objectId}`)}">
    <circle class="wo-selection-ring" cx="${x}" cy="${y}" r="${visualRadius + 8}" />
    ${renderAtmosphere(sceneObject, palette)}
    ${renderObjectBody(object, x, y, radius, palette)}
    ${imageMarkup}
    ${outlineMarkup}
  </g>`;
}

function renderSceneLabel(
  scene: RenderScene,
  label: RenderScene["labels"][number],
  selectedObjectId: string | null,
): string {
  const selectionClass = selectedObjectId === label.objectId ? " wo-object-label-selected" : "";
  const labelScale = scene.scaleModel.labelMultiplier;
  return `<g class="wo-object-label${selectionClass}" data-object-id="${escapeXml(label.objectId)}" data-group-id="${escapeAttribute(label.groupId ?? "")}" data-render-id="${escapeXml(label.renderId)}">
    <text class="wo-label" x="${label.x}" y="${label.y}" text-anchor="${label.textAnchor}" font-size="${14 * labelScale}">${escapeXml(label.label)}</text>
    <text class="wo-label-secondary" x="${label.x}" y="${label.secondaryY}" text-anchor="${label.textAnchor}" font-size="${11 * labelScale}">${escapeXml(label.secondaryLabel)}</text>
  </g>`;
}

function renderObjectBody(
  object: WorldOrbitObject,
  x: number,
  y: number,
  radius: number,
  palette: ObjectPalette,
  options: { outlineOnly?: boolean } = {},
): string {
  const fill = options.outlineOnly ? "transparent" : palette.fill;
  const tail = palette.tail ?? palette.fill;

  switch (object.type) {
    case "star":
      return options.outlineOnly
        ? `<circle cx="${x}" cy="${y}" r="${radius}" fill="transparent" stroke="${palette.stroke}" stroke-width="2" />`
        : `<circle cx="${x}" cy="${y}" r="${radius * 2.4}" fill="${palette.glow ?? "url(#wo-star-glow)"}" opacity="0.84" />
<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${palette.stroke}" stroke-width="2" />`;
    case "planet":
    case "moon":
    case "belt":
    case "asteroid":
    case "ring":
      return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${palette.stroke}" stroke-width="${options.outlineOnly ? 1.5 : 1.4}" />`;
    case "comet":
      return options.outlineOnly
        ? `<circle cx="${x}" cy="${y}" r="${radius}" fill="transparent" stroke="${palette.stroke}" stroke-width="1.4" />`
        : `<path d="M ${x - radius * 2} ${y + radius * 1.3} Q ${x - radius * 0.7} ${y + radius * 0.3} ${x - radius * 0.45} ${y}" fill="none" stroke="${tail}" stroke-width="${Math.max(2, radius * 0.8)}" stroke-linecap="round" opacity="0.85" />
<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${palette.stroke}" stroke-width="1.4" />`;
    case "structure":
      return `<polygon points="${diamondPoints(x, y, radius)}" fill="${fill}" stroke="${palette.stroke}" stroke-width="1.4" />`;
    case "phenomenon":
      return `<polygon points="${phenomenonPoints(x, y, radius)}" fill="${fill}" stroke="${palette.stroke}" stroke-width="1.4" />`;
  }
}

function renderAtmosphere(sceneObject: RenderSceneObject, palette: ObjectPalette): string {
  if (!palette.atmosphere) {
    return "";
  }

  const { object, x, y, radius } = sceneObject;
  if (object.type !== "planet" && object.type !== "moon" && object.type !== "asteroid") {
    return "";
  }

  return `<circle cx="${x}" cy="${y}" r="${radius + 4}" fill="none" stroke="${palette.atmosphere}" stroke-width="4" opacity="0.45" />`;
}

function renderObjectImage(sceneObject: RenderSceneObject): string {
  if (!sceneObject.imageHref) {
    return "";
  }

  const bounds = imageBoundsForObject(sceneObject);
  return `<image class="wo-object-image" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" href="${escapeAttribute(sceneObject.imageHref)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${escapeAttribute(getObjectClipPathId(sceneObject))})" />`;
}

function renderImageClipPath(sceneObject: RenderSceneObject): string {
  const { x, y, radius } = sceneObject;
  let content = "";

  switch (sceneObject.object.type) {
    case "star":
    case "planet":
    case "moon":
    case "asteroid":
    case "comet":
      content = `<circle cx="${x}" cy="${y}" r="${radius}" />`;
      break;
    case "structure":
      content = `<polygon points="${diamondPoints(x, y, radius)}" />`;
      break;
    case "phenomenon":
      content = `<polygon points="${phenomenonPoints(x, y, radius)}" />`;
      break;
    default:
      return "";
  }

  return `<clipPath id="${escapeAttribute(getObjectClipPathId(sceneObject))}" clipPathUnits="userSpaceOnUse">${content}</clipPath>`;
}

function imageBoundsForObject(sceneObject: RenderSceneObject): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const { object, x, y, radius } = sceneObject;

  switch (object.type) {
    case "structure":
      return {
        x: x - radius,
        y: y - radius,
        width: radius * 2,
        height: radius * 2,
      };
    case "phenomenon":
      return {
        x: x - radius * 1.2,
        y: y - radius * 1.2,
        width: radius * 2.4,
        height: radius * 2.4,
      };
    default:
      return {
        x: x - radius,
        y: y - radius,
        width: radius * 2,
        height: radius * 2,
      };
  }
}

function computeLabelPlacements(
  scene: RenderScene,
  objects: RenderSceneObject[],
): Map<string, LabelPlacement> {
  const placements = new Map<string, LabelPlacement>();
  const occupied: Array<{ left: number; right: number; top: number; bottom: number }> = [];
  const labelScale = scene.scaleModel.labelMultiplier;

  for (const object of objects) {
    const direction = object.y > scene.height * 0.62 ? -1 : 1;
    const labelHalfWidth = estimateLabelHalfWidth(object, labelScale);
    let labelY = object.y + direction * (object.radius + 18 * labelScale);
    let secondaryY = labelY + direction * (16 * labelScale);
    let rect = labelRect(object.x, labelY, secondaryY, labelHalfWidth, direction);
    let attempts = 0;

    while (occupied.some((entry) => rectsOverlap(entry, rect)) && attempts < 10) {
      labelY += direction * 14 * labelScale;
      secondaryY += direction * 14 * labelScale;
      rect = labelRect(object.x, labelY, secondaryY, labelHalfWidth, direction);
      attempts += 1;
    }

    occupied.push(rect);
    placements.set(object.objectId, { labelY, secondaryY });
  }

  return placements;
}

function defaultLabelPlacement(scene: RenderScene, object: RenderSceneObject): LabelPlacement {
  const direction = object.y > scene.height * 0.62 ? -1 : 1;
  const labelScale = scene.scaleModel.labelMultiplier;
  const labelY = object.y + direction * (object.radius + 18 * labelScale);
  return {
    labelY,
    secondaryY: labelY + direction * (16 * labelScale),
  };
}

function labelRect(
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

function resolveObjectPalette(
  sceneObject: RenderSceneObject,
  theme: ReturnType<typeof resolveTheme>,
): ObjectPalette {
  const base = basePaletteForType(sceneObject.object.type, theme);
  const customFill =
    sceneObject.fillColor && isColorLike(sceneObject.fillColor)
      ? sceneObject.fillColor
      : base.fill;
  const albedo = numericValue(sceneObject.object.properties.albedo);
  const temperature = numericValue(sceneObject.object.properties.temperature);
  const fill = applyTemperatureAndAlbedo(customFill, temperature, albedo, sceneObject.object.type);
  const stroke = mixColors(fill, "#ffffff", 0.4) ?? base.stroke;
  const atmosphere = atmosphereColor(sceneObject.object.properties.atmosphere);
  const glow =
    sceneObject.object.type === "star"
      ? rgbaString(mixColors(fill, "#fff2cb", 0.4) ?? fill, 0.82)
      : undefined;

  return {
    fill,
    stroke,
    glow,
    atmosphere,
    tail:
      sceneObject.object.type === "comet"
        ? rgbaString(mixColors(fill, "#ffffff", 0.5) ?? fill, 0.72)
        : undefined,
  };
}

function basePaletteForType(
  type: WorldOrbitObject["type"],
  theme: ReturnType<typeof resolveTheme>,
): ObjectPalette {
  switch (type) {
    case "star":
      return {
        fill: theme.starCore,
        stroke: theme.starStroke,
      };
    case "planet":
      return { fill: "#72b7ff", stroke: "#d8efff" };
    case "moon":
      return { fill: "#c7d7ea", stroke: "#f2f8ff" };
    case "belt":
      return { fill: "#d9aa74", stroke: "#f7d5aa" };
    case "asteroid":
      return { fill: "#a7a5b8", stroke: "#ebe5ff" };
    case "comet":
      return { fill: "#9ce7ff", stroke: "#e7fbff" };
    case "ring":
      return { fill: "#e59f7d", stroke: "#fff0d3" };
    case "structure":
      return { fill: theme.accentStrong, stroke: "#fff2ea" };
    case "phenomenon":
      return { fill: "#78ffd7", stroke: "#e9fff7" };
  }
}

function applyTemperatureAndAlbedo(
  baseColor: string,
  temperature: number | null,
  albedo: number | null,
  type: WorldOrbitObject["type"],
): string {
  let nextColor = baseColor;

  if (temperature !== null) {
    const tint = temperatureTint(temperature, type);
    nextColor = mixColors(nextColor, tint, type === "star" ? 0.42 : 0.2) ?? nextColor;
  }

  if (albedo !== null) {
    const clamped = Math.min(Math.max(albedo, 0), 1);
    nextColor =
      mixColors(nextColor, clamped >= 0.5 ? "#ffffff" : "#0f1520", Math.abs(clamped - 0.5) * 0.7) ??
      nextColor;
  }

  return nextColor;
}

function temperatureTint(value: number, type: WorldOrbitObject["type"]): string {
  if (type === "star") {
    if (value >= 8_000) return "#d7ebff";
    if (value >= 6_000) return "#fff3d8";
    if (value >= 4_000) return "#ffd39a";
    return "#ff9d76";
  }

  if (value <= 180) return "#8fd8ff";
  if (value >= 600) return "#ffb56e";
  return "#fff1c4";
}

function atmosphereColor(value: NormalizedValue | undefined): string | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.includes("methane")) return "rgba(134, 236, 255, 0.75)";
  if (normalized.includes("nitrogen") || normalized.includes("oxygen") || normalized.includes("air")) {
    return "rgba(122, 194, 255, 0.75)";
  }
  if (normalized.includes("carbon") || normalized.includes("co2")) {
    return "rgba(255, 198, 138, 0.75)";
  }
  if (normalized.includes("sulfur")) {
    return "rgba(255, 233, 138, 0.75)";
  }
  return "rgba(180, 222, 255, 0.68)";
}

function resolveRenderPreset(
  preset: SvgRenderOptions["preset"],
): { layers?: SvgRenderOptions["layers"] } {
  switch (preset) {
    case "presentation":
      return {
        layers: {
          background: true,
          guides: true,
          orbits: true,
          objects: true,
          labels: true,
          structures: true,
          metadata: true,
        },
      };
    case "atlas-card":
      return {
        layers: {
          background: true,
          guides: false,
          orbits: true,
          objects: true,
          labels: true,
          structures: true,
          metadata: true,
        },
      };
    case "markdown":
      return {
        layers: {
          background: true,
          guides: false,
          orbits: true,
          objects: true,
          labels: true,
          structures: true,
          metadata: false,
        },
      };
    case "diagram":
    default:
      return {
        layers: {
          background: true,
          guides: true,
          orbits: true,
          objects: true,
          labels: true,
          structures: true,
          metadata: true,
        },
      };
  }
}

function numericValue(value: NormalizedValue | undefined): number | null {
  if (typeof value === "number") {
    return value;
  }

  if (value && typeof value === "object" && "value" in value) {
    return (value as UnitValue).value;
  }

  return null;
}

function estimateLabelHalfWidth(object: RenderSceneObject, labelScale: number): number {
  const primaryWidth = object.label.length * 4.8 * labelScale + 18;
  const secondaryWidth = object.secondaryLabel.length * 4.1 * labelScale + 18;
  return Math.max(primaryWidth, secondaryWidth, object.visualRadius + 18);
}

function getObjectClipPathId(sceneObject: RenderSceneObject): string {
  return `${sceneObject.renderId}-clip`;
}

function diamondPoints(x: number, y: number, radius: number): string {
  return `${x},${y - radius} ${x + radius},${y} ${x},${y + radius} ${x - radius},${y}`;
}

function phenomenonPoints(x: number, y: number, radius: number): string {
  return `${x},${y - radius * 1.2} ${x + radius * 0.9},${y - radius * 0.3} ${x + radius * 1.2},${y + radius * 0.8} ${x},${y + radius * 1.2} ${x - radius * 1.1},${y + radius * 0.3} ${x - radius * 0.8},${y - radius * 0.8}`;
}

function renderBackdrop(width: number, height: number): string {
  const verticalLines = Array.from({ length: 10 }, (_, index) => {
    const x = 90 + index * ((width - 180) / 9);
    return `<line class="wo-grid" x1="${x}" y1="120" x2="${x}" y2="${height - 70}" />`;
  }).join("");

  const horizontalLines = Array.from({ length: 6 }, (_, index) => {
    const y = 150 + index * ((height - 240) / 5);
    return `<line class="wo-grid" x1="56" y1="${y}" x2="${width - 56}" y2="${y}" />`;
  }).join("");

  return `${verticalLines}${horizontalLines}`;
}

function renderMetadata(scene: RenderScene): string {
  return [
    `${scene.layoutPreset} layout`,
    `${scene.viewMode} view`,
    `${scene.renderPreset ?? "custom"} preset`,
    `schema ${scene.metadata.version ?? "1.0"}`,
  ].join(" - ");
}

function isStructureLike(object: WorldOrbitObject): boolean {
  return object.type === "structure" || object.type === "phenomenon";
}

function mixColors(left: string, right: string, amount: number): string | undefined {
  const leftRgb = parseColor(left);
  const rightRgb = parseColor(right);
  if (!leftRgb || !rightRgb) {
    return undefined;
  }

  const clamped = Math.min(Math.max(amount, 0), 1);
  return rgbToHex({
    r: Math.round(leftRgb.r + (rightRgb.r - leftRgb.r) * clamped),
    g: Math.round(leftRgb.g + (rightRgb.g - leftRgb.g) * clamped),
    b: Math.round(leftRgb.b + (rightRgb.b - leftRgb.b) * clamped),
  });
}

function rgbaString(color: string, alpha: number): string {
  const rgb = parseColor(color);
  if (!rgb) {
    return color;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function parseColor(value: string): { r: number; g: number; b: number } | null {
  const hex = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    return {
      r: Number.parseInt(hex.slice(1, 3), 16),
      g: Number.parseInt(hex.slice(3, 5), 16),
      b: Number.parseInt(hex.slice(5, 7), 16),
    };
  }

  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return {
      r: Number.parseInt(hex[1] + hex[1], 16),
      g: Number.parseInt(hex[2] + hex[2], 16),
      b: Number.parseInt(hex[3] + hex[3], 16),
    };
  }

  return null;
}

function rgbToHex(color: { r: number; g: number; b: number }): string {
  const part = (value: number): string => value.toString(16).padStart(2, "0");
  return `#${part(color.r)}${part(color.g)}${part(color.b)}`;
}

function isColorLike(value: string): boolean {
  return Boolean(value.trim());
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeAttribute(value: string): string {
  return escapeXml(value);
}
