const heroSource = `schema 3.0

system Iyath

defaults
  view orthographic
  scale presentation
  preset atlas-card
  theme atlas

viewpoint overview
  projection perspective
  camera
    azimuth 24
    elevation 18
    distance 5

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg

object moon Seyra
  orbit Naar
  distance 384400km

object craft Courier
  free 9au
  trajectory courier-transfer

trajectory courier-transfer
  craft Courier
  from DeepSpace
  to Naar

  maneuver departure
    deltaV 1.8km/s

  maneuver flyby
    assist Iyath
    around Iyath
    periapsis 420000km
    turnAngle 13deg`;

const example1Source = `schema 3.0

system Sol

object star Sun

object craft Scout
  free 5au`;

const example2Source = `schema 3.0

system Iyath
  title "Iyath System"

defaults
  view orthographic
  scale presentation
  preset atlas-card
  theme atlas

viewpoint inner
  projection perspective
  camera
    azimuth 28
    elevation 20
    distance 5

group inner-system
  label "Inner System"

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  phase 42deg
  atmosphere nitrogen-oxygen
  groups inner-system

object moon Leth
  orbit Naar
  distance 384000km
  phase 140deg

object structure Relay-One
  at Naar:L4
  kind relay

object craft Courier
  free 9au
  trajectory courier-transfer

trajectory courier-transfer
  craft Courier
  from DeepSpace
  to Naar

  maneuver departure
    deltaV 1.8km/s

  maneuver capture
    to Naar
    deltaV 0.6km/s`;

const playgroundDefaultSource = `schema 3.0

system Demo
  title "Demo System"

defaults
  view orthographic
  scale presentation
  preset atlas-card
  theme atlas

viewpoint demo
  projection perspective
  camera
    azimuth 32
    elevation 20
    distance 5

object star Helion

object planet Astera
  orbit Helion
  semiMajor 0.8au
  phase 45deg

object planet Belis
  orbit Helion
  semiMajor 1.6au
  phase 180deg

object moon B1
  orbit Belis
  distance 250000km
  phase 80deg

object craft Courier
  free 9au
  trajectory courier-transfer

trajectory courier-transfer
  craft Courier
  from DeepSpace
  to Belis

  maneuver departure
    deltaV 1.8km/s

  maneuver flyby
    assist Helion
    around Helion
    periapsis 480000km
    turnAngle 11deg`;

const previewModes = {
  hero: "3d",
  playground: "3d",
};

const previewViewers = new Map();

function syncPreviewButtons(prefix, mode) {
  const button2d = document.getElementById(`${prefix}-2d`);
  const button3d = document.getElementById(`${prefix}-3d`);
  if (button2d) button2d.setAttribute("aria-pressed", mode === "2d" ? "true" : "false");
  if (button3d) button3d.setAttribute("aria-pressed", mode === "3d" ? "true" : "false");
}

function mountPreview(targetId, source, options = {}) {
  const target = document.getElementById(targetId);
  if (!target || !window.WorldOrbit) return null;

  const existingViewer = previewViewers.get(targetId);
  if (existingViewer) {
    existingViewer.destroy();
    previewViewers.delete(targetId);
  }

  try {
    target.innerHTML = "";
    const loaded = window.WorldOrbit.loadWorldOrbitSource(source);
    const viewer = window.WorldOrbit.createInteractiveViewer(target, {
      document: loaded.document,
      projection: options.projection || "document",
      initialViewpointId: options.initialViewpointId || null,
      theme: "atlas",
    });
    previewViewers.set(targetId, viewer);
    if (options.viewMode === "3d") {
      viewer.setViewMode("3d");
    }
    return viewer;
  } catch (error) {
    target.innerHTML = `<div style="padding:16px;color:#ffb4b4;font:14px/1.5 sans-serif;">Preview failed.<br>${String(error)}</div>`;
    return null;
  }
}

function renderHeroPreview(mode = previewModes.hero) {
  previewModes.hero = mode;
  const viewer = mountPreview("hero-preview", heroSource, {
    projection: "document",
    initialViewpointId: "overview",
    viewMode: mode,
  });
  const tag = document.getElementById("hero-preview-tag");
  if (!viewer) {
    previewModes.hero = "2d";
    syncPreviewButtons("hero-preview", "2d");
    if (tag) {
      tag.textContent = "3D unavailable here, showing fallback messaging";
    }
    return;
  }
  syncPreviewButtons("hero-preview", mode);
  if (tag) {
    tag.textContent = mode === "3d"
      ? "Rendered with WorldOrbit in 3D"
      : "Rendered with WorldOrbit in 2D";
  }
}

function renderPlayground() {
  const sourceField = document.getElementById("playground-source");
  const status = document.getElementById("playground-status");
  if (!sourceField || !status) return;
  const viewer = mountPreview("playground-preview", sourceField.value, {
    projection: "document",
    initialViewpointId: "demo",
    viewMode: previewModes.playground,
  });
  if (viewer) {
    syncPreviewButtons("playground-preview", previewModes.playground);
    status.textContent = `Preview rendered successfully in ${previewModes.playground.toUpperCase()}.`;
    status.style.color = "#96a9e6";
  } else {
    status.textContent = `Render failed in ${previewModes.playground.toUpperCase()}.`;
    status.style.color = "#ffb4b4";
  }
}

mountPreview("example-1-preview", example1Source, {
  projection: "isometric",
  viewMode: "2d",
});

mountPreview("example-2-preview", example2Source, {
  projection: "document",
  initialViewpointId: "inner",
  viewMode: "2d",
});

document.getElementById("hero-preview-2d")?.addEventListener("click", () => renderHeroPreview("2d"));
document.getElementById("hero-preview-3d")?.addEventListener("click", () => renderHeroPreview("3d"));
document.getElementById("playground-preview-2d")?.addEventListener("click", () => {
  previewModes.playground = "2d";
  renderPlayground();
});
document.getElementById("playground-preview-3d")?.addEventListener("click", () => {
  previewModes.playground = "3d";
  renderPlayground();
});
document.getElementById("playground-render")?.addEventListener("click", renderPlayground);
document.getElementById("playground-reset")?.addEventListener("click", () => {
  const sourceField = document.getElementById("playground-source");
  if (sourceField) {
    sourceField.value = playgroundDefaultSource;
  }
  renderPlayground();
});

renderHeroPreview("3d");
renderPlayground();
