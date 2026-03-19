import {
  loadWorldOrbitSource,
  renderDocumentToScene,
  rotatePoint,
  type CoordinatePoint,
  type LoadedWorldOrbitSource,
  type RenderScene,
  type RenderSceneObject,
  type RenderSceneViewpoint,
  type WorldOrbitDocument,
} from "@worldorbit/core";

import {
  computeVisibleObjectIds,
  createAtlasStateSnapshot,
  createViewerBookmark,
  deserializeViewerAtlasState,
  normalizeViewerFilter,
  sceneViewpointToLayerOptions,
  searchSceneObjects,
  serializeViewerAtlasState,
  viewpointToViewerFilter,
} from "./atlas-state.js";
import { renderViewerMinimap } from "./minimap.js";
import { renderSceneToSvg } from "./render.js";
import {
  buildViewerTooltipDetails,
  renderDefaultTooltipContent,
} from "./tooltip.js";
import type {
  InteractiveViewerOptions,
  TooltipMode,
  ViewerAtlasState,
  ViewerBookmark,
  ViewerFilter,
  ViewerObjectDetails,
  ViewerRenderOptions,
  ViewerSearchResult,
  ViewerState,
  ViewerTooltipDetails,
  WorldOrbitViewer,
} from "./types.js";
import {
  DEFAULT_VIEWER_STATE,
  composeViewerTransform,
  fitViewerState,
  focusViewerState,
  invertViewerPoint,
  panViewerState,
  rotateViewerState,
  type ViewerConstraints,
  zoomViewerStateAt,
} from "./viewer-state.js";

interface TouchGestureState {
  startState: ViewerState;
  startCenter: CoordinatePoint;
  startViewportCenter: CoordinatePoint;
  startDistance: number;
}

type ViewerInput =
  | { kind: "source"; value: string }
  | { kind: "document"; value: WorldOrbitDocument }
  | { kind: "scene"; value: RenderScene };

const DEFAULT_VIEWER_LIMITS = {
  minScale: 0.2,
  maxScale: 8,
  fitPadding: 48,
  panStep: 40,
  zoomStep: 1.2,
  rotationStep: 15,
};
const TOOLTIP_STYLE_ID = "worldorbit-viewer-tooltip-style";

export function createInteractiveViewer(
  container: HTMLElement,
  options: InteractiveViewerOptions,
): WorldOrbitViewer {
  ensureBrowserEnvironment(container);

  const inputCount =
    Number(Boolean(options.source)) +
    Number(Boolean(options.document)) +
    Number(Boolean(options.scene));

  if (inputCount !== 1) {
    throw new Error('Interactive viewer requires exactly one of "source", "document", or "scene".');
  }

  const constraints: ViewerConstraints = {
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

  let renderOptions: ViewerRenderOptions = {
    width: options.width,
    height: options.height,
    padding: options.padding,
    preset: options.preset,
    projection: options.projection,
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
  let state = { ...DEFAULT_VIEWER_STATE };
  let svgElement: SVGSVGElement | null = null;
  let cameraRoot: SVGGElement | null = null;
  let minimapRoot: HTMLElement | null = null;
  let tooltipRoot: HTMLElement | null = null;
  let suppressClick = false;
  let activePointerId: number | null = null;
  let lastPointerPoint: CoordinatePoint | null = null;
  let dragDistance = 0;
  let destroyed = false;
  let touchPoints = new Map<number, CoordinatePoint>();
  let touchGesture: TouchGestureState | null = null;
  let hoveredObjectId: string | null = null;
  let pinnedTooltipObjectId: string | null = null;
  let activeTooltipObjectId: string | null = null;
  let activeTooltipDetails: ViewerTooltipDetails | null = null;
  let activeViewpointId: string | null = null;

  if (previousTabIndex === null) {
    container.tabIndex = 0;
  }

  installViewerTooltipStyles();
  container.classList.add("wo-viewer-container");
  container.style.touchAction = behavior.touch ? "none" : previousTouchAction;
  if (!container.style.position) {
    container.style.position = "relative";
  }

  const handleWheel = (event: WheelEvent): void => {
    if (!behavior.pointer || destroyed) {
      return;
    }

    event.preventDefault();
    container.focus();

    const anchor = getWorldPointFromClient(event.clientX, event.clientY);
    const factor = clampValue(Math.exp(-event.deltaY * 0.002), 0.6, 1.6);
    updateState(zoomViewerStateAt(scene, state, factor, anchor, constraints));
  };

  const handlePointerDown = (event: PointerEvent): void => {
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

    const point = getViewportPointFromClient(event.clientX, event.clientY);
    if (isTouch) {
      touchPoints.set(event.pointerId, point);
      if (touchPoints.size === 2) {
        touchGesture = createTouchGestureState(scene, state, touchPoints);
      } else if (touchPoints.size === 1) {
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

  const handlePointerMove = (event: PointerEvent): void => {
    if (destroyed) {
      return;
    }

    const isTouch = event.pointerType === "touch";
    if (isTouch) {
      if (!behavior.touch || !touchPoints.has(event.pointerId)) {
        return;
      }

      const prevPoint = touchPoints.get(event.pointerId)!;
      const nextPoint = getViewportPointFromClient(event.clientX, event.clientY);
      touchPoints.set(event.pointerId, nextPoint);

      if (touchPoints.size === 2) {
        if (!touchGesture) {
          touchGesture = createTouchGestureState(scene, state, touchPoints);
        }

        const current = getTouchCenterAndDistance(touchPoints);
        const factor = current.distance / Math.max(touchGesture.startDistance, 1);
        const zoomedState = zoomViewerStateAt(
          scene,
          touchGesture.startState,
          factor,
          touchGesture.startCenter,
          constraints,
        );
        const deltaX = current.center.x - touchGesture.startViewportCenter.x;
        const deltaY = current.center.y - touchGesture.startViewportCenter.y;
        updateState(panViewerState(zoomedState, deltaX, deltaY));
      } else if (touchPoints.size === 1) {
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

  const handlePointerEnd = (event: PointerEvent): void => {
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

  const handleClick = (event: MouseEvent): void => {
    if (!behavior.selection || destroyed) {
      return;
    }

    if (suppressClick) {
      suppressClick = false;
      return;
    }

    const objectId = getClosestObjectId(event.target);
    applySelection(objectId);
    if (behavior.tooltipMode === "pinned") {
      pinnedTooltipObjectId = objectId;
      updateTooltip();
    }
  };

  const handleMouseOver = (event: MouseEvent): void => {
    const objectId = getClosestObjectId(event.target);
    applyHover(objectId);
  };

  const handleMouseLeave = (): void => {
    applyHover(null);
  };

  const handleFocusIn = (event: FocusEvent): void => {
    const objectId = getClosestObjectId(event.target);
    if (!objectId) {
      return;
    }
    applyHover(objectId);
  };

  const handleFocusOut = (): void => {
    applyHover(null);
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (!behavior.keyboard || destroyed) {
      return;
    }

    const objectId = getClosestObjectId(event.target);
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

  const api: WorldOrbitViewer = {
    setSource(source: string): void {
      currentInput = { kind: "source", value: source };
      scene = renderSceneFromInput(currentInput, renderOptions);
      activeViewpointId = null;
      rerenderScene(true);
    },
    setDocument(document: WorldOrbitDocument): void {
      currentInput = { kind: "document", value: document };
      scene = renderSceneFromInput(currentInput, renderOptions);
      activeViewpointId = null;
      rerenderScene(true);
    },
    setScene(nextScene: RenderScene): void {
      currentInput = { kind: "scene", value: nextScene };
      scene = nextScene;
      activeViewpointId = null;
      rerenderScene(true);
    },
    getScene(): RenderScene {
      return scene;
    },
    getRenderOptions(): ViewerRenderOptions {
      return cloneRenderOptions(renderOptions);
    },
    listViewpoints(): RenderSceneViewpoint[] {
      return scene.viewpoints.slice();
    },
    getActiveViewpoint(): RenderSceneViewpoint | null {
      return getViewpointById(activeViewpointId);
    },
    goToViewpoint(id: string): boolean {
      const viewpoint = getViewpointById(id);
      if (!viewpoint) {
        return false;
      }

      const nextRenderOptions: Partial<ViewerRenderOptions> = {};
      const viewpointLayers = sceneViewpointToLayerOptions(viewpoint);
      if (viewpoint.preset !== null) {
        nextRenderOptions.preset = viewpoint.preset;
      }
      if (currentInput.kind !== "scene" && viewpoint.projection !== scene.projection) {
        nextRenderOptions.projection = viewpoint.projection;
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
    getActiveEventId(): string | null {
      return renderOptions.activeEventId ?? null;
    },
    setActiveEvent(id: string | null): void {
      api.setRenderOptions({ activeEventId: id });
    },
    search(query: string, limit = 12): ViewerSearchResult[] {
      return searchSceneObjects(scene, query, limit);
    },
    getFilter(): ViewerFilter | null {
      return renderOptions.filter ? { ...renderOptions.filter } : null;
    },
    setFilter(filter: ViewerFilter | null): void {
      setFilterInternal(filter, true, true);
    },
    getVisibleObjects(): RenderSceneObject[] {
      return getVisibleSceneObjects();
    },
    getFocusPath(id: string): RenderSceneObject[] {
      return buildFocusPath(id);
    },
    getObjectDetails(id: string): ViewerObjectDetails | null {
      return buildObjectDetails(id);
    },
    getSelectionDetails(): ViewerObjectDetails | null {
      return buildObjectDetails(state.selectedObjectId);
    },
    getTooltipDetails(): ViewerTooltipDetails | null {
      return activeTooltipDetails;
    },
    getAtlasState(): ViewerAtlasState {
      return createAtlasStateSnapshot(
        state,
        renderOptions,
        renderOptions.filter ?? null,
        activeViewpointId,
      );
    },
    setAtlasState(nextAtlasState: ViewerAtlasState | string): void {
      const atlasState =
        typeof nextAtlasState === "string"
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
    serializeAtlasState(): string {
      return serializeViewerAtlasState(api.getAtlasState());
    },
    captureBookmark(name: string, label?: string): ViewerBookmark {
      return createViewerBookmark(name, label, api.getAtlasState());
    },
    applyBookmark(bookmark: ViewerBookmark | string): boolean {
      if (typeof bookmark === "string") {
        api.setAtlasState(bookmark);
        return true;
      }

      api.setAtlasState(bookmark.atlasState);
      return true;
    },
    setRenderOptions(options: Partial<ViewerRenderOptions>): void {
      const sceneAffecting = hasSceneAffectingRenderOptions(options);
      renderOptions = mergeRenderOptions(renderOptions, options);
      if (currentInput.kind !== "scene" && sceneAffecting) {
        scene = renderSceneFromInput(currentInput, renderOptions);
      }
      rerenderScene(sceneAffecting);
    },
    getState(): ViewerState {
      return { ...state };
    },
    setState(nextState: Partial<ViewerState>): void {
      updateState(sanitizeState({ ...state, ...nextState }));
    },
    zoomBy(factor: number, anchor?: CoordinatePoint): void {
      updateState(
        zoomViewerStateAt(
          scene,
          state,
          factor,
          anchor ?? { x: scene.width / 2, y: scene.height / 2 },
          constraints,
        ),
      );
    },
    panBy(dx: number, dy: number): void {
      updateState(panViewerState(state, dx, dy));
    },
    rotateBy(deg: number): void {
      updateState(rotateViewerState(state, deg));
    },
    fitToSystem(): void {
      updateState(fitViewerState(scene, state, constraints));
    },
    focusObject(id: string): void {
      activeViewpointId = null;
      updateState(focusViewerState(scene, state, id, constraints));
      applySelection(id);
      if (behavior.tooltipMode === "pinned") {
        pinnedTooltipObjectId = getObjectById(id)?.objectId ?? null;
        updateTooltip();
      }
    },
    pinTooltip(id: string | null): void {
      pinnedTooltipObjectId = getObjectById(id)?.objectId ?? null;
      updateTooltip();
    },
    resetView(): void {
      const resetState = fitViewerState(scene, { ...DEFAULT_VIEWER_STATE }, constraints);
      activeViewpointId = null;
      updateState(resetState);
      applySelection(null);
      pinnedTooltipObjectId = null;
      updateTooltip();
    },
    exportSvg(): string {
      return renderSceneToSvg(scene, {
        ...renderOptions,
        filter: renderOptions.filter ?? null,
        selectedObjectId: state.selectedObjectId,
      });
    },
    destroy(): void {
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
      tooltipRoot?.remove();
      tooltipRoot = null;
      minimapRoot?.remove();
      minimapRoot = null;
      container.classList.remove("wo-viewer-container");
      container.style.touchAction = previousTouchAction;
      container.style.position = previousPosition;

      if (previousTabIndex === null) {
        container.removeAttribute("tabindex");
      } else {
        container.setAttribute("tabindex", previousTabIndex);
      }
    },
  };

  rerenderScene(true);
  if (options.initialViewpointId) {
    api.goToViewpoint(options.initialViewpointId);
  } else if (options.initialSelectionObjectId) {
    api.focusObject(options.initialSelectionObjectId);
  } else {
    emitAtlasStateChange();
  }
  return api;

  function rerenderScene(resetView: boolean): void {
    container.innerHTML = renderSceneToSvg(scene, {
      ...renderOptions,
      filter: renderOptions.filter ?? null,
      selectedObjectId: state.selectedObjectId,
    });
    svgElement = container.querySelector('[data-worldorbit-svg="true"]');
    cameraRoot = container.querySelector("#worldorbit-camera-root");
    minimapRoot = null;
    tooltipRoot = null;

    if (behavior.minimap) {
      minimapRoot = document.createElement("div");
      minimapRoot.dataset.worldorbitMinimapRoot = "true";
      container.append(minimapRoot);
    }

    if (behavior.tooltipMode !== "disabled") {
      tooltipRoot = document.createElement("div");
      tooltipRoot.className = "wo-viewer-tooltip-root";
      tooltipRoot.dataset.worldorbitTooltip = "true";
      tooltipRoot.hidden = true;
      tooltipRoot.addEventListener("click", handleTooltipClick);
      container.append(tooltipRoot);
    }

    if (!svgElement || !cameraRoot) {
      throw new Error("Interactive viewer could not locate the rendered SVG camera root.");
    }

    state = resetView
      ? fitViewerState(scene, { ...DEFAULT_VIEWER_STATE }, constraints)
      : sanitizeState(state);

    applySelection(
      state.selectedObjectId &&
        getObjectById(state.selectedObjectId)
        ? state.selectedObjectId
        : null,
      false,
    );
    applyHover(
      hoveredObjectId &&
        getObjectById(hoveredObjectId)
        ? hoveredObjectId
        : null,
      false,
    );
    pinnedTooltipObjectId =
      pinnedTooltipObjectId && getObjectById(pinnedTooltipObjectId)
        ? pinnedTooltipObjectId
        : null;
    updateCameraTransform();
    notifyFilterChange();
    notifyViewpointChange();
    options.onViewChange?.({ ...state });
    emitAtlasStateChange();
  }

  function updateState(nextState: ViewerState): void {
    state = sanitizeState(nextState);
    updateCameraTransform();
    options.onViewChange?.({ ...state });
    emitAtlasStateChange();
  }

  function sanitizeState(nextState: ViewerState): ViewerState {
    return {
      scale: clampValue(nextState.scale, constraints.minScale, constraints.maxScale),
      rotationDeg: normalizeRotation(nextState.rotationDeg),
      translateX: Number.isFinite(nextState.translateX) ? nextState.translateX : state.translateX,
      translateY: Number.isFinite(nextState.translateY) ? nextState.translateY : state.translateY,
      selectedObjectId:
        nextState.selectedObjectId && getObjectById(nextState.selectedObjectId)
          ? nextState.selectedObjectId
          : null,
    };
  }

  function updateCameraTransform(): void {
    if (!cameraRoot) {
      return;
    }

    cameraRoot.setAttribute("transform", composeViewerTransform(scene, state));
    updateMinimap();
    updateTooltip();
  }

  function applySelection(objectId: string | null, emitCallback = true): void {
    if (state.selectedObjectId) {
      container
        .querySelector<SVGGElement>(`[data-object-id="${cssEscape(state.selectedObjectId)}"]`)
        ?.classList.remove("wo-object-selected");
    }

    state = {
      ...state,
      selectedObjectId:
        objectId && getObjectById(objectId)
          ? objectId
          : null,
    };

    if (state.selectedObjectId) {
      container
        .querySelector<SVGGElement>(`[data-object-id="${cssEscape(state.selectedObjectId)}"]`)
        ?.classList.add("wo-object-selected");
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

  function applyHover(objectId: string | null, emitCallback = true): void {
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

  function getSelectedObject(): RenderSceneObject | null {
    return getObjectById(state.selectedObjectId);
  }

  function getObjectById(objectId: string | null): RenderSceneObject | null {
    if (!objectId) {
      return null;
    }

    const visibleObjectIds = getVisibleObjectIds();
    return (
      scene.objects.find(
        (object) =>
          object.objectId === objectId &&
          !object.hidden &&
          visibleObjectIds.has(object.objectId),
      ) ?? null
    );
  }

  function buildObjectDetails(objectId: string | null): ViewerObjectDetails | null {
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
      semanticGroups: scene.semanticGroups.filter((group) =>
        renderObject.semanticGroupIds.includes(group.id),
      ),
      orbit: scene.orbitVisuals.find((orbit) => orbit.objectId === renderObject.objectId && !orbit.hidden) ?? null,
      relatedOrbits: scene.orbitVisuals.filter(
        (orbit) =>
          !orbit.hidden &&
          (orbit.objectId === renderObject.objectId ||
            renderObject.ancestorIds.includes(orbit.objectId) ||
            renderObject.childIds.includes(orbit.objectId)),
      ),
      relations: scene.relations.filter(
        (relation) =>
          !relation.hidden &&
          (relation.fromObjectId === renderObject.objectId ||
            relation.toObjectId === renderObject.objectId),
      ),
      relatedEvents: scene.events.filter(
        (event) =>
          !event.hidden &&
          (event.targetObjectId === renderObject.objectId ||
            event.objectIds.includes(renderObject.objectId)),
      ),
      parent: getObjectById(renderObject.parentId),
      children: renderObject.childIds.map((childId) => getObjectById(childId)).filter(Boolean) as RenderSceneObject[],
      ancestors: renderObject.ancestorIds
        .map((ancestorId) => getObjectById(ancestorId))
        .filter(Boolean) as RenderSceneObject[],
      focusPath: buildFocusPath(renderObject.objectId),
    };
  }

  function syncAtlasHighlights(): void {
    for (const element of container.querySelectorAll<HTMLElement>(
      ".wo-chain-selected, .wo-chain-hover, .wo-ancestor-selected, .wo-ancestor-hover, .wo-orbit-related-selected, .wo-orbit-related-hover",
    )) {
      element.classList.remove(
        "wo-chain-selected",
        "wo-chain-hover",
        "wo-ancestor-selected",
        "wo-ancestor-hover",
        "wo-orbit-related-selected",
        "wo-orbit-related-hover",
      );
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

  function applyChainClasses(
    objectId: string | null,
    classes: { objectClass: string; ancestorClass: string; orbitClass: string },
  ): void {
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
      for (const element of container.querySelectorAll<HTMLElement>(
        `[data-object-id="${cssEscape(id)}"]`,
      )) {
        element.classList.add(classes.objectClass);
      }
    }

    for (const ancestor of details.ancestors) {
      for (const element of container.querySelectorAll<HTMLElement>(
        `[data-object-id="${cssEscape(ancestor.objectId)}"]`,
      )) {
        element.classList.add(classes.ancestorClass);
      }
    }

    for (const orbit of details.relatedOrbits) {
      for (const element of container.querySelectorAll<HTMLElement>(
        `[data-orbit-object-id="${cssEscape(orbit.objectId)}"]`,
      )) {
        element.classList.add(classes.orbitClass);
      }
    }
  }

  function getViewportPointFromClient(clientX: number, clientY: number): CoordinatePoint {
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

  function getWorldPointFromClient(clientX: number, clientY: number): CoordinatePoint {
    return invertViewerPoint(scene, state, getViewportPointFromClient(clientX, clientY));
  }

  function getVisibleObjectIds(): Set<string> {
    return computeVisibleObjectIds(scene, renderOptions.filter ?? null);
  }

  function getVisibleSceneObjects(): RenderSceneObject[] {
    const visibleObjectIds = getVisibleObjectIds();
    return scene.objects.filter(
      (object) => !object.hidden && visibleObjectIds.has(object.objectId),
    );
  }

  function buildFocusPath(objectId: string): RenderSceneObject[] {
    const object = scene.objects.find((entry) => entry.objectId === objectId && !entry.hidden);
    if (!object) {
      return [];
    }

    return [...object.ancestorIds, object.objectId]
      .map((entryId) => getObjectById(entryId))
      .filter(Boolean) as RenderSceneObject[];
  }

  function getViewpointById(id: string | null): RenderSceneViewpoint | null {
    return scene.viewpoints.find((viewpoint) => viewpoint.id === id) ?? null;
  }

  function createViewpointState(viewpoint: RenderSceneViewpoint): ViewerState {
    const rotationDeg = normalizeRotation(viewpoint.rotationDeg);
    const scale =
      viewpoint.scale !== null && viewpoint.scale !== undefined
        ? clampValue(viewpoint.scale, constraints.minScale, constraints.maxScale)
        : null;
    const targetObject =
      viewpoint.objectId &&
      scene.objects.find((object) => object.objectId === viewpoint.objectId && !object.hidden);

    if (targetObject) {
      return createCenteredState(
        { x: targetObject.x, y: targetObject.y },
        scale ?? Math.max(1.8, DEFAULT_VIEWER_STATE.scale),
        rotationDeg,
        viewpoint.selectedObjectId ?? targetObject.objectId,
      );
    }

    const baseState = fitViewerState(scene, { ...DEFAULT_VIEWER_STATE, rotationDeg }, constraints);
    if (scale === null) {
      return {
        ...baseState,
        rotationDeg,
        selectedObjectId: viewpoint.selectedObjectId ?? null,
      };
    }

    return createCenteredState(
      {
        x: scene.contentBounds.centerX,
        y: scene.contentBounds.centerY,
      },
      scale,
      rotationDeg,
      viewpoint.selectedObjectId ?? null,
    );
  }

  function createCenteredState(
    target: CoordinatePoint,
    scale: number,
    rotationDeg: number,
    selectedObjectId: string | null,
  ): ViewerState {
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

  function setFilterInternal(
    filter: ViewerFilter | null,
    emitCallbacks: boolean,
    clearActiveViewpoint: boolean,
  ): void {
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

  function notifyFilterChange(): void {
    options.onFilterChange?.(renderOptions.filter ?? null, getVisibleSceneObjects());
  }

  function notifyViewpointChange(): void {
    options.onViewpointChange?.(getViewpointById(activeViewpointId));
  }

  function emitAtlasStateChange(): void {
    options.onAtlasStateChange?.(api.getAtlasState());
  }

  function updateMinimap(): void {
    if (!behavior.minimap || !minimapRoot) {
      return;
    }

    minimapRoot.innerHTML = renderViewerMinimap(scene, state, getVisibleSceneObjects());
  }

  function updateTooltip(): void {
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

  function resolveTooltipTarget(): { objectId: string; mode: TooltipMode } | null {
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

  function renderTooltipContent(
    element: HTMLElement,
    details: ViewerTooltipDetails,
    mode: TooltipMode,
  ): void {
    const customMarkup = options.tooltipRenderer?.(details, mode);
    element.innerHTML = "";

    if (typeof customMarkup === "string") {
      element.innerHTML = customMarkup;
    } else if (customMarkup instanceof HTMLElement) {
      element.append(customMarkup);
    } else {
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
    } else {
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

  function positionTooltip(
    element: HTMLElement,
    renderObject: RenderSceneObject,
  ): void {
    if (!svgElement) {
      return;
    }

    const anchor = {
      x: renderObject.anchorX ?? renderObject.x,
      y:
        renderObject.anchorY ??
        renderObject.y - Math.max(renderObject.visualRadius, renderObject.radius),
    };
    const viewportPoint = projectWorldPoint(anchor);
    const svgRect = svgElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const pointX =
      svgRect.left -
      containerRect.left +
      (viewportPoint.x / Math.max(scene.width, 1)) * svgRect.width;
    const pointY =
      svgRect.top -
      containerRect.top +
      (viewportPoint.y / Math.max(scene.height, 1)) * svgRect.height;
    const maxLeft = Math.max(container.clientWidth - element.offsetWidth - 12, 12);
    const maxTop = Math.max(container.clientHeight - element.offsetHeight - 12, 12);
    const preferAbove = pointY > container.clientHeight * 0.48;
    const nextLeft = clampValue(pointX + 18, 12, maxLeft);
    const nextTop = clampValue(
      preferAbove ? pointY - element.offsetHeight - 18 : pointY + 18,
      12,
      maxTop,
    );

    element.style.left = `${nextLeft}px`;
    element.style.top = `${nextTop}px`;
  }

  function projectWorldPoint(point: CoordinatePoint): CoordinatePoint {
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

  function handleTooltipClick(event: MouseEvent): void {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-tooltip-action]");
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

  function setTooltipDetails(details: ViewerTooltipDetails | null): void {
    const changed =
      activeTooltipDetails?.objectId !== details?.objectId ||
      activeTooltipDetails?.description !== details?.description ||
      activeTooltipDetails?.imageHref !== details?.imageHref;

    activeTooltipDetails = details;
    activeTooltipObjectId = details?.objectId ?? null;

    if (changed) {
      options.onTooltipChange?.(details);
    }
  }
}

function resolveInitialInput(options: InteractiveViewerOptions): ViewerInput {
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

function renderSceneFromInput(
  input: ViewerInput,
  renderOptions: ViewerRenderOptions,
): RenderScene {
  switch (input.kind) {
    case "scene":
      return input.value;
    case "document":
      return renderDocumentToScene(input.value, renderOptions);
    case "source": {
      const loaded = loadWorldOrbitSource(input.value);
      return renderDocumentToScene(
        loaded.document,
        resolveSourceRenderOptions(loaded, renderOptions),
      );
    }
  }
}

function cloneRenderOptions(renderOptions: ViewerRenderOptions): ViewerRenderOptions {
  return {
    ...renderOptions,
    filter: renderOptions.filter ? { ...renderOptions.filter } : undefined,
    scaleModel: renderOptions.scaleModel ? { ...renderOptions.scaleModel } : undefined,
    layers: renderOptions.layers ? { ...renderOptions.layers } : undefined,
    theme:
      renderOptions.theme && typeof renderOptions.theme === "object"
        ? { ...renderOptions.theme }
        : renderOptions.theme,
    activeEventId: renderOptions.activeEventId ?? null,
  };
}

function mergeRenderOptions(
  current: ViewerRenderOptions,
  next: Partial<ViewerRenderOptions>,
): ViewerRenderOptions {
  return {
    ...current,
    ...next,
    filter:
      next.filter !== undefined
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
    theme:
      next.theme && typeof next.theme === "object"
        ? { ...next.theme }
        : next.theme ?? current.theme,
  };
}

function hasSceneAffectingRenderOptions(options: Partial<ViewerRenderOptions>): boolean {
  return (
    options.width !== undefined ||
    options.height !== undefined ||
    options.padding !== undefined ||
    options.preset !== undefined ||
    options.projection !== undefined ||
    options.scaleModel !== undefined ||
    options.activeEventId !== undefined
  );
}

function resolveSourceRenderOptions(
  loaded: LoadedWorldOrbitSource,
  renderOptions: ViewerRenderOptions,
): ViewerRenderOptions {
  const atlasDocument = loaded.atlasDocument ?? loaded.draftDocument;

  if (renderOptions.preset || !atlasDocument?.system?.defaults.preset) {
    return renderOptions;
  }

  return {
    ...renderOptions,
    preset: atlasDocument.system.defaults.preset,
  };
}

function createTouchGestureState(
  scene: RenderScene,
  state: ViewerState,
  touchPoints: Map<number, CoordinatePoint>,
): TouchGestureState {
  const { center, distance } = getTouchCenterAndDistance(touchPoints);
  return {
    startState: { ...state },
    startCenter: invertViewerPoint(scene, state, center),
    startViewportCenter: center,
    startDistance: distance,
  };
}

function getTouchCenterAndDistance(
  touchPoints: Map<number, CoordinatePoint>,
): { center: CoordinatePoint; distance: number } {
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

function getClosestObjectId(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest<SVGGElement>("[data-object-id]")?.dataset.objectId ?? null;
}

function ensureBrowserEnvironment(container: HTMLElement): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("createInteractiveViewer can only run in a browser environment.");
  }

  if (!(container instanceof HTMLElement)) {
    throw new Error("Interactive viewer requires an HTMLElement container.");
  }
}

function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeRotation(rotationDeg: number): number {
  let normalized = rotationDeg % 360;

  if (normalized > 180) {
    normalized -= 360;
  }

  if (normalized <= -180) {
    normalized += 360;
  }

  return normalized;
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/["\\]/g, "\\$&");
}

function installViewerTooltipStyles(): void {
  if (typeof document === "undefined" || document.getElementById(TOOLTIP_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = TOOLTIP_STYLE_ID;
  style.textContent = `
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
