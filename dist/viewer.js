import { normalizeDocument } from "./normalize.js";
import { parseWorldOrbit } from "./parse.js";
import { renderDocumentToScene, renderSceneToSvg } from "./render.js";
import { validateDocument } from "./validate.js";
import { DEFAULT_VIEWER_STATE, composeViewerTransform, fitViewerState, focusViewerState, panViewerState, rotateViewerState, zoomViewerStateAt, } from "./viewer-state.js";
const DEFAULT_VIEWER_LIMITS = {
    minScale: 0.2,
    maxScale: 8,
    fitPadding: 48,
    panStep: 40,
    zoomStep: 1.2,
    rotationStep: 15,
};
export function createInteractiveViewer(container, options) {
    ensureBrowserEnvironment(container);
    const inputCount = Number(Boolean(options.source)) + Number(Boolean(options.document)) + Number(Boolean(options.scene));
    if (inputCount !== 1) {
        throw new Error('Interactive viewer requires exactly one of "source", "document", or "scene".');
    }
    const constraints = {
        minScale: options.minScale ?? DEFAULT_VIEWER_LIMITS.minScale,
        maxScale: options.maxScale ?? DEFAULT_VIEWER_LIMITS.maxScale,
        fitPadding: options.fitPadding ?? DEFAULT_VIEWER_LIMITS.fitPadding,
    };
    const behavior = {
        keyboard: options.keyboard ?? true,
        pointer: options.pointer ?? true,
        touch: options.touch ?? true,
        selection: options.selection ?? true,
        panStep: options.panStep ?? DEFAULT_VIEWER_LIMITS.panStep,
        zoomStep: options.zoomStep ?? DEFAULT_VIEWER_LIMITS.zoomStep,
        rotationStep: options.rotationStep ?? DEFAULT_VIEWER_LIMITS.rotationStep,
    };
    const renderOptions = {
        width: options.width,
        height: options.height,
        padding: options.padding,
    };
    const previousTabIndex = container.getAttribute("tabindex");
    const previousTouchAction = container.style.touchAction;
    let scene = resolveInitialScene(options, renderOptions);
    let state = { ...DEFAULT_VIEWER_STATE };
    let svgElement = null;
    let cameraRoot = null;
    let suppressClick = false;
    let activePointerId = null;
    let lastPointerPoint = null;
    let dragDistance = 0;
    let destroyed = false;
    let touchPoints = new Map();
    let touchGesture = null;
    if (previousTabIndex === null) {
        container.tabIndex = 0;
    }
    container.classList.add("wo-viewer-container");
    container.style.touchAction = behavior.touch ? "none" : previousTouchAction;
    const handleWheel = (event) => {
        if (!behavior.pointer || destroyed) {
            return;
        }
        event.preventDefault();
        container.focus();
        const anchor = getScenePointFromClient(event.clientX, event.clientY);
        const factor = clampValue(Math.exp(-event.deltaY * 0.002), 0.6, 1.6);
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
        container.focus();
        container.setPointerCapture?.(event.pointerId);
        const point = getScenePointFromClient(event.clientX, event.clientY);
        if (isTouch) {
            touchPoints.set(event.pointerId, point);
            if (touchPoints.size === 2) {
                touchGesture = createTouchGestureState(state, touchPoints);
            }
            return;
        }
        activePointerId = event.pointerId;
        lastPointerPoint = point;
        dragDistance = 0;
        suppressClick = false;
    };
    const handlePointerMove = (event) => {
        if (destroyed) {
            return;
        }
        const isTouch = event.pointerType === "touch";
        if (isTouch) {
            if (!behavior.touch || !touchPoints.has(event.pointerId)) {
                return;
            }
            touchPoints.set(event.pointerId, getScenePointFromClient(event.clientX, event.clientY));
            if (touchPoints.size === 2) {
                if (!touchGesture) {
                    touchGesture = createTouchGestureState(state, touchPoints);
                }
                const current = getTouchCenterAndDistance(touchPoints);
                const factor = current.distance / Math.max(touchGesture.startDistance, 1);
                const zoomedState = zoomViewerStateAt(scene, touchGesture.startState, factor, touchGesture.startCenter, constraints);
                const deltaX = current.center.x - touchGesture.startCenter.x;
                const deltaY = current.center.y - touchGesture.startCenter.y;
                updateState(panViewerState(zoomedState, deltaX, deltaY));
            }
            return;
        }
        if (!behavior.pointer || activePointerId !== event.pointerId || !lastPointerPoint) {
            return;
        }
        const nextPoint = getScenePointFromClient(event.clientX, event.clientY);
        const deltaX = nextPoint.x - lastPointerPoint.x;
        const deltaY = nextPoint.y - lastPointerPoint.y;
        dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
        lastPointerPoint = nextPoint;
        if (dragDistance > 2) {
            suppressClick = true;
        }
        updateState(panViewerState(state, deltaX, deltaY));
    };
    const handlePointerEnd = (event) => {
        if (event.pointerType === "touch") {
            touchPoints.delete(event.pointerId);
            if (touchPoints.size < 2) {
                touchGesture = null;
            }
            return;
        }
        if (activePointerId === event.pointerId) {
            activePointerId = null;
            lastPointerPoint = null;
        }
    };
    const handleClick = (event) => {
        if (!behavior.selection || destroyed) {
            return;
        }
        if (suppressClick) {
            suppressClick = false;
            return;
        }
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        const objectElement = target.closest("[data-object-id]");
        if (!objectElement) {
            applySelection(null);
            return;
        }
        applySelection(objectElement.dataset.objectId ?? null);
    };
    const handleKeyDown = (event) => {
        if (!behavior.keyboard || destroyed) {
            return;
        }
        switch (event.key) {
            case "+":
            case "=":
                event.preventDefault();
                api.zoomBy(behavior.zoomStep);
                return;
            case "-":
                event.preventDefault();
                api.zoomBy(1 / behavior.zoomStep);
                return;
            case "ArrowLeft":
                event.preventDefault();
                api.panBy(-behavior.panStep, 0);
                return;
            case "ArrowRight":
                event.preventDefault();
                api.panBy(behavior.panStep, 0);
                return;
            case "ArrowUp":
                event.preventDefault();
                api.panBy(0, -behavior.panStep);
                return;
            case "ArrowDown":
                event.preventDefault();
                api.panBy(0, behavior.panStep);
                return;
            case "[":
                event.preventDefault();
                api.rotateBy(-behavior.rotationStep);
                return;
            case "]":
                event.preventDefault();
                api.rotateBy(behavior.rotationStep);
                return;
            case "f":
            case "F":
                event.preventDefault();
                api.fitToSystem();
                return;
            case "0":
                event.preventDefault();
                api.resetView();
                return;
        }
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerEnd);
    container.addEventListener("pointercancel", handlePointerEnd);
    container.addEventListener("click", handleClick);
    container.addEventListener("keydown", handleKeyDown);
    const api = {
        setSource(source) {
            scene = renderDocumentToScene(parseSource(source), renderOptions);
            rerenderScene(true);
        },
        setDocument(document) {
            scene = renderDocumentToScene(document, renderOptions);
            rerenderScene(true);
        },
        setScene(nextScene) {
            scene = nextScene;
            rerenderScene(true);
        },
        getState() {
            return { ...state };
        },
        setState(nextState) {
            updateState(sanitizeState({ ...state, ...nextState }));
        },
        zoomBy(factor, anchor) {
            updateState(zoomViewerStateAt(scene, state, factor, anchor ?? { x: scene.width / 2, y: scene.height / 2 }, constraints));
        },
        panBy(dx, dy) {
            updateState(panViewerState(state, dx, dy));
        },
        rotateBy(deg) {
            updateState(rotateViewerState(state, deg));
        },
        fitToSystem() {
            updateState(fitViewerState(scene, state, constraints));
        },
        focusObject(id) {
            updateState(focusViewerState(scene, state, id, constraints));
            applySelection(id);
        },
        resetView() {
            const resetState = fitViewerState(scene, { ...DEFAULT_VIEWER_STATE }, constraints);
            updateState(resetState);
            applySelection(null);
        },
        destroy() {
            if (destroyed) {
                return;
            }
            destroyed = true;
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("pointerdown", handlePointerDown);
            container.removeEventListener("pointermove", handlePointerMove);
            container.removeEventListener("pointerup", handlePointerEnd);
            container.removeEventListener("pointercancel", handlePointerEnd);
            container.removeEventListener("click", handleClick);
            container.removeEventListener("keydown", handleKeyDown);
            container.classList.remove("wo-viewer-container");
            container.style.touchAction = previousTouchAction;
            if (previousTabIndex === null) {
                container.removeAttribute("tabindex");
            }
            else {
                container.setAttribute("tabindex", previousTabIndex);
            }
        },
    };
    rerenderScene(true);
    return api;
    function rerenderScene(resetView) {
        container.innerHTML = renderSceneToSvg(scene);
        svgElement = container.querySelector("svg");
        cameraRoot = container.querySelector(`#worldorbit-camera-root`);
        if (!svgElement || !cameraRoot) {
            throw new Error("Interactive viewer could not locate the rendered SVG camera root.");
        }
        state = resetView
            ? fitViewerState(scene, { ...DEFAULT_VIEWER_STATE }, constraints)
            : sanitizeState(state);
        applySelection(state.selectedObjectId &&
            scene.objects.some((object) => object.objectId === state.selectedObjectId && !object.hidden)
            ? state.selectedObjectId
            : null, false);
        updateCameraTransform();
        options.onViewChange?.({ ...state });
    }
    function updateState(nextState) {
        state = sanitizeState(nextState);
        updateCameraTransform();
        options.onViewChange?.({ ...state });
    }
    function sanitizeState(nextState) {
        return {
            scale: clampValue(nextState.scale, constraints.minScale, constraints.maxScale),
            rotationDeg: normalizeRotation(nextState.rotationDeg),
            translateX: Number.isFinite(nextState.translateX) ? nextState.translateX : state.translateX,
            translateY: Number.isFinite(nextState.translateY) ? nextState.translateY : state.translateY,
            selectedObjectId: nextState.selectedObjectId &&
                scene.objects.some((object) => object.objectId === nextState.selectedObjectId && !object.hidden)
                ? nextState.selectedObjectId
                : null,
        };
    }
    function updateCameraTransform() {
        if (!cameraRoot) {
            return;
        }
        cameraRoot.setAttribute("transform", composeViewerTransform(scene, state));
    }
    function applySelection(objectId, emitCallback = true) {
        if (state.selectedObjectId) {
            const previous = container.querySelector(`[data-object-id="${cssEscape(state.selectedObjectId)}"]`);
            previous?.classList.remove("wo-object-selected");
        }
        state = {
            ...state,
            selectedObjectId: objectId &&
                scene.objects.some((object) => object.objectId === objectId && !object.hidden)
                ? objectId
                : null,
        };
        if (state.selectedObjectId) {
            const next = container.querySelector(`[data-object-id="${cssEscape(state.selectedObjectId)}"]`);
            next?.classList.add("wo-object-selected");
        }
        if (emitCallback) {
            options.onSelectionChange?.(getSelectedObject());
            options.onViewChange?.({ ...state });
        }
    }
    function getSelectedObject() {
        return (scene.objects.find((object) => object.objectId === state.selectedObjectId && !object.hidden) ?? null);
    }
    function getScenePointFromClient(clientX, clientY) {
        if (!svgElement) {
            return {
                x: scene.width / 2,
                y: scene.height / 2,
            };
        }
        const rect = svgElement.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return {
                x: scene.width / 2,
                y: scene.height / 2,
            };
        }
        return {
            x: ((clientX - rect.left) / rect.width) * scene.width,
            y: ((clientY - rect.top) / rect.height) * scene.height,
        };
    }
}
function resolveInitialScene(options, renderOptions) {
    if (options.scene) {
        return options.scene;
    }
    if (options.document) {
        return renderDocumentToScene(options.document, renderOptions);
    }
    if (options.source) {
        return renderDocumentToScene(parseSource(options.source), renderOptions);
    }
    throw new Error("Interactive viewer requires an initial render input.");
}
function parseSource(source) {
    const ast = parseWorldOrbit(source);
    const document = normalizeDocument(ast);
    validateDocument(document);
    return document;
}
function createTouchGestureState(state, touchPoints) {
    const { center, distance } = getTouchCenterAndDistance(touchPoints);
    return {
        startState: { ...state },
        startCenter: center,
        startDistance: distance,
    };
}
function getTouchCenterAndDistance(touchPoints) {
    const points = [...touchPoints.values()];
    if (points.length < 2) {
        return {
            center: points[0] ?? { x: 0, y: 0 },
            distance: 1,
        };
    }
    const [first, second] = points;
    return {
        center: {
            x: (first.x + second.x) / 2,
            y: (first.y + second.y) / 2,
        },
        distance: Math.hypot(second.x - first.x, second.y - first.y),
    };
}
function ensureBrowserEnvironment(container) {
    if (typeof window === "undefined" || typeof document === "undefined") {
        throw new Error("createInteractiveViewer can only run in a browser environment.");
    }
    if (!(container instanceof HTMLElement)) {
        throw new Error("Interactive viewer requires an HTMLElement container.");
    }
}
function clampValue(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function normalizeRotation(rotationDeg) {
    let normalized = rotationDeg % 360;
    if (normalized > 180) {
        normalized -= 360;
    }
    if (normalized <= -180) {
        normalized += 360;
    }
    return normalized;
}
function cssEscape(value) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
        return CSS.escape(value);
    }
    return value.replace(/["\\]/g, "\\$&");
}
