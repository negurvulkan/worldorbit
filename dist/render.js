import { normalizeDocument } from "./normalize.js";
import { parseWorldOrbit } from "./parse.js";
import { validateDocument } from "./validate.js";
const AU_IN_KM = 149_597_870.7;
const EARTH_RADIUS_IN_KM = 6_371;
const SOLAR_RADIUS_IN_KM = 695_700;
const WORLD_LAYER_ID = "worldorbit-camera-root";
export function renderDocumentToScene(document, options = {}) {
    const width = options.width ?? 1200;
    const height = options.height ?? 780;
    const padding = options.padding ?? 72;
    const objectMap = new Map(document.objects.map((object) => [object.id, object]));
    const positions = new Map();
    const orbitDrafts = [];
    const leaderDrafts = [];
    const rootObjects = [];
    const freeObjects = [];
    const atObjects = [];
    const surfaceChildren = new Map();
    const orbitChildren = new Map();
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
    const primaryRoot = rootObjects.find((object) => object.type === "star") ?? rootObjects[0] ?? null;
    if (primaryRoot) {
        placeObject(primaryRoot, centerX, centerY, 0, positions, orbitDrafts, leaderDrafts, {
            orbitChildren,
            surfaceChildren,
            objectMap,
        });
    }
    const secondaryRoots = rootObjects.filter((object) => object.id !== primaryRoot?.id);
    if (secondaryRoots.length > 0) {
        const rootRingRadius = Math.min(width, height) * 0.28;
        secondaryRoots.forEach((object, index) => {
            const angle = angleForIndex(index, secondaryRoots.length, -Math.PI / 2);
            const x = centerX + Math.cos(angle) * rootRingRadius;
            const y = centerY + Math.sin(angle) * rootRingRadius;
            placeObject(object, x, y, 0, positions, orbitDrafts, leaderDrafts, {
                orbitChildren,
                surfaceChildren,
                objectMap,
            });
        });
    }
    freeObjects.forEach((object, index) => {
        const x = width - padding - 130;
        const y = padding +
            90 +
            index *
                Math.max(70, (height - padding * 2 - 180) / Math.max(1, freeObjects.length));
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
        placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, {
            orbitChildren,
            surfaceChildren,
            objectMap,
        });
    });
    atObjects.forEach((object, index) => {
        if (positions.has(object.id)) {
            return;
        }
        const placement = object.placement;
        if (!placement || placement.mode !== "at") {
            return;
        }
        const resolved = resolveAtPosition(placement.reference, positions, objectMap, index, atObjects.length, width, height, padding);
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
        placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, {
            orbitChildren,
            surfaceChildren,
            objectMap,
        });
    });
    const objects = [...positions.values()].map((position) => createSceneObject(position));
    const orbitVisuals = orbitDrafts.map((draft) => createOrbitVisual(draft));
    const leaders = leaderDrafts.map((draft) => createLeaderLine(draft));
    const contentBounds = calculateContentBounds(width, height, objects, orbitVisuals, leaders);
    return {
        width,
        height,
        padding,
        title: String(document.system?.properties.title ?? document.system?.id ?? "WorldOrbit") ||
            "WorldOrbit",
        contentBounds,
        objects,
        orbitVisuals,
        leaders,
    };
}
export function renderSceneToSvg(scene) {
    const { width, height, title } = scene;
    const orbitMarkup = scene.orbitVisuals
        .filter((visual) => !visual.hidden)
        .map((visual) => {
        const orbitClass = visual.band ? "wo-orbit wo-orbit-band" : "wo-orbit";
        return `<circle class="${orbitClass}" cx="${visual.cx}" cy="${visual.cy}" r="${visual.radius}" data-render-id="${escapeXml(visual.renderId)}" />`;
    })
        .join("");
    const leaderMarkup = scene.leaders
        .filter((leader) => !leader.hidden)
        .map((leader) => `<line class="wo-leader wo-leader-${leader.mode}" x1="${leader.x1}" y1="${leader.y1}" x2="${leader.x2}" y2="${leader.y2}" data-render-id="${escapeXml(leader.renderId)}" />`)
        .join("");
    const objectMarkup = scene.objects
        .filter((object) => !object.hidden)
        .map((object) => renderSceneObject(object))
        .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="worldorbit-title worldorbit-desc">
  <title id="worldorbit-title">${escapeXml(title)}</title>
  <desc id="worldorbit-desc">A top-down WorldOrbit render with ${scene.objects.filter((object) => !object.hidden).length} visible objects.</desc>
  <defs>
    <linearGradient id="wo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#07131f" />
      <stop offset="55%" stop-color="#0d2230" />
      <stop offset="100%" stop-color="#04070c" />
    </linearGradient>
    <radialGradient id="wo-star-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffe8a3" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#f7c25c" stop-opacity="0" />
    </radialGradient>
  </defs>
  <style>
    .wo-bg { fill: url(#wo-bg); }
    .wo-grid { fill: none; stroke: rgba(255,255,255,0.04); stroke-width: 1; }
    .wo-orbit { fill: none; stroke: rgba(163, 209, 255, 0.24); stroke-width: 1.5; }
    .wo-orbit-band { stroke: rgba(255, 190, 120, 0.28); stroke-width: 8; stroke-linecap: round; }
    .wo-leader { stroke: rgba(225, 238, 255, 0.4); stroke-width: 1.5; stroke-dasharray: 6 5; }
    .wo-label { fill: #e8f0ff; font: 600 14px "Segoe UI Variable", "Bahnschrift", sans-serif; letter-spacing: 0.02em; }
    .wo-label-secondary { fill: rgba(232, 240, 255, 0.72); font: 500 11px "Segoe UI Variable", "Bahnschrift", sans-serif; }
    .wo-star-core { fill: #ffcc67; stroke: rgba(255, 245, 203, 0.85); stroke-width: 2; }
    .wo-star-glow { fill: url(#wo-star-glow); }
    .wo-planet { fill: #72b7ff; stroke: #d8efff; stroke-width: 1.5; }
    .wo-moon { fill: #c7d7ea; stroke: rgba(255,255,255,0.8); stroke-width: 1; }
    .wo-belt { fill: #f3ba7d; stroke: rgba(255,245,235,0.8); stroke-width: 1.2; }
    .wo-asteroid { fill: #a7a5b8; stroke: #ebe5ff; stroke-width: 1; }
    .wo-comet { fill: #9ce7ff; stroke: #e7fbff; stroke-width: 1.2; }
    .wo-ring { fill: #e59f7d; stroke: #fff0d3; stroke-width: 1.2; }
    .wo-structure { fill: #ff7c6e; stroke: #fff2ea; stroke-width: 1.2; }
    .wo-phenomenon { fill: #78ffd7; stroke: #e9fff7; stroke-width: 1.2; }
    .wo-title { fill: rgba(255,255,255,0.92); font: 700 24px "Bahnschrift", "Segoe UI Variable", sans-serif; letter-spacing: 0.06em; text-transform: uppercase; }
    .wo-subtitle { fill: rgba(232,240,255,0.58); font: 500 12px "Segoe UI Variable", "Bahnschrift", sans-serif; letter-spacing: 0.14em; text-transform: uppercase; }
    .wo-object { cursor: pointer; }
    .wo-object-selected .wo-label { fill: #ffd68b; }
    .wo-object-selected .wo-label-secondary { fill: rgba(255, 214, 139, 0.78); }
    .wo-object-selected .wo-selection-ring { display: block; }
    .wo-selection-ring { display: none; fill: none; stroke: rgba(255, 214, 139, 0.9); stroke-width: 2; stroke-dasharray: 6 5; }
  </style>
  <rect class="wo-bg" x="0" y="0" width="${width}" height="${height}" rx="28" ry="28" />
  ${renderBackdrop(width, height)}
  <text class="wo-title" x="56" y="64">${escapeXml(title)}</text>
  <text class="wo-subtitle" x="56" y="88">WorldOrbit v0.1 render preview</text>
  <g data-worldorbit-world>
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
export function renderDocumentToSvg(document, options = {}) {
    return renderSceneToSvg(renderDocumentToScene(document, options));
}
export function renderSourceToSvg(source, options = {}) {
    const ast = parseWorldOrbit(source);
    const document = normalizeDocument(ast);
    validateDocument(document);
    return renderDocumentToSvg(document, options);
}
function createSceneObject(position) {
    const { object, x, y, radius, anchorX, anchorY } = position;
    const renderId = createRenderId(object.id);
    return {
        renderId,
        objectId: object.id,
        object,
        x,
        y,
        radius,
        visualRadius: visualExtentForObject(object, radius),
        anchorX,
        anchorY,
        label: object.id,
        secondaryLabel: object.type === "structure" ? String(object.properties.kind ?? object.type) : object.type,
        fillColor: customColorFor(object.properties.color),
        hidden: object.properties.hidden === true,
    };
}
function createOrbitVisual(draft) {
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
function createLeaderLine(draft) {
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
function calculateContentBounds(width, height, objects, orbitVisuals, leaders) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    const include = (x, y) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    };
    for (const orbit of orbitVisuals) {
        if (orbit.hidden) {
            continue;
        }
        const strokePadding = orbit.band ? 6 : 2;
        include(orbit.cx - orbit.radius - strokePadding, orbit.cy - orbit.radius - strokePadding);
        include(orbit.cx + orbit.radius + strokePadding, orbit.cy + orbit.radius + strokePadding);
    }
    for (const leader of leaders) {
        if (leader.hidden) {
            continue;
        }
        include(leader.x1, leader.y1);
        include(leader.x2, leader.y2);
    }
    for (const object of objects) {
        if (object.hidden) {
            continue;
        }
        const horizontalPad = 24;
        const verticalPad = 34;
        include(object.x - object.visualRadius - horizontalPad, object.y - object.visualRadius - 12);
        include(object.x + object.visualRadius + horizontalPad, object.y + object.visualRadius + verticalPad);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
        return createBounds(0, 0, width, height);
    }
    return createBounds(minX, minY, maxX, maxY);
}
function createBounds(minX, minY, maxX, maxY) {
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
function placeObject(object, x, y, depth, positions, orbitDrafts, leaderDrafts, context) {
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
function placeOrbitingChildren(object, positions, orbitDrafts, leaderDrafts, context) {
    const parent = positions.get(object.id);
    if (!parent) {
        return;
    }
    const orbiting = [...(context.orbitChildren.get(object.id) ?? [])].sort(compareOrbiting);
    const orbitRadii = computeOrbitRadii(orbiting, parent.radius);
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
        const anchorX = parent.x + Math.cos(angle) * parent.radius;
        const anchorY = parent.y + Math.sin(angle) * parent.radius;
        const x = parent.x + Math.cos(angle) * (parent.radius + 28);
        const y = parent.y + Math.sin(angle) * (parent.radius + 28);
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
function compareOrbiting(left, right) {
    const leftMetric = orbitMetric(left);
    const rightMetric = orbitMetric(right);
    if (leftMetric !== null && rightMetric !== null && leftMetric !== rightMetric) {
        return leftMetric - rightMetric;
    }
    if (leftMetric !== null && rightMetric === null) {
        return -1;
    }
    if (leftMetric === null && rightMetric !== null) {
        return 1;
    }
    return left.id.localeCompare(right.id);
}
function computeOrbitRadii(objects, parentRadius) {
    if (objects.length === 0) {
        return [];
    }
    const metrics = objects.map((object) => orbitMetric(object));
    const presentMetrics = metrics.filter((value) => value !== null);
    const inner = parentRadius + 54;
    const step = objects.length > 2 ? 54 : 64;
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
function orbitMetric(object) {
    if (!object.placement || object.placement.mode !== "orbit") {
        return null;
    }
    return toDistanceMetric(object.placement.semiMajor ?? object.placement.distance ?? null);
}
function resolveOrbitAngle(object, index, count) {
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
function resolveAtPosition(reference, positions, objectMap, index, count, width, height, padding) {
    if (reference.kind === "lagrange") {
        return resolveLagrangePosition(reference, positions, objectMap, width, height);
    }
    const anchor = positions.get(reference.name);
    if (anchor) {
        const angle = angleForIndex(index, count, Math.PI / 6);
        const distance = anchor.radius + 34;
        return {
            x: anchor.x + Math.cos(angle) * distance,
            y: anchor.y + Math.sin(angle) * distance,
            anchorX: anchor.x,
            anchorY: anchor.y,
        };
    }
    return {
        x: width - padding - 160,
        y: height - padding - 80 - index * 56,
    };
}
function resolveLagrangePosition(reference, positions, objectMap, width, height) {
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
function deriveParentAnchor(objectId, positions, objectMap) {
    const object = objectMap.get(objectId);
    if (!object?.placement || object.placement.mode !== "orbit") {
        return positions.get(objectId);
    }
    return positions.get(object.placement.target);
}
function visualRadiusFor(object, depth = 0) {
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
function visualExtentForObject(object, radius) {
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
function renderBackdrop(width, height) {
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
function renderSceneObject(sceneObject) {
    const { object, x, y, radius, label, secondaryLabel, visualRadius, fillColor } = sceneObject;
    const labelY = y + radius + 18;
    return `<g class="wo-object wo-object-${object.type}" data-object-id="${escapeXml(sceneObject.objectId)}" data-render-id="${escapeXml(sceneObject.renderId)}">
    <circle class="wo-selection-ring" cx="${x}" cy="${y}" r="${visualRadius + 8}" />
    ${renderObjectBody(object, x, y, radius, fillColor)}
    <text class="wo-label" x="${x}" y="${labelY}" text-anchor="middle">${escapeXml(label)}</text>
    <text class="wo-label-secondary" x="${x}" y="${labelY + 15}" text-anchor="middle">${escapeXml(secondaryLabel)}</text>
  </g>`;
}
function renderObjectBody(object, x, y, radius, fillColor) {
    switch (object.type) {
        case "star":
            return `<circle class="wo-star-glow" cx="${x}" cy="${y}" r="${radius * 2.4}" />
<circle class="wo-star-core" cx="${x}" cy="${y}" r="${radius}"${fillColor ? ` fill="${fillColor}"` : ""} />`;
        case "planet":
            return `<circle class="wo-planet" cx="${x}" cy="${y}" r="${radius}"${fillColor ? ` fill="${fillColor}"` : ""} />`;
        case "moon":
            return `<circle class="wo-moon" cx="${x}" cy="${y}" r="${radius}"${fillColor ? ` fill="${fillColor}"` : ""} />`;
        case "belt":
            return `<circle class="wo-belt" cx="${x}" cy="${y}" r="${radius}"${fillColor ? ` fill="${fillColor}"` : ""} />`;
        case "asteroid":
            return `<circle class="wo-asteroid" cx="${x}" cy="${y}" r="${radius}"${fillColor ? ` fill="${fillColor}"` : ""} />`;
        case "comet":
            return `<path class="wo-comet" d="M ${x - radius * 1.8} ${y + radius * 1.2} Q ${x - radius * 0.6} ${y + radius * 0.2} ${x - radius * 0.4} ${y}" /><circle class="wo-comet" cx="${x}" cy="${y}" r="${radius}"${fillColor ? ` fill="${fillColor}"` : ""} />`;
        case "ring":
            return `<circle class="wo-ring" cx="${x}" cy="${y}" r="${radius}"${fillColor ? ` fill="${fillColor}"` : ""} />`;
        case "structure":
            return `<polygon class="wo-structure" points="${x},${y - radius} ${x + radius},${y} ${x},${y + radius} ${x - radius},${y}"${fillColor ? ` fill="${fillColor}"` : ""} />`;
        case "phenomenon":
            return `<polygon class="wo-phenomenon" points="${x},${y - radius * 1.2} ${x + radius * 0.9},${y - radius * 0.3} ${x + radius * 1.2},${y + radius * 0.8} ${x},${y + radius * 1.2} ${x - radius * 1.1},${y + radius * 0.3} ${x - radius * 0.8},${y - radius * 0.8}"${fillColor ? ` fill="${fillColor}"` : ""} />`;
    }
}
function toDistanceMetric(value) {
    if (!value) {
        return null;
    }
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
function toVisualSizeMetric(value) {
    if (!value || typeof value !== "object" || !("value" in value)) {
        return null;
    }
    const unitValue = value;
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
function unitValueToDegrees(value) {
    if (value.unit === "deg" || value.unit === null) {
        return value.value;
    }
    return null;
}
function angleForIndex(index, count, startAngle) {
    if (count <= 1) {
        return startAngle;
    }
    return startAngle + (index * Math.PI * 2) / count;
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function pushGrouped(map, key, value) {
    const existing = map.get(key);
    if (existing) {
        existing.push(value);
    }
    else {
        map.set(key, [value]);
    }
}
function createRenderId(objectId) {
    const normalized = objectId
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "object";
    return `wo-${normalized}`;
}
function customColorFor(value) {
    return typeof value === "string" && value.trim() ? value : undefined;
}
function escapeXml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}
export function rotatePoint(point, center, rotationDeg) {
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
