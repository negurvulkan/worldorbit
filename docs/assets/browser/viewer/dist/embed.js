import { WorldOrbit3DUnavailableError } from "./errors.js";
import { renderSceneToSvg } from "./render.js";
import { createInteractiveViewer } from "./viewer.js";
const EMBED_SELECTOR = "[data-worldorbit-embed]";
export function serializeWorldOrbitEmbedPayload(payload) {
    return encodeURIComponent(JSON.stringify(payload));
}
export function deserializeWorldOrbitEmbedPayload(serialized) {
    const raw = JSON.parse(decodeURIComponent(serialized));
    return {
        version: "2.0",
        mode: normalizeEmbedMode(raw.mode),
        scene: raw.scene,
        spatialScene: raw.spatialScene ?? undefined,
        options: raw.options
            ? {
                ...raw.options,
                viewMode: raw.options.viewMode ?? embedModeToViewMode(normalizeEmbedMode(raw.mode)),
                initialFilter: raw.options.initialFilter ?? null,
                atlasState: raw.options.atlasState ?? null,
            }
            : undefined,
    };
}
export function createEmbedPayload(scene, mode, options = {}) {
    return {
        version: "2.0",
        mode: normalizeEmbedMode(mode),
        scene,
        spatialScene: options.spatialScene,
        options: {
            viewMode: options.viewMode ?? embedModeToViewMode(normalizeEmbedMode(mode)),
            initialViewpointId: options.initialViewpointId,
            initialSelectionObjectId: options.initialSelectionObjectId,
            initialFilter: options.initialFilter ?? null,
            atlasState: options.atlasState ?? null,
            minimap: options.minimap,
        },
    };
}
export function createWorldOrbitEmbedMarkup(payload, options = {}) {
    const mergedPayload = {
        ...payload,
        options: {
            ...payload.options,
            theme: options.theme ?? payload.options?.theme,
            layers: options.layers ?? payload.options?.layers,
            subtitle: options.subtitle ?? payload.options?.subtitle,
            preset: options.preset ?? payload.options?.preset,
            viewMode: options.viewMode ?? payload.options?.viewMode ?? embedModeToViewMode(normalizeEmbedMode(payload.mode)),
            initialViewpointId: options.initialViewpointId ?? payload.options?.initialViewpointId,
            initialSelectionObjectId: options.initialSelectionObjectId ?? payload.options?.initialSelectionObjectId,
            initialFilter: options.initialFilter ?? payload.options?.initialFilter ?? null,
            atlasState: options.atlasState ?? payload.options?.atlasState ?? null,
            minimap: options.minimap ?? payload.options?.minimap,
        },
    };
    const html = renderSceneToSvg(payload.scene, {
        theme: mergedPayload.options?.theme,
        layers: mergedPayload.options?.layers,
        filter: mergedPayload.options?.initialFilter ?? null,
        selectedObjectId: mergedPayload.options?.initialSelectionObjectId ?? null,
        subtitle: mergedPayload.options?.subtitle,
        preset: mergedPayload.options?.preset,
    });
    return `<div class="${escapeAttribute(options.className ?? "worldorbit-embed")}" data-worldorbit-embed="true" data-worldorbit-mode="${mergedPayload.mode}" data-worldorbit-preset="${escapeAttribute(mergedPayload.options?.preset ?? payload.scene.renderPreset ?? "custom")}" data-worldorbit-viewpoint="${escapeAttribute(mergedPayload.options?.initialViewpointId ?? "")}" data-worldorbit-payload="${escapeAttribute(serializeWorldOrbitEmbedPayload(mergedPayload))}">${html}</div>`;
}
export function mountWorldOrbitEmbeds(root = document, options = {}) {
    const viewers = new Map();
    const cleanupCallbacks = [];
    const elements = [...root.querySelectorAll(EMBED_SELECTOR)];
    for (const element of elements) {
        const payload = deserializePayloadFromElement(element);
        const mode = normalizeEmbedMode(options.mode ?? payload.mode);
        const theme = options.theme ?? payload.options?.theme;
        const layers = options.layers ?? payload.options?.layers;
        const subtitle = options.subtitle ?? payload.options?.subtitle;
        const preset = options.preset ?? payload.options?.preset ?? payload.scene.renderPreset ?? undefined;
        const initialFilter = options.viewer?.initialFilter ?? payload.options?.initialFilter ?? null;
        const initialViewpointId = options.viewer?.initialViewpointId ?? payload.options?.initialViewpointId;
        const initialSelectionObjectId = options.viewer?.initialSelectionObjectId ?? payload.options?.initialSelectionObjectId;
        const minimap = options.viewer?.minimap ?? payload.options?.minimap;
        const viewMode = options.viewer?.viewMode ??
            payload.options?.viewMode ??
            embedModeToViewMode(mode);
        const measureViewport = () => resolveEmbedViewport(element, payload.scene, options);
        if (mode === "interactive-2d" || mode === "interactive-3d") {
            try {
                const viewport = measureViewport();
                const viewer = createInteractiveViewer(element, {
                    ...options.viewer,
                    scene: payload.scene,
                    spatialScene: payload.spatialScene,
                    width: viewport.width,
                    height: viewport.height,
                    padding: options.padding ?? payload.scene.padding,
                    preset,
                    theme,
                    layers,
                    subtitle,
                    viewMode,
                    initialFilter,
                    initialViewpointId,
                    initialSelectionObjectId,
                    minimap,
                });
                if (payload.options?.atlasState) {
                    viewer.setAtlasState(payload.options.atlasState);
                }
                viewers.set(element, viewer);
                cleanupCallbacks.push(bindEmbedResize(element, () => {
                    const nextViewport = measureViewport();
                    viewer.setRenderOptions({
                        width: nextViewport.width,
                        height: nextViewport.height,
                    });
                }));
                options.onMount?.(viewer, element);
            }
            catch (error) {
                if (error instanceof WorldOrbit3DUnavailableError && mode === "interactive-3d") {
                    element.innerHTML = render3DUnavailableMarkup(error.message);
                    options.onMount?.(null, element);
                }
                else {
                    throw error;
                }
            }
        }
        else {
            const renderStaticEmbed = () => {
                const viewport = measureViewport();
                element.innerHTML = renderSceneToSvg(payload.scene, {
                    width: viewport.width,
                    height: viewport.height,
                    padding: options.padding ?? payload.scene.padding,
                    preset,
                    theme,
                    layers,
                    filter: initialFilter,
                    selectedObjectId: initialSelectionObjectId ?? null,
                    subtitle,
                });
            };
            renderStaticEmbed();
            cleanupCallbacks.push(bindEmbedResize(element, renderStaticEmbed));
            options.onMount?.(null, element);
        }
        element.dataset.worldorbitMounted = "true";
    }
    return {
        viewers: [...viewers.values()],
        destroy() {
            for (const cleanup of cleanupCallbacks) {
                cleanup();
            }
            for (const [element, viewer] of viewers.entries()) {
                viewer.destroy();
                element.removeAttribute("data-worldorbit-mounted");
            }
            for (const element of elements) {
                element.removeAttribute("data-worldorbit-mounted");
            }
            viewers.clear();
        },
    };
}
function resolveEmbedViewport(element, scene, options) {
    const rect = element.getBoundingClientRect();
    const width = sanitizeViewportDimension(options.width) ??
        sanitizeViewportDimension(element.clientWidth) ??
        sanitizeViewportDimension(rect.width) ??
        scene.width;
    const explicitHeight = sanitizeViewportDimension(options.height) ??
        sanitizeViewportDimension(element.clientHeight) ??
        sanitizeViewportDimension(rect.height);
    const fallbackHeight = Math.max(Math.round(width * (scene.height / Math.max(scene.width, 1))), Math.min(scene.height, 240));
    return {
        width,
        height: explicitHeight ?? fallbackHeight,
    };
}
function sanitizeViewportDimension(value) {
    return typeof value === "number" && Number.isFinite(value) && value > 0
        ? Math.round(value)
        : null;
}
function bindEmbedResize(element, callback) {
    let lastWidth = -1;
    let lastHeight = -1;
    const run = () => {
        const rect = element.getBoundingClientRect();
        const nextWidth = Math.round(Math.max(element.clientWidth || rect.width, 0));
        const nextHeight = Math.round(Math.max(element.clientHeight || rect.height, 0));
        if (nextWidth === lastWidth && nextHeight === lastHeight) {
            return;
        }
        lastWidth = nextWidth;
        lastHeight = nextHeight;
        callback();
    };
    run();
    if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(() => {
            run();
        });
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }
    const handleWindowResize = () => {
        run();
    };
    window.addEventListener("resize", handleWindowResize);
    return () => {
        window.removeEventListener("resize", handleWindowResize);
    };
}
function deserializePayloadFromElement(element) {
    const serialized = element.dataset.worldorbitPayload;
    if (!serialized) {
        throw new Error("WorldOrbit embed is missing data-worldorbit-payload.");
    }
    return deserializeWorldOrbitEmbedPayload(serialized);
}
function escapeAttribute(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;");
}
function normalizeEmbedMode(mode) {
    if (!mode || mode === "interactive") {
        return "interactive-2d";
    }
    return mode;
}
function embedModeToViewMode(mode) {
    return mode === "interactive-3d" ? "3d" : "2d";
}
export function render3DUnavailableMarkup(message) {
    return `<div class="worldorbit-embed-unavailable" data-worldorbit-3d-unavailable="true"><strong>3D unavailable</strong><span>${escapeAttribute(message)}</span></div>`;
}
