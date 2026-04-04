import { renderDocumentToScene } from "@worldorbit/core";
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 760;
const DEFAULT_PADDING = 72;
export function renderCosmosDocumentToScene(document, options = {}) {
    const width = options.width ?? DEFAULT_WIDTH;
    const height = options.height ?? DEFAULT_HEIGHT;
    const padding = options.padding ?? DEFAULT_PADDING;
    const scope = options.scope ?? "system";
    const zoom = options.zoom ?? 1;
    const activeGalaxy = resolveGalaxy(document, options.activeGalaxyId);
    const activeSystem = resolveSystem(document, activeGalaxy, options.activeSystemId);
    if (scope === "system") {
        return renderSystemScope(document, activeGalaxy, activeSystem, width, height, padding, zoom);
    }
    if (scope === "galaxy") {
        return renderGalaxyScope(document, activeGalaxy, width, height, padding, zoom);
    }
    return renderUniverseScope(document, width, height, padding, zoom, activeGalaxy, activeSystem);
}
function renderSystemScope(document, galaxy, system, width, height, padding, zoom) {
    const atlasScene = system?.materializedDocument
        ? renderDocumentToScene(system.materializedDocument, {
            width,
            height,
            padding,
        })
        : null;
    return {
        scope: "system",
        width,
        height,
        padding,
        title: system?.title ?? system?.id ?? document.universe.title ?? document.universe.id,
        subtitle: galaxy ? `${galaxy.title ?? galaxy.id} galaxy system view` : "System view",
        universeId: document.universe.id,
        activeGalaxyId: galaxy?.id ?? null,
        activeSystemId: system?.id ?? null,
        zoom,
        nodes: [],
        links: [],
        atlasScene,
        diagnostics: system?.diagnostics ?? document.diagnostics,
    };
}
function renderGalaxyScope(document, galaxy, width, height, padding, zoom) {
    const targetGalaxy = galaxy ?? document.universe.galaxies[0] ?? null;
    const nodes = [];
    const links = [];
    if (!targetGalaxy) {
        return emptyContainerScene(document, "galaxy", width, height, padding, zoom);
    }
    const centerX = width / 2;
    const centerY = height / 2;
    const galaxyRadius = Math.min(width, height) * 0.23;
    nodes.push(createNode(targetGalaxy.id, "galaxy", targetGalaxy.title ?? targetGalaxy.id, targetGalaxy.description, null, centerX, centerY, galaxyRadius, targetGalaxy.color, targetGalaxy.image, targetGalaxy.hidden, false));
    const systemRadius = Math.max(34, Math.min(72, 48 * zoom));
    const orbitRadius = Math.min(width, height) * 0.31;
    const systems = targetGalaxy.systems.filter((system) => !system.hidden);
    systems.forEach((system, index) => {
        const angle = (-Math.PI / 2) + (index * (Math.PI * 2)) / Math.max(systems.length, 1);
        const x = centerX + Math.cos(angle) * orbitRadius;
        const y = centerY + Math.sin(angle) * orbitRadius;
        nodes.push(createNode(system.id, "system", system.title ?? system.id, system.description, targetGalaxy.id, x, y, systemRadius, system.color ?? "#7bd0ff", system.image, system.hidden, false));
        links.push(createLink(targetGalaxy.id, system.id));
        if (zoom >= 1.4) {
            nodes.push(...createSystemPreviewNodes(system, x, y, systemRadius, targetGalaxy.id));
        }
    });
    return {
        scope: "galaxy",
        width,
        height,
        padding,
        title: targetGalaxy.title ?? targetGalaxy.id,
        subtitle: `${systems.length} systems visible`,
        universeId: document.universe.id,
        activeGalaxyId: targetGalaxy.id,
        activeSystemId: null,
        zoom,
        nodes,
        links,
        atlasScene: null,
        diagnostics: targetGalaxy.systems.flatMap((system) => system.diagnostics),
    };
}
function renderUniverseScope(document, width, height, padding, zoom, activeGalaxy, activeSystem) {
    const nodes = [];
    const links = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const universeRadius = Math.min(width, height) * 0.24;
    nodes.push(createNode(document.universe.id, "universe", document.universe.title ?? document.universe.id, document.universe.description, null, centerX, centerY, universeRadius, document.universe.color, document.universe.image, document.universe.hidden, false));
    const galaxies = document.universe.galaxies.filter((galaxy) => !galaxy.hidden);
    const galaxyOrbit = Math.min(width, height) * 0.34;
    const galaxyRadius = Math.max(54, Math.min(88, 68 * zoom));
    galaxies.forEach((galaxy, index) => {
        const angle = (-Math.PI / 2) + (index * (Math.PI * 2)) / Math.max(galaxies.length, 1);
        const x = centerX + Math.cos(angle) * galaxyOrbit;
        const y = centerY + Math.sin(angle) * galaxyOrbit;
        nodes.push(createNode(galaxy.id, "galaxy", galaxy.title ?? galaxy.id, galaxy.description, document.universe.id, x, y, galaxyRadius, galaxy.color ?? "#93a7ff", galaxy.image, galaxy.hidden, false));
        links.push(createLink(document.universe.id, galaxy.id));
        if (zoom >= 1.25) {
            nodes.push(...createGalaxyPreviewNodes(galaxy, x, y, galaxyRadius));
        }
    });
    return {
        scope: "universe",
        width,
        height,
        padding,
        title: document.universe.title ?? document.universe.id,
        subtitle: `${galaxies.length} galaxies visible`,
        universeId: document.universe.id,
        activeGalaxyId: activeGalaxy?.id ?? null,
        activeSystemId: activeSystem?.id ?? null,
        zoom,
        nodes,
        links,
        atlasScene: null,
        diagnostics: document.diagnostics,
    };
}
function emptyContainerScene(document, scope, width, height, padding, zoom) {
    return {
        scope,
        width,
        height,
        padding,
        title: document.universe.title ?? document.universe.id,
        subtitle: "No visible containers",
        universeId: document.universe.id,
        activeGalaxyId: null,
        activeSystemId: null,
        zoom,
        nodes: [],
        links: [],
        atlasScene: null,
        diagnostics: document.diagnostics,
    };
}
function createGalaxyPreviewNodes(galaxy, centerX, centerY, radius) {
    const systems = galaxy.systems.filter((system) => !system.hidden).slice(0, 8);
    return systems.map((system, index) => {
        const angle = (-Math.PI / 2) + (index * (Math.PI * 2)) / Math.max(systems.length, 1);
        return createNode(`${galaxy.id}/${system.id}`, "system", system.title ?? system.id, null, galaxy.id, centerX + Math.cos(angle) * radius * 0.58, centerY + Math.sin(angle) * radius * 0.58, Math.max(9, radius * 0.12), system.color ?? "#7bd0ff", system.image, false, true);
    });
}
function createSystemPreviewNodes(system, centerX, centerY, radius, parentId) {
    const objects = system.materializedDocument?.objects.slice(0, 8) ?? [];
    return objects.map((object, index) => {
        const angle = (-Math.PI / 2) + (index * (Math.PI * 2)) / Math.max(objects.length, 1);
        return createNode(`${system.id}/${object.id}`, "object", object.id, typeof object.properties.class === "string" ? object.properties.class : object.type, parentId, centerX + Math.cos(angle) * radius * 0.58, centerY + Math.sin(angle) * radius * 0.58, Math.max(7, radius * 0.1), typeof object.properties.color === "string" ? object.properties.color : "#c8d7ff", typeof object.properties.image === "string" ? object.properties.image : null, false, true);
    });
}
function resolveGalaxy(document, activeGalaxyId) {
    if (activeGalaxyId) {
        return document.universe.galaxies.find((galaxy) => galaxy.id === activeGalaxyId) ?? null;
    }
    return document.universe.galaxies[0] ?? null;
}
function resolveSystem(document, galaxy, activeSystemId) {
    if (activeSystemId) {
        for (const item of document.universe.galaxies) {
            const found = item.systems.find((system) => system.id === activeSystemId);
            if (found) {
                return found;
            }
        }
    }
    return galaxy?.systems[0] ?? null;
}
function createNode(id, kind, label, subtitle, parentId, x, y, radius, fill, image, hidden, preview) {
    return {
        renderId: `cosmos-${kind}-${id}`,
        id,
        kind,
        label,
        subtitle,
        parentId,
        x,
        y,
        radius,
        fill,
        image,
        hidden,
        preview,
    };
}
function createLink(fromId, toId) {
    return {
        renderId: `cosmos-link-${fromId}-${toId}`,
        fromId,
        toId,
        kind: "containment",
    };
}
