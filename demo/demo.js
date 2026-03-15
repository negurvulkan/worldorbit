import { parse } from "@worldorbit/core";
import { createInteractiveViewer, createWorldOrbitEmbedMarkup } from "@worldorbit/viewer";

const sampleSource = `system Iyath
  title "Iyath System"
  view isometric
  scale presentation

star Iyath
  class G2
  radius 1.08sol
  mass 1.02sol
  temperature 5840
  color #ffd36a

planet Naar
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
  tags habitable homeworld

  info
    faction "Veyrathische Republik"
    description "Heimatwelt der Enari."

moon Leth
  orbit Naar
  distance 220000km
  angle 34deg
  inclination 18deg
  phase 210deg
  period 18d
  radius 0.27re
  albedo 0.21

ring Dawn-Ring
  orbit Naar
  distance 185000km
  angle 22deg
  inclination 18deg
  inner 120000km
  outer 190000km

belt Ember-Belt
  orbit Iyath
  semiMajor 2.7au
  eccentricity 0.16
  angle 14deg
  inclination 11deg
  phase 166deg
  inner 2.45au
  outer 2.95au
  tags mining debris

structure L4-Relay
  kind relay
  at Naar:L4

structure Skyhook
  kind elevator
  surface Naar

structure OuterGate
  kind gate
  free 8.4au

phenomenon Helioscar
  kind anomaly
  orbit Iyath
  semiMajor 4.9au
  eccentricity 0.2
  angle 36deg
  inclination 9deg
  phase 228deg
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
const themeSelect = document.querySelector("#theme");
const presetSelect = document.querySelector("#preset");
const projectionSelect = document.querySelector("#projection");
const orbitScaleInput = document.querySelector("#orbit-scale");
const bodyScaleInput = document.querySelector("#body-scale");
const labelScaleInput = document.querySelector("#label-scale");
const orbitScaleValue = document.querySelector("#orbit-scale-value");
const bodyScaleValue = document.querySelector("#body-scale-value");
const labelScaleValue = document.querySelector("#label-scale-value");

let viewer = null;
let currentDocument = null;
let currentSelection = null;
let currentSelectionDetails = null;
let currentScene = null;
let currentRenderOptions = getRenderOptionsFromControls();
let renderTimer = 0;

sourceField.value = sampleSource;
syncControlOutputs();

function scheduleRender() {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(render, 100);
}

function render() {
  try {
    const result = parse(sourceField.value);
    currentDocument = result.document;
    currentSelection = null;
    currentSelectionDetails = null;

    if (!viewer) {
      viewer = createInteractiveViewer(preview, {
        document: currentDocument,
        ...currentRenderOptions,
        theme: themeSelect.value,
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
      });
    } else {
      viewer.setDocument(currentDocument);
      viewer.setState({ selectedObjectId: null });
    }

    currentScene = viewer.getScene();
    updateSummary();
    updateModelPanel();
    updateEmbedPanel();
    updateDownloadState();
    errorPanel.hidden = true;
    downloadButton.disabled = false;
    enableViewerButtons(true);
  } catch (error) {
    currentDocument = null;
    currentSelection = null;
    currentSelectionDetails = null;
    currentScene = null;
    preview.innerHTML = "";
    modelOutput.textContent = "";
    embedOutput.textContent = "";
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

  if (!viewer || !currentDocument) {
    return;
  }

  viewer.setRenderOptions({
    ...currentRenderOptions,
    theme: themeSelect.value,
  });
  currentScene = viewer.getScene();
  updateSummary();
  updateModelPanel();
  updateEmbedPanel();
  updateDownloadState();
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

function syncControlOutputs() {
  orbitScaleValue.value = Number(orbitScaleInput.value).toFixed(2);
  bodyScaleValue.value = Number(bodyScaleInput.value).toFixed(2);
  labelScaleValue.value = Number(labelScaleInput.value).toFixed(2);
}

function updateSummary() {
  if (!currentDocument || !currentScene) {
    summary.textContent = "Keine Szene geladen";
    return;
  }

  const base = `${currentDocument.objects.length} Objekte - ${currentScene.projection} - ${currentScene.layoutPreset} layout`;
  const preset = currentScene.renderPreset ?? "custom";
  summary.textContent = currentSelection
    ? `${base} - ${preset} - Auswahl: ${currentSelection.objectId}`
    : `${base} - ${preset}`;
}

function updateModelPanel() {
  if (!currentDocument || !currentScene) {
    modelOutput.textContent = "";
    return;
  }

  const payload = currentSelectionDetails
    ? {
        selectedObject: {
          id: currentSelectionDetails.objectId,
          type: currentSelectionDetails.object.type,
          renderFields: pickRenderFields(currentSelectionDetails.object.properties),
          placement: pickRenderPlacement(currentSelectionDetails.object.placement),
          info: currentSelectionDetails.object.info,
        },
        atlasDetails: {
          group: currentSelectionDetails.group,
          parent: currentSelectionDetails.parent?.objectId ?? null,
          children: currentSelectionDetails.children.map((child) => child.objectId),
          ancestors: currentSelectionDetails.ancestors.map((ancestor) => ancestor.objectId),
          relatedOrbits: currentSelectionDetails.relatedOrbits.map((orbit) => orbit.objectId),
          label: currentSelectionDetails.label,
        },
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
          groups: currentScene.groups,
          layers: currentScene.layers,
          scaleModel: currentScene.scaleModel,
        },
        documentSummary: {
          system: currentDocument.system?.id ?? null,
          objectCount: currentDocument.objects.length,
          schemaVersion: currentDocument.version,
        },
      }
    : {
        document: currentDocument,
        sceneDefaults: {
          preset: currentScene.renderPreset,
          projection: currentScene.projection,
          layoutPreset: currentScene.layoutPreset,
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

  embedOutput.textContent = createWorldOrbitEmbedMarkup(
    {
      version: "1.0",
      mode: "interactive",
      scene: currentScene,
    },
    {
      theme: themeSelect.value,
      className: "worldorbit-embed demo-sample",
      preset: currentRenderOptions.preset,
    },
  );
}

function updateDownloadState() {
  downloadButton.disabled = !preview.querySelector("svg");
}

function enableViewerButtons(enabled) {
  [
    zoomInButton,
    zoomOutButton,
    rotateLeftButton,
    rotateRightButton,
    fitButton,
    resetViewButton,
  ].forEach((button) => {
    button.disabled = !enabled;
  });
}

function downloadSvg() {
  if (!viewer) {
    return;
  }

  const blob = new Blob([viewer.exportSvg()], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "worldorbit-v1-5-scene.svg";
  link.click();
  URL.revokeObjectURL(url);
}

sourceField.addEventListener("input", scheduleRender);
resetSourceButton.addEventListener("click", () => {
  sourceField.value = sampleSource;
  render();
});
downloadButton.addEventListener("click", downloadSvg);
zoomInButton.addEventListener("click", () => viewer?.zoomBy(1.2));
zoomOutButton.addEventListener("click", () => viewer?.zoomBy(1 / 1.2));
rotateLeftButton.addEventListener("click", () => viewer?.rotateBy(-15));
rotateRightButton.addEventListener("click", () => viewer?.rotateBy(15));
fitButton.addEventListener("click", () => viewer?.fitToSystem());
resetViewButton.addEventListener("click", () => viewer?.resetView());
themeSelect.addEventListener("change", applyRenderControls);
presetSelect.addEventListener("change", applyRenderControls);
projectionSelect.addEventListener("change", applyRenderControls);
orbitScaleInput.addEventListener("input", applyRenderControls);
bodyScaleInput.addEventListener("input", applyRenderControls);
labelScaleInput.addEventListener("input", applyRenderControls);

render();
