import { parse, renderDocumentToScene } from "../packages/core/dist/index.js";
import {
  createInteractiveViewer,
  createWorldOrbitEmbedMarkup,
} from "../packages/viewer/dist/index.js";

const sampleSource = `system Iyath
  title "Iyath System"
  view topdown
  scale presentation

star Iyath
  class G2
  radius 1.08sol
  mass 1.02sol
  color #ffd36a

planet Naar
  class terrestrial
  culture Enari
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.03
  period 412d
  tags habitable homeworld

  info
    faction "Veyrathische Republik"
    description "Heimatwelt der Enari."

moon Leth
  orbit Naar
  distance 220000km
  period 18d

belt Ember-Belt
  orbit Iyath
  distance 2.7au
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
  distance 4.9au`;

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

let viewer = null;
let currentDocument = null;
let currentSelection = null;
let currentScene = null;
let renderTimer = 0;

sourceField.value = sampleSource;

function scheduleRender() {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(render, 100);
}

function render() {
  try {
    const result = parse(sourceField.value);
    currentDocument = result.document;
    currentSelection = null;
    currentScene = renderDocumentToScene(currentDocument, {
      width: 1080,
      height: 720,
    });

    if (!viewer) {
      viewer = createInteractiveViewer(preview, {
        scene: currentScene,
        theme: themeSelect.value,
        onSelectionChange(selection) {
          currentSelection = selection;
          updateSummary();
          updateModelPanel();
        },
        onViewChange() {
          updateDownloadState();
        },
      });
    } else {
      viewer.setScene(currentScene);
      viewer.setState({ selectedObjectId: null });
    }

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

function rebuildViewerTheme() {
  if (!viewer || !currentScene) {
    return;
  }

  const state = viewer.getState();
  const selectedObjectId = state.selectedObjectId;
  viewer.destroy();
  viewer = createInteractiveViewer(preview, {
    scene: currentScene,
    theme: themeSelect.value,
    onSelectionChange(selection) {
      currentSelection = selection;
      updateSummary();
      updateModelPanel();
    },
    onViewChange() {
      updateDownloadState();
    },
  });

  if (selectedObjectId) {
    viewer.focusObject(selectedObjectId);
  } else {
    viewer.setState(state);
  }

  updateEmbedPanel();
}

function updateSummary() {
  if (!currentDocument || !currentScene) {
    summary.textContent = "Keine Szene geladen";
    return;
  }

  const base = `${currentDocument.objects.length} Objekte · ${currentScene.layoutPreset} layout`;
  summary.textContent = currentSelection
    ? `${base} · Auswahl: ${currentSelection.objectId}`
    : base;
}

function updateModelPanel() {
  if (!currentDocument) {
    modelOutput.textContent = "";
    return;
  }

  const payload = currentSelection
    ? {
        selectedObject: currentSelection.object,
        renderNode: {
          objectId: currentSelection.objectId,
          x: currentSelection.x,
          y: currentSelection.y,
          radius: currentSelection.radius,
        },
        documentSummary: {
          system: currentDocument.system?.id ?? null,
          objectCount: currentDocument.objects.length,
          schemaVersion: currentDocument.version,
        },
      }
    : currentDocument;

  modelOutput.textContent = JSON.stringify(payload, null, 2);
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
  link.download = "worldorbit-v1-scene.svg";
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
themeSelect.addEventListener("change", rebuildViewerTheme);

render();
