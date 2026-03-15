import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import { parse } from "@worldorbit/core";
import { createInteractiveViewer } from "@worldorbit/viewer";

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

function installDomGlobals(window) {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    Element: globalThis.Element,
    SVGSVGElement: globalThis.SVGSVGElement,
    SVGGElement: globalThis.SVGGElement,
    CSS: globalThis.CSS,
  };

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Element = window.Element;
  globalThis.SVGSVGElement = window.SVGSVGElement;
  globalThis.SVGGElement = window.SVGGElement;
  globalThis.CSS = window.CSS ?? { escape: (value) => value };

  return () => {
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.HTMLElement = previous.HTMLElement;
    globalThis.Element = previous.Element;
    globalThis.SVGSVGElement = previous.SVGSVGElement;
    globalThis.SVGGElement = previous.SVGGElement;
    globalThis.CSS = previous.CSS;
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
    assert.match(target?.getAttribute("class") ?? "", /wo-object-selected/);
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
