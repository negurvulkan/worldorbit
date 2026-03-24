import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import { parse, renderDocumentToScene } from "@worldorbit/core";
import {
  WorldOrbit3DUnavailableError,
  createEmbedPayload,
  createWorldOrbitEmbedMarkup,
  createAtlasViewer,
  createInteractiveViewer,
  mountWorldOrbitEmbeds,
} from "@worldorbit/viewer";

const source = `
system Iyath
  view isometric
  info
    viewpoint.overview.label "Atlas Overview"
    viewpoint.naar.label "Naar Close Orbit"
    viewpoint.naar.focus Naar
    viewpoint.naar.select Naar
    viewpoint.naar.zoom 2.2
    viewpoint.naar.rotation 14
    viewpoint.infrastructure.label "Infrastructure"
    viewpoint.infrastructure.types structure
    viewpoint.infrastructure.query relay
star Iyath
  temperature 5840
planet Naar orbit Iyath semiMajor 1.18au eccentricity 0.08 angle 28deg inclination 24deg phase 42deg image assets/naar-map.png atmosphere nitrogen-oxygen
moon Leth orbit Naar distance 220000km angle 18deg inclination 12deg
structure Relay kind relay at Naar:L4
`.trim();

const atlasSource = `
schema 2.0

system Iyath
  title "Iyath System"

defaults
  view isometric
  scale presentation
  preset atlas-card

viewpoint overview
  label "Atlas Overview"
  summary "Draft overview for the hydrated atlas path."
  projection isometric

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg

object structure Relay
  at Naar:L4
  kind relay
`.trim();

const legacyDraftSource = atlasSource.replace("schema 2.0", "schema 2.0-draft");

const schema21Source = `
schema 2.1

system Iyath
  title "Iyath System"
  epoch "JY-0001.0"
  referencePlane ecliptic

defaults
  view isometric
  scale presentation
  preset atlas-card

group inner-system
  label "Inner System"
  summary "Naar and nearby infrastructure"
  color "#d9b37a"

viewpoint inner
  label "Inner System"
  projection isometric
  filter
    groups inner-system

relation supply-route
  from Colony
  to Relay
  kind logistics
  label "Supply Route"

object star Iyath
  mass 1sol

object planet Naar
  orbit Iyath
  semiMajor 0.92au
  period 349.6d
  groups inner-system

object moon Seyra
  orbit Naar
  distance 384400km
  epoch "JY-0001.0"
  referencePlane naar-equatorial
  tidalLock true
  groups inner-system

  climate
    meanSurfaceTemperature 291K

object moon Orun
  orbit Naar
  distance 192200km
  resonance Seyra 2:1
  renderLabel false
  renderOrbit false
  groups inner-system

object structure Relay
  at Naar:L4
  kind relay
  groups inner-system

object structure Colony
  surface Naar
  kind colony
  groups inner-system

object belt Outer-Belt
  orbit Iyath
  distance 5au
`.trim();

const schema21EventSource = `
schema 2.1

system Iyath
  title "Iyath System"
  epoch "JY-0001.0"

defaults
  view topdown
  preset atlas-card

viewpoint eclipse
  label "Eclipse View"
  projection topdown
  layers background guides orbits-back events objects labels metadata
  events naar-eclipse

object star Iyath
  mass 1sol

object planet Naar
  orbit Iyath
  semiMajor 1au
  phase 15deg

object moon Seyra
  orbit Naar
  distance 384400km
  phase 40deg

event naar-eclipse
  kind solar-eclipse
  label "Naar Eclipse"
  target Naar
  participants Iyath Naar Seyra
  timing "Local noon"
  visibility "Naar equatorial belt"

  positions
    pose Naar
      orbit Iyath
      semiMajor 1au
      phase 90deg

    pose Seyra
      orbit Naar
      distance 384400km
      phase 90deg
`.trim();

const schema25Source = `
schema 2.5

system Helion
  title "Helion"
  epoch "JY-0214.0"
  referencePlane ecliptic

defaults
  view orthographic
  scale presentation
  preset atlas-card

viewpoint overview
  label "Overview"
  projection orthographic
  camera
    azimuth 28
    elevation 18

viewpoint eclipse
  label "Perspective Eclipse"
  focus Aster
  projection perspective
  events aster-eclipse
  camera
    azimuth 42
    elevation 24
    distance 6

object star Helion
  mass 1sol

object planet Aster
  orbit Helion
  semiMajor 1au
  phase 20deg

object moon Beryl
  orbit Aster
  distance 300000km
  phase 40deg

event aster-eclipse
  kind solar-eclipse
  target Aster
  participants Helion Aster Beryl
  epoch "JY-0214.0"
  referencePlane ecliptic

  positions
    pose Beryl
      orbit Aster
      distance 300000km
      phase 90deg
`.trim();

function installDomGlobals(window) {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    Element: globalThis.Element,
    SVGSVGElement: globalThis.SVGSVGElement,
    SVGGElement: globalThis.SVGGElement,
    CSS: globalThis.CSS,
    ResizeObserver: globalThis.ResizeObserver,
  };

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Element = window.Element;
  globalThis.SVGSVGElement = window.SVGSVGElement;
  globalThis.SVGGElement = window.SVGGElement;
  globalThis.CSS = window.CSS ?? { escape: (value) => value };
  globalThis.ResizeObserver = window.ResizeObserver;

  return () => {
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.HTMLElement = previous.HTMLElement;
    globalThis.Element = previous.Element;
    globalThis.SVGSVGElement = previous.SVGSVGElement;
    globalThis.SVGGElement = previous.SVGGElement;
    globalThis.CSS = previous.CSS;
    globalThis.ResizeObserver = previous.ResizeObserver;
  };
}

function createRect(width, height) {
  return {
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON() {
      return {};
    },
  };
}

test("interactive viewer mounts, updates, selects, exports, and destroys cleanly", () => {
  const dom = new JSDOM(`<div id="preview"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const preview = dom.window.document.getElementById("preview");
  const selections = [];
  const selectionDetails = [];
  const hovers = [];
  const hoverDetails = [];
  const tooltipChanges = [];
  const views = [];
  const filters = [];
  const viewpoints = [];

  preview.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 1080,
    bottom: 720,
    width: 1080,
    height: 720,
    toJSON() {
      return {};
    },
  });

  try {
    const viewer = createInteractiveViewer(preview, {
      source,
      preset: "atlas-card",
      width: 1080,
      height: 720,
      minimap: true,
      tooltipMode: "pinned",
      onSelectionChange(selection) {
        selections.push(selection?.objectId ?? null);
      },
      onSelectionDetailsChange(details) {
        selectionDetails.push(details?.objectId ?? null);
      },
      onHoverChange(selection) {
        hovers.push(selection?.objectId ?? null);
      },
      onHoverDetailsChange(details) {
        hoverDetails.push(details?.objectId ?? null);
      },
      onTooltipChange(details) {
        tooltipChanges.push(details?.objectId ?? null);
      },
      onViewChange(state) {
        views.push(state);
      },
      onFilterChange(filter, visibleObjects) {
        filters.push({
          filter,
          visible: visibleObjects.map((object) => object.objectId),
        });
      },
      onViewpointChange(viewpoint) {
        viewpoints.push(viewpoint?.id ?? null);
      },
    });

    assert.ok(preview.querySelector("svg"));
    assert.ok(preview.querySelector("#worldorbit-camera-root"));
    assert.ok(preview.querySelector("[data-worldorbit-minimap]"));
    assert.ok(views.length > 0);
    assert.equal(viewer.getScene().projection, "isometric");
    assert.equal(viewer.getScene().renderPreset, "atlas-card");
    assert.ok(viewer.listViewpoints().some((viewpoint) => viewpoint.id === "naar"));
    assert.equal(viewer.search("relay")[0]?.objectId, "Relay");

    viewer.setDocument(parse(source).document);
    viewer.setRenderOptions({
      preset: "diagram",
      projection: "topdown",
      scaleModel: {
        bodyRadiusMultiplier: 1.4,
      },
    });
    assert.equal(viewer.getRenderOptions().preset, "diagram");
    assert.equal(viewer.getRenderOptions().projection, "topdown");
    assert.equal(viewer.getRenderOptions().scaleModel?.bodyRadiusMultiplier, 1.4);
    assert.equal(viewer.getScene().projection, "topdown");

    viewer.setRenderOptions({
      preset: "atlas-card",
      projection: "isometric",
      scaleModel: {
        bodyRadiusMultiplier: 1.25,
      },
    });
    assert.equal(viewer.getScene().projection, "isometric");
    assert.equal(viewer.goToViewpoint("naar"), true);
    assert.equal(viewer.getActiveViewpoint()?.id, "naar");
    assert.equal(viewer.getSelectionDetails()?.focusPath.at(-1)?.objectId, "Naar");
    viewer.focusObject("Naar");
    assert.equal(viewer.getState().selectedObjectId, "Naar");
    viewer.setFilter({ objectTypes: ["moon"] });
    assert.deepEqual(
      viewer.getVisibleObjects().map((object) => object.objectId).sort(),
      ["Iyath", "Leth", "Naar"],
    );
    assert.ok(filters.at(-1)?.visible.includes("Leth"));

    const bookmark = viewer.captureBookmark("moon path", "Moon Path");
    viewer.goToViewpoint("infrastructure");
    assert.equal(viewer.getActiveViewpoint()?.id, "infrastructure");
    assert.equal(viewpoints.at(-1), "infrastructure");
    viewer.applyBookmark(bookmark);
    assert.equal(viewer.getVisibleObjects().some((object) => object.objectId === "Leth"), true);

    const atlasState = viewer.serializeAtlasState();
    viewer.setAtlasState(atlasState);
    assert.ok(viewer.getAtlasState().filter);

    const target = preview.querySelector('[data-object-id="Naar"]');
    target?.dispatchEvent(new dom.window.MouseEvent("mouseover", { bubbles: true }));
    target?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

    assert.equal(hovers.at(-1), "Naar");
    assert.equal(selections.at(-1), "Naar");
    assert.equal(selectionDetails.at(-1), "Naar");
    assert.equal(hoverDetails.at(-1), "Naar");
    assert.equal(tooltipChanges.at(-1), "Naar");
    assert.match(target?.getAttribute("class") ?? "", /wo-object-selected/);
    assert.ok(preview.querySelector("[data-worldorbit-tooltip]"));
    assert.equal(viewer.getTooltipDetails()?.objectId, "Naar");
    viewer.pinTooltip(null);
    preview.dispatchEvent(new dom.window.MouseEvent("mouseleave", { bubbles: true }));
    assert.equal(viewer.getTooltipDetails(), null);
    assert.match(viewer.exportSvg(), /wo-object-selected/);
    assert.match(viewer.exportSvg(), /assets\/naar-map\.png/);
    assert.match(viewer.exportSvg(), /wo-orbit-back/);
    assert.match(viewer.exportSvg(), /data-layer-id="labels"/);
    assert.equal(viewer.getObjectDetails("Naar")?.parent?.objectId, "Iyath");
    assert.ok((viewer.getObjectDetails("Naar")?.ancestors.length ?? 0) >= 1);

    const selectionCount = selections.length;
    viewer.destroy();

    preview
      .querySelector('[data-object-id="Leth"]')
      ?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

    assert.equal(selections.length, selectionCount);
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});

test("interactive viewer can load schema 2.0 source and preserve atlas preset defaults", () => {
  const dom = new JSDOM(`<div id="preview"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const preview = dom.window.document.getElementById("preview");

  preview.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 960,
    bottom: 560,
    width: 960,
    height: 560,
    toJSON() {
      return {};
    },
  });

  try {
    const viewer = createInteractiveViewer(preview, {
      source: atlasSource,
    });

    assert.equal(viewer.getScene().renderPreset, "atlas-card");
    assert.equal(viewer.getScene().projection, "isometric");
    assert.equal(viewer.listViewpoints()[0]?.summary, "Draft overview for the hydrated atlas path.");
    assert.ok(preview.querySelector("svg"));

    viewer.destroy();
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});

test("interactive viewer keeps screen-space labels at a stable font size while zooming", () => {
  const dom = new JSDOM(`<div id="preview"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const preview = dom.window.document.getElementById("preview");

  preview.getBoundingClientRect = () => createRect(1080, 720);

  try {
    const viewer = createInteractiveViewer(preview, {
      source,
      preset: "atlas-card",
      width: 1080,
      height: 720,
    });
    const svg = preview.querySelector("svg");
    svg.getBoundingClientRect = () => createRect(1080, 720);
    viewer.setState(viewer.getState());

    const initialLabel = preview.querySelector('[data-worldorbit-screen-label="true"][data-object-id="Relay"]');
    const initialPrimary = initialLabel?.querySelector(".wo-viewer-label-primary");
    const initialLeft = initialLabel?.style.left;
    const initialFontSize = initialPrimary?.style.fontSize;

    assert.equal(
      preview.querySelector('[data-layer-id="labels"]')?.getAttribute("display"),
      "none",
    );
    assert.equal(initialFontSize, `${14 * viewer.getScene().scaleModel.labelMultiplier}px`);

    viewer.zoomBy(1.8, { x: 120, y: 120 });

    const zoomedLabel = preview.querySelector('[data-worldorbit-screen-label="true"][data-object-id="Relay"]');
    const zoomedPrimary = zoomedLabel?.querySelector(".wo-viewer-label-primary");

    assert.equal(zoomedPrimary?.style.fontSize, initialFontSize);
    assert.notEqual(zoomedLabel?.style.left, initialLeft);

    viewer.destroy();
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});

test("mounted embeds size interactive viewers from their container and react to resize", () => {
  const dom = new JSDOM(`<div id="root"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const root = dom.window.document.getElementById("root");
  const scene = renderDocumentToScene(parse(source).document);
  const payload = createEmbedPayload(scene, "interactive-2d");
  const observers = [];
  let width = 640;
  let height = 360;

  class FakeResizeObserver {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }

    observe() {}

    disconnect() {
      this.disconnected = true;
    }

    trigger() {
      this.callback();
    }
  }

  dom.window.ResizeObserver = FakeResizeObserver;
  globalThis.ResizeObserver = FakeResizeObserver;

  root.innerHTML = `<div id="embed-host" style="width:${width}px;height:${height}px"></div>`;
  const host = dom.window.document.getElementById("embed-host");
  host.insertAdjacentHTML("beforeend", createWorldOrbitEmbedMarkup(payload));
  const embed = host.querySelector("[data-worldorbit-embed]");

  Object.defineProperty(embed, "clientWidth", {
    configurable: true,
    get() {
      return width;
    },
  });
  Object.defineProperty(embed, "clientHeight", {
    configurable: true,
    get() {
      return height;
    },
  });
  embed.getBoundingClientRect = () => createRect(width, height);

  try {
    const mounted = mountWorldOrbitEmbeds(root);
    const viewer = mounted.viewers[0];

    assert.equal(viewer.getRenderOptions().width, 640);
    assert.equal(viewer.getRenderOptions().height, 360);

    width = 480;
    height = 240;
    observers[0]?.trigger();

    assert.equal(viewer.getRenderOptions().width, 480);
    assert.equal(viewer.getRenderOptions().height, 240);

    mounted.destroy();
    assert.equal(observers[0]?.disconnected, true);
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});

test("mounted embeds derive a stable fallback height when the host has no explicit height", () => {
  const dom = new JSDOM(`<div id="root"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const root = dom.window.document.getElementById("root");
  const scene = renderDocumentToScene(parse(source).document);
  const payload = createEmbedPayload(scene, "interactive-2d");
  let width = 600;

  root.innerHTML = `<div id="embed-host"></div>`;
  const host = dom.window.document.getElementById("embed-host");
  host.insertAdjacentHTML("beforeend", createWorldOrbitEmbedMarkup(payload));
  const embed = host.querySelector("[data-worldorbit-embed]");

  Object.defineProperty(embed, "clientWidth", {
    configurable: true,
    get() {
      return width;
    },
  });
  Object.defineProperty(embed, "clientHeight", {
    configurable: true,
    get() {
      return 0;
    },
  });
  embed.getBoundingClientRect = () => createRect(width, 0);

  try {
    const mounted = mountWorldOrbitEmbeds(root);
    const viewer = mounted.viewers[0];
    const expectedHeight = Math.max(
      Math.round(width * (scene.height / scene.width)),
      Math.min(scene.height, 240),
    );

    assert.equal(viewer.getRenderOptions().width, 600);
    assert.equal(viewer.getRenderOptions().height, expectedHeight);

    mounted.destroy();
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});

test("atlas viewer exposes built-in atlas controls and inspector state", () => {
  const dom = new JSDOM(`<div id="preview"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const preview = dom.window.document.getElementById("preview");
  const inspectorSnapshots = [];

  preview.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 960,
    bottom: 560,
    width: 960,
    height: 560,
    toJSON() {
      return {};
    },
  });

  try {
    const atlasViewer = createAtlasViewer(preview, {
      source: legacyDraftSource,
      onInspectorChange(snapshot) {
        inspectorSnapshots.push(snapshot);
      },
    });

    assert.ok(preview.querySelector("[data-atlas-toolbar]"));
    assert.ok(preview.querySelector("[data-atlas-inspector]"));
    assert.ok(atlasViewer.listSearchResults().some((result) => result.objectId === "Relay"));

    atlasViewer.setSearchQuery("relay");
    assert.equal(atlasViewer.listSearchResults()[0]?.objectId, "Relay");
    atlasViewer.setObjectTypeFilter("structure");
    assert.equal(atlasViewer.goToViewpoint("overview"), true);

    const bookmark = atlasViewer.captureBookmark("overview", "Overview");
    assert.equal(atlasViewer.applyBookmark(bookmark), true);
    assert.equal(atlasViewer.getAtlasState().version, "2.5");
    assert.equal(atlasViewer.getInspectorSnapshot().scene.renderPreset, "atlas-card");
    assert.ok(inspectorSnapshots.length > 0);

    atlasViewer.destroy();
    assert.equal(preview.textContent?.trim() ?? "", "");
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});

test("interactive viewer loads schema 2.1 semantic groups and relations without dropping details", () => {
  const dom = new JSDOM(`<div id="preview"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const preview = dom.window.document.getElementById("preview");

  preview.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 960,
    bottom: 560,
    width: 960,
    height: 560,
    toJSON() {
      return {};
    },
  });

  try {
    const viewer = createInteractiveViewer(preview, {
      source: schema21Source,
      width: 960,
      height: 560,
    });

    viewer.setFilter({ groupIds: ["inner-system"] });

    assert.ok(viewer.getScene().semanticGroups.some((group) => group.id === "inner-system"));
    assert.ok(viewer.getScene().relations.some((relation) => relation.relationId === "supply-route"));
    assert.equal(viewer.getVisibleObjects().some((object) => object.objectId === "Outer-Belt"), false);
    assert.equal(viewer.getVisibleObjects().some((object) => object.objectId === "Orun"), true);
    assert.equal(viewer.getObjectDetails("Seyra")?.object.epoch, "JY-0001.0");
    assert.equal(viewer.getObjectDetails("Seyra")?.object.referencePlane, "naar-equatorial");
    assert.equal(viewer.getObjectDetails("Seyra")?.object.tidalLock, true);
    assert.equal(viewer.getObjectDetails("Seyra")?.object.typedBlocks?.climate?.meanSurfaceTemperature, "291K");
    assert.equal(viewer.getObjectDetails("Orun")?.object.resonance?.ratio, "2:1");
    assert.equal(viewer.getObjectDetails("Orun")?.semanticGroups[0]?.id, "inner-system");
    assert.equal(viewer.getObjectDetails("Orun")?.relations.length, 0);
    assert.match(viewer.exportSvg(), /data-layer-id="relations"/);
    assert.match(viewer.exportSvg(), /data-relation-id="supply-route"/);

    viewer.destroy();
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});

test("interactive viewer can activate schema 2.1 events and expose related event details", () => {
  const dom = new JSDOM(`<div id="preview"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const preview = dom.window.document.getElementById("preview");

  preview.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 960,
    bottom: 560,
    width: 960,
    height: 560,
    toJSON() {
      return {};
    },
  });

  try {
    const viewer = createInteractiveViewer(preview, {
      source: schema21EventSource,
      width: 960,
      height: 560,
    });

    assert.equal(viewer.getActiveEventId(), null);
    viewer.setActiveEvent("naar-eclipse");

    const details = viewer.getObjectDetails("Seyra");
    assert.equal(viewer.getActiveEventId(), "naar-eclipse");
    assert.equal(viewer.getRenderOptions().activeEventId, "naar-eclipse");
    assert.ok(details?.relatedEvents.some((eventEntry) => eventEntry.eventId === "naar-eclipse"));
    assert.match(viewer.exportSvg(), /data-layer-id="events"/);
    assert.match(viewer.exportSvg(), /data-event-id="naar-eclipse"/);

    viewer.destroy();
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});

test("atlas viewer exposes a schema 2.1 group filter and relation-aware inspector snapshot", () => {
  const dom = new JSDOM(`<div id="preview"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const preview = dom.window.document.getElementById("preview");

  preview.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 960,
    bottom: 560,
    width: 960,
    height: 560,
    toJSON() {
      return {};
    },
  });

  try {
    const atlasViewer = createAtlasViewer(preview, {
      source: schema21Source,
    });
    const groupFilter = preview.querySelector("[data-atlas-group-filter]");

    assert.ok(groupFilter);
    assert.match(groupFilter?.innerHTML ?? "", /inner-system/);
    assert.ok(atlasViewer.getInspectorSnapshot().scene.semanticGroupCount >= 1);
    assert.ok(atlasViewer.getInspectorSnapshot().scene.relationCount >= 1);

    groupFilter.value = "inner-system";
    groupFilter.dispatchEvent(new dom.window.Event("change", { bubbles: true }));

    assert.deepEqual(atlasViewer.getAtlasState().filter?.groupIds, ["inner-system"]);

    atlasViewer.destroy();
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});

test("interactive viewer preserves schema 2.5 camera metadata in atlas state and viewpoint changes", () => {
  const dom = new JSDOM(`<div id="preview"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const preview = dom.window.document.getElementById("preview");

  preview.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 960,
    bottom: 560,
    width: 960,
    height: 560,
    toJSON() {
      return {};
    },
  });

  try {
    const viewer = createInteractiveViewer(preview, {
      source: schema25Source,
      width: 960,
      height: 560,
    });

    assert.equal(viewer.goToViewpoint("eclipse"), true);
    assert.equal(viewer.getScene().projection, "perspective");
    assert.equal(viewer.getScene().renderProjection, "isometric");
    assert.equal(viewer.getActiveViewpoint()?.camera?.distance, 6);
    assert.equal(viewer.getRenderOptions().camera?.azimuth, 42);
    assert.equal(viewer.getAtlasState().version, "2.5");
    assert.equal(viewer.getAtlasState().renderOptions.camera?.distance, 6);
    assert.equal(viewer.getAtlasState().renderOptions.projection, "perspective");

    viewer.setActiveEvent("aster-eclipse");
    assert.equal(viewer.getScene().objects.find((object) => object.objectId === "Beryl")?.object.epoch, "JY-0214.0");

    viewer.destroy();
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});

test("interactive viewer keeps 2D animation disabled and fails clearly when 3D is unavailable", () => {
  const dom = new JSDOM(`<div id="preview"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const preview = dom.window.document.getElementById("preview");

  preview.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 960,
    bottom: 560,
    width: 960,
    height: 560,
    toJSON() {
      return {};
    },
  });

  try {
    const viewer = createInteractiveViewer(preview, {
      source: schema25Source,
      width: 960,
      height: 560,
    });

    assert.equal(viewer.getViewMode(), "2d");
    viewer.setAnimationSpeed(2);
    viewer.playAnimation();
    assert.equal(viewer.getAnimationState().playing, false);
    assert.throws(() => viewer.setViewMode("3d"), WorldOrbit3DUnavailableError);
    assert.equal(viewer.getViewMode(), "2d");

    viewer.destroy();

    assert.throws(
      () =>
        createInteractiveViewer(preview, {
          source: schema25Source,
          width: 960,
          height: 560,
          viewMode: "3d",
        }),
      WorldOrbit3DUnavailableError,
    );
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});

test("interactive viewer applies stable defaults for 3D quality options", () => {
  const dom = new JSDOM(`<div id="preview"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const preview = dom.window.document.getElementById("preview");

  preview.getBoundingClientRect = () => createRect(960, 560);

  try {
    const viewer = createInteractiveViewer(preview, {
      source: schema25Source,
      width: 960,
      height: 560,
    });

    assert.equal(viewer.getRenderOptions().quality, "balanced");
    assert.equal(viewer.getRenderOptions().style3d, "symbolic");

    viewer.setRenderOptions({
      quality: "high",
      style3d: "cinematic",
    });

    assert.equal(viewer.getRenderOptions().quality, "high");
    assert.equal(viewer.getRenderOptions().style3d, "cinematic");

    viewer.destroy();
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});
