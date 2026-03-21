import { getViewerVisibleBounds } from "./viewer-state.js";
const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;
const MINIMAP_PADDING = 10;
export function renderViewerMinimap(scene, state, visibleObjects) {
    const bounds = scene.contentBounds.width > 0 && scene.contentBounds.height > 0
        ? scene.contentBounds
        : {
            minX: 0,
            minY: 0,
            maxX: scene.width,
            maxY: scene.height,
            width: scene.width,
            height: scene.height,
            centerX: scene.width / 2,
            centerY: scene.height / 2,
        };
    const scale = Math.min((MINIMAP_WIDTH - MINIMAP_PADDING * 2) / Math.max(bounds.width, 1), (MINIMAP_HEIGHT - MINIMAP_PADDING * 2) / Math.max(bounds.height, 1));
    const translateX = (MINIMAP_WIDTH - bounds.width * scale) / 2 - bounds.minX * scale;
    const translateY = (MINIMAP_HEIGHT - bounds.height * scale) / 2 - bounds.minY * scale;
    const viewport = getViewerVisibleBounds(scene, state);
    const objectsMarkup = visibleObjects
        .map((object) => {
        const x = object.x * scale + translateX;
        const y = object.y * scale + translateY;
        const radius = Math.max(1.4, Math.min(object.visualRadius * scale, 5.2));
        const fill = object.fillColor ?? minimapColorForObject(object.object.type);
        return `<circle cx="${formatNumber(x)}" cy="${formatNumber(y)}" r="${formatNumber(radius)}" fill="${fill}" fill-opacity="0.92" />`;
    })
        .join("");
    return `<div data-worldorbit-minimap="true" style="position:absolute;right:16px;bottom:16px;width:${MINIMAP_WIDTH}px;height:${MINIMAP_HEIGHT}px;padding:8px;border-radius:16px;background:rgba(5, 14, 22, 0.78);border:1px solid rgba(179, 216, 255, 0.16);box-shadow:0 14px 28px rgba(0, 0, 0, 0.24);backdrop-filter:blur(8px);pointer-events:none;">
  <svg width="${MINIMAP_WIDTH}" height="${MINIMAP_HEIGHT}" viewBox="0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}" role="presentation" aria-hidden="true">
    <rect x="0.5" y="0.5" width="${MINIMAP_WIDTH - 1}" height="${MINIMAP_HEIGHT - 1}" rx="12" ry="12" fill="rgba(7, 17, 27, 0.85)" stroke="rgba(179, 216, 255, 0.18)" />
    <rect x="${formatNumber(bounds.minX * scale + translateX)}" y="${formatNumber(bounds.minY * scale + translateY)}" width="${formatNumber(bounds.width * scale)}" height="${formatNumber(bounds.height * scale)}" rx="10" ry="10" fill="rgba(163, 209, 255, 0.04)" stroke="rgba(163, 209, 255, 0.16)" />
    ${objectsMarkup}
    <rect x="${formatNumber(viewport.minX * scale + translateX)}" y="${formatNumber(viewport.minY * scale + translateY)}" width="${formatNumber(viewport.width * scale)}" height="${formatNumber(viewport.height * scale)}" rx="8" ry="8" fill="rgba(255, 180, 100, 0.09)" stroke="rgba(255, 180, 100, 0.88)" stroke-width="1.4" />
  </svg>
</div>`;
}
function minimapColorForObject(type) {
    switch (type) {
        case "star":
            return "#ffcc67";
        case "planet":
            return "#72b7ff";
        case "moon":
            return "#c7d7ea";
        case "belt":
        case "ring":
            return "#d9aa74";
        case "asteroid":
            return "#a7a5b8";
        case "comet":
            return "#9ce7ff";
        case "structure":
            return "#ff7f5f";
        case "phenomenon":
            return "#78ffd7";
    }
}
function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
