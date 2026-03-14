import {
  normalizeDocument,
  parseWorldOrbit,
  renderDocumentToScene,
  validateDocument,
  type RenderScene,
  type RenderSceneObject,
  type WorldOrbitDocument,
  type WorldOrbitObject,
} from "@worldorbit/core";

import { resolveLayers, resolveTheme } from "./theme.js";
import type { SvgRenderOptions } from "./types.js";

export const WORLD_LAYER_ID = "worldorbit-camera-root";

export function renderSceneToSvg(scene: RenderScene, options: SvgRenderOptions = {}): string {
  const theme = resolveTheme(options.theme);
  const layers = resolveLayers(options.layers);
  const subtitle = options.subtitle ?? scene.subtitle;
  const visibleObjects = scene.objects
    .filter((object) => !object.hidden)
    .filter((object) => layers.structures || !isStructureLike(object.object));
  const imageDefinitions = buildImageDefinitions(visibleObjects);

  const orbitMarkup = layers.orbits
    ? scene.orbitVisuals
        .filter((visual) => !visual.hidden)
        .map((visual) => {
          const orbitClass = visual.band ? "wo-orbit wo-orbit-band" : "wo-orbit";
          return `<circle class="${orbitClass}" cx="${visual.cx}" cy="${visual.cy}" r="${visual.radius}" data-render-id="${escapeXml(visual.renderId)}" />`;
        })
        .join("")
    : "";

  const leaderMarkup = layers.guides
    ? scene.leaders
        .filter((leader) => !leader.hidden)
        .map(
          (leader) =>
            `<line class="wo-leader wo-leader-${leader.mode}" x1="${leader.x1}" y1="${leader.y1}" x2="${leader.x2}" y2="${leader.y2}" data-render-id="${escapeXml(leader.renderId)}" />`,
        )
        .join("")
    : "";

  const objectMarkup = visibleObjects
    .map((object) => renderSceneObject(scene, object, options.selectedObjectId ?? null, layers.labels))
    .join("");

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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="worldorbit-title worldorbit-desc">
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
    .wo-orbit-band { stroke: ${theme.orbitBand}; stroke-width: 8; stroke-linecap: round; }
    .wo-leader { stroke: ${theme.leader}; stroke-width: 1.5; stroke-dasharray: 6 5; }
    .wo-label { fill: ${theme.ink}; font: 600 14px ${theme.fontFamily}; letter-spacing: 0.02em; }
    .wo-label-secondary { fill: ${theme.muted}; font: 500 11px ${theme.fontFamily}; }
    .wo-title { fill: ${theme.ink}; font: 700 24px ${theme.displayFont}; letter-spacing: 0.06em; text-transform: uppercase; }
    .wo-subtitle { fill: ${theme.muted}; font: 500 12px ${theme.fontFamily}; letter-spacing: 0.14em; text-transform: uppercase; }
    .wo-meta { fill: ${theme.muted}; font: 500 11px ${theme.fontFamily}; letter-spacing: 0.06em; }
    .wo-object { cursor: pointer; outline: none; }
    .wo-object:focus-visible .wo-selection-ring,
    .wo-object:hover .wo-selection-ring,
    .wo-object-selected .wo-selection-ring { display: block; }
    .wo-object-selected .wo-label { fill: ${theme.accent}; }
    .wo-object-selected .wo-label-secondary { fill: ${theme.selected}; }
    .wo-selection-ring { display: none; fill: none; stroke: ${theme.selected}; stroke-width: 2; stroke-dasharray: 6 5; }
    .wo-object-image { pointer-events: none; }
    .wo-star-core { fill: ${theme.starCore}; stroke: ${theme.starStroke}; stroke-width: 2; }
    .wo-star-glow { fill: url(#wo-star-glow); }
    .wo-planet { fill: #72b7ff; stroke: #d8efff; stroke-width: 1.5; }
    .wo-moon { fill: #c7d7ea; stroke: rgba(255,255,255,0.8); stroke-width: 1; }
    .wo-belt { fill: #f3ba7d; stroke: rgba(255,245,235,0.8); stroke-width: 1.2; }
    .wo-asteroid { fill: #a7a5b8; stroke: #ebe5ff; stroke-width: 1; }
    .wo-comet { fill: #9ce7ff; stroke: #e7fbff; stroke-width: 1.2; }
    .wo-ring { fill: #e59f7d; stroke: #fff0d3; stroke-width: 1.2; }
    .wo-structure { fill: ${theme.accentStrong}; stroke: #fff2ea; stroke-width: 1.2; }
    .wo-phenomenon { fill: #78ffd7; stroke: #e9fff7; stroke-width: 1.2; }
    .wo-outline { fill: transparent; }
  </style>
  ${backgroundMarkup}
  ${metadataMarkup}
  <g data-worldorbit-world="true">
    <g data-worldorbit-camera-root="${WORLD_LAYER_ID}" id="${WORLD_LAYER_ID}">
      <g data-worldorbit-world-content="true">
        ${orbitMarkup}
        ${leaderMarkup}
        ${objectMarkup}
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
  const ast = parseWorldOrbit(source);
  const document = normalizeDocument(ast);
  validateDocument(document);
  return renderDocumentToSvg(document, options);
}

function buildImageDefinitions(objects: RenderSceneObject[]): string {
  return objects
    .filter((object) => Boolean(object.imageHref))
    .map((object) => renderImageClipPath(object))
    .join("");
}

function renderSceneObject(
  scene: RenderScene,
  sceneObject: RenderSceneObject,
  selectedObjectId: string | null,
  showLabels: boolean,
): string {
  const { object, x, y, radius, label, secondaryLabel, visualRadius, fillColor } = sceneObject;
  const labelDirection = y > scene.height * 0.62 ? -1 : 1;
  const labelY = y + labelDirection * (radius + 18);
  const secondaryY = labelY + labelDirection * 15;
  const selectionClass = selectedObjectId === sceneObject.objectId ? " wo-object-selected" : "";
  const imageMarkup = renderObjectImage(sceneObject);
  const outlineMarkup = imageMarkup
    ? renderObjectBody(object, x, y, radius, fillColor, { outlineOnly: true })
    : "";

  return `<g class="wo-object wo-object-${object.type}${selectionClass}" data-object-id="${escapeXml(sceneObject.objectId)}" data-render-id="${escapeXml(sceneObject.renderId)}" tabindex="0" role="button" aria-label="${escapeXml(`${object.type} ${sceneObject.objectId}`)}">
    <circle class="wo-selection-ring" cx="${x}" cy="${y}" r="${visualRadius + 8}" />
    ${renderObjectBody(object, x, y, radius, fillColor)}
    ${imageMarkup}
    ${outlineMarkup}
    ${showLabels ? `<text class="wo-label" x="${x}" y="${labelY}" text-anchor="middle">${escapeXml(label)}</text>
    <text class="wo-label-secondary" x="${x}" y="${secondaryY}" text-anchor="middle">${escapeXml(secondaryLabel)}</text>` : ""}
  </g>`;
}

function renderObjectBody(
  object: WorldOrbitObject,
  x: number,
  y: number,
  radius: number,
  fillColor?: string,
  options: { outlineOnly?: boolean } = {},
): string {
  const fillAttribute = options.outlineOnly ? ' fill="transparent"' : fillColor ? ` fill="${fillColor}"` : "";
  const outlineClass = options.outlineOnly ? " wo-outline" : "";

  switch (object.type) {
    case "star":
      return options.outlineOnly
        ? `<circle class="wo-star-core${outlineClass}" cx="${x}" cy="${y}" r="${radius}"${fillAttribute} />`
        : `<circle class="wo-star-glow" cx="${x}" cy="${y}" r="${radius * 2.4}" />
<circle class="wo-star-core" cx="${x}" cy="${y}" r="${radius}"${fillAttribute} />`;
    case "planet":
      return `<circle class="wo-planet${outlineClass}" cx="${x}" cy="${y}" r="${radius}"${fillAttribute} />`;
    case "moon":
      return `<circle class="wo-moon${outlineClass}" cx="${x}" cy="${y}" r="${radius}"${fillAttribute} />`;
    case "belt":
      return `<circle class="wo-belt${outlineClass}" cx="${x}" cy="${y}" r="${radius}"${fillAttribute} />`;
    case "asteroid":
      return `<circle class="wo-asteroid${outlineClass}" cx="${x}" cy="${y}" r="${radius}"${fillAttribute} />`;
    case "comet":
      return options.outlineOnly
        ? `<circle class="wo-comet${outlineClass}" cx="${x}" cy="${y}" r="${radius}"${fillAttribute} />`
        : `<path class="wo-comet" d="M ${x - radius * 1.8} ${y + radius * 1.2} Q ${x - radius * 0.6} ${y + radius * 0.2} ${x - radius * 0.4} ${y}" /><circle class="wo-comet" cx="${x}" cy="${y}" r="${radius}"${fillAttribute} />`;
    case "ring":
      return `<circle class="wo-ring${outlineClass}" cx="${x}" cy="${y}" r="${radius}"${fillAttribute} />`;
    case "structure":
      return `<polygon class="wo-structure${outlineClass}" points="${diamondPoints(x, y, radius)}"${fillAttribute} />`;
    case "phenomenon":
      return `<polygon class="wo-phenomenon${outlineClass}" points="${phenomenonPoints(x, y, radius)}"${fillAttribute} />`;
  }
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
    `schema ${scene.metadata.version ?? "1.0"}`,
  ].join(" - ");
}

function isStructureLike(object: WorldOrbitObject): boolean {
  return object.type === "structure" || object.type === "phenomenon";
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
