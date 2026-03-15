import {
  cloneAtlasDocument,
  createEmptyAtlasDocument,
  formatDocument,
  getAtlasDocumentNode,
  loadWorldOrbitSourceWithDiagnostics,
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
  type WorldOrbitAtlasViewpoint,
  type WorldOrbitObject,
} from "@worldorbit/core";
import { renderWorldOrbitBlock } from "@worldorbit/markdown";
import {
  createInteractiveViewer,
  type ViewerObjectDetails,
  type WorldOrbitViewer,
} from "@worldorbit/viewer";
import { invertViewerPoint } from "@worldorbit/viewer/viewer-state";

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
}

const STYLE_ID = "worldorbit-editor-style";
const FREE_DISTANCE_PIXEL_FACTOR = 96;
const AU_IN_KM = 149_597_870.7;
const EARTH_RADIUS_IN_KM = 6_371;
const SOLAR_RADIUS_IN_KM = 695_700;
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
  let diagnostics = initial.diagnostics;
  let selection: AtlasDocumentPath | null = atlasDocument.objects[0]
    ? { kind: "object", id: atlasDocument.objects[0].id }
    : { kind: "system" };
  const history: HistoryEntry[] = [];
  const future: HistoryEntry[] = [];
  let dragState: DragState | null = null;
  let ignoreViewerSelection = false;
  let destroyed = false;

  const showTextPane = options.showTextPane ?? true;
  const showInspector = options.showInspector ?? true;
  const showPreview = options.showPreview ?? true;

  container.classList.add("wo-editor");
  container.innerHTML = buildEditorMarkup(showInspector, showTextPane, showPreview);

  const toolbar = queryRequired<HTMLElement>(container, "[data-editor-toolbar]");
  const outline = queryRequired<HTMLElement>(container, "[data-editor-outline]");
  const stageShell = queryRequired<HTMLElement>(container, "[data-editor-stage-shell]");
  const stage = queryRequired<HTMLElement>(container, "[data-editor-stage]");
  const overlay = queryRequired<HTMLElement>(container, "[data-editor-overlay]");
  const diagnosticsPanel = queryRequired<HTMLElement>(container, "[data-editor-diagnostics]");
  const inspector = container.querySelector<HTMLElement>("[data-editor-inspector]");
  const sourcePane = container.querySelector<HTMLTextAreaElement>("[data-editor-source]");
  const previewVisual = container.querySelector<HTMLElement>("[data-editor-preview-visual]");
  const previewMarkup = container.querySelector<HTMLElement>("[data-editor-preview-markup]");

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
      if (ignoreViewerSelection || !selectedObject) {
        if (!ignoreViewerSelection && selection?.kind === "object") {
          setSelection(null, false, true);
        }
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
  inspector?.addEventListener("input", handleInspectorInput);
  inspector?.addEventListener("change", handleInspectorChange);
  sourcePane?.addEventListener("input", handleSourceInput);
  sourcePane?.addEventListener("change", handleSourceCommit);
  sourcePane?.addEventListener("blur", handleSourceCommit);
  window.addEventListener("pointermove", handleWindowPointerMove);
  window.addEventListener("pointerup", handleWindowPointerUp);

  const api: WorldOrbitEditor = {
    setSource(nextSource: string): void {
      applySourceText(nextSource, true);
    },
    setAtlasDocument(document: WorldOrbitAtlasDocument): void {
      replaceAtlasDocument(document, true, selection);
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
        projection: atlasDocument.system?.defaults.view ?? "topdown",
        preset: atlasDocument.system?.defaults.preset ?? null,
        zoom: null,
        rotationDeg: 0,
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
      return buildEmbedMarkup(canonicalSource, atlasDocument);
    },
    destroy(): void {
      if (destroyed) {
        return;
      }

      destroyed = true;
      toolbar.removeEventListener("click", handleToolbarClick);
      outline.removeEventListener("click", handleOutlineClick);
      overlay.removeEventListener("pointerdown", handleOverlayPointerDown);
      inspector?.removeEventListener("input", handleInspectorInput);
      inspector?.removeEventListener("change", handleInspectorChange);
      sourcePane?.removeEventListener("input", handleSourceInput);
      sourcePane?.removeEventListener("change", handleSourceCommit);
      sourcePane?.removeEventListener("blur", handleSourceCommit);
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      viewer!.destroy();
      container.innerHTML = "";
      container.classList.remove("wo-editor");
    },
  };

  renderAll();
  return api;

  function createHistoryEntry(): HistoryEntry {
    return {
      atlasDocument: cloneAtlasDocument(atlasDocument),
      selection: selection ? { ...selection } : null,
      source: canonicalSource,
    };
  }

  function restoreHistoryEntry(entry: HistoryEntry): void {
    atlasDocument = cloneAtlasDocument(entry.atlasDocument);
    canonicalSource = entry.source;
    sourceText = canonicalSource;
    diagnostics = collectDocumentDiagnostics(atlasDocument);
    syncViewer();
    setSelection(entry.selection, false, false);
    renderAll();
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

    atlasDocument = cloneAtlasDocument(nextDocument);
    canonicalSource = formatDocument(atlasDocument, { schema: "2.0" });
    if (!preserveSourceText) {
      sourceText = canonicalSource;
    }
    diagnostics = collectDocumentDiagnostics(atlasDocument);
    syncViewer();
    setSelection(nextSelection, false, false);
    renderAll();
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
      options.onDiagnosticsChange?.(diagnostics.map(cloneResolvedDiagnostic));
      return false;
    }

    const nextDocument =
      loaded.value.atlasDocument ?? upgradeDocumentToV2(loaded.value.document);
    const loadedDiagnostics = resolveAtlasDiagnostics(nextDocument, loaded.diagnostics);

    if (commitHistory) {
      history.push(createHistoryEntry());
      future.length = 0;
      sourceText = formatDocument(nextDocument, { schema: "2.0" });
    }

    atlasDocument = cloneAtlasDocument(nextDocument);
    canonicalSource = formatDocument(atlasDocument, { schema: "2.0" });
    diagnostics = mergeDiagnostics(loadedDiagnostics, collectDocumentDiagnostics(atlasDocument));
    syncViewer();
    selection = normalizeSelection(selection);
    renderAll();
    emitSnapshot();
    return true;
  }

  function syncViewer(): void {
    if (!viewer) {
      return;
    }
    ignoreViewerSelection = true;
    viewer.setSource(canonicalSource);

    if (selection?.kind === "object" && selection.id) {
      viewer!.focusObject(selection.id);
    } else if (selection?.kind === "viewpoint" && selection.id) {
      viewer!.goToViewpoint(selection.id);
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
      if (selection?.kind === "object" && selection.id) {
        viewer!.focusObject(selection.id);
      } else if (selection?.kind === "viewpoint" && selection.id) {
        viewer!.goToViewpoint(selection.id);
      }
      ignoreViewerSelection = false;
    }

    renderOutline();
    renderInspector();
    renderStageOverlay();

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

  function renderAll(): void {
    renderToolbar();
    renderOutline();
    renderDiagnostics();
    renderInspector();
    renderSourcePane();
    renderPreview();
    renderStageOverlay();
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
    const metadataEntries = Object.entries(atlasDocument.system?.atlasMetadata ?? {}).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    outline.innerHTML = `
      <div class="wo-editor-outline-section">
        <h3>Atlas</h3>
        ${renderOutlineButton({ kind: "system" }, "System", activeKey)}
        ${renderOutlineButton({ kind: "defaults" }, "Defaults", activeKey)}
      </div>
      <div class="wo-editor-outline-section">
        <h3>Metadata</h3>
        ${
          metadataEntries.length > 0
            ? metadataEntries
                .map(([key]) => renderOutlineButton({ kind: "metadata", key }, key, activeKey))
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
                  renderOutlineButton({ kind: "viewpoint", id: viewpoint.id }, viewpoint.label, activeKey),
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
                  renderOutlineButton({ kind: "annotation", id: annotation.id }, annotation.label, activeKey),
                )
                .join("")
            : `<p class="wo-editor-empty">No annotations yet.</p>`
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
              return `<article class="wo-editor-diagnostic wo-editor-diagnostic-${escapeHtml(entry.diagnostic.severity)}">
                <strong>${escapeHtml(entry.diagnostic.severity.toUpperCase())}</strong>
                <span>${escapeHtml(pathLabel)}</span>
                <p>${escapeHtml(entry.diagnostic.message)}</p>
              </article>`;
            })
            .join("");
  }

  function renderInspector(): void {
    if (!inspector) {
      return;
    }

    const formState: WorldOrbitEditorFormState = {
      selection: selection ? { path: { ...selection } } : null,
      system: atlasDocument.system,
      viewpoints: atlasDocument.system?.viewpoints ?? [],
      objects: atlasDocument.objects,
    };

    if (!selection) {
      inspector.innerHTML = `<p class="wo-editor-empty">Select an atlas node or object to edit it.</p>`;
      return;
    }

    switch (selection.kind) {
      case "system":
        inspector.innerHTML = renderSystemInspector(formState);
        return;
      case "defaults":
        inspector.innerHTML = renderDefaultsInspector(formState);
        return;
      case "metadata":
        inspector.innerHTML = renderMetadataInspector(formState, selection.key ?? "");
        return;
      case "viewpoint":
        inspector.innerHTML = renderViewpointInspector(formState, selection.id ?? "");
        return;
      case "annotation":
        inspector.innerHTML = renderAnnotationInspector(formState, selection.id ?? "");
        return;
      case "object":
        inspector.innerHTML = renderObjectInspector(formState, selection.id ?? "");
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

  function renderPreview(): void {
    if (!viewer) {
      return;
    }
    if (previewVisual) {
      previewVisual.innerHTML = viewer.exportSvg();
    }

    if (previewMarkup) {
      previewMarkup.textContent = buildEmbedMarkup(canonicalSource, atlasDocument);
    }
  }

  function renderStageOverlay(): void {
    if (!viewer) {
      return;
    }
    overlay.innerHTML = "";
    if (selection?.kind !== "object" || !selection.id) {
      return;
    }

    const details = viewer.getObjectDetails(selection.id);
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
        sourceText = canonicalSource;
        renderSourcePane();
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
      case "annotation":
        replaceAtlasDocument(buildAnnotationDocumentFromInspector(selection.id ?? ""), commitHistory, selection, false);
        return;
      case "object":
        replaceAtlasDocument(buildObjectDocumentFromInspector(selection.id ?? ""), commitHistory, selection, false);
        return;
    }
  }

  function handleSourceInput(): void {
    applySourceText(sourcePane?.value ?? "", false);
  }

  function handleSourceCommit(): void {
    const committed = applySourceText(sourcePane?.value ?? "", true);
    if (committed) {
      renderSourcePane();
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

    dragState = { kind, objectId };
    history.push(createHistoryEntry());
    future.length = 0;
    event.preventDefault();
  }

  function handleWindowPointerMove(event: PointerEvent): void {
    if (!dragState || selection?.kind !== "object" || selection.id !== dragState.objectId) {
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
          nextDocument = updateOrbitPhase(atlasDocument, dragState.objectId, details, pointer);
        }
        break;
      case "orbit-radius":
        if (details.object.placement?.mode === "orbit" && details.orbit) {
          nextDocument = updateOrbitRadius(atlasDocument, dragState.objectId, details, pointer);
        }
        break;
      case "at-reference":
        if (details.object.placement?.mode === "at") {
          nextDocument = updateAtReference(atlasDocument, dragState.objectId, viewer!.getScene(), pointer);
        }
        break;
      case "surface-target":
        if (details.object.placement?.mode === "surface") {
          nextDocument = updateSurfaceTarget(atlasDocument, dragState.objectId, viewer!.getScene(), pointer);
        }
        break;
      case "free-distance":
        if (details.object.placement?.mode === "free") {
          nextDocument = updateFreeDistance(
            atlasDocument,
            dragState.objectId,
            viewer!.getScene(),
            details,
            pointer,
          );
        }
        break;
    }

    replaceAtlasDocument(nextDocument, false, selection, false);
  }

  function handleWindowPointerUp(): void {
    dragState = null;
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
      layers: {
        background: readCheckbox(form, "layer-background"),
        guides: readCheckbox(form, "layer-guides"),
        "orbits-back": readCheckbox(form, "layer-orbits-back"),
        "orbits-front": readCheckbox(form, "layer-orbits-front"),
        objects: readCheckbox(form, "layer-objects"),
        labels: readCheckbox(form, "layer-labels"),
        metadata: readCheckbox(form, "layer-metadata"),
      },
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
}

function resolveInitialEditorState(
  options: WorldOrbitEditorOptions,
): LoadedEditorState {
  if (options.atlasDocument) {
    const atlasDocument = cloneAtlasDocument(options.atlasDocument);
    return {
      atlasDocument,
      source: formatDocument(atlasDocument, { schema: "2.0" }),
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
        source: formatDocument(atlasDocument, { schema: "2.0" }),
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
    source: formatDocument(atlasDocument, { schema: "2.0" }),
    diagnostics: collectDocumentDiagnostics(atlasDocument),
  };
}

function buildEditorMarkup(
  showInspector: boolean,
  showTextPane: boolean,
  showPreview: boolean,
): string {
  return `<section class="wo-editor-shell">
    <div class="wo-editor-toolbar" data-editor-toolbar></div>
    <div class="wo-editor-main">
      <aside class="wo-editor-sidebar">
        <div class="wo-editor-panel">
          <h2>Atlas</h2>
          <div class="wo-editor-outline" data-editor-outline></div>
        </div>
        <div class="wo-editor-panel">
          <h2>Diagnostics</h2>
          <div class="wo-editor-diagnostics" data-editor-diagnostics></div>
        </div>
      </aside>
      <div class="wo-editor-stage-panel">
        <div class="wo-editor-stage-shell" data-editor-stage-shell>
          <div class="wo-editor-stage" data-editor-stage></div>
          <div class="wo-editor-overlay" data-editor-overlay></div>
        </div>
        ${
          showPreview
            ? `<div class="wo-editor-preview">
                <div class="wo-editor-panel">
                  <h2>Static SVG</h2>
                  <div class="wo-editor-preview-visual" data-editor-preview-visual></div>
                </div>
                <div class="wo-editor-panel">
                  <h2>Embed Markup</h2>
                  <pre class="wo-editor-preview-markup" data-editor-preview-markup></pre>
                </div>
              </div>`
            : ""
        }
      </div>
      ${showInspector ? `<aside class="wo-editor-panel wo-editor-inspector" data-editor-inspector></aside>` : ""}
    </div>
    ${
      showTextPane
        ? `<div class="wo-editor-panel wo-editor-text-panel">
            <h2>Source</h2>
            <textarea class="wo-editor-source" data-editor-source spellcheck="false"></textarea>
          </div>`
        : ""
    }
  </section>`;
}

function renderOutlineButton(
  path: AtlasDocumentPath,
  label: string,
  activeKey: string | null,
): string {
  const key = selectionKey(path);
  return `<button type="button" class="wo-editor-outline-item${key === activeKey ? " is-active" : ""}" data-path-kind="${escapeHtml(path.kind)}"${path.id ? ` data-path-id="${escapeHtml(path.id)}"` : ""}${path.key ? ` data-path-key="${escapeHtml(path.key)}"` : ""}>${escapeHtml(label)}</button>`;
}

function renderSystemInspector(formState: WorldOrbitEditorFormState): string {
  return `<form class="wo-editor-form" data-editor-form="system">
    <h2>System</h2>
    ${renderTextField("System ID", "system-id", formState.system?.id ?? "")}
    ${renderTextField("Title", "system-title", formState.system?.title ?? "")}
  </form>`;
}

function renderDefaultsInspector(formState: WorldOrbitEditorFormState): string {
  const defaults = formState.system?.defaults;
  return `<form class="wo-editor-form" data-editor-form="defaults">
    <h2>Defaults</h2>
    ${renderSelectField("Projection", "defaults-view", [
      ["topdown", "Topdown"],
      ["isometric", "Isometric"],
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
    ${renderTextField("Theme", "defaults-theme", defaults?.theme ?? "")}
  </form>`;
}

function renderMetadataInspector(
  formState: WorldOrbitEditorFormState,
  key: string,
): string {
  const value = formState.system?.atlasMetadata[key] ?? "";
  return `<form class="wo-editor-form" data-editor-form="metadata">
    <h2>Metadata</h2>
    ${renderTextField("Key", "metadata-key", key)}
    ${renderTextAreaField("Value", "metadata-value", value)}
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
    ${renderTextField("ID", "viewpoint-id", viewpoint.id)}
    ${renderTextField("Label", "viewpoint-label", viewpoint.label)}
    ${renderTextAreaField("Summary", "viewpoint-summary", viewpoint.summary)}
    ${renderTextField("Focus object", "viewpoint-focus", viewpoint.focusObjectId ?? "")}
    ${renderTextField("Selected object", "viewpoint-select", viewpoint.selectedObjectId ?? "")}
    ${renderSelectField("Projection", "viewpoint-projection", [
      ["topdown", "Topdown"],
      ["isometric", "Isometric"],
    ], viewpoint.projection)}
    ${renderSelectField("Preset", "viewpoint-preset", [
      ["", "Document default"],
      ["diagram", "Diagram"],
      ["presentation", "Presentation"],
      ["atlas-card", "Atlas Card"],
      ["markdown", "Markdown"],
    ], viewpoint.preset ?? "")}
    ${renderTextField("Zoom", "viewpoint-zoom", viewpoint.zoom === null ? "" : String(viewpoint.zoom))}
    ${renderTextField("Rotation", "viewpoint-rotation", String(viewpoint.rotationDeg))}
    <fieldset class="wo-editor-fieldset">
      <legend>Layers</legend>
      ${renderCheckboxField("Background", "layer-background", viewpoint.layers.background !== false)}
      ${renderCheckboxField("Guides", "layer-guides", viewpoint.layers.guides !== false)}
      ${renderCheckboxField("Orbits back", "layer-orbits-back", viewpoint.layers["orbits-back"] !== false)}
      ${renderCheckboxField("Orbits front", "layer-orbits-front", viewpoint.layers["orbits-front"] !== false)}
      ${renderCheckboxField("Objects", "layer-objects", viewpoint.layers.objects !== false)}
      ${renderCheckboxField("Labels", "layer-labels", viewpoint.layers.labels !== false)}
      ${renderCheckboxField("Metadata", "layer-metadata", viewpoint.layers.metadata !== false)}
    </fieldset>
    ${renderTextField("Filter query", "filter-query", viewpoint.filter?.query ?? "")}
    ${renderTextField("Filter object types", "filter-object-types", viewpoint.filter?.objectTypes.join(" ") ?? "")}
    ${renderTextField("Filter tags", "filter-tags", viewpoint.filter?.tags.join(" ") ?? "")}
    ${renderTextField("Filter groups", "filter-groups", viewpoint.filter?.groupIds.join(" ") ?? "")}
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
    ${renderTextField("ID", "annotation-id", annotation.id)}
    ${renderTextField("Label", "annotation-label", annotation.label)}
    ${renderTextField("Target object", "annotation-target", annotation.targetObjectId ?? "")}
    ${renderTextField("Source object", "annotation-source", annotation.sourceObjectId ?? "")}
    ${renderTextAreaField("Body", "annotation-body", annotation.body)}
    ${renderTextField("Tags", "annotation-tags", annotation.tags.join(" "))}
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
    ${renderTextField("ID", "object-id", object.id)}
    ${renderSelectField("Type", "object-type", OBJECT_TYPES.map((type) => [type, humanizeIdentifier(type)]), object.type)}
    ${renderSelectField("Placement mode", "placement-mode", [
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
    ${renderTextField("Phase", "placement-phase", object.placement?.mode === "orbit" && object.placement.phase ? formatUnitValue(object.placement.phase) : "")}
    <fieldset class="wo-editor-fieldset">
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
    </fieldset>
    ${renderTextAreaField("Description", "info-description", object.info.description ?? "")}
  </form>`;
}

function renderTextField(label: string, name: string, value: string): string {
  return `<label class="wo-editor-field"><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" value="${escapeAttribute(value)}" /></label>`;
}

function renderTextAreaField(label: string, name: string, value: string): string {
  return `<label class="wo-editor-field"><span>${escapeHtml(label)}</span><textarea name="${escapeHtml(name)}">${escapeHtml(value)}</textarea></label>`;
}

function renderSelectField(
  label: string,
  name: string,
  options: Array<[string, string]>,
  selectedValue: string,
): string {
  return `<label class="wo-editor-field"><span>${escapeHtml(label)}</span><select name="${escapeHtml(name)}">${options
    .map(
      ([value, optionLabel]) =>
        `<option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(optionLabel)}</option>`,
    )
    .join("")}</select></label>`;
}

function renderCheckboxField(label: string, name: string, checked: boolean): string {
  return `<label class="wo-editor-checkbox"><input type="checkbox" name="${escapeHtml(name)}"${checked ? " checked" : ""} /><span>${escapeHtml(label)}</span></label>`;
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
  const mode = readTextInput(form, "placement-mode");
  const target = readOptionalTextInput(form, "placement-target");

  switch (mode) {
    case "orbit":
      return {
        mode,
        target:
          target ??
          (current.placement?.mode === "orbit"
            ? current.placement.target
            : current.id),
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
        target: target ?? current.id,
        reference: parseAtReferenceString(target ?? current.id),
      };
    case "surface":
      return {
        mode,
        target: target ?? current.id,
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
}

function removeSelectedNode(
  document: WorldOrbitAtlasDocument,
  selection: AtlasDocumentPath,
): WorldOrbitAtlasDocument {
  const next = removeAtlasDocumentNode(document, selection);

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

  return next;
}

function updateOrbitPhase(
  document: WorldOrbitAtlasDocument,
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
  const object = next.objects.find((entry) => entry.id === objectId);
  if (!object || object.placement?.mode !== "orbit") {
    return document;
  }

  object.placement.phase = {
    value: roundNumber(phaseDeg, 2),
    unit: "deg",
  };
  return next;
}

function updateOrbitRadius(
  document: WorldOrbitAtlasDocument,
  objectId: string,
  details: ViewerObjectDetails,
  pointer: CoordinatePoint,
): WorldOrbitAtlasDocument {
  const orbit = details.orbit;
  if (!orbit || details.object.placement?.mode !== "orbit") {
    return document;
  }

  const unrotated = rotatePoint(pointer, { x: orbit.cx, y: orbit.cy }, -orbit.rotationDeg);
  const currentRadius = orbit.kind === "circle" ? orbit.radius ?? 1 : orbit.rx ?? 1;
  const nextRadius = Math.max(Math.abs(unrotated.x - orbit.cx), 24);
  const ratio = nextRadius / Math.max(currentRadius, 1);
  const next = cloneAtlasDocument(document);
  const object = next.objects.find((entry) => entry.id === objectId);
  if (!object || object.placement?.mode !== "orbit") {
    return document;
  }

  const currentValue =
    object.placement.semiMajor ??
    object.placement.distance ?? {
      value: 1,
      unit: "au" as const,
    };
  const scaled: UnitValue = {
    value: roundNumber(currentValue.value * ratio, 3),
    unit: currentValue.unit,
  };
  if (object.placement.semiMajor) {
    object.placement.semiMajor = scaled;
  } else {
    object.placement.distance = scaled;
  }
  return next;
}

function updateAtReference(
  document: WorldOrbitAtlasDocument,
  objectId: string,
  scene: RenderScene,
  pointer: CoordinatePoint,
): WorldOrbitAtlasDocument {
  const candidate = findNearestAtCandidate(scene, objectId, pointer);
  if (!candidate) {
    return document;
  }

  const next = cloneAtlasDocument(document);
  const object = next.objects.find((entry) => entry.id === objectId);
  if (!object || object.placement?.mode !== "at") {
    return document;
  }

  object.placement.reference = candidate.reference;
  object.placement.target = formatAtReference(candidate.reference);
  return next;
}

function updateSurfaceTarget(
  document: WorldOrbitAtlasDocument,
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
  const object = next.objects.find((entry) => entry.id === objectId);
  if (!object || object.placement?.mode !== "surface") {
    return document;
  }

  object.placement.target = target.objectId;
  return next;
}

function updateFreeDistance(
  document: WorldOrbitAtlasDocument,
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
  const object = next.objects.find((entry) => entry.id === objectId);
  if (!object || object.placement?.mode !== "free") {
    return document;
  }

  const preferredUnit = normalizeFreeDistanceUnit(object.placement.distance?.unit ?? null);
  const metric = offsetPx / Math.max(FREE_DISTANCE_PIXEL_FACTOR * scene.scaleModel.freePlacementMultiplier, 1);
  if (metric < 0.01) {
    object.placement.distance = undefined;
    if (!object.placement.descriptor) {
      delete object.placement.descriptor;
    }
    return next;
  }

  object.placement.distance = distanceMetricToUnitValue(metric, preferredUnit);
  delete object.placement.descriptor;
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
    case "object":
      return `Object: ${path.id ?? ""}`;
    case "viewpoint":
      return `Viewpoint: ${path.id ?? ""}`;
    case "annotation":
      return `Annotation: ${path.id ?? ""}`;
  }
}

function selectionKey(path: AtlasDocumentPath | null): string | null {
  return path ? `${path.kind}:${path.id ?? path.key ?? ""}` : null;
}

function compareObjects(left: WorldOrbitObject, right: WorldOrbitObject): number {
  return left.id.localeCompare(right.id);
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
    .wo-editor-shell { display: grid; gap: 16px; min-width: 0; }
    .wo-editor-toolbar { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .wo-editor-toolbar-group { display: flex; gap: 10px; flex-wrap: wrap; }
    .wo-editor-toolbar button, .wo-editor-toolbar select {
      border: 1px solid rgba(240, 180, 100, 0.2);
      border-radius: 999px;
      background: rgba(240, 180, 100, 0.08);
      color: #edf6ff;
      font: 600 13px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif;
      padding: 10px 14px;
    }
    .wo-editor-toolbar button:disabled { opacity: 0.45; cursor: not-allowed; }
    .wo-editor-main { display: grid; grid-template-columns: minmax(220px, 280px) minmax(0, 1fr) minmax(280px, 360px); gap: 16px; min-width: 0; }
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
    .wo-editor-outline { display: grid; gap: 14px; }
    .wo-editor-outline-section { display: grid; gap: 8px; }
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
    }
    .wo-editor-outline-item.is-active {
      border-color: rgba(255, 214, 138, 0.34);
      background: rgba(255, 214, 138, 0.12);
      color: #ffdda9;
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
    .wo-editor-form { display: grid; gap: 12px; min-width: 0; }
    .wo-editor-field { display: grid; gap: 6px; }
    .wo-editor-field span, .wo-editor-fieldset legend {
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
    .wo-editor-field textarea, .wo-editor-source { min-height: 110px; resize: vertical; }
    .wo-editor-source {
      min-height: 280px;
      font-family: "Cascadia Code", "Consolas", monospace;
      white-space: pre;
      overflow: auto;
    }
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
      align-items: center;
      color: #edf6ff;
      font: 500 13px/1.4 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
    .wo-editor-preview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
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
    .wo-editor-empty {
      margin: 0;
      color: rgba(237,246,255,0.68);
      font: 500 12px/1.5 "Segoe UI Variable", "Segoe UI", sans-serif;
    }
    @media (max-width: 1280px) {
      .wo-editor-main { grid-template-columns: minmax(220px, 260px) minmax(0, 1fr); }
      .wo-editor-inspector { grid-column: 1 / -1; }
      .wo-editor-preview { grid-template-columns: 1fr; }
    }
    @media (max-width: 960px) {
      .wo-editor-main { grid-template-columns: 1fr; }
      .wo-editor-stage { min-height: 440px; }
    }
  `;
  document.head.append(style);
}
