import {
  normalizeDocument,
  parseWorldOrbit,
  renderDocumentToScene,
  validateDocument,
  type CoordinatePoint,
  type RenderScene,
  type RenderSceneObject,
  type WorldOrbitDocument,
} from "@worldorbit/core";

import { renderSceneToSvg } from "./render.js";
import type {
  InteractiveViewerOptions,
  ViewerObjectDetails,
  ViewerRenderOptions,
  ViewerState,
  WorldOrbitViewer,
} from "./types.js";
import {
  DEFAULT_VIEWER_STATE,
  composeViewerTransform,
  fitViewerState,
  focusViewerState,
  panViewerState,
  rotateViewerState,
  type ViewerConstraints,
  zoomViewerStateAt,
} from "./viewer-state.js";

interface TouchGestureState {
  startState: ViewerState;
  startCenter: CoordinatePoint;
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
    subtitle: options.subtitle,
  };

  const previousTabIndex = container.getAttribute("tabindex");
  const previousTouchAction = container.style.touchAction;

  let currentInput = resolveInitialInput(options);
  let scene = renderSceneFromInput(currentInput, renderOptions);
  let state = { ...DEFAULT_VIEWER_STATE };
  let svgElement: SVGSVGElement | null = null;
  let cameraRoot: SVGGElement | null = null;
  let suppressClick = false;
  let activePointerId: number | null = null;
  let lastPointerPoint: CoordinatePoint | null = null;
  let dragDistance = 0;
  let destroyed = false;
  let touchPoints = new Map<number, CoordinatePoint>();
  let touchGesture: TouchGestureState | null = null;
  let hoveredObjectId: string | null = null;

  if (previousTabIndex === null) {
    container.tabIndex = 0;
  }

  container.classList.add("wo-viewer-container");
  container.style.touchAction = behavior.touch ? "none" : previousTouchAction;

  const handleWheel = (event: WheelEvent): void => {
    if (!behavior.pointer || destroyed) {
      return;
    }

    event.preventDefault();
    container.focus();

    const anchor = getScenePointFromClient(event.clientX, event.clientY);
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

  const handlePointerMove = (event: PointerEvent): void => {
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
        const zoomedState = zoomViewerStateAt(
          scene,
          touchGesture.startState,
          factor,
          touchGesture.startCenter,
          constraints,
        );
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

    applySelection(getClosestObjectId(event.target));
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
  container.addEventListener("mouseover", handleMouseOver);
  container.addEventListener("mouseleave", handleMouseLeave);
  container.addEventListener("focusin", handleFocusIn);
  container.addEventListener("focusout", handleFocusOut);
  container.addEventListener("keydown", handleKeyDown);

  const api: WorldOrbitViewer = {
    setSource(source: string): void {
      currentInput = { kind: "source", value: source };
      scene = renderSceneFromInput(currentInput, renderOptions);
      rerenderScene(true);
    },
    setDocument(document: WorldOrbitDocument): void {
      currentInput = { kind: "document", value: document };
      scene = renderSceneFromInput(currentInput, renderOptions);
      rerenderScene(true);
    },
    setScene(nextScene: RenderScene): void {
      currentInput = { kind: "scene", value: nextScene };
      scene = nextScene;
      rerenderScene(true);
    },
    getScene(): RenderScene {
      return scene;
    },
    getRenderOptions(): ViewerRenderOptions {
      return cloneRenderOptions(renderOptions);
    },
    getObjectDetails(id: string): ViewerObjectDetails | null {
      return buildObjectDetails(id);
    },
    getSelectionDetails(): ViewerObjectDetails | null {
      return buildObjectDetails(state.selectedObjectId);
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
      updateState(focusViewerState(scene, state, id, constraints));
      applySelection(id);
    },
    resetView(): void {
      const resetState = fitViewerState(scene, { ...DEFAULT_VIEWER_STATE }, constraints);
      updateState(resetState);
      applySelection(null);
    },
    exportSvg(): string {
      return renderSceneToSvg(scene, {
        ...renderOptions,
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
      container.classList.remove("wo-viewer-container");
      container.style.touchAction = previousTouchAction;

      if (previousTabIndex === null) {
        container.removeAttribute("tabindex");
      } else {
        container.setAttribute("tabindex", previousTabIndex);
      }
    },
  };

  rerenderScene(true);
  return api;

  function rerenderScene(resetView: boolean): void {
    container.innerHTML = renderSceneToSvg(scene, {
      ...renderOptions,
      selectedObjectId: state.selectedObjectId,
    });
    svgElement = container.querySelector("svg");
    cameraRoot = container.querySelector("#worldorbit-camera-root");

    if (!svgElement || !cameraRoot) {
      throw new Error("Interactive viewer could not locate the rendered SVG camera root.");
    }

    state = resetView
      ? fitViewerState(scene, { ...DEFAULT_VIEWER_STATE }, constraints)
      : sanitizeState(state);

    applySelection(
      state.selectedObjectId &&
        scene.objects.some((object) => object.objectId === state.selectedObjectId && !object.hidden)
        ? state.selectedObjectId
        : null,
      false,
    );
    applyHover(
      hoveredObjectId &&
        scene.objects.some((object) => object.objectId === hoveredObjectId && !object.hidden)
        ? hoveredObjectId
        : null,
      false,
    );
    updateCameraTransform();
    options.onViewChange?.({ ...state });
  }

  function updateState(nextState: ViewerState): void {
    state = sanitizeState(nextState);
    updateCameraTransform();
    options.onViewChange?.({ ...state });
  }

  function sanitizeState(nextState: ViewerState): ViewerState {
    return {
      scale: clampValue(nextState.scale, constraints.minScale, constraints.maxScale),
      rotationDeg: normalizeRotation(nextState.rotationDeg),
      translateX: Number.isFinite(nextState.translateX) ? nextState.translateX : state.translateX,
      translateY: Number.isFinite(nextState.translateY) ? nextState.translateY : state.translateY,
      selectedObjectId:
        nextState.selectedObjectId &&
        scene.objects.some((object) => object.objectId === nextState.selectedObjectId && !object.hidden)
          ? nextState.selectedObjectId
          : null,
    };
  }

  function updateCameraTransform(): void {
    if (!cameraRoot) {
      return;
    }

    cameraRoot.setAttribute("transform", composeViewerTransform(scene, state));
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
        objectId && scene.objects.some((object) => object.objectId === objectId && !object.hidden)
          ? objectId
          : null,
    };

    if (state.selectedObjectId) {
      container
        .querySelector<SVGGElement>(`[data-object-id="${cssEscape(state.selectedObjectId)}"]`)
        ?.classList.add("wo-object-selected");
    }

    syncAtlasHighlights();

    if (emitCallback) {
      options.onSelectionChange?.(getSelectedObject());
      options.onSelectionDetailsChange?.(buildObjectDetails(state.selectedObjectId));
      options.onViewChange?.({ ...state });
    }
  }

  function applyHover(objectId: string | null, emitCallback = true): void {
    if (hoveredObjectId === objectId && emitCallback) {
      return;
    }

    hoveredObjectId =
      objectId && scene.objects.some((object) => object.objectId === objectId && !object.hidden)
        ? objectId
        : null;

    syncAtlasHighlights();

    if (emitCallback) {
      options.onHoverChange?.(getObjectById(hoveredObjectId));
      options.onHoverDetailsChange?.(buildObjectDetails(hoveredObjectId));
    }
  }

  function getSelectedObject(): RenderSceneObject | null {
    return getObjectById(state.selectedObjectId);
  }

  function getObjectById(objectId: string | null): RenderSceneObject | null {
    return scene.objects.find((object) => object.objectId === objectId && !object.hidden) ?? null;
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
      orbit: scene.orbitVisuals.find((orbit) => orbit.objectId === renderObject.objectId && !orbit.hidden) ?? null,
      relatedOrbits: scene.orbitVisuals.filter(
        (orbit) =>
          !orbit.hidden &&
          (orbit.objectId === renderObject.objectId ||
            renderObject.ancestorIds.includes(orbit.objectId) ||
            renderObject.childIds.includes(orbit.objectId)),
      ),
      parent: getObjectById(renderObject.parentId),
      children: renderObject.childIds.map((childId) => getObjectById(childId)).filter(Boolean) as RenderSceneObject[],
      ancestors: renderObject.ancestorIds
        .map((ancestorId) => getObjectById(ancestorId))
        .filter(Boolean) as RenderSceneObject[],
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

  function getScenePointFromClient(clientX: number, clientY: number): CoordinatePoint {
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
    case "source":
      return renderDocumentToScene(parseSource(input.value), renderOptions);
  }
}

function cloneRenderOptions(renderOptions: ViewerRenderOptions): ViewerRenderOptions {
  return {
    ...renderOptions,
    scaleModel: renderOptions.scaleModel ? { ...renderOptions.scaleModel } : undefined,
    layers: renderOptions.layers ? { ...renderOptions.layers } : undefined,
    theme:
      renderOptions.theme && typeof renderOptions.theme === "object"
        ? { ...renderOptions.theme }
        : renderOptions.theme,
  };
}

function mergeRenderOptions(
  current: ViewerRenderOptions,
  next: Partial<ViewerRenderOptions>,
): ViewerRenderOptions {
  return {
    ...current,
    ...next,
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
    options.scaleModel !== undefined
  );
}

function parseSource(source: string): WorldOrbitDocument {
  const ast = parseWorldOrbit(source);
  const document = normalizeDocument(ast);
  validateDocument(document);
  return document;
}

function createTouchGestureState(
  state: ViewerState,
  touchPoints: Map<number, CoordinatePoint>,
): TouchGestureState {
  const { center, distance } = getTouchCenterAndDistance(touchPoints);
  return {
    startState: { ...state },
    startCenter: center,
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
