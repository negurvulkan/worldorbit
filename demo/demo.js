import {
  loadWorldOrbitSource,
  renderDocumentToScene,
  renderDocumentToSpatialScene,
} from "@worldorbit/core";
import {
  createEmbedPayload,
  createInteractiveViewer,
  createWorldOrbitEmbedMarkup,
  renderSceneToSvg,
} from "@worldorbit/viewer";

const sampleSource = `schema 2.5

system Iyath
  title "Iyath System"
  epoch "JY-0001.0"
  referencePlane ecliptic

defaults
  view orthographic
  scale presentation
  preset atlas-card
  theme atlas

viewpoint overview
  label "Atlas Overview"
  summary "Fit the full system and keep the atlas defaults visible in 2D and 3D."
  projection orthographic
  camera
    azimuth 26
    elevation 18

viewpoint naar
  label "Naar Close Orbit"
  summary "Center the homeworld and its local infrastructure in a perspective camera."
  focus Naar
  select Naar
  projection perspective
  camera
    azimuth 38
    elevation 24
    distance 5
  layers background orbits objects labels metadata relations

viewpoint infrastructure
  label "Infrastructure"
  summary "Filter infrastructure and anomalies for atlas inspection."
  focus Naar
  projection orthographic
  camera
    azimuth 30
    elevation 20
  layers background orbits objects labels metadata relations
  filter
    query relay skyhook gate anomaly
    objectTypes structure phenomenon

annotation ember
  label "Mining Corridor"
  target Ember-Belt
  body "Industrial traffic and salvage fields cut through the inner belt."
  tags industry salvage

object star Iyath
  class G2
  radius 1.08sol
  mass 1.02sol
  temperature 5840
  color #ffd36a

object planet Naar
  class terrestrial
  culture Enari
  image assets/naar-map.png
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  period 412d
  radius 1.06re
  temperature 289
  albedo 0.34
  atmosphere nitrogen-oxygen
  tags habitable homeworld atlas

  info
    faction "Veyrathische Republik"
    description "Heimatwelt der Enari."

object moon Leth
  orbit Naar
  distance 220000km
  angle 34deg
  inclination 18deg
  phase 210deg
  period 18d
  radius 0.27re
  albedo 0.21
  tags moon survey

object ring Dawn-Ring
  orbit Naar
  distance 185000km
  angle 22deg
  inclination 18deg
  inner 120000km
  outer 190000km

object belt Ember-Belt
  orbit Iyath
  semiMajor 2.7au
  eccentricity 0.16
  angle 14deg
  inclination 11deg
  phase 166deg
  period 1800d
  inner 2.45au
  outer 2.95au
  tags mining debris atlas

object structure L4-Relay
  kind relay
  tags relay infrastructure atlas
  at Naar:L4

object structure Skyhook
  kind elevator
  tags infrastructure atlas
  surface Naar

object structure OuterGate
  kind gate
  tags infrastructure atlas
  free 8.4au

object phenomenon Helioscar
  kind anomaly
  tags anomaly atlas
  orbit Iyath
  semiMajor 4.9au
  eccentricity 0.2
  angle 36deg
  inclination 9deg
  phase 228deg
  period 3200d
  temperature 620`;

const sourceField = document.querySelector("#source");
const preview = document.querySelector("#preview");
const errorPanel = document.querySelector("#error");
const errorText = document.querySelector("#error-text");
const modelOutput = document.querySelector("#model");
const embedOutput = document.querySelector("#embed");
const summary = document.querySelector("#summary");
const resetSourceButton = document.querySelector("#load-example");
const downloadButton = document.querySelector("#download-svg");
const zoomInButton = document.querySelector("#zoom-in");
const zoomOutButton = document.querySelector("#zoom-out");
const rotateLeftButton = document.querySelector("#rotate-left");
const rotateRightButton = document.querySelector("#rotate-right");
const fitButton = document.querySelector("#fit-view");
const resetViewButton = document.querySelector("#reset-view");
const saveBookmarkButton = document.querySelector("#save-bookmark");
const bookmarkList = document.querySelector("#bookmark-list");
const viewModeSelect = document.querySelector("#view-mode");
const themeSelect = document.querySelector("#theme");
const presetSelect = document.querySelector("#preset");
const projectionSelect = document.querySelector("#projection");
const animationPlayButton = document.querySelector("#animation-play");
const animationPauseButton = document.querySelector("#animation-pause");
const animationResetButton = document.querySelector("#animation-reset");
const animationSpeedSelect = document.querySelector("#animation-speed");
const viewpointSelect = document.querySelector("#viewpoint");
const typeFilterSelect = document.querySelector("#type-filter");
const atlasSearchInput = document.querySelector("#atlas-search");
const searchResults = document.querySelector("#search-results");
const orbitScaleInput = document.querySelector("#orbit-scale");
const bodyScaleInput = document.querySelector("#body-scale");
const labelScaleInput = document.querySelector("#label-scale");
const orbitScaleValue = document.querySelector("#orbit-scale-value");
const bodyScaleValue = document.querySelector("#body-scale-value");
const labelScaleValue = document.querySelector("#label-scale-value");

let viewer = null;
let currentDocument = null;
let currentSourceSchemaVersion = null;
let currentAtlasDocument = null;
let currentSelection = null;
let currentSelectionDetails = null;
let currentScene = null;
let currentSpatialScene = null;
let currentAtlasState = null;
let currentViewpointId = null;
let currentDisplayMode = getDisplayMode();
let currentRenderOptions = getRenderOptionsFromControls();
let bookmarks = [];
let renderTimer = 0;
let pendingAtlasState = readAtlasStateFromHash();

sourceField.value = sampleSource;
syncControlOutputs();

function scheduleRender() {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(render, 100);
}

function render() {
  try {
    currentDisplayMode = getDisplayMode();
    const loaded = loadWorldOrbitSource(sourceField.value);
    currentDocument = loaded.document;
    currentSourceSchemaVersion = loaded.schemaVersion;
    currentAtlasDocument = loaded.atlasDocument ?? loaded.draftDocument;
    currentSelection = null;
    currentSelectionDetails = null;
    currentScene = renderDocumentToScene(currentDocument, getDocumentRenderOptions());
    currentSpatialScene =
      currentDisplayMode === "interactive-3d"
        ? renderDocumentToSpatialScene(currentDocument, getDocumentRenderOptions())
        : null;
    destroyViewer();

    if (currentDisplayMode === "static") {
      preview.innerHTML = renderSceneToSvg(currentScene, {
        ...currentRenderOptions,
        theme: themeSelect.value,
      });
      currentAtlasState = null;
      currentViewpointId = null;
    } else {
      viewer = createInteractiveViewer(preview, {
        document: currentDocument,
        spatialScene: currentSpatialScene ?? undefined,
        ...currentRenderOptions,
        theme: themeSelect.value,
        minimap: true,
        viewMode: currentDisplayMode === "interactive-3d" ? "3d" : "2d",
        onSelectionChange(selection) {
          currentSelection = selection;
          updateSummary();
        },
        onSelectionDetailsChange(details) {
          currentSelectionDetails = details;
          updateModelPanel();
        },
        onViewChange() {
          currentScene = viewer?.getScene() ?? currentScene;
          updateDownloadState();
        },
        onFilterChange(filter) {
          syncAtlasControlsFromFilter(filter);
          updateSearchResults();
          updateSummary();
          updateModelPanel();
        },
        onViewpointChange(viewpoint) {
          currentViewpointId = viewpoint?.id ?? null;
          syncViewpointControl();
          updateSummary();
          updateModelPanel();
        },
        onAtlasStateChange(state) {
          currentAtlasState = state;
          writeAtlasStateToHash(state);
          updateEmbedPanel();
        },
      });
      currentScene = viewer.getScene();
      viewer.setAnimationSpeed(Number(animationSpeedSelect.value));
    }

    populateViewpointOptions();

    if (viewer && pendingAtlasState) {
      viewer.setAtlasState(pendingAtlasState);
      pendingAtlasState = null;
      currentScene = viewer.getScene();
    } else if (viewer) {
      applyAtlasFilter(false);
    }

    currentAtlasState = viewer?.getAtlasState() ?? null;
    updateSearchResults();
    renderBookmarks();
    updateSummary();
    updateModelPanel();
    updateEmbedPanel();
    updateDownloadState();
    errorPanel.hidden = true;
    enableViewerButtons(Boolean(currentScene));
  } catch (error) {
    destroyViewer();
    currentDocument = null;
    currentSourceSchemaVersion = null;
    currentAtlasDocument = null;
    currentSelection = null;
    currentSelectionDetails = null;
    currentScene = null;
    currentSpatialScene = null;
    currentAtlasState = null;
    currentViewpointId = null;
    preview.innerHTML = "";
    modelOutput.textContent = "";
    embedOutput.textContent = "";
    searchResults.innerHTML = "";
    summary.textContent = "Render fehlgeschlagen";
    errorText.textContent = error instanceof Error ? error.message : String(error);
    errorPanel.hidden = false;
    downloadButton.disabled = true;
    enableViewerButtons(false);
  }
}

function applyRenderControls() {
  currentRenderOptions = getRenderOptionsFromControls();
  syncControlOutputs();
  render();
}

function applyAtlasFilter(resetViewpoint = true) {
  if (!viewer) {
    return;
  }

  const query = atlasSearchInput.value.trim();
  const type = typeFilterSelect.value;
  const filter =
    query || type
      ? {
          query: query || undefined,
          objectTypes: type ? [type] : undefined,
          includeAncestors: true,
        }
      : null;

  viewer.setFilter(filter);
  currentScene = viewer.getScene();

  if (resetViewpoint) {
    currentViewpointId = null;
    syncViewpointControl();
  }

  updateSearchResults();
  updateSummary();
  updateModelPanel();
  updateEmbedPanel();
}

function applyViewpointSelection() {
  if (!viewer) {
    return;
  }

  const viewpointId = viewpointSelect.value;
  if (!viewpointId) {
    currentViewpointId = null;
    viewer.resetView();
    applyAtlasFilter(false);
    return;
  }

  viewer.goToViewpoint(viewpointId);
  currentScene = viewer.getScene();
  currentViewpointId = viewpointId;
  syncAtlasControlsFromFilter(viewer.getFilter());
  updateSearchResults();
  updateSummary();
  updateModelPanel();
  updateEmbedPanel();
}

function populateViewpointOptions() {
  if (!currentScene) {
    viewpointSelect.innerHTML = `<option value="">Scene default</option>`;
    return;
  }

  const activeValue = currentViewpointId ?? "";
  const options = [
    `<option value="">Scene default</option>`,
    ...currentScene.viewpoints
      .map(
        (viewpoint) =>
          `<option value="${escapeHtml(viewpoint.id)}">${escapeHtml(viewpoint.label)}</option>`,
      ),
  ];

  viewpointSelect.innerHTML = options.join("");
  viewpointSelect.value = activeValue && currentScene.viewpoints.some((entry) => entry.id === activeValue)
    ? activeValue
    : "";
}

function syncViewpointControl() {
  viewpointSelect.value = currentViewpointId ?? "";
}

function updateSearchResults() {
  if (!viewer) {
    searchResults.innerHTML = "";
    return;
  }

  const results = viewer.search(atlasSearchInput.value.trim(), 5);
  searchResults.innerHTML = results
    .map(
      (result) =>
        `<button type="button" data-object-id="${escapeHtml(result.objectId)}">${escapeHtml(result.objectId)} - ${escapeHtml(result.type)}</button>`,
    )
    .join("");
}

function focusSearchResult(objectId) {
  if (!viewer) {
    return;
  }

  viewer.focusObject(objectId);
  currentScene = viewer.getScene();
  updateSummary();
  updateModelPanel();
  updateEmbedPanel();
}

function saveBookmark() {
  if (!viewer) {
    return;
  }

  const label = currentViewpointId
    ? `View ${currentViewpointId}`
    : `View ${bookmarks.length + 1}`;
  bookmarks = [...bookmarks, viewer.captureBookmark(label, label)];
  renderBookmarks();
}

function renderBookmarks() {
  bookmarkList.innerHTML = bookmarks
    .map(
      (bookmark) =>
        `<button type="button" data-bookmark-id="${escapeHtml(bookmark.id)}">${escapeHtml(bookmark.label)}</button>`,
    )
    .join("");
}

function applyBookmark(bookmarkId) {
  if (!viewer) {
    return;
  }

  const bookmark = bookmarks.find((entry) => entry.id === bookmarkId);
  if (!bookmark) {
    return;
  }

  viewer.applyBookmark(bookmark);
  currentScene = viewer.getScene();
  currentAtlasState = viewer.getAtlasState();
  currentViewpointId = currentAtlasState.viewpointId;
  syncViewpointControl();
  syncAtlasControlsFromFilter(viewer.getFilter());
  updateSearchResults();
  updateSummary();
  updateModelPanel();
  updateEmbedPanel();
}

function getRenderOptionsFromControls() {
  const orbitScale = Number(orbitScaleInput.value);
  const bodyScale = Number(bodyScaleInput.value);
  const labelScale = Number(labelScaleInput.value);

  return {
    width: 1080,
    height: 720,
    preset: presetSelect.value,
    projection: projectionSelect.value,
    scaleModel: {
      orbitDistanceMultiplier: orbitScale,
      bodyRadiusMultiplier: bodyScale,
      labelMultiplier: labelScale,
      freePlacementMultiplier: orbitScale,
      ringThicknessMultiplier: orbitScale,
    },
  };
}

function getDocumentRenderOptions() {
  return {
    ...currentRenderOptions,
    projection:
      currentRenderOptions.projection === "document"
        ? undefined
        : currentRenderOptions.projection,
  };
}

function syncControlOutputs() {
  orbitScaleValue.value = Number(orbitScaleInput.value).toFixed(2);
  bodyScaleValue.value = Number(bodyScaleInput.value).toFixed(2);
  labelScaleValue.value = Number(labelScaleInput.value).toFixed(2);
}

function syncAtlasControlsFromFilter(filter) {
  if (!filter) {
    if (document.activeElement !== atlasSearchInput) {
      atlasSearchInput.value = "";
    }
    typeFilterSelect.value = "";
    return;
  }

  if (document.activeElement !== atlasSearchInput) {
    atlasSearchInput.value = filter.query ?? "";
  }
  typeFilterSelect.value =
    filter.objectTypes?.length === 1 ? filter.objectTypes[0] : "";
}

function updateSummary() {
  if (!currentDocument || !currentScene) {
    summary.textContent = "Keine Szene geladen";
    return;
  }

  const filter = viewer?.getFilter() ?? null;
  const filterSummary = filter
    ? `Filter ${filter.query ?? filter.objectTypes?.join("/") ?? "aktiv"}`
    : "Kein Filter";
  const viewpointSummary = currentViewpointId ? `Viewpoint ${currentViewpointId}` : "Scene default";
  const preset = currentScene.renderPreset ?? "custom";
  const schemaLabel = currentSourceSchemaVersion ?? currentDocument.version;
  const base = `${currentDocument.objects.length} Objekte - schema ${schemaLabel} - ${currentDisplayMode} - ${currentScene.projection} - ${currentScene.layoutPreset} layout - ${preset}`;

  summary.textContent = currentSelection
    ? `${base} - ${viewpointSummary} - ${filterSummary} - Auswahl: ${currentSelection.objectId}`
    : `${base} - ${viewpointSummary} - ${filterSummary}`;
}

function updateModelPanel() {
  if (!currentDocument || !currentScene) {
    modelOutput.textContent = "";
    return;
  }

  const payload = currentSelectionDetails && viewer
    ? {
        selectedObject: {
          id: currentSelectionDetails.objectId,
          type: currentSelectionDetails.object.type,
          renderFields: pickRenderFields(currentSelectionDetails.object.properties),
          placement: pickRenderPlacement(currentSelectionDetails.object.placement),
          info: currentSelectionDetails.object.info,
        },
        atlasDetails: {
          viewpoint: currentViewpointId,
          filter: viewer.getFilter(),
          visibleObjects: viewer.getVisibleObjects().map((object) => object.objectId),
          focusPath: currentSelectionDetails.focusPath.map((object) => object.objectId),
          group: currentSelectionDetails.group,
          parent: currentSelectionDetails.parent?.objectId ?? null,
          children: currentSelectionDetails.children.map((child) => child.objectId),
          ancestors: currentSelectionDetails.ancestors.map((ancestor) => ancestor.objectId),
          relatedOrbits: currentSelectionDetails.relatedOrbits.map((orbit) => orbit.objectId),
          label: currentSelectionDetails.label,
        },
        atlasState: currentAtlasState,
        spatialScene: currentSpatialScene
          ? {
              viewMode: currentSpatialScene.viewMode,
              timeFrozen: currentSpatialScene.timeFrozen,
              objectCount: currentSpatialScene.objects.length,
              orbitCount: currentSpatialScene.orbits.length,
            }
          : null,
        renderNode: {
          projection: currentScene.projection,
          x: currentSelectionDetails.renderObject.x,
          y: currentSelectionDetails.renderObject.y,
          radius: currentSelectionDetails.renderObject.radius,
          sortKey: currentSelectionDetails.renderObject.sortKey,
        },
        scene: {
          preset: currentScene.renderPreset,
          layoutPreset: currentScene.layoutPreset,
          viewpoints: currentScene.viewpoints,
          groups: currentScene.groups,
          layers: currentScene.layers,
          scaleModel: currentScene.scaleModel,
        },
        documentSummary: {
          system: currentDocument.system?.id ?? null,
          objectCount: currentDocument.objects.length,
          schemaVersion: currentDocument.version,
          sourceSchemaVersion: currentSourceSchemaVersion,
          atlasDocumentVersion: currentAtlasDocument?.version ?? null,
        },
      }
    : {
        document: currentDocument,
        sourceSchemaVersion: currentSourceSchemaVersion,
        atlasDocumentVersion: currentAtlasDocument?.version ?? null,
        atlasState: currentAtlasState,
        spatialScene: currentSpatialScene
          ? {
              viewMode: currentSpatialScene.viewMode,
              timeFrozen: currentSpatialScene.timeFrozen,
              objectCount: currentSpatialScene.objects.length,
              orbitCount: currentSpatialScene.orbits.length,
            }
          : null,
        sceneDefaults: {
          preset: currentScene.renderPreset,
          projection: currentScene.projection,
          layoutPreset: currentScene.layoutPreset,
          viewpoints: currentScene.viewpoints,
          groups: currentScene.groups,
          layers: currentScene.layers,
          scaleModel: currentScene.scaleModel,
        },
      };

  modelOutput.textContent = JSON.stringify(payload, null, 2);
}

function pickRenderFields(properties) {
  const keys = [
    "radius",
    "mass",
    "density",
    "gravity",
    "temperature",
    "albedo",
    "atmosphere",
    "period",
    "distance",
    "semiMajor",
    "eccentricity",
    "angle",
    "inclination",
    "phase",
    "inner",
    "outer",
    "image",
    "color",
    "tags",
  ];

  return Object.fromEntries(
    keys
      .filter((key) => properties[key] !== undefined)
      .map((key) => [key, properties[key]]),
  );
}

function pickRenderPlacement(placement) {
  if (!placement) {
    return null;
  }

  if (placement.mode === "orbit") {
    return {
      mode: placement.mode,
      target: placement.target,
      distance: placement.distance,
      semiMajor: placement.semiMajor,
      eccentricity: placement.eccentricity,
      period: placement.period,
      angle: placement.angle,
      inclination: placement.inclination,
      phase: placement.phase,
    };
  }

  if (placement.mode === "at") {
    return {
      mode: placement.mode,
      target: placement.target,
      reference: placement.reference,
    };
  }

  if (placement.mode === "surface") {
    return {
      mode: placement.mode,
      target: placement.target,
    };
  }

  return {
    mode: placement.mode,
    distance: placement.distance,
    descriptor: placement.descriptor,
  };
}

function updateEmbedPanel() {
  if (!currentScene) {
    embedOutput.textContent = "";
    return;
  }

  const atlasState = viewer?.getAtlasState() ?? null;
  const initialFilter = viewer?.getFilter() ?? null;
  const payloadMode = currentDisplayMode === "static" ? "static" : currentDisplayMode;
  embedOutput.textContent = createWorldOrbitEmbedMarkup(
    createEmbedPayload(currentScene, payloadMode, {
      spatialScene: currentSpatialScene ?? undefined,
      viewMode: currentDisplayMode === "interactive-3d" ? "3d" : "2d",
      atlasState,
      initialViewpointId: currentViewpointId ?? undefined,
      initialSelectionObjectId: currentSelection?.objectId ?? undefined,
      initialFilter,
      minimap: currentDisplayMode !== "static",
    }),
    {
      theme: themeSelect.value,
      className: "worldorbit-embed demo-sample",
      preset: currentRenderOptions.preset,
      viewMode: currentDisplayMode === "interactive-3d" ? "3d" : "2d",
      atlasState,
      initialViewpointId: currentViewpointId ?? undefined,
      initialSelectionObjectId: currentSelection?.objectId ?? undefined,
      initialFilter,
      minimap: currentDisplayMode !== "static",
    },
  );
}

function updateDownloadState() {
  downloadButton.disabled = !preview.querySelector("svg");
}

function enableViewerButtons(enabled) {
  const interactive = enabled && currentDisplayMode !== "static";
  const animate = interactive && currentDisplayMode === "interactive-3d";
  [
    zoomInButton,
    zoomOutButton,
    rotateLeftButton,
    rotateRightButton,
    fitButton,
    resetViewButton,
    saveBookmarkButton,
  ].forEach((button) => {
    button.disabled = !interactive;
  });
  animationPlayButton.disabled = !animate;
  animationPauseButton.disabled = !animate;
  animationResetButton.disabled = !animate;
  animationSpeedSelect.disabled = !animate;
  viewpointSelect.disabled = !interactive;
  typeFilterSelect.disabled = !interactive;
  atlasSearchInput.disabled = !interactive;
}

function downloadSvg() {
  if (!currentScene) {
    return;
  }

  const svg = viewer
    ? viewer.exportSvg()
    : renderSceneToSvg(currentScene, {
        ...currentRenderOptions,
        theme: themeSelect.value,
      });
  const blob = new Blob([svg], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "worldorbit-v3-atlas.svg";
  link.click();
  URL.revokeObjectURL(url);
}

function getDisplayMode() {
  return viewModeSelect.value;
}

function destroyViewer() {
  if (!viewer) {
    return;
  }

  viewer.destroy();
  viewer = null;
}

function readAtlasStateFromHash() {
  const hash = window.location.hash.replace(/^#/, "").trim();
  return hash || null;
}

function writeAtlasStateToHash(state) {
  const serialized = encodeURIComponent(JSON.stringify(state));
  if (window.location.hash.replace(/^#/, "") === serialized) {
    return;
  }

  window.history.replaceState(null, "", `#${serialized}`);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

sourceField.addEventListener("input", scheduleRender);
resetSourceButton.addEventListener("click", () => {
  sourceField.value = sampleSource;
  bookmarks = [];
  pendingAtlasState = null;
  render();
});
downloadButton.addEventListener("click", downloadSvg);
zoomInButton.addEventListener("click", () => viewer?.zoomBy(1.2));
zoomOutButton.addEventListener("click", () => viewer?.zoomBy(1 / 1.2));
rotateLeftButton.addEventListener("click", () => viewer?.rotateBy(-15));
rotateRightButton.addEventListener("click", () => viewer?.rotateBy(15));
fitButton.addEventListener("click", () => viewer?.fitToSystem());
resetViewButton.addEventListener("click", () => viewer?.resetView());
saveBookmarkButton.addEventListener("click", saveBookmark);
themeSelect.addEventListener("change", applyRenderControls);
presetSelect.addEventListener("change", applyRenderControls);
projectionSelect.addEventListener("change", applyRenderControls);
viewModeSelect.addEventListener("change", applyRenderControls);
viewpointSelect.addEventListener("change", applyViewpointSelection);
typeFilterSelect.addEventListener("change", () => applyAtlasFilter(true));
atlasSearchInput.addEventListener("input", () => {
  applyAtlasFilter(true);
  updateSearchResults();
});
orbitScaleInput.addEventListener("input", applyRenderControls);
bodyScaleInput.addEventListener("input", applyRenderControls);
labelScaleInput.addEventListener("input", applyRenderControls);
animationPlayButton.addEventListener("click", () => viewer?.playAnimation());
animationPauseButton.addEventListener("click", () => viewer?.pauseAnimation());
animationResetButton.addEventListener("click", () => viewer?.resetAnimation());
animationSpeedSelect.addEventListener("change", () => {
  viewer?.setAnimationSpeed(Number(animationSpeedSelect.value));
});
searchResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-object-id]");
  if (!button) {
    return;
  }
  focusSearchResult(button.dataset.objectId);
});
bookmarkList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-bookmark-id]");
  if (!button) {
    return;
  }
  applyBookmark(button.dataset.bookmarkId);
});

render();
