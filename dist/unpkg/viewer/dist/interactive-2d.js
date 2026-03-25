import { renderSceneToSvg, WORLD_LAYER_ID } from "./render.js";
import { DEFAULT_VIEWER_STATE, composeViewerTransform, fitViewerState, panViewerState, zoomViewerStateAt, } from "./viewer-state.js";
export { renderSceneToSvg } from "./render.js";
export { resolveTheme } from "./theme.js";
const DEFAULT_VIEWER_LIMITS = {
    minScale: 0.2,
    maxScale: 8,
    fitPadding: 48,
};
export function createInteractiveViewer2D(container, scene, options = {}) {
    const constraints = {
        minScale: options.minScale ?? DEFAULT_VIEWER_LIMITS.minScale,
        maxScale: options.maxScale ?? DEFAULT_VIEWER_LIMITS.maxScale,
        fitPadding: options.fitPadding ?? DEFAULT_VIEWER_LIMITS.fitPadding,
    };
    const behavior = {
        pointer: options.pointer ?? true,
        touch: options.touch ?? true,
        selection: options.selection ?? true,
    };
    let renderOptions = {
        width: options.width,
        height: options.height,
        padding: options.padding,
        preset: options.preset,
        theme: options.theme,
        layers: options.layers,
        subtitle: options.subtitle,
        pointer: behavior.pointer,
        touch: behavior.touch,
        selection: behavior.selection,
        minScale: constraints.minScale,
        maxScale: constraints.maxScale,
        fitPadding: constraints.fitPadding,
    };
    let state = fitViewerState(scene, DEFAULT_VIEWER_STATE, constraints);
    let svgElement = null;
    let cameraRoot = null;
    let destroyed = false;
    let activePointerId = null;
    let lastPointerClientPoint = null;
    let dragDistance = 0;
    const previousTabIndex = container.getAttribute("tabindex");
    const previousTouchAction = container.style.touchAction;
    if (previousTabIndex === null) {
        container.tabIndex = 0;
    }
    container.classList.add("wo-viewer-container");
    container.style.touchAction = behavior.touch ? "none" : previousTouchAction;
    const handleWheel = (event) => {
        if (!behavior.pointer || destroyed || !svgElement) {
            return;
        }
        event.preventDefault();
        container.focus();
        const anchor = getScenePointFromClient(event.clientX, event.clientY);
        const factor = clamp(Math.exp(-event.deltaY * 0.002), 0.6, 1.6);
        updateState(zoomViewerStateAt(scene, state, factor, anchor, constraints));
    };
    const handlePointerDown = (event) => {
        if (destroyed) {
            return;
        }
        const isTouch = event.pointerType === "touch";
        if ((isTouch && !behavior.touch) || (!isTouch && !behavior.pointer)) {
            return;
        }
        if (!isTouch && event.button !== 0) {
            return;
        }
        activePointerId = event.pointerId;
        lastPointerClientPoint = { x: event.clientX, y: event.clientY };
        dragDistance = 0;
        container.setPointerCapture?.(event.pointerId);
        container.focus();
    };
    const handlePointerMove = (event) => {
        if (destroyed || activePointerId !== event.pointerId || !lastPointerClientPoint) {
            return;
        }
        const rect = svgElement?.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) {
            return;
        }
        const dx = event.clientX - lastPointerClientPoint.x;
        const dy = event.clientY - lastPointerClientPoint.y;
        lastPointerClientPoint = { x: event.clientX, y: event.clientY };
        dragDistance += Math.hypot(dx, dy);
        updateState(panViewerState(state, dx * (scene.width / rect.width), dy * (scene.height / rect.height)));
    };
    const stopPointer = (event) => {
        if (activePointerId !== event.pointerId) {
            return;
        }
        activePointerId = null;
        lastPointerClientPoint = null;
        container.releasePointerCapture?.(event.pointerId);
    };
    const handleClick = (event) => {
        if (destroyed || !behavior.selection || dragDistance > 6) {
            return;
        }
        const objectEl = event.target?.closest(".wo-object[data-object-id]");
        if (!objectEl) {
            return;
        }
        updateState({
            ...state,
            selectedObjectId: objectEl.dataset.objectId ?? null,
        });
        renderSvg();
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", stopPointer);
    container.addEventListener("pointercancel", stopPointer);
    container.addEventListener("click", handleClick);
    renderSvg();
    return {
        getState() {
            return { ...state };
        },
        setState(nextState) {
            updateState({
                ...state,
                ...nextState,
            });
            if ("selectedObjectId" in nextState) {
                renderSvg();
            }
        },
        setRenderOptions(nextOptions) {
            renderOptions = {
                ...renderOptions,
                ...nextOptions,
            };
            renderSvg();
        },
        fitToSystem() {
            updateState(fitViewerState(scene, state, constraints));
        },
        destroy() {
            if (destroyed) {
                return;
            }
            destroyed = true;
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("pointerdown", handlePointerDown);
            container.removeEventListener("pointermove", handlePointerMove);
            container.removeEventListener("pointerup", stopPointer);
            container.removeEventListener("pointercancel", stopPointer);
            container.removeEventListener("click", handleClick);
            if (previousTabIndex === null) {
                container.removeAttribute("tabindex");
            }
            container.style.touchAction = previousTouchAction;
            container.replaceChildren();
            svgElement = null;
            cameraRoot = null;
        },
    };
    function renderSvg() {
        if (destroyed) {
            return;
        }
        container.innerHTML = renderSceneToSvg(scene, {
            width: renderOptions.width,
            height: renderOptions.height,
            padding: renderOptions.padding,
            preset: renderOptions.preset,
            theme: renderOptions.theme,
            layers: renderOptions.layers,
            subtitle: renderOptions.subtitle,
            selectedObjectId: state.selectedObjectId,
        });
        svgElement = container.querySelector("svg");
        cameraRoot = container.querySelector(`[data-worldorbit-camera-root="${WORLD_LAYER_ID}"]`);
        applyTransform();
    }
    function applyTransform() {
        cameraRoot?.setAttribute("transform", composeViewerTransform(scene, state));
    }
    function updateState(nextState) {
        state = nextState;
        applyTransform();
    }
    function getScenePointFromClient(clientX, clientY) {
        const rect = svgElement?.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) {
            return { x: scene.width / 2, y: scene.height / 2 };
        }
        return {
            x: ((clientX - rect.left) / rect.width) * scene.width,
            y: ((clientY - rect.top) / rect.height) * scene.height,
        };
    }
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
