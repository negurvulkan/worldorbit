import { renderSceneToSvg } from "./render.js";
export function renderHierarchySceneToSvg(scene, options = {}) {
    if (scene.scope === "system" && scene.atlasScene) {
        return renderSceneToSvg(scene.atlasScene, {
            selectedObjectId: options.selectedNodeId ?? null,
        });
    }
    const selectedNodeId = options.selectedNodeId ?? null;
    const nodeIndex = new Map(scene.nodes.map((node) => [node.id, node]));
    const links = scene.links
        .map((link) => {
        const from = nodeIndex.get(link.fromId);
        const to = nodeIndex.get(link.toId);
        if (!from || !to) {
            return "";
        }
        return `<line class="woc-link" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
    })
        .join("");
    const nodes = scene.nodes
        .filter((node) => !node.hidden)
        .map((node) => renderNode(node, selectedNodeId))
        .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" role="img" aria-labelledby="woc-title woc-desc">
  <title id="woc-title">${escapeXml(scene.title)}</title>
  <desc id="woc-desc">${escapeXml(scene.subtitle)}</desc>
  <defs>
    <radialGradient id="woc-bg" cx="50%" cy="35%" r="85%">
      <stop offset="0%" stop-color="#102448" />
      <stop offset="100%" stop-color="#07101f" />
    </radialGradient>
  </defs>
  <style>
    .woc-bg { fill: url(#woc-bg); }
    .woc-grid { stroke: rgba(123, 208, 255, 0.07); stroke-width: 1; }
    .woc-link { stroke: rgba(123, 208, 255, 0.18); stroke-width: 1.6; }
    .woc-node { cursor: pointer; }
    .woc-node-body { fill: #7bd0ff; fill-opacity: 0.16; stroke: rgba(223, 228, 255, 0.86); stroke-width: 1.5; }
    .woc-node-preview .woc-node-body { fill-opacity: 0.28; stroke-width: 1; }
    .woc-node-selected .woc-node-body { stroke: #f0b464; stroke-width: 2.6; }
    .woc-node-label { fill: #edf6ff; font: 700 13px/1.2 "Segoe UI Variable", "Segoe UI", sans-serif; letter-spacing: 0.03em; text-transform: uppercase; }
    .woc-node-subtitle { fill: rgba(237, 246, 255, 0.7); font: 500 11px/1.3 "Segoe UI Variable", "Segoe UI", sans-serif; }
    .woc-title { fill: #edf6ff; font: 700 26px/1 "Segoe UI Variable Display", "Segoe UI", sans-serif; letter-spacing: 0.04em; text-transform: uppercase; }
    .woc-subtitle { fill: rgba(237, 246, 255, 0.7); font: 500 12px/1.2 "Segoe UI Variable", "Segoe UI", sans-serif; letter-spacing: 0.08em; text-transform: uppercase; }
    .woc-meta { fill: rgba(237, 246, 255, 0.58); font: 500 11px/1.2 "Segoe UI Variable", "Segoe UI", sans-serif; }
  </style>
  <rect class="woc-bg" x="0" y="0" width="${scene.width}" height="${scene.height}" rx="28" ry="28" />
  ${renderBackdrop(scene.width, scene.height)}
  <text class="woc-title" x="48" y="62">${escapeXml(scene.title)}</text>
  <text class="woc-subtitle" x="48" y="84">${escapeXml(scene.subtitle)}</text>
  <text class="woc-meta" x="48" y="${scene.height - 32}">${escapeXml(`schema 4.0 - ${scene.scope} scope - zoom ${scene.zoom.toFixed(2)}`)}</text>
  <g data-worldorbit-hierarchy-scope="${escapeAttribute(scene.scope)}">
    ${links}
    ${nodes}
  </g>
</svg>`;
}
function renderNode(node, selectedNodeId) {
    const selectedClass = selectedNodeId === node.id ? " woc-node-selected" : "";
    const previewClass = node.preview ? " woc-node-preview" : "";
    const fill = node.fill ?? defaultFillForKind(node.kind);
    const subtitle = node.subtitle ? `<text class="woc-node-subtitle" x="${node.x}" y="${node.y + node.radius + 22}" text-anchor="middle">${escapeXml(node.subtitle)}</text>` : "";
    return `<g class="woc-node${selectedClass}${previewClass}" data-worldorbit-hierarchy-node-id="${escapeAttribute(node.id)}" data-worldorbit-hierarchy-kind="${escapeAttribute(node.kind)}">
    <circle class="woc-node-body" cx="${node.x}" cy="${node.y}" r="${node.radius}" fill="${escapeAttribute(fill)}" />
    <text class="woc-node-label" x="${node.x}" y="${node.y + 4}" text-anchor="middle">${escapeXml(node.label)}</text>
    ${!node.preview ? subtitle : ""}
  </g>`;
}
function defaultFillForKind(kind) {
    switch (kind) {
        case "universe":
            return "#95b8ff";
        case "galaxy":
            return "#a07fff";
        case "system":
            return "#7bd0ff";
        default:
            return "#c8d7ff";
    }
}
function renderBackdrop(width, height) {
    const vertical = Array.from({ length: 8 }, (_, index) => {
        const x = 70 + index * ((width - 140) / 7);
        return `<line class="woc-grid" x1="${x}" y1="120" x2="${x}" y2="${height - 70}" />`;
    }).join("");
    const horizontal = Array.from({ length: 5 }, (_, index) => {
        const y = 150 + index * ((height - 220) / 4);
        return `<line class="woc-grid" x1="48" y1="${y}" x2="${width - 48}" y2="${y}" />`;
    }).join("");
    return `${vertical}${horizontal}`;
}
function escapeXml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}
function escapeAttribute(value) {
    return escapeXml(value);
}
