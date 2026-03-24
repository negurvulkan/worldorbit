import { loadWorldOrbitSource, renderDocumentToScene, renderDocumentToSpatialScene, rotatePoint, } from "@worldorbit/core";
import { computeVisibleObjectIds, createAtlasStateSnapshot, createViewerBookmark, deserializeViewerAtlasState, normalizeViewerFilter, sceneViewpointToLayerOptions, searchSceneObjects, serializeViewerAtlasState, viewpointToViewerFilter, } from "./atlas-state.js";
import { renderViewerMinimap } from "./minimap.js";
import { renderSceneToSvg } from "./render.js";
import { createViewer3DRuntime, } from "./runtime-3d.js";
import { buildViewerTooltipDetails, renderDefaultTooltipContent, } from "./tooltip.js";
import { DEFAULT_VIEWER_STATE, composeViewerTransform, fitViewerState, focusViewerState, invertViewerPoint, panViewerState, rotateViewerState, zoomViewerStateAt, } from "./viewer-state.js";
const DEFAULT_VIEWER_LIMITS = {
    minScale: 0.2,
    maxScale: 8,
    fitPadding: 48,
    panStep: 40,
    zoomStep: 1.2,
    rotationStep: 15,
};
const TOOLTIP_STYLE_ID = "worldorbit-viewer-tooltip-style";
export function createInteractiveViewer(container, options) {
    ensureBrowserEnvironment(container);
    const inputCount = Number(Boolean(options.source)) +
        Number(Boolean(options.document)) +
        Number(Boolean(options.scene));
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
        tooltipMode: options.tooltipMode ?? "hover",
        minimap: options.minimap ?? false,
        panStep: options.panStep ?? DEFAULT_VIEWER_LIMITS.panStep,
        zoomStep: options.zoomStep ?? DEFAULT_VIEWER_LIMITS.zoomStep,
        rotationStep: options.rotationStep ?? DEFAULT_VIEWER_LIMITS.rotationStep,
    };
    let renderOptions = {
        width: options.width,
        height: options.height,
        padding: options.padding,
        preset: options.preset,
        projection: options.projection,
        viewMode: options.viewMode ?? "2d",
        quality: options.quality ?? "balanced",
        style3d: options.style3d ?? "symbolic",
        camera: options.camera ? { ...options.camera } : null,
        scaleModel: options.scaleModel ? { ...options.scaleModel } : undefined,
        theme: options.theme,
        layers: options.layers,
        filter: normalizeViewerFilter(options.initialFilter),
        subtitle: options.subtitle,
    };
    const previousTabIndex = container.getAttribute("tabindex");
    const previousTouchAction = container.style.touchAction;
    const previousPosition = container.style.position;
    let currentInput = resolveInitialInput(options);
    let scene = renderSceneFromInput(currentInput, renderOptions);
    let providedSpatialScene = options.spatialScene ?? null;
    let spatialScene = renderOptions.viewMode === "3d"
        ? renderSpatialSceneFromInput(currentInput, renderOptions, providedSpatialScene)
        : null;
    let state = { ...DEFAULT_VIEWER_STATE };
    let svgElement = null;
    let cameraRoot = null;
    let runtime3d = null;
    let minimapRoot = null;
    let labelRoot = null;
    let tooltipRoot = null;
    let suppressClick = false;
    let activePointerId = null;
    let lastPointerPoint = null;
    let dragDistance = 0;
    let destroyed = false;
    let touchPoints = new Map();
    let touchGesture = null;
    let hoveredObjectId = null;
    let pinnedTooltipObjectId = null;
    let activeTooltipObjectId = null;
    let activeTooltipDetails = null;
    let activeViewpointId = null;
    let animationFrameId = null;
    let lastAnimationTimestamp = null;
    let animationState = {
        playing: false,
        speed: 1,
        timeSeconds: 0,
        frozenByEvent: spatialScene?.timeFrozen ?? false,
    };
    if (previousTabIndex === null) {
        container.tabIndex = 0;
    }
    installViewerOverlayStyles();
    container.classList.add("wo-viewer-container");
    container.style.touchAction = behavior.touch ? "none" : previousTouchAction;
    if (!container.style.position) {
        container.style.position = "relative";
    }
    syncAnimationFrozenState();
    const handleWheel = (event) => {
        if (!behavior.pointer || destroyed) {
            return;
        }
        event.preventDefault();
        container.focus();
        if (is3DView()) {
            const factor = clampValue(Math.exp(-event.deltaY * 0.002), 0.6, 1.6);
            api.zoomBy(factor);
            return;
        }
        const anchor = getWorldPointFromClient(event.clientX, event.clientY);
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
        if (!isTouch && event.button !== 0 && !is3DView()) {
            return;
        }
        container.focus();
        container.setPointerCapture?.(event.pointerId);
        const point = getViewportPointFromClient(event.clientX, event.clientY);
        if (isTouch) {
            touchPoints.set(event.pointerId, point);
            if (touchPoints.size === 2) {
                touchGesture = createTouchGestureState(scene, state, touchPoints);
            }
            else if (touchPoints.size === 1) {
                dragDistance = 0;
                suppressClick = false;
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
            if (is3DView()) {
                return;
            }
            if (!behavior.touch || !touchPoints.has(event.pointerId)) {
                return;
            }
            const prevPoint = touchPoints.get(event.pointerId);
            const nextPoint = getViewportPointFromClient(event.clientX, event.clientY);
            touchPoints.set(event.pointerId, nextPoint);
            if (touchPoints.size === 2) {
                if (!touchGesture) {
                    touchGesture = createTouchGestureState(scene, state, touchPoints);
                }
                const current = getTouchCenterAndDistance(touchPoints);
                const factor = current.distance / Math.max(touchGesture.startDistance, 1);
                const zoomedState = zoomViewerStateAt(scene, touchGesture.startState, factor, touchGesture.startCenter, constraints);
                const deltaX = current.center.x - touchGesture.startViewportCenter.x;
                const deltaY = current.center.y - touchGesture.startViewportCenter.y;
                updateState(panViewerState(zoomedState, deltaX, deltaY));
            }
            else if (touchPoints.size === 1) {
                const deltaX = nextPoint.x - prevPoint.x;
                const deltaY = nextPoint.y - prevPoint.y;
                dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
                if (dragDistance > 2) {
                    suppressClick = true;
                }
                updateState(panViewerState(state, deltaX, deltaY));
            }
            return;
        }
        if (is3DView() && behavior.pointer && activePointerId === null) {
            applyHover(runtime3d?.hitTest(event.clientX, event.clientY) ?? null);
            return;
        }
        if (is3DView() && behavior.pointer && activePointerId === event.pointerId && lastPointerPoint) {
            const nextPoint = getViewportPointFromClient(event.clientX, event.clientY);
            const deltaX = nextPoint.x - lastPointerPoint.x;
            const deltaY = nextPoint.y - lastPointerPoint.y;
            dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
            lastPointerPoint = nextPoint;
            if (dragDistance > 2) {
                suppressClick = true;
            }
            if (event.shiftKey || event.buttons === 2) {
                api.panBy(deltaX, deltaY);
            }
            else {
                api.rotateBy(deltaX * 0.35);
                api.panBy(0, deltaY * 0.35);
            }
            applyHover(runtime3d?.hitTest(event.clientX, event.clientY) ?? null);
            return;
        }
        if (!behavior.pointer || activePointerId !== event.pointerId || !lastPointerPoint) {
            return;
        }
        const nextPoint = getViewportPointFromClient(event.clientX, event.clientY);
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
        const objectId = is3DView()
            ? runtime3d?.hitTest(event.clientX, event.clientY) ?? null
            : getClosestObjectId(event.target);
        applySelection(objectId);
        if (behavior.tooltipMode === "pinned") {
            pinnedTooltipObjectId = objectId;
            updateTooltip();
        }
    };
    const handleMouseOver = (event) => {
        if (is3DView()) {
            return;
        }
        const objectId = getClosestObjectId(event.target);
        applyHover(objectId);
    };
    const handleMouseLeave = () => {
        applyHover(null);
    };
    const handleFocusIn = (event) => {
        if (is3DView()) {
            return;
        }
        const objectId = getClosestObjectId(event.target);
        if (!objectId) {
            return;
        }
        applyHover(objectId);
    };
    const handleFocusOut = () => {
        applyHover(null);
    };
    const handleKeyDown = (event) => {
        if (!behavior.keyboard || destroyed) {
            return;
        }
        const objectId = is3DView()
            ? state.selectedObjectId
            : getClosestObjectId(event.target);
        if ((event.key === "Enter" || event.key === " ") && objectId) {
            event.preventDefault();
            applySelection(objectId);
            if (behavior.tooltipMode === "pinned") {
                pinnedTooltipObjectId = objectId;
                updateTooltip();
            }
            return;
        }
        switch (event.key) {
            case "Escape":
                if (behavior.tooltipMode === "pinned" && pinnedTooltipObjectId) {
                    event.preventDefault();
                    pinnedTooltipObjectId = null;
                    updateTooltip();
                }
                return;
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
    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("focusin", handleFocusIn);
    container.addEventListener("focusout", handleFocusOut);
    container.addEventListener("keydown", handleKeyDown);
    const api = {
        setSource(source) {
            currentInput = { kind: "source", value: source };
            scene = renderSceneFromInput(currentInput, renderOptions);
            providedSpatialScene = null;
            spatialScene =
                renderOptions.viewMode === "3d"
                    ? renderSpatialSceneFromInput(currentInput, renderOptions, null)
                    : null;
            syncAnimationFrozenState();
            activeViewpointId = null;
            rerenderScene(true);
        },
        setDocument(document) {
            currentInput = { kind: "document", value: document };
            scene = renderSceneFromInput(currentInput, renderOptions);
            providedSpatialScene = null;
            spatialScene =
                renderOptions.viewMode === "3d"
                    ? renderSpatialSceneFromInput(currentInput, renderOptions, null)
                    : null;
            syncAnimationFrozenState();
            activeViewpointId = null;
            rerenderScene(true);
        },
        setScene(nextScene) {
            currentInput = { kind: "scene", value: nextScene };
            scene = nextScene;
            providedSpatialScene = null;
            spatialScene =
                renderOptions.viewMode === "3d"
                    ? renderSpatialSceneFromInput(currentInput, renderOptions, null)
                    : null;
            syncAnimationFrozenState();
            activeViewpointId = null;
            rerenderScene(true);
        },
        getScene() {
            return scene;
        },
        getRenderOptions() {
            return cloneRenderOptions(renderOptions);
        },
        getViewMode() {
            return renderOptions.viewMode ?? "2d";
        },
        setViewMode(mode) {
            const previousRenderOptions = renderOptions;
            const previousSpatialScene = spatialScene;
            const nextRenderOptions = mergeRenderOptions(renderOptions, { viewMode: mode });
            const nextSpatialScene = mode === "3d"
                ? renderSpatialSceneFromInput(currentInput, nextRenderOptions, providedSpatialScene)
                : null;
            renderOptions = nextRenderOptions;
            spatialScene = nextSpatialScene;
            syncAnimationFrozenState();
            try {
                rerenderScene(false);
            }
            catch (error) {
                renderOptions = previousRenderOptions;
                spatialScene = previousSpatialScene;
                syncAnimationFrozenState();
                rerenderScene(false);
                throw error;
            }
        },
        listViewpoints() {
            return scene.viewpoints.slice();
        },
        getActiveViewpoint() {
            return getViewpointById(activeViewpointId);
        },
        goToViewpoint(id) {
            const viewpoint = getViewpointById(id);
            if (!viewpoint) {
                return false;
            }
            const nextRenderOptions = {};
            const viewpointLayers = sceneViewpointToLayerOptions(viewpoint);
            if (viewpoint.preset !== null) {
                nextRenderOptions.preset = viewpoint.preset;
            }
            if (currentInput.kind !== "scene" && viewpoint.projection !== scene.projection) {
                nextRenderOptions.projection = viewpoint.projection;
            }
            if (viewpoint.camera) {
                nextRenderOptions.camera = { ...viewpoint.camera };
            }
            else if (renderOptions.camera) {
                nextRenderOptions.camera = null;
            }
            if (viewpointLayers) {
                nextRenderOptions.layers = viewpointLayers;
            }
            activeViewpointId = viewpoint.id;
            if (Object.keys(nextRenderOptions).length > 0) {
                const sceneAffecting = hasSceneAffectingRenderOptions(nextRenderOptions);
                renderOptions = mergeRenderOptions(renderOptions, nextRenderOptions);
                if (currentInput.kind !== "scene" && sceneAffecting) {
                    scene = renderSceneFromInput(currentInput, renderOptions);
                }
                rerenderScene(sceneAffecting);
            }
            setFilterInternal(viewpointToViewerFilter(viewpoint), false, false);
            const nextState = createViewpointState(viewpoint);
            updateState(nextState);
            applySelection(viewpoint.selectedObjectId ?? viewpoint.objectId ?? null, false);
            options.onSelectionChange?.(getSelectedObject());
            options.onSelectionDetailsChange?.(buildObjectDetails(state.selectedObjectId));
            notifyViewpointChange();
            emitAtlasStateChange();
            return true;
        },
        getActiveEventId() {
            return renderOptions.activeEventId ?? null;
        },
        setActiveEvent(id) {
            api.setRenderOptions({ activeEventId: id });
        },
        playAnimation() {
            if (!is3DView()) {
                animationState = {
                    ...animationState,
                    playing: false,
                };
                stopAnimationLoop();
                return;
            }
            if (animationState.frozenByEvent) {
                animationState = {
                    ...animationState,
                    playing: false,
                };
                return;
            }
            animationState = {
                ...animationState,
                playing: true,
            };
            ensureAnimationFrame();
        },
        pauseAnimation() {
            animationState = {
                ...animationState,
                playing: false,
            };
            stopAnimationLoop();
        },
        resetAnimation() {
            animationState = {
                ...animationState,
                playing: false,
                timeSeconds: 0,
            };
            stopAnimationLoop();
            syncRuntimePresentation();
        },
        setAnimationSpeed(multiplier) {
            animationState = {
                ...animationState,
                speed: clampValue(multiplier, 0.1, 64),
            };
        },
        getAnimationState() {
            return { ...animationState };
        },
        search(query, limit = 12) {
            return searchSceneObjects(scene, query, limit);
        },
        getFilter() {
            return renderOptions.filter ? { ...renderOptions.filter } : null;
        },
        setFilter(filter) {
            setFilterInternal(filter, true, true);
        },
        getVisibleObjects() {
            return getVisibleSceneObjects();
        },
        getFocusPath(id) {
            return buildFocusPath(id);
        },
        getObjectDetails(id) {
            return buildObjectDetails(id);
        },
        getSelectionDetails() {
            return buildObjectDetails(state.selectedObjectId);
        },
        getTooltipDetails() {
            return activeTooltipDetails;
        },
        getAtlasState() {
            return createAtlasStateSnapshot(state, renderOptions, renderOptions.filter ?? null, activeViewpointId);
        },
        setAtlasState(nextAtlasState) {
            const atlasState = typeof nextAtlasState === "string"
                ? deserializeViewerAtlasState(nextAtlasState)
                : nextAtlasState;
            if (atlasState.viewpointId) {
                api.goToViewpoint(atlasState.viewpointId);
            }
            api.setRenderOptions(atlasState.renderOptions);
            setFilterInternal(atlasState.filter ?? null, false, false);
            updateState(sanitizeState({ ...state, ...atlasState.viewerState }));
            applySelection(atlasState.viewerState.selectedObjectId ?? null, false);
            notifyViewpointChange();
            options.onSelectionChange?.(getSelectedObject());
            options.onSelectionDetailsChange?.(buildObjectDetails(state.selectedObjectId));
            emitAtlasStateChange();
        },
        serializeAtlasState() {
            return serializeViewerAtlasState(api.getAtlasState());
        },
        captureBookmark(name, label) {
            return createViewerBookmark(name, label, api.getAtlasState());
        },
        applyBookmark(bookmark) {
            if (typeof bookmark === "string") {
                api.setAtlasState(bookmark);
                return true;
            }
            api.setAtlasState(bookmark.atlasState);
            return true;
        },
        setRenderOptions(options) {
            const sceneAffecting = hasSceneAffectingRenderOptions(options);
            const previousRenderOptions = renderOptions;
            const previousScene = scene;
            const previousSpatialScene = spatialScene;
            const nextRenderOptions = mergeRenderOptions(renderOptions, options);
            let nextScene = scene;
            if (currentInput.kind !== "scene" && sceneAffecting) {
                nextScene = renderSceneFromInput(currentInput, nextRenderOptions);
            }
            const nextSpatialScene = nextRenderOptions.viewMode === "3d"
                ? renderSpatialSceneFromInput(currentInput, nextRenderOptions, providedSpatialScene)
                : null;
            renderOptions = nextRenderOptions;
            scene = nextScene;
            spatialScene = nextSpatialScene;
            syncAnimationFrozenState();
            try {
                rerenderScene(sceneAffecting);
            }
            catch (error) {
                renderOptions = previousRenderOptions;
                scene = previousScene;
                spatialScene = previousSpatialScene;
                syncAnimationFrozenState();
                rerenderScene(sceneAffecting);
                throw error;
            }
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
            updateState(is3DView()
                ? { ...DEFAULT_VIEWER_STATE, selectedObjectId: state.selectedObjectId }
                : fitViewerState(scene, state, constraints));
        },
        focusObject(id) {
            activeViewpointId = null;
            updateState(is3DView()
                ? create3DFocusState(id)
                : focusViewerState(scene, state, id, constraints));
            applySelection(id);
            if (behavior.tooltipMode === "pinned") {
                pinnedTooltipObjectId = getObjectById(id)?.objectId ?? null;
                updateTooltip();
            }
        },
        pinTooltip(id) {
            pinnedTooltipObjectId = getObjectById(id)?.objectId ?? null;
            updateTooltip();
        },
        resetView() {
            const resetState = is3DView()
                ? { ...DEFAULT_VIEWER_STATE }
                : fitViewerState(scene, { ...DEFAULT_VIEWER_STATE }, constraints);
            activeViewpointId = null;
            updateState(resetState);
            applySelection(null);
            pinnedTooltipObjectId = null;
            updateTooltip();
        },
        exportSvg() {
            return renderSceneToSvg(scene, {
                ...renderOptions,
                filter: renderOptions.filter ?? null,
                selectedObjectId: state.selectedObjectId,
            });
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
            container.removeEventListener("mouseover", handleMouseOver);
            container.removeEventListener("mouseleave", handleMouseLeave);
            container.removeEventListener("focusin", handleFocusIn);
            container.removeEventListener("focusout", handleFocusOut);
            container.removeEventListener("keydown", handleKeyDown);
            stopAnimationLoop();
            runtime3d?.destroy();
            runtime3d = null;
            labelRoot?.remove();
            labelRoot = null;
            tooltipRoot?.remove();
            tooltipRoot = null;
            minimapRoot?.remove();
            minimapRoot = null;
            container.classList.remove("wo-viewer-container");
            container.style.touchAction = previousTouchAction;
            container.style.position = previousPosition;
            if (previousTabIndex === null) {
                container.removeAttribute("tabindex");
            }
            else {
                container.setAttribute("tabindex", previousTabIndex);
            }
        },
    };
    rerenderScene(true);
    if (options.initialViewpointId) {
        api.goToViewpoint(options.initialViewpointId);
    }
    else if (options.initialSelectionObjectId) {
        api.focusObject(options.initialSelectionObjectId);
    }
    else {
        emitAtlasStateChange();
    }
    return api;
    function rerenderScene(resetView) {
        runtime3d?.destroy();
        runtime3d = null;
        container.innerHTML = "";
        svgElement = null;
        cameraRoot = null;
        minimapRoot = null;
        labelRoot = null;
        tooltipRoot = null;
        if (is3DView()) {
            spatialScene = spatialScene ?? renderSpatialSceneFromInput(currentInput, renderOptions, providedSpatialScene);
            runtime3d = createViewer3DRuntime(container);
        }
        else {
            container.innerHTML = renderSceneToSvg(scene, {
                ...renderOptions,
                filter: renderOptions.filter ?? null,
                selectedObjectId: state.selectedObjectId,
            });
            svgElement = container.querySelector('[data-worldorbit-svg="true"]');
            cameraRoot = container.querySelector("#worldorbit-camera-root");
        }
        if (behavior.minimap) {
            minimapRoot = document.createElement("div");
            minimapRoot.dataset.worldorbitMinimapRoot = "true";
            container.append(minimapRoot);
        }
        labelRoot = document.createElement("div");
        labelRoot.className = "wo-viewer-label-root";
        labelRoot.dataset.worldorbitLabelRoot = "true";
        container.append(labelRoot);
        if (behavior.tooltipMode !== "disabled") {
            tooltipRoot = document.createElement("div");
            tooltipRoot.className = "wo-viewer-tooltip-root";
            tooltipRoot.dataset.worldorbitTooltip = "true";
            tooltipRoot.hidden = true;
            tooltipRoot.addEventListener("click", handleTooltipClick);
            container.append(tooltipRoot);
        }
        if (!is3DView() && (!svgElement || !cameraRoot)) {
            throw new Error("Interactive viewer could not locate the rendered SVG camera root.");
        }
        suppressStaticLabelLayers();
        state = resetView
            ? is3DView()
                ? { ...DEFAULT_VIEWER_STATE }
                : fitViewerState(scene, { ...DEFAULT_VIEWER_STATE }, constraints)
            : sanitizeState(state);
        applySelection(state.selectedObjectId &&
            getObjectById(state.selectedObjectId)
            ? state.selectedObjectId
            : null, false);
        applyHover(hoveredObjectId &&
            getObjectById(hoveredObjectId)
            ? hoveredObjectId
            : null, false);
        pinnedTooltipObjectId =
            pinnedTooltipObjectId && getObjectById(pinnedTooltipObjectId)
                ? pinnedTooltipObjectId
                : null;
        syncRuntimePresentation();
        notifyFilterChange();
        notifyViewpointChange();
        options.onViewChange?.({ ...state });
        emitAtlasStateChange();
    }
    function updateState(nextState) {
        state = sanitizeState(nextState);
        syncRuntimePresentation();
        options.onViewChange?.({ ...state });
        emitAtlasStateChange();
    }
    function sanitizeState(nextState) {
        return {
            scale: clampValue(nextState.scale, constraints.minScale, constraints.maxScale),
            rotationDeg: normalizeRotation(nextState.rotationDeg),
            translateX: Number.isFinite(nextState.translateX) ? nextState.translateX : state.translateX,
            translateY: Number.isFinite(nextState.translateY) ? nextState.translateY : state.translateY,
            selectedObjectId: nextState.selectedObjectId && getObjectById(nextState.selectedObjectId)
                ? nextState.selectedObjectId
                : null,
        };
    }
    function updateCameraTransform() {
        if (is3DView()) {
            sync3DView();
            return;
        }
        if (!cameraRoot) {
            return;
        }
        cameraRoot.setAttribute("transform", composeViewerTransform(scene, state));
        updateScreenLabels();
        updateMinimap();
        updateTooltip();
    }
    function applySelection(objectId, emitCallback = true) {
        if (!is3DView() && state.selectedObjectId) {
            for (const element of container.querySelectorAll(`[data-object-id="${cssEscape(state.selectedObjectId)}"]`)) {
                element.classList.remove("wo-object-selected");
            }
        }
        state = {
            ...state,
            selectedObjectId: objectId && getObjectById(objectId)
                ? objectId
                : null,
        };
        if (!is3DView() && state.selectedObjectId) {
            for (const element of container.querySelectorAll(`[data-object-id="${cssEscape(state.selectedObjectId)}"]`)) {
                element.classList.add("wo-object-selected");
            }
        }
        syncAtlasHighlights();
        updateTooltip();
        if (emitCallback) {
            options.onSelectionChange?.(getSelectedObject());
            options.onSelectionDetailsChange?.(buildObjectDetails(state.selectedObjectId));
            options.onViewChange?.({ ...state });
            emitAtlasStateChange();
        }
    }
    function applyHover(objectId, emitCallback = true) {
        if (hoveredObjectId === objectId && emitCallback) {
            return;
        }
        hoveredObjectId =
            objectId && getObjectById(objectId)
                ? objectId
                : null;
        syncAtlasHighlights();
        updateTooltip();
        if (emitCallback) {
            options.onHoverChange?.(getObjectById(hoveredObjectId));
            options.onHoverDetailsChange?.(buildObjectDetails(hoveredObjectId));
        }
    }
    function getSelectedObject() {
        return getObjectById(state.selectedObjectId);
    }
    function getObjectById(objectId) {
        if (!objectId) {
            return null;
        }
        const visibleObjectIds = getVisibleObjectIds();
        return (scene.objects.find((object) => object.objectId === objectId &&
            !object.hidden &&
            visibleObjectIds.has(object.objectId)) ?? null);
    }
    function buildObjectDetails(objectId) {
        const renderObject = getObjectById(objectId);
        if (!renderObject) {
            return null;
        }
        return {
            objectId: renderObject.objectId,
            object: renderObject.object,
            renderObject,
            label: scene.labels.find((label) => label.objectId === renderObject.objectId && !label.hidden) ?? null,
            group: scene.groups.find((group) => group.renderId === renderObject.groupId) ?? null,
            semanticGroups: scene.semanticGroups.filter((group) => renderObject.semanticGroupIds.includes(group.id)),
            orbit: scene.orbitVisuals.find((orbit) => orbit.objectId === renderObject.objectId && !orbit.hidden) ?? null,
            relatedOrbits: scene.orbitVisuals.filter((orbit) => !orbit.hidden &&
                (orbit.objectId === renderObject.objectId ||
                    renderObject.ancestorIds.includes(orbit.objectId) ||
                    renderObject.childIds.includes(orbit.objectId))),
            relations: scene.relations.filter((relation) => !relation.hidden &&
                (relation.fromObjectId === renderObject.objectId ||
                    relation.toObjectId === renderObject.objectId)),
            relatedEvents: scene.events.filter((event) => !event.hidden &&
                (event.targetObjectId === renderObject.objectId ||
                    event.objectIds.includes(renderObject.objectId))),
            parent: getObjectById(renderObject.parentId),
            children: renderObject.childIds.map((childId) => getObjectById(childId)).filter(Boolean),
            ancestors: renderObject.ancestorIds
                .map((ancestorId) => getObjectById(ancestorId))
                .filter(Boolean),
            focusPath: buildFocusPath(renderObject.objectId),
        };
    }
    function syncAtlasHighlights() {
        if (is3DView()) {
            sync3DView();
            return;
        }
        for (const element of container.querySelectorAll(".wo-chain-selected, .wo-chain-hover, .wo-ancestor-selected, .wo-ancestor-hover, .wo-orbit-related-selected, .wo-orbit-related-hover")) {
            element.classList.remove("wo-chain-selected", "wo-chain-hover", "wo-ancestor-selected", "wo-ancestor-hover", "wo-orbit-related-selected", "wo-orbit-related-hover");
        }
        applyChainClasses(state.selectedObjectId, {
            objectClass: "wo-chain-selected",
            ancestorClass: "wo-ancestor-selected",
            orbitClass: "wo-orbit-related-selected",
        });
        applyChainClasses(hoveredObjectId, {
            objectClass: "wo-chain-hover",
            ancestorClass: "wo-ancestor-hover",
            orbitClass: "wo-orbit-related-hover",
        });
    }
    function applyChainClasses(objectId, classes) {
        const details = buildObjectDetails(objectId);
        if (!details) {
            return;
        }
        const chainIds = new Set([
            details.objectId,
            ...details.renderObject.childIds,
            ...details.renderObject.ancestorIds,
        ]);
        for (const id of chainIds) {
            for (const element of container.querySelectorAll(`[data-object-id="${cssEscape(id)}"]`)) {
                element.classList.add(classes.objectClass);
            }
        }
        for (const ancestor of details.ancestors) {
            for (const element of container.querySelectorAll(`[data-object-id="${cssEscape(ancestor.objectId)}"]`)) {
                element.classList.add(classes.ancestorClass);
            }
        }
        for (const orbit of details.relatedOrbits) {
            for (const element of container.querySelectorAll(`[data-orbit-object-id="${cssEscape(orbit.objectId)}"]`)) {
                element.classList.add(classes.orbitClass);
            }
        }
    }
    function getViewportPointFromClient(clientX, clientY) {
        if (is3DView()) {
            const rect = container.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return {
                    x: scene.width / 2,
                    y: scene.height / 2,
                };
            }
            return {
                x: clientX - rect.left,
                y: clientY - rect.top,
            };
        }
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
    function getWorldPointFromClient(clientX, clientY) {
        return invertViewerPoint(scene, state, getViewportPointFromClient(clientX, clientY));
    }
    function getVisibleObjectIds() {
        return computeVisibleObjectIds(scene, renderOptions.filter ?? null);
    }
    function getVisibleSceneObjects() {
        const visibleObjectIds = getVisibleObjectIds();
        return scene.objects.filter((object) => !object.hidden && visibleObjectIds.has(object.objectId));
    }
    function buildFocusPath(objectId) {
        const object = scene.objects.find((entry) => entry.objectId === objectId && !entry.hidden);
        if (!object) {
            return [];
        }
        return [...object.ancestorIds, object.objectId]
            .map((entryId) => getObjectById(entryId))
            .filter(Boolean);
    }
    function getViewpointById(id) {
        return scene.viewpoints.find((viewpoint) => viewpoint.id === id) ?? null;
    }
    function createViewpointState(viewpoint) {
        const rotationDeg = normalizeRotation(viewpoint.rotationDeg);
        const scale = viewpoint.scale !== null && viewpoint.scale !== undefined
            ? clampValue(viewpoint.scale, constraints.minScale, constraints.maxScale)
            : null;
        if (is3DView()) {
            const focusId = viewpoint.objectId ?? viewpoint.selectedObjectId ?? null;
            const target = focusId
                ? spatialScene?.focusTargets.find((entry) => entry.objectId === focusId)
                : null;
            return {
                scale: scale ?? 1.6,
                rotationDeg,
                translateX: target ? -target.center.x : 0,
                translateY: target ? -target.center.z : 0,
                selectedObjectId: viewpoint.selectedObjectId ?? viewpoint.objectId ?? null,
            };
        }
        const targetObject = viewpoint.objectId &&
            scene.objects.find((object) => object.objectId === viewpoint.objectId && !object.hidden);
        if (targetObject) {
            return createCenteredState({ x: targetObject.x, y: targetObject.y }, scale ?? Math.max(1.8, DEFAULT_VIEWER_STATE.scale), rotationDeg, viewpoint.selectedObjectId ?? targetObject.objectId);
        }
        const baseState = fitViewerState(scene, { ...DEFAULT_VIEWER_STATE, rotationDeg }, constraints);
        if (scale === null) {
            return {
                ...baseState,
                rotationDeg,
                selectedObjectId: viewpoint.selectedObjectId ?? null,
            };
        }
        return createCenteredState({
            x: scene.contentBounds.centerX,
            y: scene.contentBounds.centerY,
        }, scale, rotationDeg, viewpoint.selectedObjectId ?? null);
    }
    function createCenteredState(target, scale, rotationDeg, selectedObjectId) {
        const center = {
            x: scene.width / 2,
            y: scene.height / 2,
        };
        const rotatedTarget = rotatePoint(target, center, rotationDeg);
        return {
            scale,
            rotationDeg,
            translateX: center.x - (center.x + (rotatedTarget.x - center.x) * scale),
            translateY: center.y - (center.y + (rotatedTarget.y - center.y) * scale),
            selectedObjectId,
        };
    }
    function setFilterInternal(filter, emitCallbacks, clearActiveViewpoint) {
        renderOptions = {
            ...renderOptions,
            filter: normalizeViewerFilter(filter),
        };
        if (clearActiveViewpoint) {
            activeViewpointId = null;
        }
        rerenderScene(false);
        if (!emitCallbacks) {
            return;
        }
    }
    function notifyFilterChange() {
        options.onFilterChange?.(renderOptions.filter ?? null, getVisibleSceneObjects());
    }
    function notifyViewpointChange() {
        options.onViewpointChange?.(getViewpointById(activeViewpointId));
    }
    function emitAtlasStateChange() {
        options.onAtlasStateChange?.(api.getAtlasState());
    }
    function updateMinimap() {
        if (!behavior.minimap || !minimapRoot) {
            return;
        }
        minimapRoot.innerHTML = renderViewerMinimap(scene, state, getVisibleSceneObjects());
    }
    function updateTooltip() {
        if (behavior.tooltipMode === "disabled" || !tooltipRoot) {
            setTooltipDetails(null);
            return;
        }
        const resolved = resolveTooltipTarget();
        if (!resolved) {
            tooltipRoot.hidden = true;
            tooltipRoot.innerHTML = "";
            tooltipRoot.removeAttribute("data-mode");
            setTooltipDetails(null);
            return;
        }
        const details = buildObjectDetails(resolved.objectId);
        if (!details) {
            tooltipRoot.hidden = true;
            tooltipRoot.innerHTML = "";
            tooltipRoot.removeAttribute("data-mode");
            setTooltipDetails(null);
            return;
        }
        const tooltipDetails = buildViewerTooltipDetails(details);
        activeTooltipObjectId = resolved.objectId;
        tooltipRoot.hidden = false;
        tooltipRoot.dataset.mode = resolved.mode;
        tooltipRoot.classList.toggle("is-pinned", resolved.mode === "pinned");
        tooltipRoot.style.pointerEvents = "auto";
        tooltipRoot.style.visibility = "hidden";
        renderTooltipContent(tooltipRoot, tooltipDetails, resolved.mode);
        positionTooltip(tooltipRoot, details.renderObject);
        tooltipRoot.style.visibility = "visible";
        setTooltipDetails(tooltipDetails);
    }
    function resolveTooltipTarget() {
        if (pinnedTooltipObjectId && getObjectById(pinnedTooltipObjectId)) {
            return {
                objectId: pinnedTooltipObjectId,
                mode: "pinned",
            };
        }
        if (hoveredObjectId && getObjectById(hoveredObjectId)) {
            return {
                objectId: hoveredObjectId,
                mode: "hover",
            };
        }
        return null;
    }
    function renderTooltipContent(element, details, mode) {
        const customMarkup = options.tooltipRenderer?.(details, mode);
        element.innerHTML = "";
        if (typeof customMarkup === "string") {
            element.innerHTML = customMarkup;
        }
        else if (customMarkup instanceof HTMLElement) {
            element.append(customMarkup);
        }
        else {
            element.innerHTML = renderDefaultTooltipContent(details, mode);
        }
        const actions = document.createElement("div");
        actions.className = "wo-tooltip-actions";
        if (mode === "pinned") {
            const unpinButton = document.createElement("button");
            unpinButton.type = "button";
            unpinButton.className = "wo-tooltip-action";
            unpinButton.dataset.tooltipAction = "unpin";
            unpinButton.textContent = "Unpin";
            actions.append(unpinButton);
        }
        else {
            const pinButton = document.createElement("button");
            pinButton.type = "button";
            pinButton.className = "wo-tooltip-action";
            pinButton.dataset.tooltipAction = "pin";
            pinButton.dataset.objectId = details.objectId;
            pinButton.textContent = "Pin";
            actions.append(pinButton);
        }
        if (actions.childElementCount > 0) {
            element.append(actions);
        }
    }
    function positionTooltip(element, renderObject) {
        const point = is3DView()
            ? runtime3d?.projectObjectToContainer(renderObject.objectId) ?? null
            : project2DTooltipPoint(renderObject);
        if (!point) {
            return;
        }
        const maxLeft = Math.max(container.clientWidth - element.offsetWidth - 12, 12);
        const maxTop = Math.max(container.clientHeight - element.offsetHeight - 12, 12);
        const preferAbove = point.y > container.clientHeight * 0.48;
        const nextLeft = clampValue(point.x + 18, 12, maxLeft);
        const nextTop = clampValue(preferAbove ? point.y - element.offsetHeight - 18 : point.y + 18, 12, maxTop);
        element.style.left = `${nextLeft}px`;
        element.style.top = `${nextTop}px`;
    }
    function projectWorldPoint(point) {
        if (is3DView()) {
            return point;
        }
        const center = {
            x: scene.width / 2,
            y: scene.height / 2,
        };
        const rotated = rotatePoint(point, center, state.rotationDeg);
        return {
            x: center.x + (rotated.x - center.x) * state.scale + state.translateX,
            y: center.y + (rotated.y - center.y) * state.scale + state.translateY,
        };
    }
    function project2DTooltipPoint(renderObject) {
        const anchor = {
            x: renderObject.anchorX ?? renderObject.x,
            y: renderObject.anchorY ??
                renderObject.y - Math.max(renderObject.visualRadius, renderObject.radius),
        };
        return project2DScenePointToContainer(anchor);
    }
    function project2DScenePointToContainer(point) {
        if (!svgElement) {
            return null;
        }
        const viewportPoint = projectWorldPoint(point);
        const svgRect = svgElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return {
            x: svgRect.left -
                containerRect.left +
                (viewportPoint.x / Math.max(scene.width, 1)) * svgRect.width,
            y: svgRect.top -
                containerRect.top +
                (viewportPoint.y / Math.max(scene.height, 1)) * svgRect.height,
        };
    }
    function handleTooltipClick(event) {
        const target = event.target?.closest("[data-tooltip-action]");
        if (!target) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        switch (target.dataset.tooltipAction) {
            case "pin":
                pinnedTooltipObjectId = target.dataset.objectId ?? activeTooltipObjectId;
                break;
            case "unpin":
                pinnedTooltipObjectId = null;
                break;
        }
        updateTooltip();
    }
    function setTooltipDetails(details) {
        const changed = activeTooltipDetails?.objectId !== details?.objectId ||
            activeTooltipDetails?.description !== details?.description ||
            activeTooltipDetails?.imageHref !== details?.imageHref;
        activeTooltipDetails = details;
        activeTooltipObjectId = details?.objectId ?? null;
        if (changed) {
            options.onTooltipChange?.(details);
        }
    }
    function is3DView() {
        return renderOptions.viewMode === "3d";
    }
    function syncAnimationFrozenState() {
        animationState = {
            ...animationState,
            frozenByEvent: spatialScene?.timeFrozen ?? false,
        };
        if (animationState.frozenByEvent) {
            animationState = {
                ...animationState,
                playing: false,
            };
            stopAnimationLoop();
        }
    }
    function ensureAnimationFrame() {
        if (animationFrameId !== null || !animationState.playing || destroyed) {
            return;
        }
        animationFrameId = window.requestAnimationFrame(renderAnimationFrame);
    }
    function stopAnimationLoop() {
        if (animationFrameId !== null) {
            window.cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        lastAnimationTimestamp = null;
    }
    function renderAnimationFrame(timestamp) {
        animationFrameId = null;
        if (!animationState.playing || destroyed) {
            lastAnimationTimestamp = null;
            return;
        }
        const previousTimestamp = lastAnimationTimestamp ?? timestamp;
        const deltaSeconds = Math.max((timestamp - previousTimestamp) / 1_000, 0);
        lastAnimationTimestamp = timestamp;
        animationState = {
            ...animationState,
            timeSeconds: animationState.timeSeconds + deltaSeconds * animationState.speed,
        };
        sync3DView();
        ensureAnimationFrame();
    }
    function syncRuntimePresentation() {
        updateCameraTransform();
        if (is3DView() && animationState.playing) {
            ensureAnimationFrame();
        }
        else if (!animationState.playing || !is3DView()) {
            stopAnimationLoop();
        }
    }
    function sync3DView() {
        if (!is3DView() || !runtime3d || !spatialScene) {
            return;
        }
        runtime3d.update({
            spatialScene,
            renderOptions,
            visibleObjectIds: getVisibleObjectIds(),
            selectedObjectId: state.selectedObjectId,
            hoveredObjectId,
            state,
            timeSeconds: animationState.timeSeconds,
        });
        updateScreenLabels();
        updateMinimap();
        updateTooltip();
    }
    function suppressStaticLabelLayers() {
        if (is3DView()) {
            return;
        }
        container
            .querySelector('[data-layer-id="labels"]')
            ?.setAttribute("display", "none");
        for (const element of container.querySelectorAll(".wo-event-label")) {
            element.setAttribute("display", "none");
        }
    }
    function updateScreenLabels() {
        if (!labelRoot) {
            return;
        }
        const descriptors = buildScreenLabelDescriptors();
        labelRoot.replaceChildren(...descriptors.map((descriptor) => createScreenLabelElement(descriptor)));
        labelRoot.hidden = descriptors.length === 0;
    }
    function buildScreenLabelDescriptors() {
        const descriptors = [];
        const visibleObjectIds = getVisibleObjectIds();
        if (layerEnabled("labels")) {
            for (const label of scene.labels) {
                if (label.hidden || !visibleObjectIds.has(label.objectId)) {
                    continue;
                }
                if (is3DView() && !shouldRender3DLabel(label.objectId, visibleObjectIds)) {
                    continue;
                }
                const point = is3DView()
                    ? runtime3d?.projectObjectToContainer(label.objectId) ?? null
                    : project2DScenePointToContainer({ x: label.x, y: label.y });
                if (!point) {
                    continue;
                }
                descriptors.push({
                    key: `object:${label.renderId}`,
                    kind: "object",
                    point: is3DView()
                        ? { x: point.x, y: point.y - 18 }
                        : point,
                    textAnchor: label.textAnchor,
                    objectId: label.objectId,
                    primaryText: label.label,
                    secondaryText: label.secondaryLabel,
                    secondaryOffset: Math.max(label.secondaryY - label.y, 12),
                });
            }
        }
        if (!is3DView() && layerEnabled("events")) {
            for (const event of scene.events) {
                if (event.hidden || !isEventVisible(event, visibleObjectIds)) {
                    continue;
                }
                const point = project2DScenePointToContainer({ x: event.x, y: event.y - 10 });
                if (!point) {
                    continue;
                }
                descriptors.push({
                    key: `event:${event.renderId}`,
                    kind: "event",
                    point,
                    textAnchor: "middle",
                    primaryText: event.event.label || event.event.id,
                });
            }
        }
        return descriptors;
    }
    function isEventVisible(event, visibleObjectIds) {
        return event.objectIds.some((objectId) => visibleObjectIds.has(objectId));
    }
    function shouldRender3DLabel(objectId, visibleObjectIds) {
        if (!is3DView()) {
            return true;
        }
        if (objectId === state.selectedObjectId || objectId === hoveredObjectId) {
            return true;
        }
        const object = getObjectById(objectId);
        if (!object || object.hidden || !visibleObjectIds.has(objectId)) {
            return false;
        }
        if (object.object.type === "star") {
            return true;
        }
        const selected = state.selectedObjectId ? buildObjectDetails(state.selectedObjectId) : null;
        const hovered = hoveredObjectId ? buildObjectDetails(hoveredObjectId) : null;
        const selectedFocus = selected
            ? new Set([
                selected.objectId,
                ...selected.renderObject.ancestorIds,
                ...selected.renderObject.childIds,
            ])
            : null;
        const hoveredFocus = hovered
            ? new Set([
                hovered.objectId,
                ...hovered.renderObject.ancestorIds,
                ...hovered.renderObject.childIds,
            ])
            : null;
        if (selectedFocus?.has(objectId) || hoveredFocus?.has(objectId)) {
            return true;
        }
        if (object.semanticGroupIds.length > 0 && object.visualRadius >= 12) {
            return true;
        }
        return object.childIds.length > 0 && object.visualRadius >= 10;
    }
    function createScreenLabelElement(descriptor) {
        const element = document.createElement("div");
        element.className = `wo-viewer-label wo-viewer-label-${descriptor.kind}`;
        element.dataset.worldorbitScreenLabel = "true";
        element.dataset.labelKey = descriptor.key;
        element.dataset.anchor = descriptor.textAnchor;
        element.style.left = `${descriptor.point.x}px`;
        element.style.top = `${descriptor.point.y}px`;
        if (descriptor.objectId) {
            element.dataset.objectId = descriptor.objectId;
            for (const className of resolveScreenLabelClasses(descriptor.objectId)) {
                element.classList.add(className);
            }
        }
        const primary = document.createElement("span");
        primary.className = "wo-viewer-label-primary";
        if (descriptor.kind === "object") {
            primary.style.fontSize = `${14 * scene.scaleModel.labelMultiplier}px`;
        }
        primary.textContent = descriptor.primaryText;
        element.append(primary);
        if (descriptor.secondaryText) {
            const secondary = document.createElement("span");
            secondary.className = "wo-viewer-label-secondary";
            secondary.style.fontSize = `${11 * scene.scaleModel.labelMultiplier}px`;
            secondary.style.marginTop = `${Math.max(descriptor.secondaryOffset ?? 12, 10) - 10}px`;
            secondary.textContent = descriptor.secondaryText;
            element.append(secondary);
        }
        return element;
    }
    function layerEnabled(id) {
        return renderOptions.layers?.[id] !== false;
    }
    function resolveScreenLabelClasses(objectId) {
        const classes = [];
        const selectedDetails = buildObjectDetails(state.selectedObjectId);
        const hoveredDetails = buildObjectDetails(hoveredObjectId);
        if (state.selectedObjectId === objectId) {
            classes.push("wo-object-selected");
        }
        if (selectedDetails) {
            const selectedChain = new Set([
                selectedDetails.objectId,
                ...selectedDetails.renderObject.childIds,
                ...selectedDetails.renderObject.ancestorIds,
            ]);
            const selectedAncestors = new Set(selectedDetails.ancestors.map((ancestor) => ancestor.objectId));
            if (selectedChain.has(objectId)) {
                classes.push("wo-chain-selected");
            }
            if (selectedAncestors.has(objectId)) {
                classes.push("wo-ancestor-selected");
            }
        }
        if (hoveredDetails) {
            const hoveredChain = new Set([
                hoveredDetails.objectId,
                ...hoveredDetails.renderObject.childIds,
                ...hoveredDetails.renderObject.ancestorIds,
            ]);
            const hoveredAncestors = new Set(hoveredDetails.ancestors.map((ancestor) => ancestor.objectId));
            if (hoveredChain.has(objectId)) {
                classes.push("wo-chain-hover");
            }
            if (hoveredAncestors.has(objectId)) {
                classes.push("wo-ancestor-hover");
            }
        }
        return classes;
    }
    function create3DFocusState(objectId) {
        const target = spatialScene?.focusTargets.find((entry) => entry.objectId === objectId);
        if (!target) {
            return {
                ...DEFAULT_VIEWER_STATE,
                selectedObjectId: objectId,
            };
        }
        return {
            scale: 1.8,
            rotationDeg: state.rotationDeg,
            translateX: -target.center.x,
            translateY: -target.center.z,
            selectedObjectId: objectId,
        };
    }
}
function resolveInitialInput(options) {
    if (options.scene) {
        return { kind: "scene", value: options.scene };
    }
    if (options.document) {
        return { kind: "document", value: options.document };
    }
    if (options.source) {
        return { kind: "source", value: options.source };
    }
    throw new Error("Interactive viewer requires an initial render input.");
}
function renderSceneFromInput(input, renderOptions) {
    switch (input.kind) {
        case "scene":
            return input.value;
        case "document":
            return renderDocumentToScene(input.value, renderOptions);
        case "source": {
            const loaded = loadWorldOrbitSource(input.value);
            return renderDocumentToScene(loaded.document, resolveSourceRenderOptions(loaded, renderOptions));
        }
    }
}
function renderSpatialSceneFromInput(input, renderOptions, providedSpatialScene) {
    if (providedSpatialScene) {
        return providedSpatialScene;
    }
    switch (input.kind) {
        case "scene":
            return fallbackSpatialSceneFromRenderScene(input.value);
        case "document":
            return renderDocumentToSpatialScene(input.value, renderOptions);
        case "source": {
            const loaded = loadWorldOrbitSource(input.value);
            return renderDocumentToSpatialScene(loaded.document, resolveSourceRenderOptions(loaded, renderOptions));
        }
    }
}
function cloneRenderOptions(renderOptions) {
    return {
        ...renderOptions,
        camera: renderOptions.camera ? { ...renderOptions.camera } : null,
        filter: renderOptions.filter ? { ...renderOptions.filter } : undefined,
        scaleModel: renderOptions.scaleModel ? { ...renderOptions.scaleModel } : undefined,
        layers: renderOptions.layers ? { ...renderOptions.layers } : undefined,
        theme: renderOptions.theme && typeof renderOptions.theme === "object"
            ? { ...renderOptions.theme }
            : renderOptions.theme,
        activeEventId: renderOptions.activeEventId ?? null,
        viewMode: renderOptions.viewMode ?? "2d",
        quality: renderOptions.quality ?? "balanced",
        style3d: renderOptions.style3d ?? "symbolic",
    };
}
function mergeRenderOptions(current, next) {
    return {
        ...current,
        ...next,
        camera: next.camera !== undefined
            ? next.camera
                ? { ...next.camera }
                : null
            : current.camera
                ? { ...current.camera }
                : null,
        filter: next.filter !== undefined
            ? normalizeViewerFilter(next.filter)
            : current.filter
                ? { ...current.filter }
                : undefined,
        scaleModel: next.scaleModel
            ? {
                ...(current.scaleModel ?? {}),
                ...next.scaleModel,
            }
            : current.scaleModel
                ? { ...current.scaleModel }
                : undefined,
        layers: next.layers
            ? {
                ...(current.layers ?? {}),
                ...next.layers,
            }
            : current.layers
                ? { ...current.layers }
                : undefined,
        theme: next.theme && typeof next.theme === "object"
            ? { ...next.theme }
            : next.theme ?? current.theme,
        viewMode: next.viewMode ?? current.viewMode ?? "2d",
        quality: next.quality ?? current.quality ?? "balanced",
        style3d: next.style3d ?? current.style3d ?? "symbolic",
    };
}
function hasSceneAffectingRenderOptions(options) {
    return (options.width !== undefined ||
        options.height !== undefined ||
        options.padding !== undefined ||
        options.preset !== undefined ||
        options.projection !== undefined ||
        options.camera !== undefined ||
        options.scaleModel !== undefined ||
        options.activeEventId !== undefined);
}
function resolveSourceRenderOptions(loaded, renderOptions) {
    const atlasDocument = loaded.atlasDocument ?? loaded.draftDocument;
    if (renderOptions.preset || !atlasDocument?.system?.defaults.preset) {
        return renderOptions;
    }
    return {
        ...renderOptions,
        preset: atlasDocument.system.defaults.preset,
    };
}
function fallbackSpatialSceneFromRenderScene(scene) {
    return {
        width: scene.width,
        height: scene.height,
        padding: scene.padding,
        renderPreset: scene.renderPreset,
        projection: scene.projection,
        camera: scene.camera,
        scaleModel: {
            orbitDistanceMultiplier: 1,
            bodyRadiusMultiplier: 1,
            markerSizeMultiplier: 1,
            ringThicknessMultiplier: 1,
            focusPadding: 12,
            minBodyRadius: 4,
            maxBodyRadius: 40,
        },
        title: scene.title,
        subtitle: scene.subtitle,
        systemId: scene.systemId,
        viewMode: "3d",
        layoutPreset: scene.layoutPreset,
        metadata: {
            ...scene.metadata,
            "viewer.mode": "3d-fallback",
        },
        contentBounds: {
            minX: scene.contentBounds.minX - scene.contentBounds.centerX,
            minY: -40,
            minZ: scene.contentBounds.minY - scene.contentBounds.centerY,
            maxX: scene.contentBounds.maxX - scene.contentBounds.centerX,
            maxY: 40,
            maxZ: scene.contentBounds.maxY - scene.contentBounds.centerY,
            width: scene.contentBounds.width,
            height: 80,
            depth: scene.contentBounds.height,
            center: { x: 0, y: 0, z: 0 },
        },
        semanticGroups: scene.semanticGroups,
        viewpoints: scene.viewpoints,
        activeEventId: scene.activeEventId,
        timeFrozen: scene.activeEventId !== null,
        objects: scene.objects.map((object) => ({
            objectId: object.objectId,
            object: object.object,
            parentId: object.parentId,
            ancestorIds: object.ancestorIds.slice(),
            childIds: object.childIds.slice(),
            groupId: object.groupId,
            semanticGroupIds: object.semanticGroupIds.slice(),
            position: {
                x: object.x - scene.contentBounds.centerX,
                y: 0,
                z: object.y - scene.contentBounds.centerY,
            },
            radius: object.radius,
            visualRadius: object.visualRadius,
            label: object.label,
            secondaryLabel: object.secondaryLabel,
            fillColor: object.fillColor,
            imageHref: object.imageHref,
            hidden: object.hidden,
            motion: null,
        })),
        orbits: scene.orbitVisuals.map((orbit) => ({
            objectId: orbit.objectId,
            object: orbit.object,
            parentId: orbit.parentId,
            groupId: orbit.groupId,
            semanticGroupIds: orbit.semanticGroupIds.slice(),
            center: { x: 0, y: 0, z: 0 },
            kind: orbit.kind,
            radius: orbit.radius,
            semiMajor: orbit.radius ?? orbit.rx ?? 0,
            semiMinor: orbit.radius ?? orbit.ry ?? 0,
            rotationDeg: orbit.rotationDeg,
            inclinationDeg: 0,
            band: orbit.band,
            bandThickness: orbit.bandThickness,
            hidden: orbit.hidden,
            motion: null,
        })),
        focusTargets: scene.objects.map((object) => ({
            objectId: object.objectId,
            center: {
                x: object.x - scene.contentBounds.centerX,
                y: 0,
                z: object.y - scene.contentBounds.centerY,
            },
            radius: object.visualRadius + 12,
        })),
    };
}
function createTouchGestureState(scene, state, touchPoints) {
    const { center, distance } = getTouchCenterAndDistance(touchPoints);
    return {
        startState: { ...state },
        startCenter: invertViewerPoint(scene, state, center),
        startViewportCenter: center,
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
function getClosestObjectId(target) {
    if (!(target instanceof Element)) {
        return null;
    }
    return target.closest("[data-object-id]")?.dataset.objectId ?? null;
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
function installViewerOverlayStyles() {
    if (typeof document === "undefined" || document.getElementById(TOOLTIP_STYLE_ID)) {
        return;
    }
    const style = document.createElement("style");
    style.id = TOOLTIP_STYLE_ID;
    style.textContent = `
    .wo-viewer-3d-root {
      position: relative;
      min-height: 320px;
      width: 100%;
      border-radius: 22px;
      overflow: hidden;
      background:
        radial-gradient(circle at top left, rgba(240, 180, 100, 0.08), transparent 24%),
        linear-gradient(180deg, rgba(255,255,255,0.02), transparent);
    }
    .wo-viewer-3d-loading {
      display: grid;
      place-items: center;
      min-height: 320px;
      padding: 24px;
      color: rgba(237, 246, 255, 0.76);
      font: 600 14px/1.5 "Segoe UI Variable", "Segoe UI", sans-serif;
      text-align: center;
    }
    .wo-viewer-3d-loading.is-error {
      color: #ffb2b2;
    }
    .wo-viewer-3d-canvas {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 320px;
    }
    .wo-viewer-label-root {
      position: absolute;
      inset: 0;
      z-index: 8;
      pointer-events: none;
      overflow: hidden;
    }
    .wo-viewer-label {
      position: absolute;
      display: grid;
      gap: 2px;
      padding: 4px 8px;
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(5, 16, 26, 0.72), rgba(5, 16, 26, 0.38));
      border: 1px solid rgba(164, 194, 228, 0.16);
      color: #edf6ff;
      font-family: "Segoe UI Variable", "Segoe UI", sans-serif;
      line-height: 1.15;
      text-shadow: 0 1px 2px rgba(7, 16, 25, 0.65), 0 0 18px rgba(7, 16, 25, 0.18);
      white-space: nowrap;
    }
    .wo-viewer-label[data-anchor="middle"] { transform: translate(-50%, 0); }
    .wo-viewer-label[data-anchor="end"] { transform: translate(-100%, 0); }
    .wo-viewer-label-primary {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .wo-viewer-label-secondary {
      font-size: 11px;
      font-weight: 500;
      color: rgba(237, 246, 255, 0.72);
    }
    .wo-viewer-label-event {
      color: #ffce8a;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .wo-viewer-label-event .wo-viewer-label-primary {
      font-size: 10px;
      font-weight: 700;
    }
    .wo-viewer-label.wo-object-selected .wo-viewer-label-primary,
    .wo-viewer-label.wo-chain-selected .wo-viewer-label-primary,
    .wo-viewer-label.wo-chain-hover .wo-viewer-label-primary {
      color: #ffce8a;
    }
    .wo-viewer-label.wo-object-selected .wo-viewer-label-secondary {
      color: #8fcaff;
    }
    .wo-viewer-label.wo-ancestor-selected .wo-viewer-label-primary,
    .wo-viewer-label.wo-ancestor-hover .wo-viewer-label-primary {
      opacity: 0.82;
    }
    .wo-viewer-tooltip-root {
      position: absolute;
      z-index: 12;
      min-width: 220px;
      max-width: min(320px, calc(100% - 24px));
      padding: 14px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(7, 16, 25, 0.92);
      box-shadow: 0 18px 32px rgba(0,0,0,0.28);
      color: #edf6ff;
      backdrop-filter: blur(12px);
      font: 500 13px/1.5 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
    .wo-viewer-tooltip-root[data-mode="hover"] { pointer-events: auto; }
    .wo-viewer-tooltip-root[data-mode="pinned"] { pointer-events: auto; }
    .wo-tooltip-card { display: grid; gap: 10px; }
    .wo-tooltip-head { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 12px; align-items: center; }
    .wo-tooltip-heading { display: grid; gap: 3px; }
    .wo-tooltip-heading strong { font: 700 16px/1.2 "Segoe UI Variable Display", "Segoe UI", sans-serif; }
    .wo-tooltip-heading span, .wo-tooltip-relations { color: rgba(237, 246, 255, 0.7); }
    .wo-tooltip-image {
      width: 52px;
      height: 52px;
      object-fit: cover;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
    }
    .wo-tooltip-image-placeholder {
      display: grid;
      place-items: center;
      font: 700 18px/1 "Segoe UI Variable Display", "Segoe UI", sans-serif;
      color: #ffce8a;
    }
    .wo-tooltip-description { margin: 0; }
    .wo-tooltip-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .wo-tooltip-tag {
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      color: #ffdda9;
      font: 600 11px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .wo-tooltip-fields { display: grid; gap: 6px; margin: 0; }
    .wo-tooltip-field {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: baseline;
    }
    .wo-tooltip-field dt { color: rgba(237, 246, 255, 0.68); }
    .wo-tooltip-field dd { margin: 0; font-weight: 600; text-align: right; }
    .wo-tooltip-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
    .wo-tooltip-action {
      border: 1px solid rgba(240, 180, 100, 0.24);
      border-radius: 999px;
      background: rgba(240, 180, 100, 0.12);
      color: #edf6ff;
      cursor: pointer;
      padding: 6px 12px;
      font: 600 12px/1.3 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
  `;
    document.head.append(style);
}
