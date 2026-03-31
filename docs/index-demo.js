const heroSource = `schema 2.6

system Iyath
  title "Iyath System"

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

group inner-system
  label "Inner System"

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  atmosphere nitrogen-oxygen
  groups inner-system

object moon Seyra
  orbit Naar
  distance 384400km

event naar-eclipse
  kind solar-eclipse
  target Naar
  participants Iyath Naar Seyra`;

const playgroundDefaultSource = `schema 2.6

system Iyath
  title "Iyath System"

defaults
  view orthographic
  scale presentation
  preset atlas-card
  theme atlas

viewpoint overview
  projection perspective
  camera
    azimuth 34
    elevation 22
    distance 5

group inner-system
  label "Inner System"

annotation naar-notes
  label "Naar Notes"
  target Naar
  body "Heimatwelt der Enari."

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  atmosphere nitrogen-oxygen
  groups inner-system

object moon Seyra
  orbit Naar
  distance 384400km
  groups inner-system

event naar-eclipse
  kind solar-eclipse
  target Naar
  participants Iyath Naar Seyra

  positions
    pose Naar
      orbit Iyath
      semiMajor 1.18au
      phase 90deg

    pose Seyra
      orbit Naar
      distance 384400km
      phase 90deg`;

const demoViewModes = {
  hero: "3d",
  playground: "3d",
};

const demoViewers = new Map();

function syncModeButtons(prefix, mode) {
  const button2d = document.getElementById(`${prefix}-view-2d`);
  const button3d = document.getElementById(`${prefix}-view-3d`);
  if (button2d) button2d.setAttribute("aria-pressed", mode === "2d" ? "true" : "false");
  if (button3d) button3d.setAttribute("aria-pressed", mode === "3d" ? "true" : "false");
}

function mountWorldOrbitDemo(targetId, source, options = {}) {
  const target = document.getElementById(targetId);
  if (!target || !window.WorldOrbit) return null;

  const existingViewer = demoViewers.get(targetId);
  if (existingViewer) {
    existingViewer.destroy();
    demoViewers.delete(targetId);
  }

  try {
    target.innerHTML = "";
    const loaded = window.WorldOrbit.loadWorldOrbitSource(source);
    const viewer = window.WorldOrbit.createInteractiveViewer(target, {
      document: loaded.document,
      projection: options.projection || "document",
      initialViewpointId: options.initialViewpointId || "overview",
      theme: options.theme || "atlas",
    });
    demoViewers.set(targetId, viewer);

    if (options.viewMode === "3d") {
      viewer.setViewMode("3d");
    }

    return viewer;
  } catch (error) {
    target.innerHTML = `<div style="padding:16px;color:#ffb4b4;font:14px/1.5 sans-serif;">WorldOrbit preview failed to render.<br>${String(error)}</div>`;
    return null;
  }
}

function renderHero(mode = demoViewModes.hero) {
  demoViewModes.hero = mode;
  const tag = document.getElementById("hero-view-tag");
  const viewer = mountWorldOrbitDemo("hero-view", heroSource, {
    projection: "document",
    initialViewpointId: "overview",
    theme: "atlas",
    viewMode: mode,
  });

  if (!viewer) {
    demoViewModes.hero = "2d";
    syncModeButtons("hero", "2d");
    if (tag) {
      tag.textContent = "3D unavailable here, showing fallback messaging instead.";
    }
    return;
  }

  syncModeButtons("hero", mode);
  if (tag) {
    tag.textContent = mode === "3d"
      ? "Live 3D demo powered by the same document"
      : "Live 2D demo powered by the same document";
  }
}

function renderPlayground() {
  const sourceField = document.getElementById("playground-source");
  const preview = document.getElementById("playground-preview");
  const status = document.getElementById("playground-status");
  if (!sourceField || !preview || !status || !window.WorldOrbit) return;

  const viewer = mountWorldOrbitDemo("playground-preview", sourceField.value, {
    projection: "document",
    initialViewpointId: "overview",
    theme: "atlas",
    viewMode: demoViewModes.playground,
  });

  if (viewer) {
    syncModeButtons("playground", demoViewModes.playground);
    status.textContent = `Preview rendered successfully in ${demoViewModes.playground.toUpperCase()}.`;
    status.style.color = "#96a9e6";
  } else {
    preview.innerHTML = "";
    status.textContent = `Render failed in ${demoViewModes.playground.toUpperCase()}.`;
    status.style.color = "#ffb4b4";
  }
}

document.getElementById("hero-view-2d")?.addEventListener("click", () => renderHero("2d"));
document.getElementById("hero-view-3d")?.addEventListener("click", () => renderHero("3d"));
document.getElementById("playground-view-2d")?.addEventListener("click", () => {
  demoViewModes.playground = "2d";
  renderPlayground();
});
document.getElementById("playground-view-3d")?.addEventListener("click", () => {
  demoViewModes.playground = "3d";
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

renderHero("3d");
renderPlayground();
