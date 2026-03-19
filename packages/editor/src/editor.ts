import {
  cloneAtlasDocument,
  createEmptyAtlasDocument,
  formatDocument,
  getAtlasDocumentNode,
  loadWorldOrbitSourceWithDiagnostics,
  materializeAtlasDocument,
  removeAtlasDocumentNode,
  resolveAtlasDiagnostics,
  rotatePoint,
  upgradeDocumentToV2,
  validateAtlasDocumentWithDiagnostics,
  type AtlasDocumentPath,
  type AtlasResolvedDiagnostic,
  type CoordinatePoint,
  type NormalizedValue,
  type RenderScene,
  type UnitValue,
  type WorldOrbitAtlasAnnotation,
  type WorldOrbitAtlasDocument,
  type WorldOrbitEvent,
  type WorldOrbitEventPose,
  type WorldOrbitAtlasViewpoint,
  type WorldOrbitObject,
} from "@worldorbit/core";
import { renderWorldOrbitBlock } from "@worldorbit/markdown";
import {
  createInteractiveViewer,
  type ViewerObjectDetails,
  type WorldOrbitViewer,
} from "@worldorbit/viewer";
import { getViewerVisibleBounds, invertViewerPoint } from "@worldorbit/viewer/viewer-state";

import type {
  WorldOrbitEditor,
  WorldOrbitEditorFormState,
  WorldOrbitEditorOptions,
  WorldOrbitEditorSelection,
  WorldOrbitEditorSnapshot,
} from "./types.js";

interface HistoryEntry {
  atlasDocument: WorldOrbitAtlasDocument;
  selection: AtlasDocumentPath | null;
  source: string;
}

interface LoadedEditorState {
  atlasDocument: WorldOrbitAtlasDocument;
  source: string;
  diagnostics: AtlasResolvedDiagnostic[];
}

interface DragState {
  kind: "orbit-phase" | "orbit-radius" | "at-reference" | "surface-target" | "free-distance";
  objectId: string;
  pointerId: number;
  path: AtlasDocumentPath;
  startedFrom: HistoryEntry;
  changed: boolean;
  orbitRadiusContext?: OrbitRadiusDragContext | null;
}

interface DiagnosticBucket {
  errors: number;
  warnings: number;
}

interface OrbitRadiusDragContext {
  innerPx: number;
  stepPx: number;
  radiusOffsetPx: number;
  preferredUnit: UnitValue["unit"];
}

interface FieldHelpEntry {
  description: string;
  references?: string[];
}

const STYLE_ID = "worldorbit-editor-style";
const SOURCE_INPUT_DEBOUNCE_MS = 120;
const PREVIEW_BATCH_DELAY_MS = 16;
const FREE_DISTANCE_PIXEL_FACTOR = 96;
const AU_IN_KM = 149_597_870.7;
const EARTH_RADIUS_IN_KM = 6_371;
const SOLAR_RADIUS_IN_KM = 695_700;
const PLACEMENT_DIAGNOSTIC_FIELDS = new Set([
  "placement",
  "target",
  "reference",
  "distance",
  "semiMajor",
  "eccentricity",
  "period",
  "angle",
  "inclination",
  "phase",
  "descriptor",
]);
const SURFACE_TARGET_TYPES = new Set<WorldOrbitObject["type"]>([
  "star",
  "planet",
  "moon",
  "asteroid",
  "comet",
]);
const OBJECT_TYPES: WorldOrbitObject["type"][] = [
  "star",
  "planet",
  "moon",
  "belt",
  "asteroid",
  "comet",
  "ring",
  "structure",
  "phenomenon",
];
const OBJECT_STRING_FIELDS = [
  "kind",
  "class",
  "culture",
  "color",
  "image",
  "atmosphere",
  "on",
  "source",
] as const;
const OBJECT_UNIT_FIELDS = [
  "radius",
  "mass",
  "density",
  "gravity",
  "temperature",
  "inner",
  "outer",
  "cycle",
] as const;
const OBJECT_NUMBER_FIELDS = ["albedo"] as const;
const FIELD_HELP: Partial<Record<string, FieldHelpEntry>> = {
  "defaults-view": {
    description: "Sets the default camera projection for the atlas.",
    references: [
      "Topdown = map-like",
      "Isometric = angled overview",
      "Orthographic/Perspective = 3D-ready semantic views",
    ],
  },
  "defaults-scale": {
    description: "Chooses the overall spacing/style preset used by the renderer.",
    references: ["diagram = tighter", "presentation = roomier"],
  },
  "defaults-units": {
    description: "Stores a document-wide note about the unit style you want to use.",
    references: ["Example: metric", "Example: lore-standard"],
  },
  "viewpoint-projection": {
    description: "Overrides the projection for this saved viewpoint.",
    references: [
      "Topdown = flat orbital map",
      "Isometric = angled scene",
      "Orthographic/Perspective = stored with current 2D fallback",
    ],
  },
  "viewpoint-zoom": {
    description: "Controls how closely this viewpoint frames the system.",
    references: ["1 = scene fit", "2+ = close-up"],
  },
  "viewpoint-rotation": {
    description: "Legacy 2D screen rotation. This is separate from the Schema 2.5 camera block.",
    references: ["90deg = quarter turn", "Use camera.azimuth for semantic view direction"],
  },
  "viewpoint-camera-azimuth": {
    description: "Horizontal camera direction in degrees for Schema 2.5 viewpoints.",
    references: ["0 = forward/default", "90 = quarter orbit around the scene"],
  },
  "viewpoint-camera-elevation": {
    description: "Vertical camera tilt in degrees for 3D-ready viewpoints.",
    references: ["0 = level", "30 = gentle look down"],
  },
  "viewpoint-camera-roll": {
    description: "Rolls the camera around its forward axis.",
    references: ["0 = upright", "15 = slight bank"],
  },
  "viewpoint-camera-distance": {
    description: "Semantic camera distance for perspective viewpoints.",
    references: ["4 = close", "12 = wide framing"],
  },
  "viewpoint-events": {
    description: "Lists event IDs that this viewpoint should feature in its detail panel.",
    references: ["solar-eclipse-naar", "transit-window conjunction"],
  },
  "event-kind": {
    description: "Short semantic event type for tooling and viewer overlays.",
    references: ["solar-eclipse", "lunar-eclipse", "transit"],
  },
  "event-target": {
    description: "Primary object this event is centered on.",
    references: ["Naar", "Seyra"],
  },
  "event-participants": {
    description: "Objects that participate in the event snapshot or description.",
    references: ["Iyath Naar Seyra", "Naar Seyra Orun"],
  },
  "event-timing": {
    description: "Free-text timing note for the event.",
    references: ['"Every late bloom season"', '"At local midyear"'],
  },
  "event-visibility": {
    description: "Notes where or how the event is visible.",
    references: ['"Visible from Naar"', '"Southern hemisphere only"'],
  },
  "event-epoch": {
    description: "Optional event-wide epoch that event poses inherit unless they override it.",
    references: ['"JY-0001.0"', '"Naar bloom cycle year 18"'],
  },
  "event-referencePlane": {
    description: "Optional event-wide reference plane for all poses in this snapshot.",
    references: ["ecliptic", "naar-equatorial"],
  },
  "event-viewpoints": {
    description: "Viewpoint IDs that should list this event prominently.",
    references: ["naar-system", "overview inner-system"],
  },
  "placement-target": {
    description: "Names the body or reference this object is attached to.",
    references: ["orbit Primary", "surface Homeworld", "at Naar:L4"],
  },
  "placement-free": {
    description: "Stores a free-placement offset or a descriptive label for loose placement.",
    references: ["8au = far from the star", '"outer system" = descriptive note'],
  },
  "placement-distance": {
    description: "Mean orbit distance from the target body.",
    references: ["1 au = Earth-Sun distance", "384400km = Earth-Moon distance"],
  },
  "placement-semiMajor": {
    description: "Semi-major axis of an orbit, used for elliptical orbits.",
    references: ["1 au = Earth-Sun distance", "Use this instead of distance when orbit shape matters"],
  },
  "placement-eccentricity": {
    description: "Controls how stretched the orbit is. Lower is rounder.",
    references: ["0 = circular orbit", "0.1 = mildly elliptical"],
  },
  "placement-period": {
    description: "How long one orbit takes.",
    references: ["1 y = one Earth year", "27.3d = Moon around Earth"],
  },
  "placement-angle": {
    description: "Rotates the orbit ellipse within the scene.",
    references: ["0deg = default orientation", "90deg = quarter turn"],
  },
  "placement-inclination": {
    description: "Tilts the orbit relative to the main orbital plane.",
    references: ["0deg = same plane", "5deg = slight tilt"],
  },
  "placement-phase": {
    description: "Starting position of the object along its orbit.",
    references: ["0deg = start position", "180deg = opposite side"],
  },
  "pose-epoch": {
    description: "Overrides the effective epoch for this pose only.",
    references: ['"JY-0001.0"', "Falls back to event, object, then system"],
  },
  "pose-referencePlane": {
    description: "Overrides the effective reference plane for this pose only.",
    references: ["naar-equatorial", "Falls back to event, object, then system"],
  },
  "prop-radius": {
    description: "Visual body size or real-world-inspired radius value.",
    references: ["1re = Earth radius", "1sol = Sun radius"],
  },
  "prop-mass": {
    description: "Optional mass value for the body.",
    references: ["1me = Earth mass", "1sol = Sun mass"],
  },
  "prop-gravity": {
    description: "Surface gravity or a custom gravity marker.",
    references: ["1g = Earth-like gravity", "0.16g = Moon-like gravity"],
  },
  "prop-temperature": {
    description: "Typical temperature or narrative temperature marker.",
    references: ["288K = Earth-like average", "1200K = very hot world"],
  },
  "prop-atmosphere": {
    description: "Short atmosphere descriptor for the object.",
    references: ['"nitrogen-oxygen"', '"methane haze"'],
  },
  "prop-inner": {
    description: "Inner edge for a belt, ring, or broad phenomenon.",
    references: ["120000km = ring inner edge", "2au = belt starts here"],
  },
  "prop-outer": {
    description: "Outer edge for a belt, ring, or broad phenomenon.",
    references: ["190000km = ring outer edge", "3au = belt ends here"],
  },
};

export function createWorldOrbitEditor(
  container: HTMLElement,
  options: WorldOrbitEditorOptions = {},
): WorldOrbitEditor {
  ensureBrowserEnvironment(container);
  installEditorStyles();

  const initial = resolveInitialEditorState(options);
  let atlasDocument = initial.atlasDocument;
  let canonicalSource = initial.source;
  let sourceText = canonicalSource;
  let savedSource = canonicalSource;
  let diagnostics = initial.diagnostics;
  let selection: AtlasDocumentPath | null = atlasDocument.objects[0]
    ? { kind: "object", id: atlasDocument.objects[0].id }
    : { kind: "system" };
  const history: HistoryEntry[] = [];
  const future: HistoryEntry[] = [];
  let dragState: DragState | null = null;
  let ignoreViewerSelection = false;
  let destroyed = false;
  let dirty = false;
  let sourceInputTimer: number | null = null;
  let previewTimer: number | null = null;
  let lastPreviewSvg = "";
  let lastPreviewMarkup = "";
  const inspectorSectionState = new Map<string, boolean>();

  const showTextPane = options.showTextPane ?? true;
  const showInspector = options.showInspector ?? true;
  const showPreview = options.showPreview ?? true;
  const shortcutsEnabled = options.shortcuts ?? true;

  container.classList.add("wo-editor");
  container.dataset.woShowInspector = String(showInspector);
  container.dataset.woShowTextPane = String(showTextPane);
  container.dataset.woShowPreview = String(showPreview);
  container.innerHTML = buildEditorMarkup();

  const toolbar = queryRequired<HTMLElement>(container, "[data-editor-toolbar]");
  const outline = queryRequired<HTMLElement>(container, "[data-editor-outline]");
  const stageShell = queryRequired<HTMLElement>(container, "[data-editor-stage-shell]");
  const stage = queryRequired<HTMLElement>(container, "[data-editor-stage]");
  const overlay = queryRequired<HTMLElement>(container, "[data-editor-overlay]");
  const diagnosticsPanel = queryRequired<HTMLElement>(container, "[data-editor-diagnostics]");
  const sourceDiagnostics = queryRequired<HTMLElement>(container, "[data-editor-source-diagnostics]");
  const statusBar = queryRequired<HTMLElement>(container, "[data-editor-status]");
  const liveRegion = queryRequired<HTMLElement>(container, "[data-editor-live]");
  const inspector = queryRequired<HTMLElement>(container, "[data-editor-inspector]");
  const sourcePane = queryRequired<HTMLTextAreaElement>(container, "[data-editor-source]");
  const previewVisual = queryRequired<HTMLElement>(container, "[data-editor-preview-visual]");
  const previewMarkup = queryRequired<HTMLElement>(container, "[data-editor-preview-markup]");

  let viewer: WorldOrbitViewer | null = null;
  viewer = createInteractiveViewer(stage, {
    source: canonicalSource,
    width: options.viewerWidth ?? 1120,
    height: options.viewerHeight ?? 680,
    preset: atlasDocument.system?.defaults.preset ?? "atlas-card",
    projection: "document",
    minimap: true,
    tooltipMode: "hover",
    onSelectionChange(selectedObject) {
      const activeEventId = selection ? selectionEventId(selection) : null;
      if (ignoreViewerSelection || !selectedObject) {
        if (!ignoreViewerSelection) {
          if (selection?.kind === "event-pose" && selection.id) {
            setSelection({ kind: "event", id: selection.id }, false, true);
          } else if (selection?.kind === "object") {
            setSelection(activeEventId ? { kind: "event", id: activeEventId } : null, false, true);
          } else if (selection?.kind === "event" && selection.id) {
            setSelection({ kind: "event", id: selection.id }, false, true);
          }
        }
        return;
      }

      if (activeEventId && findEventPose(atlasDocument, activeEventId, selectedObject.objectId)) {
        setSelection({ kind: "event-pose", id: activeEventId, key: selectedObject.objectId }, false, true);
        return;
      }

      setSelection({ kind: "object", id: selectedObject.objectId }, false, true);
    },
    onViewChange() {
      renderStageOverlay();
    },
  });

  toolbar.addEventListener("click", handleToolbarClick);
  outline.addEventListener("click", handleOutlineClick);
  overlay.addEventListener("pointerdown", handleOverlayPointerDown);
  inspector?.addEventListener("click", handleInspectorClick);
  inspector?.addEventListener("input", handleInspectorInput);
  inspector?.addEventListener("change", handleInspectorChange);
  sourcePane?.addEventListener("input", handleSourceInput);
  sourcePane?.addEventListener("change", handleSourceCommit);
  sourcePane?.addEventListener("blur", handleSourceCommit);
  container.addEventListener("keydown", handleEditorKeyDown);
  window.addEventListener("pointermove", handleWindowPointerMove);
  window.addEventListener("pointerup", handleWindowPointerUp);
  window.addEventListener("pointercancel", handleWindowPointerUp);

  const api: WorldOrbitEditor = {
    setSource(nextSource: string): void {
      const applied = applySourceText(nextSource, false);
      if (applied) {
        resetHistory();
        renderToolbar();
      }
    },
    setAtlasDocument(document: WorldOrbitAtlasDocument): void {
      replaceAtlasDocument(document, false, selection, false);
      resetHistory();
      renderToolbar();
    },
    getSource(): string {
      return canonicalSource;
    },
    getAtlasDocument(): WorldOrbitAtlasDocument {
      return cloneAtlasDocument(atlasDocument);
    },
    getDiagnostics(): AtlasResolvedDiagnostic[] {
      return diagnostics.map(cloneResolvedDiagnostic);
    },
    getSelection(): WorldOrbitEditorSelection | null {
      return selection ? { path: { ...selection } } : null;
    },
    isDirty(): boolean {
      return dirty;
    },
    markSaved(): void {
      markSavedInternal(true);
    },
    selectPath(path: AtlasDocumentPath | null): void {
      setSelection(path, true, true);
    },
    canUndo(): boolean {
      return history.length > 0;
    },
    canRedo(): boolean {
      return future.length > 0;
    },
    undo(): boolean {
      const entry = history.pop();
      if (!entry) {
        return false;
      }

      future.unshift(createHistoryEntry());
      restoreHistoryEntry(entry);
      return true;
    },
    redo(): boolean {
      const entry = future.shift();
      if (!entry) {
        return false;
      }

      history.push(createHistoryEntry());
      restoreHistoryEntry(entry);
      return true;
    },
    addObject(type = "planet"): string {
      const id = createUniqueId(type, atlasDocument.objects.map((object) => object.id));
      const created = createNewObject(type, id, atlasDocument);
      const nextDocument = insertObject(atlasDocument, created);
      replaceAtlasDocument(nextDocument, true, { kind: "object", id });
      return id;
    },
    addEvent(): string {
      const id = createUniqueId(
        "event",
        atlasDocument.events.map((event) => event.id),
      );
      const created: WorldOrbitEvent = {
        id,
        kind: "",
        label: humanizeIdentifier(id),
        summary: null,
        targetObjectId: null,
        participantObjectIds: [],
        timing: null,
        visibility: null,
        epoch: null,
        referencePlane: null,
        tags: [],
        color: null,
        hidden: false,
        positions: [],
      };
      const nextDocument = cloneAtlasDocument(atlasDocument);
      nextDocument.events.push(created);
      nextDocument.events.sort(compareEvents);
      replaceAtlasDocument(nextDocument, true, { kind: "event", id });
      return id;
    },
    addViewpoint(): string {
      const id = createUniqueId(
        "viewpoint",
        atlasDocument.system?.viewpoints.map((viewpoint) => viewpoint.id) ?? [],
      );
      const created: WorldOrbitAtlasViewpoint = {
        id,
        label: humanizeIdentifier(id),
        summary: "",
        focusObjectId: null,
        selectedObjectId: null,
        events: [],
        projection: atlasDocument.system?.defaults.view ?? "topdown",
        preset: atlasDocument.system?.defaults.preset ?? null,
        zoom: null,
        rotationDeg: 0,
        camera: null,
        layers: {},
        filter: null,
      };
      const nextDocument = cloneAtlasDocument(atlasDocument);
      nextDocument.system?.viewpoints.push(created);
      nextDocument.system?.viewpoints.sort((left, right) => left.id.localeCompare(right.id));
      replaceAtlasDocument(nextDocument, true, { kind: "viewpoint", id });
      return id;
    },
    addAnnotation(): string {
      const id = createUniqueId(
        "annotation",
        atlasDocument.system?.annotations.map((annotation) => annotation.id) ?? [],
      );
      const created: WorldOrbitAtlasAnnotation = {
        id,
        label: humanizeIdentifier(id),
        targetObjectId: null,
        body: "",
        tags: [],
        sourceObjectId: null,
      };
      const nextDocument = cloneAtlasDocument(atlasDocument);
      nextDocument.system?.annotations.push(created);
      nextDocument.system?.annotations.sort((left, right) => left.id.localeCompare(right.id));
      replaceAtlasDocument(nextDocument, true, { kind: "annotation", id });
      return id;
    },
    addMetadata(key, value): string {
      const metadataKey =
        key?.trim() || createUniqueId("metadata", Object.keys(atlasDocument.system?.atlasMetadata ?? {}));
      const nextDocument = cloneAtlasDocument(atlasDocument);
      if (nextDocument.system) {
        nextDocument.system.atlasMetadata[metadataKey] = value ?? "";
      }
      replaceAtlasDocument(nextDocument, true, { kind: "metadata", key: metadataKey });
      return metadataKey;
    },
    removeSelection(): boolean {
      if (!selection || selection.kind === "system" || selection.kind === "defaults") {
        return false;
      }

      const nextDocument = removeSelectedNode(atlasDocument, selection);
      replaceAtlasDocument(nextDocument, true, { kind: "system" });
      return true;
    },
    exportSvg(): string {
      return viewer!.exportSvg();
    },
    exportEmbedMarkup(): string {
      return buildEmbedMarkup(getCurrentSourceForExport(), atlasDocument);
    },
    destroy(): void {
      if (destroyed) {
        return;
      }

      destroyed = true;
      toolbar.removeEventListener("click", handleToolbarClick);
      outline.removeEventListener("click", handleOutlineClick);
      overlay.removeEventListener("pointerdown", handleOverlayPointerDown);
      inspector?.removeEventListener("click", handleInspectorClick);
      inspector?.removeEventListener("input", handleInspectorInput);
      inspector?.removeEventListener("change", handleInspectorChange);
      sourcePane?.removeEventListener("input", handleSourceInput);
      sourcePane?.removeEventListener("change", handleSourceCommit);
      sourcePane?.removeEventListener("blur", handleSourceCommit);
      container.removeEventListener("keydown", handleEditorKeyDown);
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
      clearSourceInputTimer();
      clearPreviewTimer();
      viewer!.destroy();
      container.innerHTML = "";
      container.classList.remove("wo-editor");
    },
  };

  renderAll(true);
  updateDirtyState(true);
  return api;

  function createHistoryEntry(): HistoryEntry {
    return {
      atlasDocument: cloneAtlasDocument(atlasDocument),
      selection: selection ? { ...selection } : null,
      source: canonicalSource,
    };
  }

  function resetHistory(): void {
    history.length = 0;
    future.length = 0;
    renderToolbar();
  }

  function clearSourceInputTimer(): void {
    if (sourceInputTimer !== null) {
      window.clearTimeout(sourceInputTimer);
      sourceInputTimer = null;
    }
  }

  function clearPreviewTimer(): void {
    if (previewTimer !== null) {
      window.clearTimeout(previewTimer);
      previewTimer = null;
    }
  }

  function getCurrentSourceForExport(): string {
    if (dragState?.changed) {
      return formatAtlasSource(atlasDocument);
    }
    return canonicalSource;
  }

  function updateDirtyState(forceEmit = false): void {
    const nextDirty =
      sourceText !== savedSource || canonicalSource !== savedSource || dragState?.changed === true;
    if (!forceEmit && nextDirty === dirty) {
      return;
    }

    dirty = nextDirty;
    renderStatusBar();
    options.onDirtyChange?.(dirty);
  }

  function markSavedInternal(emit = false): void {
    sourceText = canonicalSource;
    renderSourcePane();
    savedSource = canonicalSource;
    updateDirtyState(emit);
  }

  function restoreHistoryEntry(entry: HistoryEntry): void {
    clearSourceInputTimer();
    atlasDocument = cloneAtlasDocument(entry.atlasDocument);
    canonicalSource = entry.source;
    sourceText = canonicalSource;
    diagnostics = collectDocumentDiagnostics(atlasDocument);
    selection = normalizeSelection(entry.selection);
    syncViewer({ preserveCamera: true, applyViewpointSelection: selection?.kind === "viewpoint" });
    setSelection(selection, false, false);
    renderAll();
    updateDirtyState();
    emitSnapshot();
  }

  function replaceAtlasDocument(
    nextDocument: WorldOrbitAtlasDocument,
    pushHistory: boolean,
    nextSelection: AtlasDocumentPath | null,
    preserveSourceText = false,
  ): void {
    if (pushHistory) {
      history.push(createHistoryEntry());
      future.length = 0;
    }

    clearSourceInputTimer();
    atlasDocument = cloneAtlasDocument(nextDocument);
    canonicalSource = formatAtlasSource(atlasDocument);
    if (!preserveSourceText) {
      sourceText = canonicalSource;
    }
    diagnostics = collectDocumentDiagnostics(atlasDocument);
    selection = normalizeSelection(nextSelection);
    syncViewer({
      preserveCamera: selection?.kind !== "viewpoint",
      applyViewpointSelection: selection?.kind === "viewpoint",
    });
    setSelection(selection, false, false);
    renderAll();
    updateDirtyState();
    emitSnapshot();
  }

  function applySourceText(nextSourceText: string, commitHistory: boolean): boolean {
    sourceText = nextSourceText;
    if (sourcePane && sourcePane.value !== nextSourceText) {
      sourcePane.value = nextSourceText;
    }

    const loaded = loadWorldOrbitSourceWithDiagnostics(nextSourceText);
    if (!loaded.ok || !loaded.value) {
      diagnostics = loaded.diagnostics.map((diagnostic) => ({
        diagnostic,
        path: null,
      }));
      renderDiagnostics();
      renderSourceDiagnostics();
      renderOutline();
      renderInspector();
      renderStatusBar();
      updateLiveRegion();
      updateDirtyState();
      options.onDiagnosticsChange?.(diagnostics.map(cloneResolvedDiagnostic));
      return false;
    }

    const nextDocument =
      loaded.value.atlasDocument ?? upgradeDocumentToV2(loaded.value.document);
    const loadedDiagnostics = resolveAtlasDiagnostics(nextDocument, loaded.diagnostics);

    if (commitHistory) {
      history.push(createHistoryEntry());
      future.length = 0;
      sourceText = formatAtlasSource(nextDocument);
    }

    atlasDocument = cloneAtlasDocument(nextDocument);
    canonicalSource = formatAtlasSource(atlasDocument);
    diagnostics = mergeDiagnostics(loadedDiagnostics, collectDocumentDiagnostics(atlasDocument));
    selection = normalizeSelection(selection);
    syncViewer({
      preserveCamera: selection?.kind !== "viewpoint",
      applyViewpointSelection: selection?.kind === "viewpoint",
    });
    renderAll();
    updateDirtyState();
    emitSnapshot();
    return true;
  }

  function syncViewer(options: {
    preserveCamera?: boolean;
    applyViewpointSelection?: boolean;
  } = {}): void {
    if (!viewer) {
      return;
    }

    const previousState = viewer.getState();
    const currentRenderOptions = viewer.getRenderOptions();
    const nextPreset = atlasDocument.system?.defaults.preset ?? "atlas-card";
    const nextActiveEventId = selection ? selectionEventId(selection) : null;

    ignoreViewerSelection = true;
    if (
      currentRenderOptions.preset !== nextPreset ||
      currentRenderOptions.projection !== "document" ||
      (currentRenderOptions.activeEventId ?? null) !== nextActiveEventId
    ) {
      viewer.setRenderOptions({
        preset: nextPreset,
        projection: "document",
        activeEventId: nextActiveEventId,
      });
    }
    viewer.setDocument(materializeAtlasDocument(atlasDocument));

    if (options.applyViewpointSelection && selection?.kind === "viewpoint" && selection.id) {
      viewer.goToViewpoint(selection.id);
    } else if (options.preserveCamera !== false) {
      viewer.setState({
        ...previousState,
        selectedObjectId:
          selection?.kind === "object"
            ? selection.id ?? null
            : selection?.kind === "event-pose"
              ? selection.key ?? null
              : null,
      });
    } else if (selection?.kind === "object" && selection.id) {
      viewer.focusObject(selection.id);
    } else if (selection?.kind === "event-pose" && selection.key) {
      viewer.focusObject(selection.key);
    }

    ignoreViewerSelection = false;
  }

  function emitSnapshot(): void {
    const snapshot: WorldOrbitEditorSnapshot = {
      source: canonicalSource,
      atlasDocument: cloneAtlasDocument(atlasDocument),
      diagnostics: diagnostics.map(cloneResolvedDiagnostic),
      selection: selection ? { path: { ...selection } } : null,
    };

    options.onDiagnosticsChange?.(snapshot.diagnostics);
    options.onSelectionChange?.(snapshot.selection);
    options.onChange?.(snapshot);
  }

  function setSelection(
    nextSelection: AtlasDocumentPath | null,
    syncViewerSelection: boolean,
    emit = true,
  ): void {
    selection = normalizeSelection(nextSelection);

    if (syncViewerSelection) {
      ignoreViewerSelection = true;
      viewer!.setRenderOptions({ activeEventId: selection ? selectionEventId(selection) : null });
      if (selection?.kind === "object" && selection.id) {
        viewer!.focusObject(selection.id);
      } else if (selection?.kind === "event-pose" && selection.key) {
        viewer!.focusObject(selection.key);
      } else if (selection?.kind === "viewpoint" && selection.id) {
        viewer!.goToViewpoint(selection.id);
      }
      ignoreViewerSelection = false;
    }

    renderToolbar();
    renderOutline();
    if (!inspector?.contains(document.activeElement)) {
      renderInspector();
    }
    renderStageOverlay();
    renderStatusBar();
    updateLiveRegion();

    if (emit) {
      options.onSelectionChange?.(selection ? { path: { ...selection } } : null);
    }
  }

  function normalizeSelection(nextSelection: AtlasDocumentPath | null): AtlasDocumentPath | null {
    if (!nextSelection) {
      return null;
    }

    const node = getAtlasDocumentNode(atlasDocument, nextSelection);
    if (node === null || node === undefined) {
      return nextSelection.kind === "system" || nextSelection.kind === "defaults"
        ? nextSelection
        : null;
    }

    return nextSelection;
  }

  function renderAll(immediatePreview = false): void {
    renderToolbar();
    renderOutline();
    renderDiagnostics();
    renderSourceDiagnostics();
    // Do not rebuild the inspector DOM if the user is currently typing in it, 
    // to prevent losing focus/cursor position and making input glitchy.
    if (!inspector?.contains(document.activeElement)) {
      renderInspector();
    }
    renderSourcePane();
    renderPreview(immediatePreview);
    renderStageOverlay();
    renderStatusBar();
    updateLiveRegion();
  }

  function renderToolbar(): void {
    const objectType = (toolbar.querySelector("[data-editor-add-object-type]") as HTMLSelectElement | null)
      ?.value ?? "planet";
    toolbar.innerHTML = `
      <div class="wo-editor-toolbar-group">
        <select data-editor-add-object-type>
          ${OBJECT_TYPES.map(
            (type) =>
              `<option value="${escapeHtml(type)}"${type === objectType ? " selected" : ""}>${escapeHtml(humanizeIdentifier(type))}</option>`,
          ).join("")}
        </select>
        <button type="button" data-editor-action="add-object">Add object</button>
        <button type="button" data-editor-action="add-event">Add event</button>
        <button type="button" data-editor-action="add-viewpoint">Add viewpoint</button>
        <button type="button" data-editor-action="add-annotation">Add annotation</button>
        <button type="button" data-editor-action="add-metadata">Add metadata</button>
      </div>
      <div class="wo-editor-toolbar-group">
        <button type="button" data-editor-action="remove"${!selection || selection.kind === "system" || selection.kind === "defaults" ? " disabled" : ""}>Remove</button>
        <button type="button" data-editor-action="undo"${history.length === 0 ? " disabled" : ""}>Undo</button>
        <button type="button" data-editor-action="redo"${future.length === 0 ? " disabled" : ""}>Redo</button>
        <button type="button" data-editor-action="format">Format source</button>
      </div>
    `;
  }

  function renderOutline(): void {
    const activeKey = selectionKey(selection);
    const diagnosticBuckets = buildDiagnosticBuckets(diagnostics);
    const metadataEntries = Object.entries(atlasDocument.system?.atlasMetadata ?? {}).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    outline.innerHTML = `
      <div class="wo-editor-outline-section">
        <h3>Atlas</h3>
        ${renderOutlineButton({ kind: "system" }, "System", activeKey, diagnosticBuckets)}
        ${renderOutlineButton({ kind: "defaults" }, "Defaults", activeKey, diagnosticBuckets)}
      </div>
      <div class="wo-editor-outline-section">
        <h3>Metadata</h3>
        ${
          metadataEntries.length > 0
            ? metadataEntries
                .map(([key]) =>
                  renderOutlineButton({ kind: "metadata", key }, key, activeKey, diagnosticBuckets),
                )
                .join("")
            : `<p class="wo-editor-empty">No atlas metadata yet.</p>`
        }
      </div>
      <div class="wo-editor-outline-section">
        <h3>Viewpoints</h3>
        ${
          (atlasDocument.system?.viewpoints.length ?? 0) > 0
            ? atlasDocument.system?.viewpoints
                .map((viewpoint) =>
                  renderOutlineButton(
                    { kind: "viewpoint", id: viewpoint.id },
                    viewpoint.label,
                    activeKey,
                    diagnosticBuckets,
                  ),
                )
                .join("")
            : `<p class="wo-editor-empty">No viewpoints yet.</p>`
        }
      </div>
      <div class="wo-editor-outline-section">
        <h3>Annotations</h3>
        ${
          (atlasDocument.system?.annotations.length ?? 0) > 0
            ? atlasDocument.system?.annotations
                .map((annotation) =>
                  renderOutlineButton(
                    { kind: "annotation", id: annotation.id },
                    annotation.label,
                    activeKey,
                    diagnosticBuckets,
                  ),
                )
                .join("")
            : `<p class="wo-editor-empty">No annotations yet.</p>`
        }
      </div>
      <div class="wo-editor-outline-section">
        <h3>Events</h3>
        ${
          atlasDocument.events.length > 0
            ? atlasDocument.events
                .map((eventEntry) => renderEventOutlineItems(eventEntry, activeKey, diagnosticBuckets))
                .join("")
            : `<p class="wo-editor-empty">No events yet.</p>`
        }
      </div>
      <div class="wo-editor-outline-section">
        <h3>Objects</h3>
        ${
          atlasDocument.objects.length > 0
            ? atlasDocument.objects
                .map((object) =>
                  renderOutlineButton(
                    { kind: "object", id: object.id },
                    `${object.id} - ${object.type}`,
                    activeKey,
                    diagnosticBuckets,
                  ),
                )
                .join("")
            : `<p class="wo-editor-empty">No objects yet.</p>`
        }
      </div>
    `;
  }

  function renderDiagnostics(): void {
    diagnosticsPanel.innerHTML =
      diagnostics.length === 0
        ? `<p class="wo-editor-empty">No diagnostics.</p>`
        : diagnostics
            .map((entry) => {
              const pathLabel = entry.path ? describePath(entry.path) : "Source";
              const location = formatDiagnosticLocation(entry);
              return `<article class="wo-editor-diagnostic wo-editor-diagnostic-${escapeHtml(entry.diagnostic.severity)}">
                <strong>${escapeHtml(entry.diagnostic.severity.toUpperCase())}</strong>
                <span>${escapeHtml(pathLabel)}${location ? ` · ${escapeHtml(location)}` : ""}</span>
                <p>${escapeHtml(entry.diagnostic.message)}</p>
              </article>`;
            })
            .join("");
  }

  function renderSourceDiagnostics(): void {
    const sourceEntries = diagnostics.filter((entry) => !entry.path || entry.diagnostic.line !== undefined);
    sourceDiagnostics.innerHTML =
      sourceEntries.length === 0
        ? `<p class="wo-editor-empty">No source diagnostics.</p>`
        : sourceEntries
            .map((entry) => {
              const location = formatDiagnosticLocation(entry) ?? "Source";
              return `<article class="wo-editor-diagnostic wo-editor-diagnostic-${escapeHtml(entry.diagnostic.severity)}">
                <strong>${escapeHtml(entry.diagnostic.severity.toUpperCase())}</strong>
                <span>${escapeHtml(location)}</span>
                <p>${escapeHtml(entry.diagnostic.message)}</p>
              </article>`;
            })
            .join("");
  }

  function renderInspector(): void {
    if (!inspector) {
      return;
    }

    captureInspectorSectionState(inspector, inspectorSectionState);

    const formState: WorldOrbitEditorFormState = {
      selection: selection ? { path: { ...selection } } : null,
      system: atlasDocument.system,
      viewpoints: atlasDocument.system?.viewpoints ?? [],
      events: atlasDocument.events,
      objects: atlasDocument.objects,
    };

    if (!selection) {
      inspector.innerHTML = `<p class="wo-editor-empty">Select an atlas node or object to edit it.</p>`;
      return;
    }

    const diagnosticSummary = renderInspectorDiagnosticSummary(selection, diagnostics);

    switch (selection.kind) {
      case "system":
        inspector.innerHTML = diagnosticSummary + renderSystemInspector(formState);
        applyInspectorSectionState(inspector, inspectorSectionState);
        decorateInspectorDiagnostics(selection, diagnostics);
        return;
      case "defaults":
        inspector.innerHTML = diagnosticSummary + renderDefaultsInspector(formState);
        applyInspectorSectionState(inspector, inspectorSectionState);
        decorateInspectorDiagnostics(selection, diagnostics);
        return;
      case "metadata":
        inspector.innerHTML = diagnosticSummary + renderMetadataInspector(formState, selection.key ?? "");
        applyInspectorSectionState(inspector, inspectorSectionState);
        decorateInspectorDiagnostics(selection, diagnostics);
        return;
      case "viewpoint":
        inspector.innerHTML = diagnosticSummary + renderViewpointInspector(formState, selection.id ?? "");
        applyInspectorSectionState(inspector, inspectorSectionState);
        decorateInspectorDiagnostics(selection, diagnostics);
        return;
      case "event":
        inspector.innerHTML = diagnosticSummary + renderEventInspector(formState, selection.id ?? "");
        applyInspectorSectionState(inspector, inspectorSectionState);
        decorateInspectorDiagnostics(selection, diagnostics);
        return;
      case "event-pose":
        inspector.innerHTML =
          diagnosticSummary + renderEventPoseInspector(formState, selection.id ?? "", selection.key ?? "");
        applyInspectorSectionState(inspector, inspectorSectionState);
        decorateInspectorDiagnostics(selection, diagnostics);
        return;
      case "annotation":
        inspector.innerHTML = diagnosticSummary + renderAnnotationInspector(formState, selection.id ?? "");
        applyInspectorSectionState(inspector, inspectorSectionState);
        decorateInspectorDiagnostics(selection, diagnostics);
        return;
      case "object":
        inspector.innerHTML = diagnosticSummary + renderObjectInspector(formState, selection.id ?? "");
        applyInspectorSectionState(inspector, inspectorSectionState);
        decorateInspectorDiagnostics(selection, diagnostics);
        return;
    }
  }

  function renderSourcePane(): void {
    if (!sourcePane) {
      return;
    }

    if (sourcePane.value !== sourceText) {
      sourcePane.value = sourceText;
    }
  }

  function renderPreview(immediate = false): void {
    if (immediate) {
      renderPreviewNow();
      return;
    }

    schedulePreviewRender();
  }

  function renderStageOverlay(): void {
    if (!viewer) {
      return;
    }
    overlay.innerHTML = "";
    const selectedObjectId =
      selection?.kind === "object"
        ? selection.id ?? null
        : selection?.kind === "event-pose"
          ? selection.key ?? null
          : null;
    if (!selectedObjectId) {
      return;
    }

    const details = viewer.getObjectDetails(selectedObjectId);
    if (!details) {
      return;
    }

    renderHintMarker(details.renderObject.x, details.renderObject.y, details.renderObject.objectId);

    if (details.parent) {
      renderHintMarker(details.parent.x, details.parent.y, `Parent: ${details.parent.objectId}`, true);
    }

    if (details.renderObject.anchorX !== undefined && details.renderObject.anchorY !== undefined) {
      renderHintMarker(details.renderObject.anchorX, details.renderObject.anchorY, "Anchor", true);
    }

    if (details.object.placement?.mode === "orbit" && details.orbit) {
      const phasePoint = projectStagePoint({
        x: details.renderObject.x,
        y: details.renderObject.y,
      });
      overlay.append(
        createHandleElement("orbit-phase", details.objectId, phasePoint, "Phase"),
      );

      const axisPoint = projectOrbitRadiusHandle(details);
      overlay.append(
        createHandleElement("orbit-radius", details.objectId, axisPoint, "Size"),
      );
    }

    if (details.object.placement?.mode === "at") {
      overlay.append(
        createHandleElement(
          "at-reference",
          details.objectId,
          projectStagePoint({ x: details.renderObject.x, y: details.renderObject.y }),
          "Reference",
        ),
      );
      const badge = document.createElement("div");
      badge.className = "wo-editor-hint wo-editor-hint-note";
      badge.textContent = "Drag to an object center or nearby Lagrange point.";
      overlay.append(badge);
    }

    if (details.object.placement?.mode === "surface") {
      overlay.append(
        createHandleElement(
          "surface-target",
          details.objectId,
          projectStagePoint({ x: details.renderObject.x, y: details.renderObject.y }),
          "Surface",
        ),
      );
      const badge = document.createElement("div");
      badge.className = "wo-editor-hint wo-editor-hint-note";
      badge.textContent = "Drag onto another surface-capable body.";
      overlay.append(badge);
    }

    if (details.object.placement?.mode === "free") {
      overlay.append(
        createHandleElement(
          "free-distance",
          details.objectId,
          projectStagePoint({ x: details.renderObject.x, y: details.renderObject.y }),
          "Offset",
        ),
      );
      const badge = document.createElement("div");
      badge.className = "wo-editor-hint wo-editor-hint-note";
      badge.textContent = "Drag horizontally to change free offset.";
      overlay.append(badge);
    }

    const placementDiagnostics = getPlacementDiagnosticsForSelection(selection, diagnostics).slice(0, 3);
    if (placementDiagnostics.length > 0) {
      const panel = document.createElement("div");
      panel.className = "wo-editor-overlay-diagnostics";
      panel.setAttribute("role", "status");
      panel.setAttribute("aria-live", "polite");
      panel.innerHTML = placementDiagnostics
        .map(
          (entry) => `<article class="wo-editor-overlay-diagnostic wo-editor-overlay-diagnostic-${escapeHtml(
            entry.diagnostic.severity,
          )}">
              <strong>${escapeHtml(entry.diagnostic.severity.toUpperCase())}</strong>
              <p>${escapeHtml(entry.diagnostic.message)}</p>
            </article>`,
        )
        .join("");
      overlay.append(panel);
    }
  }

  function renderHintMarker(
    worldX: number,
    worldY: number,
    label: string,
    subtle = false,
  ): void {
    const point = projectStagePoint({ x: worldX, y: worldY });
    const marker = document.createElement("div");
    marker.className = `wo-editor-hint${subtle ? " is-subtle" : ""}`;
    marker.style.left = `${point.x}px`;
    marker.style.top = `${point.y}px`;
    marker.textContent = label;
    overlay.append(marker);
  }

  function projectOrbitRadiusHandle(details: ViewerObjectDetails): CoordinatePoint {
    const orbit = details.orbit;
    if (!orbit) {
      return projectStagePoint({ x: details.renderObject.x, y: details.renderObject.y });
    }

    const localPoint = {
      x: orbit.cx + (orbit.kind === "circle" ? orbit.radius ?? 0 : orbit.rx ?? 0),
      y: orbit.cy,
    };
    const rotatedPoint = rotatePoint(localPoint, { x: orbit.cx, y: orbit.cy }, orbit.rotationDeg);
    return projectStagePoint(rotatedPoint);
  }

  function projectStagePoint(point: CoordinatePoint): CoordinatePoint {
    const scene = viewer!.getScene();
    const state = viewer!.getState();
    const center = {
      x: scene.width / 2,
      y: scene.height / 2,
    };
    const rotated = rotatePoint(point, center, state.rotationDeg);
    const viewportPoint = {
      x: center.x + (rotated.x - center.x) * state.scale + state.translateX,
      y: center.y + (rotated.y - center.y) * state.scale + state.translateY,
    };
    const svg = stage.querySelector("svg");
    if (!svg) {
      return viewportPoint;
    }

    const svgRect = svg.getBoundingClientRect();
    const stageRect = stageShell.getBoundingClientRect();
    return {
      x:
        svgRect.left -
        stageRect.left +
        (viewportPoint.x / Math.max(scene.width, 1)) * svgRect.width,
      y:
        svgRect.top -
        stageRect.top +
        (viewportPoint.y / Math.max(scene.height, 1)) * svgRect.height,
    };
  }

  function handleToolbarClick(event: MouseEvent): void {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("[data-editor-action]");
    if (!button) {
      return;
    }

    switch (button.dataset.editorAction) {
      case "add-object": {
        const type =
          (toolbar.querySelector("[data-editor-add-object-type]") as HTMLSelectElement | null)
            ?.value as WorldOrbitObject["type"] | undefined;
        api.addObject(type ?? "planet");
        return;
      }
      case "add-viewpoint":
        api.addViewpoint();
        return;
      case "add-event":
        api.addEvent();
        return;
      case "add-annotation":
        api.addAnnotation();
        return;
      case "add-metadata":
        api.addMetadata();
        return;
      case "remove":
        api.removeSelection();
        return;
      case "undo":
        api.undo();
        return;
      case "redo":
        api.redo();
        return;
      case "format":
        clearSourceInputTimer();
        sourceText = canonicalSource;
        renderSourcePane();
        updateDirtyState();
        return;
    }
  }

  function handleOutlineClick(event: MouseEvent): void {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("[data-path-kind]");
    if (!button) {
      return;
    }

    setSelection(
      {
        kind: button.dataset.pathKind as AtlasDocumentPath["kind"],
        id: button.dataset.pathId || undefined,
        key: button.dataset.pathKey || undefined,
      },
      true,
      true,
    );
  }

  function handleInspectorClick(event: MouseEvent): void {
    const pathButton = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("[data-path-kind]");
    if (pathButton) {
      setSelection(
        {
          kind: pathButton.dataset.pathKind as AtlasDocumentPath["kind"],
          id: pathButton.dataset.pathId || undefined,
          key: pathButton.dataset.pathKey || undefined,
        },
        true,
        true,
      );
      return;
    }

    const actionButton = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("[data-editor-action]");
    if (!actionButton) {
      return;
    }

    if (actionButton.dataset.editorAction === "add-event-pose") {
      const eventId =
        actionButton.dataset.editorEventId ||
        (selection?.kind === "event" || selection?.kind === "event-pose" ? selection.id ?? "" : "");
      if (!eventId) {
        return;
      }
      const nextDocument = addEventPose(atlasDocument, eventId);
      const createdEvent = nextDocument.events.find((entry) => entry.id === eventId);
      const createdPose = createdEvent?.positions.at(-1) ?? createdEvent?.positions[0];
      replaceAtlasDocument(
        nextDocument,
        true,
        createdPose
          ? { kind: "event-pose", id: eventId, key: createdPose.objectId }
          : { kind: "event", id: eventId },
      );
      return;
    }
  }

  function handleInspectorInput(): void {
    applyInspectorState(false);
  }

  function handleInspectorChange(): void {
    applyInspectorState(true);
  }

  function applyInspectorState(commitHistory: boolean): void {
    if (!selection || !inspector) {
      return;
    }

    switch (selection.kind) {
      case "system":
        replaceAtlasDocument(buildSystemDocumentFromInspector(), commitHistory, selection, false);
        return;
      case "defaults":
        replaceAtlasDocument(buildDefaultsDocumentFromInspector(), commitHistory, selection, false);
        return;
      case "metadata":
        replaceAtlasDocument(buildMetadataDocumentFromInspector(selection.key ?? ""), commitHistory, selection, false);
        return;
      case "viewpoint":
        replaceAtlasDocument(buildViewpointDocumentFromInspector(selection.id ?? ""), commitHistory, selection, false);
        return;
      case "event":
        replaceAtlasDocument(buildEventDocumentFromInspector(selection.id ?? ""), commitHistory, selection, false);
        return;
      case "event-pose":
        replaceAtlasDocument(
          buildEventPoseDocumentFromInspector(selection.id ?? "", selection.key ?? ""),
          commitHistory,
          selection,
          false,
        );
        return;
      case "annotation":
        replaceAtlasDocument(buildAnnotationDocumentFromInspector(selection.id ?? ""), commitHistory, selection, false);
        return;
      case "object":
        replaceAtlasDocument(buildObjectDocumentFromInspector(selection.id ?? ""), commitHistory, selection, false);
        return;
    }
  }

  function handleSourceInput(): void {
    sourceText = sourcePane?.value ?? "";
    updateDirtyState();
    clearSourceInputTimer();
    sourceInputTimer = window.setTimeout(() => {
      sourceInputTimer = null;
      applySourceText(sourceText, false);
    }, SOURCE_INPUT_DEBOUNCE_MS);
  }

  function handleSourceCommit(): void {
    clearSourceInputTimer();
    const committed = applySourceText(sourcePane?.value ?? "", true);
    if (committed) {
      renderSourcePane();
    }
  }

  function handleEditorKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape" && dragState) {
      event.preventDefault();
      cancelActiveDrag();
      return;
    }

    if (!shortcutsEnabled || event.defaultPrevented || shouldIgnoreShortcutEvent(event)) {
      return;
    }

    const isUndo = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z";
    const isRedo =
      (event.ctrlKey || event.metaKey) &&
      ((event.shiftKey && event.key.toLowerCase() === "z") || event.key.toLowerCase() === "y");

    if (isUndo) {
      event.preventDefault();
      api.undo();
      return;
    }

    if (isRedo) {
      event.preventDefault();
      api.redo();
    }
  }

  function handleOverlayPointerDown(event: PointerEvent): void {
    const handle = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-handle-kind]");
    if (!handle) {
      return;
    }

    const objectId = handle.dataset.objectId;
    const kind = handle.dataset.handleKind as DragState["kind"];
    if (
      !objectId ||
      !["orbit-phase", "orbit-radius", "at-reference", "surface-target", "free-distance"].includes(
        kind,
      )
    ) {
      return;
    }

    clearSourceInputTimer();
    if (sourceText !== canonicalSource) {
      const committed = applySourceText(sourceText, true);
      if (!committed) {
        event.preventDefault();
        return;
      }
    }
    const details = viewer?.getObjectDetails(objectId) ?? null;
    dragState = {
      kind,
      objectId,
      pointerId: event.pointerId,
      path: selection ? { ...selection } : { kind: "object", id: objectId },
      startedFrom: createHistoryEntry(),
      changed: false,
      orbitRadiusContext:
        kind === "orbit-radius" && details
          ? createOrbitRadiusDragContext(atlasDocument, viewer!.getScene(), details)
          : null,
    };
    handle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function handleWindowPointerMove(event: PointerEvent): void {
    if (
      !dragState ||
      dragState.pointerId !== event.pointerId ||
      !selection ||
      selectionKey(selection) !== selectionKey(dragState.path)
    ) {
      return;
    }

    const details = viewer!.getObjectDetails(dragState.objectId);
    if (!details) {
      return;
    }

    const pointer = getWorldPointFromClient(event.clientX, event.clientY);
    let nextDocument = atlasDocument;

    switch (dragState.kind) {
      case "orbit-phase":
        if (details.object.placement?.mode === "orbit" && details.orbit) {
          nextDocument = updateOrbitPhase(atlasDocument, dragState.path, dragState.objectId, details, pointer);
        }
        break;
      case "orbit-radius":
        if (details.object.placement?.mode === "orbit" && details.orbit) {
          nextDocument = updateOrbitRadius(
            atlasDocument,
            dragState.path,
            dragState.objectId,
            details,
            pointer,
            dragState.orbitRadiusContext ?? null,
          );
        }
        break;
      case "at-reference":
        if (details.object.placement?.mode === "at") {
          nextDocument = updateAtReference(
            atlasDocument,
            dragState.path,
            dragState.objectId,
            viewer!.getScene(),
            pointer,
          );
        }
        break;
      case "surface-target":
        if (details.object.placement?.mode === "surface") {
          nextDocument = updateSurfaceTarget(
            atlasDocument,
            dragState.path,
            dragState.objectId,
            viewer!.getScene(),
            pointer,
          );
        }
        break;
      case "free-distance":
        if (details.object.placement?.mode === "free") {
          nextDocument = updateFreeDistance(
            atlasDocument,
            dragState.path,
            dragState.objectId,
            viewer!.getScene(),
            details,
            pointer,
          );
        }
        break;
    }

    if (nextDocument === atlasDocument) {
      return;
    }

    dragState.changed = true;
    atlasDocument = cloneAtlasDocument(nextDocument);
    diagnostics = collectDocumentDiagnostics(atlasDocument);
    syncViewer({ preserveCamera: true, applyViewpointSelection: false });
    renderDiagnostics();
    renderSourceDiagnostics();
    renderOutline();
    renderInspector();
    renderStageOverlay();
    renderStatusBar();
    updateLiveRegion();
    schedulePreviewRender();
    updateDirtyState();
  }

  function handleWindowPointerUp(event: PointerEvent): void {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const completedDrag = dragState;

    if (!dragState.changed) {
      dragState = null;
      return;
    }

    history.push(dragState.startedFrom);
    future.length = 0;
    canonicalSource = formatAtlasSource(atlasDocument);
    sourceText = canonicalSource;
    dragState = null;
    renderAll();
    if (completedDrag.kind === "orbit-radius") {
      maybeFitOrbitResizeInView(completedDrag.objectId);
    }
    updateDirtyState();
    emitSnapshot();
  }

  function cancelActiveDrag(): void {
    if (!dragState) {
      return;
    }

    const startedFrom = dragState.startedFrom;
    dragState = null;
    atlasDocument = cloneAtlasDocument(startedFrom.atlasDocument);
    canonicalSource = startedFrom.source;
    sourceText = canonicalSource;
    diagnostics = collectDocumentDiagnostics(atlasDocument);
    setSelection(startedFrom.selection, false, false);
    syncViewer({ preserveCamera: true, applyViewpointSelection: selection?.kind === "viewpoint" });
    renderAll();
    updateDirtyState();
    emitSnapshot();
  }

  function getWorldPointFromClient(clientX: number, clientY: number): CoordinatePoint {
    const svg = stage.querySelector("svg");
    const scene = viewer!.getScene();

    if (!svg) {
      return { x: scene.width / 2, y: scene.height / 2 };
    }

    const rect = svg.getBoundingClientRect();
    const viewportPoint = {
      x: ((clientX - rect.left) / Math.max(rect.width, 1)) * scene.width,
      y: ((clientY - rect.top) / Math.max(rect.height, 1)) * scene.height,
    };

    return invertViewerPoint(scene, viewer!.getState(), viewportPoint);
  }

  function buildSystemDocumentFromInspector(): WorldOrbitAtlasDocument {
    const nextDocument = cloneAtlasDocument(atlasDocument);
    const form = inspector?.querySelector("form[data-editor-form='system']") as HTMLFormElement | null;
    if (!form || !nextDocument.system) {
      return nextDocument;
    }

    nextDocument.system.id = readTextInput(form, "system-id") || nextDocument.system.id;
    nextDocument.system.title = readOptionalTextInput(form, "system-title");
    return nextDocument;
  }

  function buildDefaultsDocumentFromInspector(): WorldOrbitAtlasDocument {
    const nextDocument = cloneAtlasDocument(atlasDocument);
    const form = inspector?.querySelector("form[data-editor-form='defaults']") as HTMLFormElement | null;
    if (!form || !nextDocument.system) {
      return nextDocument;
    }

    nextDocument.system.defaults.view =
      (readTextInput(form, "defaults-view") as "topdown" | "isometric") || "topdown";
    nextDocument.system.defaults.scale = readOptionalTextInput(form, "defaults-scale");
    nextDocument.system.defaults.units = readOptionalTextInput(form, "defaults-units");
    nextDocument.system.defaults.preset =
      (readOptionalTextInput(form, "defaults-preset") as WorldOrbitAtlasViewpoint["preset"]) ?? null;
    nextDocument.system.defaults.theme = readOptionalTextInput(form, "defaults-theme");
    return nextDocument;
  }

  function buildMetadataDocumentFromInspector(currentKey: string): WorldOrbitAtlasDocument {
    const nextDocument = cloneAtlasDocument(atlasDocument);
    const form = inspector?.querySelector("form[data-editor-form='metadata']") as HTMLFormElement | null;
    if (!form || !nextDocument.system) {
      return nextDocument;
    }

    const nextKey = readTextInput(form, "metadata-key") || currentKey;
    const nextValue = readOptionalTextInput(form, "metadata-value") ?? "";
    if (nextKey !== currentKey) {
      delete nextDocument.system.atlasMetadata[currentKey];
      nextDocument.system.atlasMetadata[nextKey] = nextValue;
      selection = { kind: "metadata", key: nextKey };
      return nextDocument;
    }

    nextDocument.system.atlasMetadata[currentKey] = nextValue;
    return nextDocument;
  }

  function buildViewpointDocumentFromInspector(currentId: string): WorldOrbitAtlasDocument {
    const nextDocument = cloneAtlasDocument(atlasDocument);
    const form = inspector?.querySelector("form[data-editor-form='viewpoint']") as HTMLFormElement | null;
    const current = nextDocument.system?.viewpoints.find((viewpoint) => viewpoint.id === currentId);
    if (!form || !current || !nextDocument.system) {
      return nextDocument;
    }

    const nextId = readTextInput(form, "viewpoint-id") || current.id;
    const replacement: WorldOrbitAtlasViewpoint = {
      ...current,
      id: nextId,
      label: readTextInput(form, "viewpoint-label") || current.label,
      summary: readOptionalTextInput(form, "viewpoint-summary") ?? "",
      focusObjectId: readOptionalTextInput(form, "viewpoint-focus"),
      selectedObjectId: readOptionalTextInput(form, "viewpoint-select"),
      projection:
        (readTextInput(form, "viewpoint-projection") as WorldOrbitAtlasViewpoint["projection"]) ||
        current.projection,
      preset:
        (readOptionalTextInput(form, "viewpoint-preset") as WorldOrbitAtlasViewpoint["preset"]) ??
        null,
      zoom: parseNullableNumber(readOptionalTextInput(form, "viewpoint-zoom")),
      rotationDeg: parseNullableNumber(readOptionalTextInput(form, "viewpoint-rotation")) ?? 0,
      camera: buildViewCameraFromForm(form),
      layers: {
        background: readCheckbox(form, "layer-background"),
        guides: readCheckbox(form, "layer-guides"),
        "orbits-back": readCheckbox(form, "layer-orbits-back"),
        "orbits-front": readCheckbox(form, "layer-orbits-front"),
        events: readCheckbox(form, "layer-events"),
        objects: readCheckbox(form, "layer-objects"),
        labels: readCheckbox(form, "layer-labels"),
        metadata: readCheckbox(form, "layer-metadata"),
      },
      events: splitTokens(readOptionalTextInput(form, "viewpoint-events")),
      filter: {
        query: readOptionalTextInput(form, "filter-query"),
        objectTypes: parseObjectTypes(readOptionalTextInput(form, "filter-object-types")),
        tags: splitTokens(readOptionalTextInput(form, "filter-tags")),
        groupIds: splitTokens(readOptionalTextInput(form, "filter-groups")),
      },
    };

    nextDocument.system.viewpoints = nextDocument.system.viewpoints
      .filter((viewpoint) => viewpoint.id !== current.id)
      .concat(replacement)
      .sort((left, right) => left.id.localeCompare(right.id));
    if (current.id !== replacement.id) {
      selection = { kind: "viewpoint", id: replacement.id };
    }
    return nextDocument;
  }

  function buildEventDocumentFromInspector(currentId: string): WorldOrbitAtlasDocument {
    const nextDocument = cloneAtlasDocument(atlasDocument);
    const form = inspector?.querySelector("form[data-editor-form='event']") as HTMLFormElement | null;
    const current = nextDocument.events.find((entry) => entry.id === currentId);
    if (!form || !current) {
      return nextDocument;
    }

    const nextId = readTextInput(form, "event-id") || current.id;
    const replacement: WorldOrbitEvent = {
      ...current,
      id: nextId,
      kind: readTextInput(form, "event-kind"),
      label: readTextInput(form, "event-label") || current.label,
      summary: readOptionalTextInput(form, "event-summary"),
      targetObjectId: readOptionalTextInput(form, "event-target"),
      participantObjectIds: splitTokens(readOptionalTextInput(form, "event-participants")),
      timing: readOptionalTextInput(form, "event-timing"),
      visibility: readOptionalTextInput(form, "event-visibility"),
      epoch: readOptionalTextInput(form, "event-epoch"),
      referencePlane: readOptionalTextInput(form, "event-referencePlane"),
      tags: splitTokens(readOptionalTextInput(form, "event-tags")),
      color: readOptionalTextInput(form, "event-color"),
      hidden: readCheckbox(form, "event-hidden"),
    };

    nextDocument.events = nextDocument.events
      .filter((entry) => entry.id !== current.id)
      .concat(replacement)
      .sort(compareEvents);

    syncEventViewpointReferences(
      nextDocument,
      current.id,
      replacement.id,
      splitTokens(readOptionalTextInput(form, "event-viewpoints")),
    );

    if (current.id !== replacement.id) {
      selection = { kind: "event", id: replacement.id };
    }
    return nextDocument;
  }

  function buildEventPoseDocumentFromInspector(
    eventId: string,
    objectId: string,
  ): WorldOrbitAtlasDocument {
    const nextDocument = cloneAtlasDocument(atlasDocument);
    const form = inspector?.querySelector("form[data-editor-form='event-pose']") as HTMLFormElement | null;
    const eventEntry = nextDocument.events.find((entry) => entry.id === eventId);
    const currentPose = eventEntry?.positions.find((entry) => entry.objectId === objectId);
    if (!form || !eventEntry || !currentPose) {
      return nextDocument;
    }

    const nextObjectId = readTextInput(form, "pose-object-id") || currentPose.objectId;
    const replacement: WorldOrbitEventPose = {
      objectId: nextObjectId,
      placement: buildPlacementFromPoseForm(form, currentPose),
      epoch: readOptionalTextInput(form, "pose-epoch"),
      referencePlane: readOptionalTextInput(form, "pose-referencePlane"),
    };
    const inner = parseOptionalUnit(readOptionalTextInput(form, "prop-inner"));
    const outer = parseOptionalUnit(readOptionalTextInput(form, "prop-outer"));
    if (inner) {
      replacement.inner = inner;
    }
    if (outer) {
      replacement.outer = outer;
    }

    eventEntry.positions = eventEntry.positions
      .filter((entry) => entry.objectId !== currentPose.objectId)
      .concat(replacement)
      .sort(compareEventPoses);

    if (
      eventEntry.targetObjectId !== replacement.objectId &&
      !eventEntry.participantObjectIds.includes(replacement.objectId)
    ) {
      eventEntry.participantObjectIds.push(replacement.objectId);
      eventEntry.participantObjectIds.sort((left, right) => left.localeCompare(right));
    }

    if (currentPose.objectId !== replacement.objectId) {
      selection = { kind: "event-pose", id: eventId, key: replacement.objectId };
    }
    return nextDocument;
  }

  function buildAnnotationDocumentFromInspector(currentId: string): WorldOrbitAtlasDocument {
    const nextDocument = cloneAtlasDocument(atlasDocument);
    const form = inspector?.querySelector("form[data-editor-form='annotation']") as HTMLFormElement | null;
    const current = nextDocument.system?.annotations.find((annotation) => annotation.id === currentId);
    if (!form || !current || !nextDocument.system) {
      return nextDocument;
    }

    const nextId = readTextInput(form, "annotation-id") || current.id;
    const replacement: WorldOrbitAtlasAnnotation = {
      ...current,
      id: nextId,
      label: readTextInput(form, "annotation-label") || current.label,
      targetObjectId: readOptionalTextInput(form, "annotation-target"),
      body: readOptionalTextInput(form, "annotation-body") ?? "",
      tags: splitTokens(readOptionalTextInput(form, "annotation-tags")),
      sourceObjectId: readOptionalTextInput(form, "annotation-source"),
    };

    nextDocument.system.annotations = nextDocument.system.annotations
      .filter((annotation) => annotation.id !== current.id)
      .concat(replacement)
      .sort((left, right) => left.id.localeCompare(right.id));
    if (current.id !== replacement.id) {
      selection = { kind: "annotation", id: replacement.id };
    }
    return nextDocument;
  }

  function buildObjectDocumentFromInspector(currentId: string): WorldOrbitAtlasDocument {
    const nextDocument = cloneAtlasDocument(atlasDocument);
    const form = inspector?.querySelector("form[data-editor-form='object']") as HTMLFormElement | null;
    const current = nextDocument.objects.find((object) => object.id === currentId);
    if (!form || !current) {
      return nextDocument;
    }

    const nextId = readTextInput(form, "object-id") || current.id;
    const replacement: WorldOrbitObject = {
      ...current,
      id: nextId,
      type: (readTextInput(form, "object-type") as WorldOrbitObject["type"]) || current.type,
      properties: { ...current.properties },
      info: { ...current.info },
      placement: buildPlacementFromForm(form, current),
    };

    for (const field of OBJECT_STRING_FIELDS) {
      setOptionalProperty(replacement.properties, field, readOptionalTextInput(form, `prop-${field}`));
    }

    for (const field of OBJECT_UNIT_FIELDS) {
      setOptionalProperty(
        replacement.properties,
        field,
        parseOptionalNormalizedValue(readOptionalTextInput(form, `prop-${field}`)),
      );
    }

    for (const field of OBJECT_NUMBER_FIELDS) {
      setOptionalProperty(
        replacement.properties,
        field,
        parseNullableNumber(readOptionalTextInput(form, `prop-${field}`)),
      );
    }

    setOptionalProperty(replacement.properties, "tags", splitTokens(readOptionalTextInput(form, "prop-tags")));
    replacement.properties.hidden = readCheckbox(form, "prop-hidden");

    const description = readOptionalTextInput(form, "info-description");
    if (description) {
      replacement.info.description = description;
    } else {
      delete replacement.info.description;
    }

    const updatedDocument = replaceObject(nextDocument, current.id, replacement);
    if (current.id !== replacement.id) {
      selection = { kind: "object", id: replacement.id };
    }
    return updatedDocument;
  }

  function renderStatusBar(): void {
    const errorCount = diagnostics.filter((entry) => entry.diagnostic.severity === "error").length;
    const warningCount = diagnostics.filter((entry) => entry.diagnostic.severity === "warning").length;
    const selectionLabel = selection ? describePath(selection) : "Nothing selected";
    statusBar.innerHTML = `
      <span class="wo-editor-status-pill${dirty ? " is-dirty" : " is-clean"}">${dirty ? "Unsaved changes" : "Saved"}</span>
      <span class="wo-editor-status-pill">Schema ${escapeHtml(atlasDocument.version)}</span>
      <span class="wo-editor-status-pill${errorCount > 0 ? " is-error" : warningCount > 0 ? " is-warning" : ""}">${errorCount} errors · ${warningCount} warnings</span>
      <span class="wo-editor-status-pill">${escapeHtml(selectionLabel)}</span>
    `;
  }

  function updateLiveRegion(): void {
    const errorCount = diagnostics.filter((entry) => entry.diagnostic.severity === "error").length;
    const warningCount = diagnostics.filter((entry) => entry.diagnostic.severity === "warning").length;
    liveRegion.textContent = `${dirty ? "Unsaved changes." : "Saved."} ${errorCount} errors, ${warningCount} warnings. ${selection ? describePath(selection) : "Nothing selected"}.`;
  }

  function schedulePreviewRender(): void {
    if (previewTimer !== null) {
      return;
    }

    previewTimer = window.setTimeout(() => {
      previewTimer = null;
      renderPreviewNow();
    }, PREVIEW_BATCH_DELAY_MS);
  }

  function renderPreviewNow(): void {
    if (!viewer) {
      return;
    }

    const nextSvg = viewer.exportSvg();
    if (previewVisual && nextSvg !== lastPreviewSvg) {
      previewVisual.innerHTML = nextSvg;
      lastPreviewSvg = nextSvg;
    }

    const nextMarkup = buildEmbedMarkup(getCurrentSourceForExport(), atlasDocument);
    if (previewMarkup && nextMarkup !== lastPreviewMarkup) {
      previewMarkup.textContent = nextMarkup;
      lastPreviewMarkup = nextMarkup;
    }
  }

  function maybeFitOrbitResizeInView(objectId: string): void {
    if (!viewer) {
      return;
    }

    const details = viewer.getObjectDetails(objectId);
    if (!details) {
      return;
    }

    const visibleBounds = getViewerVisibleBounds(viewer.getScene(), viewer.getState());
    const margin = 36 / Math.max(viewer.getState().scale, 0.001);
    const point = details.renderObject;

    if (
      point.x < visibleBounds.minX + margin ||
      point.x > visibleBounds.maxX - margin ||
      point.y < visibleBounds.minY + margin ||
      point.y > visibleBounds.maxY - margin
    ) {
      viewer.fitToSystem();
    }
  }

  function shouldIgnoreShortcutEvent(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return false;
    }

    const tagName = target.tagName.toLowerCase();
    return target.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";
  }

  function getSelectionDiagnostics(
    currentSelection: AtlasDocumentPath | null,
    entries: AtlasResolvedDiagnostic[],
  ): AtlasResolvedDiagnostic[] {
    if (!currentSelection) {
      return [];
    }

    const currentKey = selectionKey(currentSelection);
    return entries.filter((entry) => {
      const entryKey = selectionKey(entry.path);
      if (entryKey && entryKey === currentKey) {
        return true;
      }

      return currentSelection.kind === "object" && entry.diagnostic.objectId === currentSelection.id;
    });
  }

  function getPlacementDiagnosticsForSelection(
    currentSelection: AtlasDocumentPath | null,
    entries: AtlasResolvedDiagnostic[],
  ): AtlasResolvedDiagnostic[] {
    return getSelectionDiagnostics(currentSelection, entries).filter((entry) => {
      const field = entry.diagnostic.field ?? "";
      return (
        PLACEMENT_DIAGNOSTIC_FIELDS.has(field) ||
        entry.diagnostic.message.toLowerCase().includes("placement") ||
        entry.diagnostic.message.toLowerCase().includes("orbit") ||
        entry.diagnostic.message.toLowerCase().includes("surface") ||
        entry.diagnostic.message.toLowerCase().includes("lagrange") ||
        entry.diagnostic.message.toLowerCase().includes("anchor")
      );
    });
  }

  function renderInspectorDiagnosticSummary(
    currentSelection: AtlasDocumentPath | null,
    entries: AtlasResolvedDiagnostic[],
  ): string {
    const selectionDiagnostics = getSelectionDiagnostics(currentSelection, entries);
    if (selectionDiagnostics.length === 0) {
      return "";
    }

    return `<div class="wo-editor-inspector-summary">
      ${selectionDiagnostics
        .slice(0, 4)
        .map(
          (entry) => `<article class="wo-editor-diagnostic wo-editor-diagnostic-${escapeHtml(entry.diagnostic.severity)}">
              <strong>${escapeHtml(entry.diagnostic.severity.toUpperCase())}</strong>
              <span>${escapeHtml(entry.diagnostic.field ?? describePath(currentSelection!))}</span>
              <p>${escapeHtml(entry.diagnostic.message)}</p>
            </article>`,
        )
        .join("")}
    </div>`;
  }

  function decorateInspectorDiagnostics(
    currentSelection: AtlasDocumentPath | null,
    entries: AtlasResolvedDiagnostic[],
  ): void {
    if (!inspector || !currentSelection) {
      return;
    }

    const selectionDiagnostics = getSelectionDiagnostics(currentSelection, entries);
    const fieldMap = new Map<string, AtlasResolvedDiagnostic[]>();

    for (const entry of selectionDiagnostics) {
      for (const inputName of mapDiagnosticFieldToInputNames(currentSelection, entry.diagnostic.field)) {
        const currentEntries = fieldMap.get(inputName) ?? [];
        currentEntries.push(entry);
        fieldMap.set(inputName, currentEntries);
      }
    }

    for (const [inputName, fieldDiagnostics] of fieldMap) {
      const input = inspector.querySelector<HTMLElement>(`[name="${CSS.escape(inputName)}"]`);
      const field = input?.closest<HTMLElement>(".wo-editor-field, .wo-editor-checkbox");
      if (!input || !field) {
        continue;
      }

      const hasError = fieldDiagnostics.some((entry) => entry.diagnostic.severity === "error");
      const hasWarning = fieldDiagnostics.some((entry) => entry.diagnostic.severity === "warning");
      field.classList.add(hasError ? "has-error" : "has-warning");
      input.setAttribute("aria-invalid", hasError ? "true" : "false");
      const note = document.createElement("div");
      note.className = `wo-editor-field-note${hasError ? " is-error" : hasWarning ? " is-warning" : ""}`;
      note.textContent = fieldDiagnostics[0]?.diagnostic.message ?? "";
      field.append(note);
    }
  }
}

function resolveInitialEditorState(
  options: WorldOrbitEditorOptions,
): LoadedEditorState {
  if (options.atlasDocument) {
    const atlasDocument = cloneAtlasDocument(options.atlasDocument);
      return {
        atlasDocument,
        source: formatAtlasSource(atlasDocument),
        diagnostics: collectDocumentDiagnostics(atlasDocument),
      };
  }

  if (options.source) {
    const loaded = loadWorldOrbitSourceWithDiagnostics(options.source);
    if (loaded.ok && loaded.value) {
      const atlasDocument =
        loaded.value.atlasDocument ?? upgradeDocumentToV2(loaded.value.document);
      return {
        atlasDocument,
        source: formatAtlasSource(atlasDocument),
        diagnostics: mergeDiagnostics(
          resolveAtlasDiagnostics(atlasDocument, loaded.diagnostics),
          collectDocumentDiagnostics(atlasDocument),
        ),
      };
    }
  }

  const atlasDocument = createEmptyAtlasDocument("WorldOrbit");
  return {
    atlasDocument,
    source: formatAtlasSource(atlasDocument),
    diagnostics: collectDocumentDiagnostics(atlasDocument),
  };
}

function formatAtlasSource(document: WorldOrbitAtlasDocument): string {
  return formatDocument(document, { schema: document.version });
}

function buildEditorMarkup(): string {
  const previewOpen = shouldPreviewSectionBeOpenByDefault();
  return `<section class="wo-editor-shell">
    <div class="wo-editor-toolbar" data-editor-toolbar></div>
    <div class="wo-editor-status" data-editor-status role="status" aria-live="polite"></div>
    <div class="wo-editor-main">
      <aside class="wo-editor-sidebar" data-editor-pane="sidebar">
        <div class="wo-editor-panel">${renderPanelSection("Atlas", "atlas", `<div class="wo-editor-outline" data-editor-outline></div>`)}</div>
        <div class="wo-editor-panel">${renderPanelSection("Diagnostics", "diagnostics", `<div class="wo-editor-diagnostics" data-editor-diagnostics></div>`)}</div>
      </aside>
      <div class="wo-editor-stage-panel">
        <div class="wo-editor-stage-shell" data-editor-stage-shell>
          <div class="wo-editor-stage" data-editor-stage></div>
          <div class="wo-editor-overlay" data-editor-overlay></div>
        </div>
        <div class="wo-editor-panel" data-editor-pane="preview">
          ${renderPanelSection(
            "Preview",
            "preview",
            `<div class="wo-editor-preview">
              <div class="wo-editor-preview-card">
                <h3>Static SVG</h3>
                <div class="wo-editor-preview-visual" data-editor-preview-visual></div>
              </div>
              <div class="wo-editor-preview-card">
                <h3>Embed Markup</h3>
                <pre class="wo-editor-preview-markup" data-editor-preview-markup></pre>
              </div>
            </div>`,
            previewOpen,
          )}
        </div>
      </div>
      <aside class="wo-editor-panel wo-editor-inspector" data-editor-pane="inspector">
        ${renderPanelSection("Inspector", "inspector", `<div data-editor-inspector></div>`)}
      </aside>
    </div>
    <div class="wo-editor-panel wo-editor-text-panel" data-editor-pane="text">
      ${renderPanelSection(
        "Source",
        "source",
        `<textarea
          class="wo-editor-source"
          data-editor-source
          spellcheck="false"
          aria-describedby="worldorbit-editor-source-diagnostics"
        ></textarea>
        <div
          class="wo-editor-source-diagnostics"
          id="worldorbit-editor-source-diagnostics"
          data-editor-source-diagnostics
          aria-live="polite"
        ></div>`,
      )}
    </div>
    <div class="wo-editor-live-region" data-editor-live aria-live="polite" aria-atomic="true"></div>
  </section>`;
}

function renderPanelSection(
  title: string,
  sectionId: string,
  content: string,
  open = true,
): string {
  return `<details class="wo-editor-panel-section" data-editor-panel-section="${escapeHtml(sectionId)}"${open ? " open" : ""}>
    <summary><span>${escapeHtml(title)}</span></summary>
    <div class="wo-editor-panel-section-body">${content}</div>
  </details>`;
}

function renderInspectorSection(
  formId: string,
  sectionId: string,
  title: string,
  content: string,
  open = false,
): string {
  const stateKey = inspectorSectionStateKey(formId, sectionId);
  return `<details class="wo-editor-inspector-section" data-editor-form-section="${escapeHtml(sectionId)}" data-editor-form-id="${escapeHtml(formId)}" data-editor-section-state="${escapeHtml(stateKey)}"${open ? " open" : ""}>
    <summary><span>${escapeHtml(title)}</span></summary>
    <div class="wo-editor-inspector-section-body">${content}</div>
  </details>`;
}

function renderFieldLabel(label: string, name: string): string {
  return `<span class="wo-editor-field-label">${escapeHtml(label)}${renderFieldHelp(name)}</span>`;
}

function renderFieldHelp(name: string): string {
  const help = FIELD_HELP[name];
  if (!help) {
    return "";
  }

  return `<details class="wo-editor-field-help">
    <summary aria-label="Explain ${escapeAttribute(name)}">?</summary>
    <div class="wo-editor-field-help-card">
      <p>${escapeHtml(help.description)}</p>
      ${(help.references?.length ?? 0) > 0
        ? `<div class="wo-editor-field-help-chips">${(help.references ?? [])
            .map((entry) => `<span>${escapeHtml(entry)}</span>`)
            .join("")}</div>`
        : ""}
    </div>
  </details>`;
}

function captureInspectorSectionState(
  container: HTMLElement,
  state: Map<string, boolean>,
): void {
  for (const section of container.querySelectorAll<HTMLDetailsElement>("[data-editor-section-state]")) {
    const key = section.dataset.editorSectionState;
    if (!key) {
      continue;
    }
    state.set(key, section.open);
  }
}

function applyInspectorSectionState(
  container: HTMLElement,
  state: Map<string, boolean>,
): void {
  for (const section of container.querySelectorAll<HTMLDetailsElement>("[data-editor-section-state]")) {
    const key = section.dataset.editorSectionState;
    if (!key || !state.has(key)) {
      continue;
    }
    section.open = state.get(key) === true;
  }
}

function inspectorSectionStateKey(formId: string, sectionId: string): string {
  return `${formId}:${sectionId}`;
}

function shouldPreviewSectionBeOpenByDefault(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  if (typeof window.matchMedia === "function") {
    return !window.matchMedia("(max-width: 1280px)").matches;
  }

  return window.innerWidth > 1280;
}

function renderOutlineButton(
  path: AtlasDocumentPath,
  label: string,
  activeKey: string | null,
  diagnosticBuckets: Map<string, DiagnosticBucket>,
): string {
  const key = selectionKey(path);
  const bucket = key ? diagnosticBuckets.get(key) : null;
  const badge =
    bucket && (bucket.errors > 0 || bucket.warnings > 0)
      ? `<span class="wo-editor-outline-badge${bucket.errors > 0 ? " is-error" : " is-warning"}">${bucket.errors > 0 ? bucket.errors : bucket.warnings}</span>`
      : "";
  return `<button type="button" class="wo-editor-outline-item${key === activeKey ? " is-active" : ""}" data-path-kind="${escapeHtml(path.kind)}"${path.id ? ` data-path-id="${escapeHtml(path.id)}"` : ""}${path.key ? ` data-path-key="${escapeHtml(path.key)}"` : ""}><span>${escapeHtml(label)}</span>${badge}</button>`;
}

function renderEventOutlineItems(
  eventEntry: WorldOrbitEvent,
  activeKey: string | null,
  diagnosticBuckets: Map<string, DiagnosticBucket>,
): string {
  return `<div class="wo-editor-outline-group">
    ${renderOutlineButton(
      { kind: "event", id: eventEntry.id },
      eventEntry.label || eventEntry.id,
      activeKey,
      diagnosticBuckets,
    )}
    ${
      eventEntry.positions.length > 0
        ? `<div class="wo-editor-outline-children">${[...eventEntry.positions]
            .sort(compareEventPoses)
            .map((pose) =>
              renderOutlineButton(
                { kind: "event-pose", id: eventEntry.id, key: pose.objectId },
                pose.objectId,
                activeKey,
                diagnosticBuckets,
              ),
            )
            .join("")}</div>`
        : ""
    }
  </div>`;
}

function renderSystemInspector(formState: WorldOrbitEditorFormState): string {
  return `<form class="wo-editor-form" data-editor-form="system">
    <h2>System</h2>
    ${renderInspectorSection(
      "system",
      "basics",
      "Basics",
      `${renderTextField("System ID", "system-id", formState.system?.id ?? "")}
      ${renderTextField("Title", "system-title", formState.system?.title ?? "")}`,
      true,
    )}
  </form>`;
}

function renderDefaultsInspector(formState: WorldOrbitEditorFormState): string {
  const defaults = formState.system?.defaults;
  return `<form class="wo-editor-form" data-editor-form="defaults">
    <h2>Defaults</h2>
    ${renderInspectorSection(
      "defaults",
      "basics",
      "Basics",
      `${renderSelectField("Projection", "defaults-view", [
        ["topdown", "Topdown"],
        ["isometric", "Isometric"],
        ["orthographic", "Orthographic"],
        ["perspective", "Perspective"],
      ], defaults?.view ?? "topdown")}
      ${renderTextField("Scale preset", "defaults-scale", defaults?.scale ?? "")}
      ${renderTextField("Units", "defaults-units", defaults?.units ?? "")}
      ${renderSelectField("Render preset", "defaults-preset", [
        ["", "Document default"],
        ["diagram", "Diagram"],
        ["presentation", "Presentation"],
        ["atlas-card", "Atlas Card"],
        ["markdown", "Markdown"],
      ], defaults?.preset ?? "")}
      ${renderTextField("Theme", "defaults-theme", defaults?.theme ?? "")}`,
      true,
    )}
  </form>`;
}

function renderMetadataInspector(
  formState: WorldOrbitEditorFormState,
  key: string,
): string {
  const value = formState.system?.atlasMetadata[key] ?? "";
  return `<form class="wo-editor-form" data-editor-form="metadata">
    <h2>Metadata</h2>
    ${renderInspectorSection(
      "metadata",
      "entry",
      "Entry",
      `${renderTextField("Key", "metadata-key", key)}
      ${renderTextAreaField("Value", "metadata-value", value)}`,
      true,
    )}
  </form>`;
}

function renderViewpointInspector(
  formState: WorldOrbitEditorFormState,
  id: string,
): string {
  const viewpoint = formState.viewpoints.find((entry) => entry.id === id);
  if (!viewpoint) {
    return `<p class="wo-editor-empty">Viewpoint not found.</p>`;
  }

  return `<form class="wo-editor-form" data-editor-form="viewpoint">
    <h2>Viewpoint</h2>
    ${renderInspectorSection(
      "viewpoint",
      "basics",
      "Basics",
      `${renderTextField("ID", "viewpoint-id", viewpoint.id)}
      ${renderTextField("Label", "viewpoint-label", viewpoint.label)}
      ${renderTextAreaField("Summary", "viewpoint-summary", viewpoint.summary)}
      ${renderTextField("Focus object", "viewpoint-focus", viewpoint.focusObjectId ?? "")}
      ${renderTextField("Selected object", "viewpoint-select", viewpoint.selectedObjectId ?? "")}
      ${renderSelectField("Projection", "viewpoint-projection", [
        ["topdown", "Topdown"],
        ["isometric", "Isometric"],
        ["orthographic", "Orthographic"],
        ["perspective", "Perspective"],
      ], viewpoint.projection)}
      ${renderSelectField("Preset", "viewpoint-preset", [
        ["", "Document default"],
        ["diagram", "Diagram"],
        ["presentation", "Presentation"],
        ["atlas-card", "Atlas Card"],
        ["markdown", "Markdown"],
      ], viewpoint.preset ?? "")}
      ${renderTextField("Zoom", "viewpoint-zoom", viewpoint.zoom === null ? "" : String(viewpoint.zoom))}
      ${renderTextField("Rotation", "viewpoint-rotation", String(viewpoint.rotationDeg))}`,
      true,
    )}
    ${renderInspectorSection(
      "viewpoint",
      "camera",
      "Camera",
      `${renderTextField("Azimuth", "viewpoint-camera-azimuth", viewpoint.camera?.azimuth === null || viewpoint.camera?.azimuth === undefined ? "" : String(viewpoint.camera.azimuth))}
      ${renderTextField("Elevation", "viewpoint-camera-elevation", viewpoint.camera?.elevation === null || viewpoint.camera?.elevation === undefined ? "" : String(viewpoint.camera.elevation))}
      ${renderTextField("Roll", "viewpoint-camera-roll", viewpoint.camera?.roll === null || viewpoint.camera?.roll === undefined ? "" : String(viewpoint.camera.roll))}
      ${renderTextField("Distance", "viewpoint-camera-distance", viewpoint.camera?.distance === null || viewpoint.camera?.distance === undefined ? "" : String(viewpoint.camera.distance))}
      <p class="wo-editor-inline-note">Rotation stays a 2D screen-rotation hint. The camera block stores Schema 2.5 view direction and framing.</p>`,
    )}
    ${renderInspectorSection(
      "viewpoint",
      "layers",
      "Layers",
      `<fieldset class="wo-editor-fieldset">
        <legend>Layers</legend>
        ${renderCheckboxField("Background", "layer-background", viewpoint.layers.background !== false)}
        ${renderCheckboxField("Guides", "layer-guides", viewpoint.layers.guides !== false)}
        ${renderCheckboxField("Orbits back", "layer-orbits-back", viewpoint.layers["orbits-back"] !== false)}
        ${renderCheckboxField("Orbits front", "layer-orbits-front", viewpoint.layers["orbits-front"] !== false)}
        ${renderCheckboxField("Events", "layer-events", viewpoint.layers.events !== false)}
        ${renderCheckboxField("Objects", "layer-objects", viewpoint.layers.objects !== false)}
        ${renderCheckboxField("Labels", "layer-labels", viewpoint.layers.labels !== false)}
        ${renderCheckboxField("Metadata", "layer-metadata", viewpoint.layers.metadata !== false)}
      </fieldset>`,
    )}
    ${renderInspectorSection(
      "viewpoint",
      "filter",
      "Filter",
      `${renderTextField("Filter query", "filter-query", viewpoint.filter?.query ?? "")}
      ${renderTextField("Filter object types", "filter-object-types", viewpoint.filter?.objectTypes.join(" ") ?? "")}
      ${renderTextField("Filter tags", "filter-tags", viewpoint.filter?.tags.join(" ") ?? "")}
      ${renderTextField("Filter groups", "filter-groups", viewpoint.filter?.groupIds.join(" ") ?? "")}
      ${renderTextField("Events", "viewpoint-events", viewpoint.events.join(" "))}`,
      )}
  </form>`;
}

function renderEventInspector(
  formState: WorldOrbitEditorFormState,
  id: string,
): string {
  const eventEntry = formState.events.find((entry) => entry.id === id);
  if (!eventEntry) {
    return `<p class="wo-editor-empty">Event not found.</p>`;
  }

  const linkedViewpoints = formState.viewpoints
    .filter((viewpoint) => viewpoint.events.includes(eventEntry.id))
    .map((viewpoint) => viewpoint.id)
    .join(" ");

  return `<form class="wo-editor-form" data-editor-form="event">
    <h2>Event</h2>
    ${renderInspectorSection(
      "event",
      "basics",
      "Basics",
      `${renderTextField("ID", "event-id", eventEntry.id)}
      ${renderTextField("Kind", "event-kind", eventEntry.kind)}
      ${renderTextField("Label", "event-label", eventEntry.label)}
      ${renderTextAreaField("Summary", "event-summary", eventEntry.summary ?? "")}
      ${renderTextField("Target object", "event-target", eventEntry.targetObjectId ?? "")}
      ${renderTextField("Participants", "event-participants", eventEntry.participantObjectIds.join(" "))}
      ${renderTextField("Timing", "event-timing", eventEntry.timing ?? "")}
      ${renderTextField("Visibility", "event-visibility", eventEntry.visibility ?? "")}
      ${renderTextField("Epoch", "event-epoch", eventEntry.epoch ?? "")}
      ${renderTextField("Reference plane", "event-referencePlane", eventEntry.referencePlane ?? "")}
      ${renderTextField("Tags", "event-tags", eventEntry.tags.join(" "))}
      ${renderTextField("Color", "event-color", eventEntry.color ?? "")}
      ${renderCheckboxField("Hidden", "event-hidden", eventEntry.hidden === true)}`,
      true,
    )}
    ${renderInspectorSection(
      "event",
      "viewpoints",
      "Viewpoints",
      `${renderTextField("Viewpoints", "event-viewpoints", linkedViewpoints)}`,
    )}
    ${renderInspectorSection(
      "event",
      "positions",
      "Positions",
      `${eventEntry.positions.length > 0
        ? `<div class="wo-editor-inline-list">${eventEntry.positions
            .map(
              (pose) =>
                renderOutlineButton(
                  { kind: "event-pose", id: eventEntry.id, key: pose.objectId },
                  pose.objectId,
                  null,
                  new Map(),
                ),
            )
            .join("")}</div>`
        : `<p class="wo-editor-empty">No event poses yet.</p>`}
      <div class="wo-editor-inline-actions">
        <button type="button" data-editor-action="add-event-pose" data-editor-event-id="${escapeHtml(eventEntry.id)}">Add pose</button>
      </div>`,
    )}
  </form>`;
}

function renderEventPoseInspector(
  formState: WorldOrbitEditorFormState,
  eventId: string,
  objectId: string,
): string {
  const eventEntry = formState.events.find((entry) => entry.id === eventId);
  const pose = eventEntry?.positions.find((entry) => entry.objectId === objectId);
  if (!eventEntry || !pose) {
    return `<p class="wo-editor-empty">Event pose not found.</p>`;
  }

  const placementMode = pose.placement?.mode ?? "";
  const placementTarget =
    pose.placement?.mode === "orbit" || pose.placement?.mode === "surface" || pose.placement?.mode === "at"
      ? pose.placement.target
      : "";
  const freeValue =
    pose.placement?.mode === "free"
      ? pose.placement.distance
        ? formatUnitValue(pose.placement.distance)
        : pose.placement.descriptor ?? ""
      : "";

  return `<form class="wo-editor-form" data-editor-form="event-pose">
    <h2>Event Pose</h2>
    <p class="wo-editor-inline-note">Event <strong>${escapeHtml(eventEntry.label || eventEntry.id)}</strong></p>
    ${renderInspectorSection(
      "event-pose",
      "identity",
      "Identity",
      `${renderTextField("Object", "pose-object-id", pose.objectId)}
      <div class="wo-editor-inline-actions">
        <button type="button" data-path-kind="event" data-path-id="${escapeHtml(eventEntry.id)}">Select event</button>
      </div>`,
      true,
    )}
    ${renderInspectorSection(
      "event-pose",
      "placement",
      "Placement",
      `${renderSelectField("Placement mode", "placement-mode", [
        ["", "None"],
        ["orbit", "Orbit"],
        ["at", "At"],
        ["surface", "Surface"],
        ["free", "Free"],
      ], placementMode)}
      ${renderTextField("Placement target", "placement-target", placementTarget)}
      ${renderTextField("Free value", "placement-free", freeValue)}
      ${renderTextField("Distance", "placement-distance", pose.placement?.mode === "orbit" && pose.placement.distance ? formatUnitValue(pose.placement.distance) : "")}
      ${renderTextField("Semi-major", "placement-semiMajor", pose.placement?.mode === "orbit" && pose.placement.semiMajor ? formatUnitValue(pose.placement.semiMajor) : "")}
      ${renderTextField("Eccentricity", "placement-eccentricity", pose.placement?.mode === "orbit" && pose.placement.eccentricity !== undefined ? String(pose.placement.eccentricity) : "")}
      ${renderTextField("Period", "placement-period", pose.placement?.mode === "orbit" && pose.placement.period ? formatUnitValue(pose.placement.period) : "")}
      ${renderTextField("Angle", "placement-angle", pose.placement?.mode === "orbit" && pose.placement.angle ? formatUnitValue(pose.placement.angle) : "")}
      ${renderTextField("Inclination", "placement-inclination", pose.placement?.mode === "orbit" && pose.placement.inclination ? formatUnitValue(pose.placement.inclination) : "")}
      ${renderTextField("Phase", "placement-phase", pose.placement?.mode === "orbit" && pose.placement.phase ? formatUnitValue(pose.placement.phase) : "")}
      ${renderTextField("Inner", "prop-inner", pose.inner ? formatUnitValue(pose.inner) : "")}
      ${renderTextField("Outer", "prop-outer", pose.outer ? formatUnitValue(pose.outer) : "")}`,
      true,
    )}
    ${renderInspectorSection(
      "event-pose",
      "context",
      "Context",
      `${renderTextField("Epoch", "pose-epoch", pose.epoch ?? "")}
      ${renderTextField("Reference plane", "pose-referencePlane", pose.referencePlane ?? "")}
      <p class="wo-editor-inline-note">Falls back to event, then object, then system context when left empty.</p>`,
    )}
  </form>`;
}

function renderAnnotationInspector(
  formState: WorldOrbitEditorFormState,
  id: string,
): string {
  const annotation = formState.system?.annotations.find((entry) => entry.id === id);
  if (!annotation) {
    return `<p class="wo-editor-empty">Annotation not found.</p>`;
  }

  return `<form class="wo-editor-form" data-editor-form="annotation">
    <h2>Annotation</h2>
    ${renderInspectorSection(
      "annotation",
      "entry",
      "Entry",
      `${renderTextField("ID", "annotation-id", annotation.id)}
      ${renderTextField("Label", "annotation-label", annotation.label)}
      ${renderTextField("Target object", "annotation-target", annotation.targetObjectId ?? "")}
      ${renderTextField("Source object", "annotation-source", annotation.sourceObjectId ?? "")}
      ${renderTextAreaField("Body", "annotation-body", annotation.body)}
      ${renderTextField("Tags", "annotation-tags", annotation.tags.join(" "))}`,
      true,
    )}
  </form>`;
}

function renderObjectInspector(
  formState: WorldOrbitEditorFormState,
  id: string,
): string {
  const object = formState.objects.find((entry) => entry.id === id);
  if (!object) {
    return `<p class="wo-editor-empty">Object not found.</p>`;
  }

  const placementMode = object.placement?.mode ?? "";
  const placementTarget =
    object.placement?.mode === "orbit" || object.placement?.mode === "surface" || object.placement?.mode === "at"
      ? object.placement.target
      : "";
  const freeValue =
    object.placement?.mode === "free"
      ? object.placement.distance
        ? formatUnitValue(object.placement.distance)
        : object.placement.descriptor ?? ""
      : "";

  return `<form class="wo-editor-form" data-editor-form="object">
    <h2>Object</h2>
    ${renderInspectorSection(
      "object",
      "identity",
      "Identity",
      `${renderTextField("ID", "object-id", object.id)}
      ${renderSelectField("Type", "object-type", OBJECT_TYPES.map((type) => [type, humanizeIdentifier(type)]), object.type)}`,
      true,
    )}
    ${renderInspectorSection(
      "object",
      "placement",
      "Placement",
      `${renderSelectField("Placement mode", "placement-mode", [
        ["", "None"],
        ["orbit", "Orbit"],
        ["at", "At"],
        ["surface", "Surface"],
        ["free", "Free"],
      ], placementMode)}
      ${renderTextField("Placement target", "placement-target", placementTarget)}
      ${renderTextField("Free value", "placement-free", freeValue)}
      ${renderTextField("Distance", "placement-distance", object.placement?.mode === "orbit" && object.placement.distance ? formatUnitValue(object.placement.distance) : "")}
      ${renderTextField("Semi-major", "placement-semiMajor", object.placement?.mode === "orbit" && object.placement.semiMajor ? formatUnitValue(object.placement.semiMajor) : "")}
      ${renderTextField("Eccentricity", "placement-eccentricity", object.placement?.mode === "orbit" && object.placement.eccentricity !== undefined ? String(object.placement.eccentricity) : "")}
      ${renderTextField("Period", "placement-period", object.placement?.mode === "orbit" && object.placement.period ? formatUnitValue(object.placement.period) : "")}
      ${renderTextField("Angle", "placement-angle", object.placement?.mode === "orbit" && object.placement.angle ? formatUnitValue(object.placement.angle) : "")}
      ${renderTextField("Inclination", "placement-inclination", object.placement?.mode === "orbit" && object.placement.inclination ? formatUnitValue(object.placement.inclination) : "")}
      ${renderTextField("Phase", "placement-phase", object.placement?.mode === "orbit" && object.placement.phase ? formatUnitValue(object.placement.phase) : "")}`,
      true,
    )}
    ${renderInspectorSection(
      "object",
      "properties",
      "Properties",
      `<fieldset class="wo-editor-fieldset">
        <legend>Properties</legend>
        ${renderTextField("Kind", "prop-kind", readStringProperty(object.properties.kind))}
        ${renderTextField("Class", "prop-class", readStringProperty(object.properties.class))}
        ${renderTextField("Culture", "prop-culture", readStringProperty(object.properties.culture))}
        ${renderTextField("Tags", "prop-tags", readTagsProperty(object.properties.tags))}
        ${renderTextField("Color", "prop-color", readStringProperty(object.properties.color))}
        ${renderTextField("Image", "prop-image", readStringProperty(object.properties.image))}
        ${renderCheckboxField("Hidden", "prop-hidden", object.properties.hidden === true)}
        ${renderTextField("Radius", "prop-radius", readUnitProperty(object.properties.radius))}
        ${renderTextField("Mass", "prop-mass", readUnitProperty(object.properties.mass))}
        ${renderTextField("Density", "prop-density", readUnitProperty(object.properties.density))}
        ${renderTextField("Gravity", "prop-gravity", readUnitProperty(object.properties.gravity))}
        ${renderTextField("Temperature", "prop-temperature", readUnitProperty(object.properties.temperature))}
        ${renderTextField("Albedo", "prop-albedo", readNumberProperty(object.properties.albedo))}
        ${renderTextField("Atmosphere", "prop-atmosphere", readStringProperty(object.properties.atmosphere))}
        ${renderTextField("Inner", "prop-inner", readUnitProperty(object.properties.inner))}
        ${renderTextField("Outer", "prop-outer", readUnitProperty(object.properties.outer))}
        ${renderTextField("On", "prop-on", readStringProperty(object.properties.on))}
        ${renderTextField("Source", "prop-source", readStringProperty(object.properties.source))}
        ${renderTextField("Cycle", "prop-cycle", readUnitProperty(object.properties.cycle))}
      </fieldset>`,
    )}
    ${renderInspectorSection(
      "object",
      "info",
      "Info",
      `${renderTextAreaField("Description", "info-description", object.info.description ?? "")}`,
    )}
  </form>`;
}

function renderTextField(label: string, name: string, value: string): string {
  return `<label class="wo-editor-field">${renderFieldLabel(label, name)}<input name="${escapeHtml(name)}" value="${escapeAttribute(value)}" /></label>`;
}

function renderTextAreaField(label: string, name: string, value: string): string {
  return `<label class="wo-editor-field">${renderFieldLabel(label, name)}<textarea name="${escapeHtml(name)}">${escapeHtml(value)}</textarea></label>`;
}

function renderSelectField(
  label: string,
  name: string,
  options: Array<[string, string]>,
  selectedValue: string,
): string {
  return `<label class="wo-editor-field">${renderFieldLabel(label, name)}<select name="${escapeHtml(name)}">${options
    .map(
      ([value, optionLabel]) =>
        `<option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(optionLabel)}</option>`,
    )
    .join("")}</select></label>`;
}

function renderCheckboxField(label: string, name: string, checked: boolean): string {
  return `<label class="wo-editor-checkbox"><input type="checkbox" name="${escapeHtml(name)}"${checked ? " checked" : ""} />${renderFieldLabel(label, name)}</label>`;
}

function createHandleElement(
  kind: DragState["kind"],
  objectId: string,
  point: CoordinatePoint,
  label: string,
): HTMLElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "wo-editor-handle";
  element.dataset.handleKind = kind;
  element.dataset.objectId = objectId;
  element.style.left = `${point.x}px`;
  element.style.top = `${point.y}px`;
  element.textContent = label;
  return element;
}

function readTextInput(form: HTMLFormElement, name: string): string {
  return (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null)?.value.trim() ?? "";
}

function readOptionalTextInput(form: HTMLFormElement, name: string): string | null {
  const value = readTextInput(form, name);
  return value ? value : null;
}

function readCheckbox(form: HTMLFormElement, name: string): boolean {
  return (form.elements.namedItem(name) as HTMLInputElement | null)?.checked ?? false;
}

function buildPlacementFromForm(
  form: HTMLFormElement,
  current: WorldOrbitObject,
): WorldOrbitObject["placement"] {
  return buildPlacementFromValues(form, current.placement, current.id);
}

function buildPlacementFromPoseForm(
  form: HTMLFormElement,
  current: WorldOrbitEventPose,
): WorldOrbitEventPose["placement"] {
  return buildPlacementFromValues(form, current.placement, current.objectId);
}

function buildPlacementFromValues(
  form: HTMLFormElement,
  currentPlacement: WorldOrbitObject["placement"],
  fallbackTarget: string,
): WorldOrbitObject["placement"] {
  const mode = readTextInput(form, "placement-mode");
  const target = readOptionalTextInput(form, "placement-target");

  switch (mode) {
    case "orbit":
      return {
        mode,
        target:
          target ??
          (currentPlacement?.mode === "orbit"
            ? currentPlacement.target
            : fallbackTarget),
        distance: parseOptionalUnit(readOptionalTextInput(form, "placement-distance")),
        semiMajor: parseOptionalUnit(readOptionalTextInput(form, "placement-semiMajor")),
        eccentricity: parseNullableNumber(readOptionalTextInput(form, "placement-eccentricity")) ?? undefined,
        period: parseOptionalUnit(readOptionalTextInput(form, "placement-period")),
        angle: parseOptionalUnit(readOptionalTextInput(form, "placement-angle")),
        inclination: parseOptionalUnit(readOptionalTextInput(form, "placement-inclination")),
        phase: parseOptionalUnit(readOptionalTextInput(form, "placement-phase")),
      };
    case "at":
      return {
        mode,
        target: target ?? fallbackTarget,
        reference: parseAtReferenceString(target ?? fallbackTarget),
      };
    case "surface":
      return {
        mode,
        target: target ?? fallbackTarget,
      };
    case "free": {
      const freeValue = readOptionalTextInput(form, "placement-free");
      const distance = parseOptionalUnit(freeValue);
      return {
        mode,
        distance: distance ?? undefined,
        descriptor: distance ? undefined : freeValue ?? undefined,
      };
    }
    default:
      return null;
  }
}

function setOptionalProperty(
  properties: Record<string, NormalizedValue>,
  key: string,
  value: NormalizedValue | null | undefined,
): void {
  const emptyArray = Array.isArray(value) && value.length === 0;
  if (value === null || value === undefined || emptyArray || value === "") {
    delete properties[key];
    return;
  }

  properties[key] = value;
}

function parseOptionalNormalizedValue(value: string | null): NormalizedValue | null {
  if (!value) {
    return null;
  }

  const unit = parseOptionalUnit(value);
  return unit ?? value;
}

function parseOptionalUnit(value: string | null): UnitValue | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(/^(-?\d+(?:\.\d+)?)(au|km|re|sol|me|d|y|h|deg)?$/);
  if (!match) {
    return undefined;
  }

  return {
    value: Number(match[1]),
    unit: (match[2] as UnitValue["unit"]) ?? null,
  };
}

function parseNullableNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildViewCameraFromForm(
  form: HTMLFormElement,
): WorldOrbitAtlasViewpoint["camera"] {
  const camera = {
    azimuth: parseNullableNumber(readOptionalTextInput(form, "viewpoint-camera-azimuth")),
    elevation: parseNullableNumber(readOptionalTextInput(form, "viewpoint-camera-elevation")),
    roll: parseNullableNumber(readOptionalTextInput(form, "viewpoint-camera-roll")),
    distance: parseNullableNumber(readOptionalTextInput(form, "viewpoint-camera-distance")),
  };

  return camera.azimuth !== null ||
    camera.elevation !== null ||
    camera.roll !== null ||
    camera.distance !== null
    ? camera
    : null;
}

function parseObjectTypes(value: string | null): WorldOrbitObject["type"][] {
  const tokens = splitTokens(value);
  return tokens.filter((token): token is WorldOrbitObject["type"] =>
    OBJECT_TYPES.includes(token as WorldOrbitObject["type"]),
  );
}

function splitTokens(value: string | null): string[] {
  return value
    ?.split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean) ?? [];
}

function createNewObject(
  type: WorldOrbitObject["type"],
  id: string,
  document: WorldOrbitAtlasDocument,
): WorldOrbitObject {
  const orbitTarget =
    document.objects.find((object) => object.type === "star")?.id ??
    document.objects[0]?.id ??
    id;

  return {
    type,
    id,
    properties: {},
    placement:
      type === "structure" || type === "phenomenon"
        ? {
            mode: "at",
            target: `${orbitTarget}:L4`,
            reference: parseAtReferenceString(`${orbitTarget}:L4`),
          }
        : {
            mode: "orbit",
            target: orbitTarget,
            distance: { value: 1, unit: "au" },
          },
    info: {},
  };
}

function insertObject(
  document: WorldOrbitAtlasDocument,
  object: WorldOrbitObject,
): WorldOrbitAtlasDocument {
  const next = cloneAtlasDocument(document);
  next.objects = next.objects
    .filter((entry) => entry.id !== object.id)
    .concat(object)
    .sort(compareObjects);
  return next;
}

function replaceObject(
  document: WorldOrbitAtlasDocument,
  currentId: string,
  object: WorldOrbitObject,
): WorldOrbitAtlasDocument {
  const next = cloneAtlasDocument(document);
  next.objects = next.objects
    .filter((entry) => entry.id !== currentId)
    .concat(object)
    .sort(compareObjects);

  if (currentId !== object.id) {
    renameObjectReferences(next, currentId, object.id);
  }

  return next;
}

function renameObjectReferences(
  document: WorldOrbitAtlasDocument,
  fromId: string,
  toId: string,
): void {
  for (const object of document.objects) {
    if (object.id === toId) {
      continue;
    }

    if (object.placement?.mode === "orbit" && object.placement.target === fromId) {
      object.placement.target = toId;
    }
    if (object.placement?.mode === "surface" && object.placement.target === fromId) {
      object.placement.target = toId;
    }
    if (object.placement?.mode === "at") {
      const reference = object.placement.reference;
      if (reference.kind === "anchor" && reference.objectId === fromId) {
        reference.objectId = toId;
      }
      if (reference.kind === "lagrange") {
        if (reference.primary === fromId) {
          reference.primary = toId;
        }
        if (reference.secondary === fromId) {
          reference.secondary = toId;
        }
      }
      object.placement.target = formatAtReference(reference);
    }
  }

  for (const viewpoint of document.system?.viewpoints ?? []) {
    if (viewpoint.focusObjectId === fromId) {
      viewpoint.focusObjectId = toId;
    }
    if (viewpoint.selectedObjectId === fromId) {
      viewpoint.selectedObjectId = toId;
    }
  }

  for (const annotation of document.system?.annotations ?? []) {
    if (annotation.targetObjectId === fromId) {
      annotation.targetObjectId = toId;
    }
    if (annotation.sourceObjectId === fromId) {
      annotation.sourceObjectId = toId;
    }
  }

  for (const eventEntry of document.events) {
    if (eventEntry.targetObjectId === fromId) {
      eventEntry.targetObjectId = toId;
    }
    eventEntry.participantObjectIds = eventEntry.participantObjectIds.map((entry) =>
      entry === fromId ? toId : entry,
    );
    for (const pose of eventEntry.positions) {
      if (pose.objectId === fromId) {
        pose.objectId = toId;
      }
      if (pose.placement?.mode === "orbit" && pose.placement.target === fromId) {
        pose.placement.target = toId;
      }
      if (pose.placement?.mode === "surface" && pose.placement.target === fromId) {
        pose.placement.target = toId;
      }
      if (pose.placement?.mode === "at") {
        const reference = pose.placement.reference;
        if (reference.kind === "anchor" && reference.objectId === fromId) {
          reference.objectId = toId;
        }
        if (reference.kind === "lagrange") {
          if (reference.primary === fromId) {
            reference.primary = toId;
          }
          if (reference.secondary === fromId) {
            reference.secondary = toId;
          }
        }
        pose.placement.target = formatAtReference(reference);
      }
    }
    eventEntry.positions.sort(compareEventPoses);
  }
}

function removeSelectedNode(
  document: WorldOrbitAtlasDocument,
  selection: AtlasDocumentPath,
): WorldOrbitAtlasDocument {
  const next = removeAtlasDocumentNode(document, selection);

  if (selection.kind === "event" && selection.id) {
    for (const viewpoint of next.system?.viewpoints ?? []) {
      viewpoint.events = viewpoint.events.filter((eventId) => eventId !== selection.id);
    }
    return next;
  }

  if (selection.kind !== "object" || !selection.id) {
    return next;
  }

  for (const object of next.objects) {
    if (object.placement?.mode === "orbit" && object.placement.target === selection.id) {
      object.placement = null;
    }
    if (object.placement?.mode === "surface" && object.placement.target === selection.id) {
      object.placement = null;
    }
    if (object.placement?.mode === "at") {
      const reference = object.placement.reference;
      const touchesSelection =
        (reference.kind === "anchor" && reference.objectId === selection.id) ||
        (reference.kind === "lagrange" &&
          (reference.primary === selection.id || reference.secondary === selection.id));
      if (touchesSelection) {
        object.placement = null;
      }
    }
  }

  for (const viewpoint of next.system?.viewpoints ?? []) {
    if (viewpoint.focusObjectId === selection.id) {
      viewpoint.focusObjectId = null;
    }
    if (viewpoint.selectedObjectId === selection.id) {
      viewpoint.selectedObjectId = null;
    }
  }

  for (const annotation of next.system?.annotations ?? []) {
    if (annotation.targetObjectId === selection.id) {
      annotation.targetObjectId = null;
    }
    if (annotation.sourceObjectId === selection.id) {
      annotation.sourceObjectId = null;
    }
  }

  for (const eventEntry of next.events) {
    if (eventEntry.targetObjectId === selection.id) {
      eventEntry.targetObjectId = null;
    }
    eventEntry.participantObjectIds = eventEntry.participantObjectIds.filter((entry) => entry !== selection.id);
    eventEntry.positions = eventEntry.positions.filter((entry) => entry.objectId !== selection.id);
    for (const pose of eventEntry.positions) {
      if (pose.placement?.mode === "orbit" && pose.placement.target === selection.id) {
        pose.placement = null;
      }
      if (pose.placement?.mode === "surface" && pose.placement.target === selection.id) {
        pose.placement = null;
      }
      if (pose.placement?.mode === "at") {
        const reference = pose.placement.reference;
        const touchesSelection =
          (reference.kind === "anchor" && reference.objectId === selection.id) ||
          (reference.kind === "lagrange" &&
            (reference.primary === selection.id || reference.secondary === selection.id));
        if (touchesSelection) {
          pose.placement = null;
        }
      }
    }
  }

  return next;
}

function findEditablePlacementOwner(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
  objectId: string,
): { placement: NonNullable<WorldOrbitObject["placement"]> | NonNullable<WorldOrbitEventPose["placement"]> } | null {
  if (path.kind === "event-pose" && path.id && path.key) {
    const pose = findEventPose(document, path.id, path.key);
    if (pose?.placement) {
      return { placement: pose.placement };
    }
    return null;
  }

  const object = findObject(document, objectId);
  if (object?.placement) {
    return { placement: object.placement };
  }
  return null;
}

function updateOrbitPhase(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
  objectId: string,
  details: ViewerObjectDetails,
  pointer: CoordinatePoint,
): WorldOrbitAtlasDocument {
  const orbit = details.orbit;
  if (!orbit || details.object.placement?.mode !== "orbit") {
    return document;
  }

  const unrotated = rotatePoint(pointer, { x: orbit.cx, y: orbit.cy }, -orbit.rotationDeg);
  const rx = orbit.kind === "circle" ? orbit.radius ?? 1 : orbit.rx ?? 1;
  const ry = orbit.kind === "circle" ? orbit.radius ?? 1 : orbit.ry ?? 1;
  const radians = Math.atan2(
    (unrotated.y - orbit.cy) / Math.max(ry, 1),
    (unrotated.x - orbit.cx) / Math.max(rx, 1),
  );
  const phaseDeg = normalizeDegrees((radians * 180) / Math.PI);
  const next = cloneAtlasDocument(document);
  const placementOwner = findEditablePlacementOwner(next, path, objectId);
  if (!placementOwner || placementOwner.placement.mode !== "orbit") {
    return document;
  }

  placementOwner.placement.phase = {
    value: roundNumber(phaseDeg, 2),
    unit: "deg",
  };
  return next;
}

function updateOrbitRadius(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
  objectId: string,
  details: ViewerObjectDetails,
  pointer: CoordinatePoint,
  dragContext: OrbitRadiusDragContext | null,
): WorldOrbitAtlasDocument {
  const orbit = details.orbit;
  if (!orbit || details.object.placement?.mode !== "orbit" || !dragContext) {
    return document;
  }

  const unrotated = rotatePoint(pointer, { x: orbit.cx, y: orbit.cy }, -orbit.rotationDeg);
  const nextDisplayedRadius = Math.max(Math.abs(unrotated.x - orbit.cx), 24);
  const nextBaseRadius = Math.max(
    nextDisplayedRadius - dragContext.radiusOffsetPx,
    dragContext.innerPx,
  );
  const nextMetric = orbitRadiusPxToMetric(
    nextBaseRadius,
    dragContext.innerPx,
    dragContext.stepPx,
  );
  const next = cloneAtlasDocument(document);
  const placementOwner = findEditablePlacementOwner(next, path, objectId);
  if (!placementOwner || placementOwner.placement.mode !== "orbit") {
    return document;
  }

  const currentValue =
    placementOwner.placement.semiMajor ??
    placementOwner.placement.distance ?? {
      value: 1,
      unit: "au" as const,
    };
  const scaled = distanceMetricToUnitValue(
    Math.max(nextMetric, 0),
    dragContext.preferredUnit ?? currentValue.unit,
  );
  if (placementOwner.placement.semiMajor) {
    placementOwner.placement.semiMajor = scaled;
  } else {
    placementOwner.placement.distance = scaled;
  }
  return next;
}

function updateAtReference(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
  objectId: string,
  scene: RenderScene,
  pointer: CoordinatePoint,
): WorldOrbitAtlasDocument {
  const candidate = findNearestAtCandidate(scene, objectId, pointer);
  if (!candidate) {
    return document;
  }

  const next = cloneAtlasDocument(document);
  const placementOwner = findEditablePlacementOwner(next, path, objectId);
  if (!placementOwner || placementOwner.placement.mode !== "at") {
    return document;
  }

  placementOwner.placement.reference = candidate.reference;
  placementOwner.placement.target = formatAtReference(candidate.reference);
  return next;
}

function updateSurfaceTarget(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
  objectId: string,
  scene: RenderScene,
  pointer: CoordinatePoint,
): WorldOrbitAtlasDocument {
  const target = findNearestSceneObject(scene, objectId, pointer, (entry) =>
    SURFACE_TARGET_TYPES.has(entry.object.type),
  );
  if (!target) {
    return document;
  }

  const next = cloneAtlasDocument(document);
  const placementOwner = findEditablePlacementOwner(next, path, objectId);
  if (!placementOwner || placementOwner.placement.mode !== "surface") {
    return document;
  }

  placementOwner.placement.target = target.objectId;
  return next;
}

function createOrbitRadiusDragContext(
  document: WorldOrbitAtlasDocument,
  scene: RenderScene,
  details: ViewerObjectDetails,
): OrbitRadiusDragContext | null {
  if (details.object.placement?.mode !== "orbit" || !details.orbit || !details.parent) {
    return null;
  }

  const targetId = details.object.placement.target;
  const siblingCount = scene.objects.filter(
    (entry) =>
      entry.object.placement?.mode === "orbit" &&
      entry.object.placement.target === targetId &&
      !entry.hidden,
  ).length;
  const spacingFactor = layoutPresetSpacingForScene(scene.layoutPreset);
  const stepPx =
    (siblingCount > 2 ? 54 : 64) * spacingFactor * scene.scaleModel.orbitDistanceMultiplier;
  const innerPx =
    details.parent.radius +
    56 * spacingFactor * scene.scaleModel.orbitDistanceMultiplier;
  const currentValue = details.object.placement.semiMajor ?? details.object.placement.distance ?? null;
  const currentMetric = unitValueToDistanceMetric(currentValue);
  const displayedRadius =
    details.orbit.kind === "circle" ? details.orbit.radius ?? 1 : details.orbit.rx ?? 1;
  const baseRadius = orbitMetricToRadiusPx(
    currentMetric ?? 0,
    innerPx,
    stepPx,
  );

  return {
    innerPx,
    stepPx,
    radiusOffsetPx: displayedRadius - baseRadius,
    preferredUnit: currentValue?.unit ?? null,
  };
}

function updateFreeDistance(
  document: WorldOrbitAtlasDocument,
  path: AtlasDocumentPath,
  objectId: string,
  scene: RenderScene,
  details: ViewerObjectDetails,
  pointer: CoordinatePoint,
): WorldOrbitAtlasDocument {
  if (details.object.placement?.mode !== "free") {
    return document;
  }

  const railX = scene.width - scene.padding - 140;
  const offsetPx = Math.max(0, railX - pointer.x);
  const next = cloneAtlasDocument(document);
  const placementOwner = findEditablePlacementOwner(next, path, objectId);
  if (!placementOwner || placementOwner.placement.mode !== "free") {
    return document;
  }

  const preferredUnit = normalizeFreeDistanceUnit(placementOwner.placement.distance?.unit ?? null);
  const metric = offsetPx / Math.max(FREE_DISTANCE_PIXEL_FACTOR * scene.scaleModel.freePlacementMultiplier, 1);
  if (metric < 0.01) {
    placementOwner.placement.distance = undefined;
    if (!placementOwner.placement.descriptor) {
      delete placementOwner.placement.descriptor;
    }
    return next;
  }

  placementOwner.placement.distance = distanceMetricToUnitValue(metric, preferredUnit);
  delete placementOwner.placement.descriptor;
  return next;
}

function findNearestSceneObject(
  scene: RenderScene,
  selectedObjectId: string,
  pointer: CoordinatePoint,
  predicate: (entry: RenderScene["objects"][number]) => boolean = () => true,
): RenderScene["objects"][number] | null {
  let nearest: RenderScene["objects"][number] | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const entry of scene.objects) {
    if (entry.hidden || entry.objectId === selectedObjectId || !predicate(entry)) {
      continue;
    }

    const distance = Math.hypot(pointer.x - entry.x, pointer.y - entry.y);
    if (distance < nearestDistance) {
      nearest = entry;
      nearestDistance = distance;
    }
  }

  return nearestDistance <= 140 ? nearest : null;
}

function findNearestAtCandidate(
  scene: RenderScene,
  selectedObjectId: string,
  pointer: CoordinatePoint,
): {
  reference: ReturnType<typeof parseAtReferenceString>;
  x: number;
  y: number;
} | null {
  let directObjectCandidate: {
    reference: ReturnType<typeof parseAtReferenceString>;
    x: number;
    y: number;
    distance: number;
  } | null = null;

  for (const entry of scene.objects) {
    if (entry.hidden || entry.objectId === selectedObjectId) {
      continue;
    }

    const distance = Math.hypot(pointer.x - entry.x, pointer.y - entry.y);
    const snapRadius = Math.max(entry.visualRadius + 16, 28);
    if (distance <= snapRadius) {
      if (!directObjectCandidate || distance < directObjectCandidate.distance) {
        directObjectCandidate = {
          reference: parseAtReferenceString(entry.objectId),
          x: entry.x,
          y: entry.y,
          distance,
        };
      }
    }
  }

  if (directObjectCandidate) {
    return {
      reference: directObjectCandidate.reference,
      x: directObjectCandidate.x,
      y: directObjectCandidate.y,
    };
  }

  const candidates: Array<{
    reference: ReturnType<typeof parseAtReferenceString>;
    x: number;
    y: number;
  }> = [];

  for (const entry of scene.objects) {
    if (entry.hidden || entry.objectId === selectedObjectId) {
      continue;
    }

    candidates.push({
      reference: parseAtReferenceString(entry.objectId),
      x: entry.x,
      y: entry.y,
    });
  }

  for (const orbit of scene.orbitVisuals) {
    if (orbit.hidden || orbit.objectId === selectedObjectId) {
      continue;
    }

    const parent = scene.objects.find((entry) => entry.objectId === orbit.parentId && !entry.hidden);
    const secondary = scene.objects.find((entry) => entry.objectId === orbit.objectId && !entry.hidden);
    if (!parent || !secondary) {
      continue;
    }

    for (const point of ["L1", "L2", "L3", "L4", "L5"] as const) {
      const position = computeLagrangeCandidatePosition(parent, secondary, point);
      candidates.push({
        reference: parseAtReferenceString(`${orbit.objectId}:${point}`),
        x: position.x,
        y: position.y,
      });
    }
  }

  let nearest: (typeof candidates)[number] | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const distance = Math.hypot(pointer.x - candidate.x, pointer.y - candidate.y);
    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }

  return nearestDistance <= 140 ? nearest : null;
}

function computeLagrangeCandidatePosition(
  primary: RenderScene["objects"][number],
  secondary: RenderScene["objects"][number],
  point: "L1" | "L2" | "L3" | "L4" | "L5",
): CoordinatePoint {
  const dx = secondary.x - primary.x;
  const dy = secondary.y - primary.y;
  const distance = Math.hypot(dx, dy) || 1;
  const ux = dx / distance;
  const uy = dy / distance;
  const nx = -uy;
  const ny = ux;
  const offset = clampNumber(distance * 0.25, 24, 68);

  switch (point) {
    case "L1":
      return {
        x: secondary.x - ux * offset,
        y: secondary.y - uy * offset,
      };
    case "L2":
      return {
        x: secondary.x + ux * offset,
        y: secondary.y + uy * offset,
      };
    case "L3":
      return {
        x: primary.x - ux * offset,
        y: primary.y - uy * offset,
      };
    case "L4":
      return {
        x: secondary.x + (ux * 0.5 - nx * 0.8660254) * offset,
        y: secondary.y + (uy * 0.5 - ny * 0.8660254) * offset,
      };
    case "L5":
      return {
        x: secondary.x + (ux * 0.5 + nx * 0.8660254) * offset,
        y: secondary.y + (uy * 0.5 + ny * 0.8660254) * offset,
      };
  }
}

function parseAtReferenceString(target: string) {
  const pairedMatch = target.match(/^([A-Za-z0-9._-]+)-([A-Za-z0-9._-]+):(L[1-5])$/);
  if (pairedMatch) {
    return {
      kind: "lagrange" as const,
      primary: pairedMatch[1],
      secondary: pairedMatch[2],
      point: pairedMatch[3] as "L1" | "L2" | "L3" | "L4" | "L5",
    };
  }

  const simpleMatch = target.match(/^([A-Za-z0-9._-]+):(L[1-5])$/);
  if (simpleMatch) {
    return {
      kind: "lagrange" as const,
      primary: simpleMatch[1],
      secondary: null,
      point: simpleMatch[2] as "L1" | "L2" | "L3" | "L4" | "L5",
    };
  }

  const anchorMatch = target.match(/^([A-Za-z0-9._-]+):([A-Za-z0-9._-]+)$/);
  if (anchorMatch) {
    return {
      kind: "anchor" as const,
      objectId: anchorMatch[1],
      anchor: anchorMatch[2],
    };
  }

  return {
    kind: "named" as const,
    name: target,
  };
}

function formatAtReference(
  reference: ReturnType<typeof parseAtReferenceString>,
): string {
  switch (reference.kind) {
    case "lagrange":
      return reference.secondary
        ? `${reference.primary}-${reference.secondary}:${reference.point}`
        : `${reference.primary}:${reference.point}`;
    case "anchor":
      return `${reference.objectId}:${reference.anchor}`;
    case "named":
      return reference.name;
  }
}

function collectDocumentDiagnostics(
  document: WorldOrbitAtlasDocument,
): AtlasResolvedDiagnostic[] {
  return validateAtlasDocumentWithDiagnostics(document);
}

function mergeDiagnostics(
  primary: AtlasResolvedDiagnostic[],
  secondary: AtlasResolvedDiagnostic[],
): AtlasResolvedDiagnostic[] {
  const seen = new Set<string>();
  const merged: AtlasResolvedDiagnostic[] = [];

  for (const entry of [...primary, ...secondary]) {
    const key = `${entry.diagnostic.code}:${entry.diagnostic.message}:${selectionKey(entry.path)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(cloneResolvedDiagnostic(entry));
  }

  return merged;
}

function buildDiagnosticBuckets(
  entries: AtlasResolvedDiagnostic[],
): Map<string, DiagnosticBucket> {
  const buckets = new Map<string, DiagnosticBucket>();

  for (const entry of entries) {
    const key =
      selectionKey(entry.path) ??
      (entry.diagnostic.objectId ? selectionKey({ kind: "object", id: entry.diagnostic.objectId }) : null);
    if (!key) {
      continue;
    }

    const bucket = buckets.get(key) ?? { errors: 0, warnings: 0 };
    if (entry.diagnostic.severity === "error") {
      bucket.errors += 1;
    } else if (entry.diagnostic.severity === "warning") {
      bucket.warnings += 1;
    }
    buckets.set(key, bucket);
  }

  return buckets;
}

function formatDiagnosticLocation(entry: AtlasResolvedDiagnostic): string | null {
  if (entry.diagnostic.line !== undefined && entry.diagnostic.column !== undefined) {
    return `Line ${entry.diagnostic.line}:${entry.diagnostic.column}`;
  }

  if (entry.diagnostic.line !== undefined) {
    return `Line ${entry.diagnostic.line}`;
  }

  return null;
}

function mapDiagnosticFieldToInputNames(
  selection: AtlasDocumentPath,
  field: string | undefined,
): string[] {
  if (!field) {
    return [];
  }

  switch (selection.kind) {
    case "system":
      if (field === "id") {
        return ["system-id"];
      }
      if (field === "title") {
        return ["system-title"];
      }
      return [];
    case "defaults":
      switch (field) {
        case "view":
          return ["defaults-view"];
        case "scale":
          return ["defaults-scale"];
        case "units":
          return ["defaults-units"];
        case "preset":
          return ["defaults-preset"];
        case "theme":
          return ["defaults-theme"];
        default:
          return [];
      }
    case "metadata":
      return field === "key" ? ["metadata-key"] : ["metadata-value"];
    case "group":
      switch (field) {
        case "id":
          return ["group-id"];
        case "label":
          return ["group-label"];
        case "summary":
          return ["group-summary"];
        case "color":
          return ["group-color"];
        case "tags":
          return ["group-tags"];
        case "hidden":
          return ["group-hidden"];
        default:
          return [];
      }
    case "viewpoint":
      switch (field) {
        case "id":
          return ["viewpoint-id"];
        case "label":
          return ["viewpoint-label"];
        case "summary":
          return ["viewpoint-summary"];
        case "focusObjectId":
          return ["viewpoint-focus"];
        case "selectedObjectId":
          return ["viewpoint-select"];
        case "projection":
          return ["viewpoint-projection"];
        case "preset":
          return ["viewpoint-preset"];
        case "zoom":
          return ["viewpoint-zoom"];
        case "rotationDeg":
          return ["viewpoint-rotation"];
        case "camera":
          return [
            "viewpoint-camera-azimuth",
            "viewpoint-camera-elevation",
            "viewpoint-camera-roll",
            "viewpoint-camera-distance",
          ];
        case "camera.azimuth":
          return ["viewpoint-camera-azimuth"];
        case "camera.elevation":
          return ["viewpoint-camera-elevation"];
        case "camera.roll":
          return ["viewpoint-camera-roll"];
        case "camera.distance":
          return ["viewpoint-camera-distance"];
        case "events":
          return ["viewpoint-events"];
        default:
          return [];
      }
    case "event":
      switch (field) {
        case "id":
          return ["event-id"];
        case "kind":
          return ["event-kind"];
        case "label":
          return ["event-label"];
        case "summary":
          return ["event-summary"];
        case "targetObjectId":
        case "target":
          return ["event-target"];
        case "participantObjectIds":
        case "participants":
          return ["event-participants"];
        case "timing":
          return ["event-timing"];
        case "visibility":
          return ["event-visibility"];
        case "epoch":
          return ["event-epoch"];
        case "referencePlane":
          return ["event-referencePlane"];
        case "tags":
          return ["event-tags"];
        case "color":
          return ["event-color"];
        case "hidden":
          return ["event-hidden"];
        default:
          return [];
      }
    case "event-pose":
      if (field === "objectId") {
        return ["pose-object-id"];
      }
      if (field === "placement") {
        return ["placement-mode"];
      }
      if (field === "reference" || field === "target") {
        return ["placement-target"];
      }
      if (field === "descriptor") {
        return ["placement-free"];
      }
      if (PLACEMENT_DIAGNOSTIC_FIELDS.has(field)) {
        return [`placement-${field}`];
      }
      if (field === "inner" || field === "outer") {
        return [`prop-${field}`];
      }
      if (field === "epoch") {
        return ["pose-epoch"];
      }
      if (field === "referencePlane") {
        return ["pose-referencePlane"];
      }
      return [];
    case "annotation":
      switch (field) {
        case "id":
          return ["annotation-id"];
        case "label":
          return ["annotation-label"];
        case "targetObjectId":
          return ["annotation-target"];
        case "sourceObjectId":
          return ["annotation-source"];
        case "body":
          return ["annotation-body"];
        case "tags":
          return ["annotation-tags"];
        default:
          return [];
      }
    case "relation":
      switch (field) {
        case "id":
          return ["relation-id"];
        case "from":
          return ["relation-from"];
        case "to":
          return ["relation-to"];
        case "kind":
          return ["relation-kind"];
        case "label":
          return ["relation-label"];
        case "summary":
          return ["relation-summary"];
        case "tags":
          return ["relation-tags"];
        case "color":
          return ["relation-color"];
        case "hidden":
          return ["relation-hidden"];
        default:
          return [];
      }
    case "object":
      if (field === "id") {
        return ["object-id"];
      }
      if (field === "type") {
        return ["object-type"];
      }
      if (field === "placement") {
        return ["placement-mode"];
      }
      if (field === "description") {
        return ["info-description"];
      }
      if (field === "reference") {
        return ["placement-target"];
      }
      if (field === "descriptor") {
        return ["placement-free"];
      }
      if (field === "target") {
        return ["placement-target"];
      }
      if (PLACEMENT_DIAGNOSTIC_FIELDS.has(field)) {
        return [`placement-${field}`];
      }
      return [`prop-${field}`];
  }
}

function buildEmbedMarkup(
  source: string,
  document: WorldOrbitAtlasDocument,
): string {
  return renderWorldOrbitBlock(source, {
    mode: "interactive",
    preset: document.system?.defaults.preset ?? "atlas-card",
    projection: document.system?.defaults.view ?? "topdown",
  });
}

function describePath(path: AtlasDocumentPath): string {
  switch (path.kind) {
    case "system":
      return "System";
    case "defaults":
      return "Defaults";
    case "metadata":
      return `Metadata: ${path.key ?? ""}`;
    case "group":
      return `Group: ${path.id ?? ""}`;
    case "event":
      return `Event: ${path.id ?? ""}`;
    case "event-pose":
      return `Event Pose: ${path.id ?? ""} / ${path.key ?? ""}`;
    case "object":
      return `Object: ${path.id ?? ""}`;
    case "viewpoint":
      return `Viewpoint: ${path.id ?? ""}`;
    case "annotation":
      return `Annotation: ${path.id ?? ""}`;
    case "relation":
      return `Relation: ${path.id ?? ""}`;
  }
}

function selectionKey(path: AtlasDocumentPath | null): string | null {
  return path ? `${path.kind}:${path.id ?? ""}:${path.key ?? ""}` : null;
}

function selectionEventId(path: AtlasDocumentPath | null): string | null {
  if (!path) {
    return null;
  }

  return path.kind === "event" || path.kind === "event-pose" ? path.id ?? null : null;
}

function compareObjects(left: WorldOrbitObject, right: WorldOrbitObject): number {
  return left.id.localeCompare(right.id);
}

function compareEvents(left: WorldOrbitEvent, right: WorldOrbitEvent): number {
  return left.id.localeCompare(right.id);
}

function compareEventPoses(left: WorldOrbitEventPose, right: WorldOrbitEventPose): number {
  return left.objectId.localeCompare(right.objectId);
}

function findEvent(
  document: WorldOrbitAtlasDocument,
  eventId: string,
): WorldOrbitEvent | null {
  return document.events.find((entry) => entry.id === eventId) ?? null;
}

function findEventPose(
  document: WorldOrbitAtlasDocument,
  eventId: string,
  objectId: string,
): WorldOrbitEventPose | null {
  return findEvent(document, eventId)?.positions.find((entry) => entry.objectId === objectId) ?? null;
}

function findObject(document: WorldOrbitAtlasDocument, objectId: string): WorldOrbitObject | null {
  return document.objects.find((entry) => entry.id === objectId) ?? null;
}

function addEventPose(
  document: WorldOrbitAtlasDocument,
  eventId: string,
): WorldOrbitAtlasDocument {
  const next = cloneAtlasDocument(document);
  const eventEntry = next.events.find((entry) => entry.id === eventId);
  if (!eventEntry) {
    return document;
  }

  const baseObject =
    next.objects.find((object) => !eventEntry.positions.some((pose) => pose.objectId === object.id)) ??
    next.objects[0];
  if (!baseObject) {
    return document;
  }

  if (
    eventEntry.targetObjectId !== baseObject.id &&
    !eventEntry.participantObjectIds.includes(baseObject.id)
  ) {
    eventEntry.participantObjectIds.push(baseObject.id);
    eventEntry.participantObjectIds.sort((left, right) => left.localeCompare(right));
  }
  eventEntry.positions.push(createEventPoseFromObject(baseObject));
  eventEntry.positions.sort(compareEventPoses);
  return next;
}

function createEventPoseFromObject(object: WorldOrbitObject): WorldOrbitEventPose {
  return {
    objectId: object.id,
    placement: object.placement ? structuredClone(object.placement) : null,
    inner: readUnitValue(object.properties.inner),
    outer: readUnitValue(object.properties.outer),
  };
}

function syncEventViewpointReferences(
  document: WorldOrbitAtlasDocument,
  previousEventId: string,
  nextEventId: string,
  viewpointIds: string[],
): void {
  const desired = new Set(viewpointIds);
  for (const viewpoint of document.system?.viewpoints ?? []) {
    const currentIds = new Set(viewpoint.events);
    currentIds.delete(previousEventId);
    currentIds.delete(nextEventId);
    if (desired.has(viewpoint.id)) {
      currentIds.add(nextEventId);
    }
    viewpoint.events = [...currentIds].sort((left, right) => left.localeCompare(right));
  }
}

function createUniqueId(prefix: string, existing: string[]): string {
  const safePrefix = prefix.trim() || "item";
  let counter = 1;
  let candidate = safePrefix;

  while (existing.includes(candidate)) {
    counter += 1;
    candidate = `${safePrefix}-${counter}`;
  }

  return candidate;
}

function humanizeIdentifier(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(" ");
}

function cloneResolvedDiagnostic(
  diagnostic: AtlasResolvedDiagnostic,
): AtlasResolvedDiagnostic {
  return {
    diagnostic: { ...diagnostic.diagnostic },
    path: diagnostic.path ? { ...diagnostic.path } : null,
  };
}

function readStringProperty(value: NormalizedValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function readTagsProperty(value: NormalizedValue | undefined): string {
  return Array.isArray(value) ? value.join(" ") : "";
}

function readUnitProperty(value: NormalizedValue | undefined): string {
  return value && typeof value === "object" && "value" in value
    ? formatUnitValue(value)
    : "";
}

function readUnitValue(value: NormalizedValue | undefined): UnitValue | undefined {
  return value && typeof value === "object" && "value" in value ? value : undefined;
}

function readNumberProperty(value: NormalizedValue | undefined): string {
  return typeof value === "number" ? String(value) : "";
}

function formatUnitValue(value: UnitValue): string {
  return `${value.value}${value.unit ?? ""}`;
}

function roundNumber(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeDegrees(value: number): number {
  let normalized = value % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

function normalizeFreeDistanceUnit(unit: UnitValue["unit"]): UnitValue["unit"] {
  switch (unit) {
    case "au":
    case "km":
    case "re":
    case "sol":
    case null:
      return unit;
    default:
      return null;
  }
}

function unitValueToDistanceMetric(value: UnitValue | null): number | null {
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

function distanceMetricToUnitValue(metric: number, unit: UnitValue["unit"]): UnitValue {
  switch (unit) {
    case "km":
      return { value: roundNumber(metric * AU_IN_KM, 0), unit };
    case "re":
      return { value: roundNumber((metric * AU_IN_KM) / EARTH_RADIUS_IN_KM, 3), unit };
    case "sol":
      return { value: roundNumber((metric * AU_IN_KM) / SOLAR_RADIUS_IN_KM, 4), unit };
    case "au":
      return { value: roundNumber(metric, 3), unit };
    default:
      return { value: roundNumber(metric, 2), unit: null };
  }
}

function orbitMetricToRadiusPx(metric: number, innerPx: number, stepPx: number): number {
  return innerPx + stepPx * log2(Math.max(metric, 0) + 1);
}

function orbitRadiusPxToMetric(radiusPx: number, innerPx: number, stepPx: number): number {
  if (radiusPx <= innerPx) {
    return 0;
  }

  return Math.pow(2, (radiusPx - innerPx) / Math.max(stepPx, 0.0001)) - 1;
}

function layoutPresetSpacingForScene(layoutPreset: RenderScene["layoutPreset"]): number {
  switch (layoutPreset) {
    case "compact":
      return 0.84;
    case "presentation":
      return 1.2;
    default:
      return 1;
  }
}

function log2(value: number): number {
  return Math.log(value) / Math.log(2);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function ensureBrowserEnvironment(container: HTMLElement): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("createWorldOrbitEditor can only run in a browser environment.");
  }

  if (!(container instanceof HTMLElement)) {
    throw new Error("WorldOrbit editor requires an HTMLElement container.");
  }
}

function queryRequired<T extends Element>(container: ParentNode, selector: string): T {
  const found = container.querySelector<T>(selector);
  if (!found) {
    throw new Error(`WorldOrbit editor failed to initialize selector "${selector}".`);
  }
  return found;
}

function installEditorStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .wo-editor {
      --wo-editor-sidebar-width: 280px;
      --wo-editor-inspector-width: 360px;
      --wo-editor-source-height: 280px;
    }
    .wo-editor-shell { display: grid; gap: 16px; min-width: 0; }
    .wo-editor-toolbar { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; min-width: 0; }
    .wo-editor-toolbar-group { display: flex; gap: 10px; flex-wrap: wrap; min-width: 0; }
    .wo-editor-toolbar button, .wo-editor-toolbar select {
      border: 1px solid rgba(240, 180, 100, 0.2);
      border-radius: 999px;
      background: rgba(240, 180, 100, 0.08);
      color: #edf6ff;
      font: 600 13px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif;
      padding: 10px 14px;
    }
    .wo-editor button:focus-visible,
    .wo-editor select:focus-visible,
    .wo-editor input:focus-visible,
    .wo-editor textarea:focus-visible {
      outline: 2px solid rgba(255, 214, 138, 0.95);
      outline-offset: 2px;
    }
    .wo-editor-toolbar button:disabled { opacity: 0.45; cursor: not-allowed; }
    .wo-editor-status {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      min-width: 0;
    }
    .wo-editor-status-pill {
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 999px;
      background: rgba(255,255,255,0.04);
      color: #edf6ff;
      font: 600 12px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif;
      padding: 8px 12px;
    }
    .wo-editor-status-pill.is-clean { border-color: rgba(120, 255, 195, 0.22); color: #c7ffe5; }
    .wo-editor-status-pill.is-dirty { border-color: rgba(240, 180, 100, 0.28); color: #ffd58a; }
    .wo-editor-status-pill.is-warning { border-color: rgba(240, 180, 100, 0.28); color: #ffd58a; }
    .wo-editor-status-pill.is-error { border-color: rgba(255, 120, 120, 0.3); color: #ffb2b2; }
    .wo-editor-main {
      display: grid;
      grid-template-columns:
        minmax(220px, var(--wo-editor-sidebar-width))
        minmax(0, 1fr)
        minmax(280px, var(--wo-editor-inspector-width));
      gap: 16px;
      min-width: 0;
      align-items: start;
    }
    .wo-editor-sidebar, .wo-editor-stage-panel, .wo-editor-preview { display: grid; gap: 16px; min-width: 0; }
    .wo-editor-panel {
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(7, 16, 25, 0.72);
      padding: 18px;
      min-width: 0;
    }
    .wo-editor-panel h2 {
      margin: 0 0 14px;
      color: #edf6ff;
      font: 700 14px/1.2 "Segoe UI Variable Display", "Segoe UI", sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .wo-editor-panel h3 {
      margin: 0 0 12px;
      color: rgba(237, 246, 255, 0.82);
      font: 700 12px/1.2 "Segoe UI Variable", "Segoe UI", sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .wo-editor-panel-section,
    .wo-editor-inspector-section {
      min-width: 0;
    }
    .wo-editor-panel-section > summary,
    .wo-editor-inspector-section > summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      cursor: pointer;
      list-style: none;
      color: #edf6ff;
      font: 700 14px/1.2 "Segoe UI Variable Display", "Segoe UI", sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .wo-editor-inspector-section > summary {
      font: 700 12px/1.2 "Segoe UI Variable", "Segoe UI", sans-serif;
      color: rgba(237, 246, 255, 0.9);
    }
    .wo-editor-panel-section > summary::-webkit-details-marker,
    .wo-editor-inspector-section > summary::-webkit-details-marker,
    .wo-editor-field-help > summary::-webkit-details-marker {
      display: none;
    }
    .wo-editor-panel-section > summary::after,
    .wo-editor-inspector-section > summary::after {
      content: "▾";
      color: rgba(240, 180, 100, 0.86);
      font-size: 12px;
      transition: transform 0.18s ease;
    }
    .wo-editor-panel-section:not([open]) > summary::after,
    .wo-editor-inspector-section:not([open]) > summary::after {
      transform: rotate(-90deg);
    }
    .wo-editor-panel-section-body {
      display: grid;
      gap: 16px;
      margin-top: 14px;
      min-width: 0;
    }
    .wo-editor-inspector-section-body {
      display: grid;
      gap: 12px;
      margin-top: 12px;
      min-width: 0;
    }
    .wo-editor[data-wo-show-inspector="false"] [data-editor-pane="inspector"] { display: none; }
    .wo-editor[data-wo-show-text-pane="false"] [data-editor-pane="text"] { display: none; }
    .wo-editor[data-wo-show-preview="false"] [data-editor-pane="preview"] { display: none; }
    .wo-editor-stage-shell {
      position: relative;
      min-width: 0;
      border-radius: 26px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(8, 17, 28, 0.9);
    }
    .wo-editor-stage { min-height: 620px; min-width: 0; }
    .wo-editor-overlay { position: absolute; inset: 0; pointer-events: none; }
    .wo-editor-overlay > * { pointer-events: auto; }
    .wo-editor-handle {
      position: absolute;
      transform: translate(-50%, -50%);
      border: 0;
      border-radius: 999px;
      background: rgba(255, 214, 138, 0.92);
      color: #071019;
      cursor: grab;
      font: 700 11px/1 "Segoe UI Variable", "Segoe UI", sans-serif;
      padding: 8px 10px;
      box-shadow: 0 10px 24px rgba(0,0,0,0.24);
    }
    .wo-editor-hint {
      position: absolute;
      transform: translate(-50%, -50%);
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(18, 39, 58, 0.84);
      color: #edf6ff;
      font: 600 11px/1.3 "Segoe UI Variable", "Segoe UI", sans-serif;
      white-space: nowrap;
      box-shadow: 0 6px 18px rgba(0,0,0,0.22);
    }
    .wo-editor-hint.is-subtle { background: rgba(18, 39, 58, 0.64); color: rgba(237, 246, 255, 0.78); }
    .wo-editor-hint-note { left: 16px; top: 16px; transform: none; }
    .wo-editor-overlay-diagnostics {
      position: absolute;
      right: 16px;
      top: 16px;
      display: grid;
      gap: 8px;
      max-width: min(320px, calc(100% - 32px));
    }
    .wo-editor-overlay-diagnostic {
      border-radius: 14px;
      padding: 10px 12px;
      background: rgba(10, 20, 32, 0.92);
      box-shadow: 0 12px 30px rgba(0,0,0,0.28);
    }
    .wo-editor-overlay-diagnostic strong {
      display: block;
      margin-bottom: 4px;
      font: 700 11px/1.2 "Segoe UI Variable", "Segoe UI", sans-serif;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .wo-editor-overlay-diagnostic p {
      margin: 0;
      color: #edf6ff;
      font: 500 12px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
    .wo-editor-overlay-diagnostic-error { border: 1px solid rgba(255, 120, 120, 0.28); }
    .wo-editor-overlay-diagnostic-warning { border: 1px solid rgba(240, 180, 100, 0.24); }
    .wo-editor-outline { display: grid; gap: 14px; }
    .wo-editor-outline-section { display: grid; gap: 8px; }
    .wo-editor-outline-group { display: grid; gap: 6px; }
    .wo-editor-outline-children {
      display: grid;
      gap: 6px;
      padding-left: 16px;
    }
    .wo-editor-outline-section h3 {
      margin: 0;
      color: rgba(237,246,255,0.68);
      font: 600 11px/1.2 "Segoe UI Variable", "Segoe UI", sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .wo-editor-outline-item {
      border: 1px solid transparent;
      border-radius: 16px;
      background: rgba(255,255,255,0.04);
      color: #edf6ff;
      cursor: pointer;
      font: 500 13px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif;
      padding: 10px 12px;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .wo-editor-outline-item.is-active {
      border-color: rgba(255, 214, 138, 0.34);
      background: rgba(255, 214, 138, 0.12);
      color: #ffdda9;
    }
    .wo-editor-outline-badge {
      min-width: 22px;
      border-radius: 999px;
      background: rgba(240, 180, 100, 0.16);
      color: #ffd58a;
      font: 700 11px/1 "Segoe UI Variable", "Segoe UI", sans-serif;
      padding: 5px 7px;
      text-align: center;
    }
    .wo-editor-outline-badge.is-error {
      background: rgba(255, 120, 120, 0.18);
      color: #ffb2b2;
    }
    .wo-editor-inline-list { display: grid; gap: 8px; }
    .wo-editor-inline-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 12px;
    }
    .wo-editor-inline-actions button {
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      color: #edf6ff;
      cursor: pointer;
      font: 600 12px/1.2 "Segoe UI Variable", "Segoe UI", sans-serif;
      padding: 8px 12px;
    }
    .wo-editor-inline-note {
      margin: 0 0 12px;
      color: rgba(237,246,255,0.72);
      font: 500 12px/1.5 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
    .wo-editor-diagnostics { display: grid; gap: 10px; }
    .wo-editor-diagnostic {
      display: grid;
      gap: 4px;
      border-radius: 16px;
      padding: 12px;
      background: rgba(255,255,255,0.04);
      color: #edf6ff;
      font: 500 12px/1.45 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
    .wo-editor-diagnostic strong { font-size: 11px; letter-spacing: 0.08em; }
    .wo-editor-diagnostic p { margin: 0; color: rgba(237,246,255,0.82); }
    .wo-editor-diagnostic-warning { border: 1px solid rgba(240, 180, 100, 0.22); }
    .wo-editor-diagnostic-error { border: 1px solid rgba(255, 120, 120, 0.24); }
    .wo-editor-inspector-summary {
      display: grid;
      gap: 10px;
      margin-bottom: 14px;
    }
    .wo-editor-form { display: grid; gap: 12px; min-width: 0; }
    .wo-editor-inspector-section {
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 14px;
      background: rgba(255,255,255,0.02);
    }
    .wo-editor-field { display: grid; gap: 6px; }
    .wo-editor-field-label,
    .wo-editor-fieldset legend {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .wo-editor-field-label,
    .wo-editor-checkbox .wo-editor-field-label,
    .wo-editor-fieldset legend {
      color: rgba(237,246,255,0.72);
      font: 600 11px/1.2 "Segoe UI Variable", "Segoe UI", sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .wo-editor-field input, .wo-editor-field select, .wo-editor-field textarea, .wo-editor-source {
      width: 100%;
      min-width: 0;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      background: rgba(12, 26, 39, 0.84);
      color: #edf6ff;
      font: 500 13px/1.5 "Segoe UI Variable", "Segoe UI", sans-serif;
      padding: 10px 12px;
      box-sizing: border-box;
    }
    .wo-editor-field.has-error input,
    .wo-editor-field.has-error select,
    .wo-editor-field.has-error textarea,
    .wo-editor-checkbox.has-error {
      border-color: rgba(255, 120, 120, 0.44);
    }
    .wo-editor-field.has-warning input,
    .wo-editor-field.has-warning select,
    .wo-editor-field.has-warning textarea,
    .wo-editor-checkbox.has-warning {
      border-color: rgba(240, 180, 100, 0.42);
    }
    .wo-editor-field textarea, .wo-editor-source { min-height: 110px; resize: vertical; }
    .wo-editor-source {
      min-height: var(--wo-editor-source-height);
      font-family: "Cascadia Code", "Consolas", monospace;
      white-space: pre;
      overflow: auto;
    }
    .wo-editor-field-note {
      color: rgba(237,246,255,0.72);
      font: 500 12px/1.45 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
    .wo-editor-field-note.is-error { color: #ffb2b2; }
    .wo-editor-field-note.is-warning { color: #ffd58a; }
    .wo-editor-fieldset {
      display: grid;
      gap: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 14px;
      min-width: 0;
    }
    .wo-editor-checkbox {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      color: #edf6ff;
      font: 500 13px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
    .wo-editor-checkbox input {
      margin-top: 2px;
    }
    .wo-editor-field-help {
      position: relative;
      flex: 0 0 auto;
    }
    .wo-editor-field-help > summary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      border: 1px solid rgba(240, 180, 100, 0.28);
      background: rgba(240, 180, 100, 0.12);
      color: #ffdda9;
      cursor: pointer;
      font: 700 11px/1 "Segoe UI Variable", "Segoe UI", sans-serif;
      list-style: none;
    }
    .wo-editor-field-help-card {
      display: grid;
      gap: 8px;
      margin-top: 8px;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid rgba(240, 180, 100, 0.2);
      background: rgba(12, 26, 39, 0.92);
      color: rgba(237, 246, 255, 0.86);
      text-transform: none;
      letter-spacing: normal;
      font: 500 12px/1.45 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
    .wo-editor-field-help-card p {
      margin: 0;
    }
    .wo-editor-field-help-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .wo-editor-field-help-chips span {
      border-radius: 999px;
      padding: 4px 8px;
      background: rgba(255,255,255,0.06);
      color: #edf6ff;
      font: 600 11px/1.3 "Segoe UI Variable", "Segoe UI", sans-serif;
      text-transform: none;
      letter-spacing: normal;
    }
    .wo-editor-preview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .wo-editor-preview-card {
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      padding: 14px;
      min-width: 0;
    }
    .wo-editor-preview-visual {
      min-height: 240px;
      overflow: auto;
    }
    .wo-editor-preview-markup {
      margin: 0;
      min-height: 240px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      color: #edf6ff;
      font: 12px/1.5 "Cascadia Code", "Consolas", monospace;
    }
    .wo-editor-source-diagnostics {
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }
    .wo-editor-empty {
      margin: 0;
      color: rgba(237,246,255,0.68);
      font: 500 12px/1.5 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
    .wo-editor-live-region {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    @media (max-width: 1280px) {
      .wo-editor-main { grid-template-columns: minmax(220px, 260px) minmax(0, 1fr); }
      .wo-editor-inspector { grid-column: 1 / -1; }
      .wo-editor-preview { grid-template-columns: 1fr; }
    }
    @media (max-width: 960px) {
      .wo-editor-main { grid-template-columns: 1fr; }
      .wo-editor-stage { min-height: 440px; }
      .wo-editor-status { flex-direction: column; }
    }
  `;
  document.head.append(style);
}
