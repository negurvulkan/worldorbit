import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import { createWorldOrbitEditor } from "@worldorbit/editor";

const source = `schema 2.0

system Iyath
  title "Iyath System"

defaults
  view isometric
  scale presentation
  preset atlas-card

viewpoint overview
  label "Overview"
  projection isometric

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  image /demo/assets/naar-map.png

object structure Relay
  at Naar:L4
  kind relay
`.trim();

const dragSource = `schema 2.0

system Iyath
  title "Iyath System"

defaults
  view topdown
  preset atlas-card

object star Iyath

object planet Naar
  orbit Iyath
  distance 1.1au

object planet Sera
  orbit Iyath
  distance 1.9au
  phase 140deg

object structure Relay
  at Naar:L4
  kind relay

object structure Dock
  surface Naar
  kind dock

object phenomenon Beacon
  free 1.5
  kind signal
`.trim();

const eventSource = `schema 2.1

system Iyath
  title "Iyath System"
  epoch "JY-0001.0"

defaults
  view topdown
  preset atlas-card

viewpoint eclipse
  label "Eclipse"
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

const schema25Source = `schema 2.5

system Helion
  title "Helion"
  epoch "JY-0214.0"
  referencePlane ecliptic

defaults
  view orthographic
  preset atlas-card

viewpoint overview
  label "Overview"
  projection perspective
  rotation 12
  camera
    azimuth 28
    elevation 18
    distance 6

object star Helion
  mass 1sol

object planet Aster
  orbit Helion
  semiMajor 1au
  phase 20deg
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

function createRect(width = 1120, height = 680) {
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

function installFixedRects(window, width = 1120, height = 680) {
  const rect = createRect(width, height);
  const originalElementRect = window.HTMLElement.prototype.getBoundingClientRect;
  const originalSvgRect = window.SVGElement.prototype.getBoundingClientRect;

  window.HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return rect;
  };
  window.SVGElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return rect;
  };

  return () => {
    window.HTMLElement.prototype.getBoundingClientRect = originalElementRect;
    window.SVGElement.prototype.getBoundingClientRect = originalSvgRect;
  };
}

function getObjectPoint(root, objectId) {
  const marker = root.querySelector(
    `.wo-object[data-object-id="${objectId}"] .wo-selection-ring`,
  );
  assert.ok(marker, `Expected a rendered marker for ${objectId}`);
  return {
    x: Number(marker.getAttribute("cx")),
    y: Number(marker.getAttribute("cy")),
  };
}

function getProjectedObjectPoint(root, objectId) {
  const point = getObjectPoint(root, objectId);
  const cameraRoot = root.querySelector("[data-worldorbit-camera-root]");
  const transform = cameraRoot?.getAttribute("transform") ?? "";
  const match = transform.match(
    /translate\(([-\d.]+) ([-\d.]+)\) translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\) scale\(([-\d.]+)\)/,
  );
  if (!match) {
    return point;
  }

  const [, tx, ty, cx, cy, rotationDeg, scale] = match.map(Number);
  const radians = (rotationDeg * Math.PI) / 180;
  const dx = point.x - cx;
  const dy = point.y - cy;
  const rotated = {
    x: dx * Math.cos(radians) - dy * Math.sin(radians),
    y: dx * Math.sin(radians) + dy * Math.cos(radians),
  };

  return {
    x: tx + cx + rotated.x * scale,
    y: ty + cy + rotated.y * scale,
  };
}

function getHandlePoint(root, kind) {
  const handle = root.querySelector(`[data-handle-kind="${kind}"]`);
  assert.ok(handle, `Expected a ${kind} handle`);
  return {
    handle,
    point: {
      x: Number.parseFloat(handle.style.left),
      y: Number.parseFloat(handle.style.top),
    },
  };
}

function getStageOrbitRadius(root, objectId) {
  const orbit = root.querySelector(
    `[data-editor-stage] [data-orbit-object-id="${objectId}"]`,
  );
  assert.ok(orbit, `Expected a rendered orbit for ${objectId}`);
  return Number(
    orbit.getAttribute("r") ??
      orbit.getAttribute("rx") ??
      orbit.getAttribute("data-radius") ??
      0,
  );
}

function dragHandle(window, handle, point) {
  handle.dispatchEvent(
    new window.MouseEvent("pointerdown", {
      bubbles: true,
      clientX: point.x,
      clientY: point.y,
      button: 0,
    }),
  );
  window.dispatchEvent(
    new window.MouseEvent("pointermove", {
      bubbles: true,
      clientX: point.x,
      clientY: point.y,
      button: 0,
    }),
  );
  window.dispatchEvent(
    new window.MouseEvent("pointerup", {
      bubbles: true,
      clientX: point.x,
      clientY: point.y,
      button: 0,
    }),
  );
}

function dragHandleFromTo(window, handle, fromPoint, toPoint) {
  handle.dispatchEvent(
    new window.MouseEvent("pointerdown", {
      bubbles: true,
      clientX: fromPoint.x,
      clientY: fromPoint.y,
      button: 0,
    }),
  );
  window.dispatchEvent(
    new window.MouseEvent("pointermove", {
      bubbles: true,
      clientX: toPoint.x,
      clientY: toPoint.y,
      button: 0,
    }),
  );
  window.dispatchEvent(
    new window.MouseEvent("pointerup", {
      bubbles: true,
      clientX: toPoint.x,
      clientY: toPoint.y,
      button: 0,
    }),
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildLargeAtlasSource() {
  const lines = [
    "schema 2.0",
    "",
    "system Atlas",
    '  title "Large Atlas"',
    "",
    "defaults",
    "  view isometric",
    "  scale presentation",
    "  preset atlas-card",
    "",
    "object star Primary",
  ];

  for (let index = 1; index <= 249; index += 1) {
    lines.push("");
    lines.push(`object planet P${index}`);
    lines.push("  orbit Primary");
    lines.push(`  semiMajor ${(0.8 + index * 0.03).toFixed(2)}au`);
    lines.push(`  eccentricity ${((index % 9) * 0.01).toFixed(2)}`);
    lines.push(`  phase ${(index * 17) % 360}deg`);
    lines.push(`  angle ${(index * 11) % 360}deg`);
    lines.push(`  inclination ${(index * 3) % 35}deg`);
    lines.push(`  radius ${(0.6 + (index % 5) * 0.08).toFixed(2)}re`);
  }

  for (let index = 1; index <= 50; index += 1) {
    lines.push("");
    lines.push(`viewpoint vp-${index}`);
    lines.push(`  label "Viewpoint ${index}"`);
    lines.push(`  focus P${((index - 1) % 40) + 1}`);
    lines.push(`  select P${((index - 1) % 40) + 1}`);
    lines.push(`  zoom ${(1.2 + index * 0.03).toFixed(2)}`);
  }

  for (let index = 1; index <= 100; index += 1) {
    lines.push("");
    lines.push(`annotation ann-${index}`);
    lines.push(`  label "Annotation ${index}"`);
    lines.push(`  target P${((index - 1) % 60) + 1}`);
    lines.push(`  body "Atlas note ${index}"`);
  }

  return lines.join("\n");
}

test("editor mounts, edits atlas state, and supports undo/redo", () => {
  const dom = new JSDOM(`<div id="editor"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const restoreRects = installFixedRects(dom.window, 1120, 680);
  const root = dom.window.document.getElementById("editor");
  const selections = [];
  const diagnosticsLog = [];

  try {
    const editor = createWorldOrbitEditor(root, {
      source,
      onSelectionChange(selection) {
        selections.push(selection?.path?.kind ?? null);
      },
      onDiagnosticsChange(diagnostics) {
        diagnosticsLog.push(diagnostics.length);
      },
    });

    assert.ok(root.querySelector("[data-editor-outline]"));
    assert.ok(root.querySelector("[data-editor-stage] svg"));
    assert.ok(root.querySelector("[data-editor-source]"));
    assert.ok(root.querySelector("[data-editor-preview-markup]"));
    assert.equal(editor.getAtlasDocument().version, "2.0");
    assert.match(editor.exportEmbedMarkup(), /data-worldorbit-embed="true"/);

    editor.selectPath({ kind: "object", id: "Naar" });
    assert.equal(editor.getSelection()?.path?.id, "Naar");

    const phaseInput = root.querySelector('input[name="placement-phase"]');
    phaseInput.value = "64deg";
    phaseInput.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    assert.match(editor.getSource(), /phase 64deg/);

    const newId = editor.addObject("moon");
    assert.equal(typeof newId, "string");
    assert.ok(editor.getAtlasDocument().objects.some((object) => object.id === newId));

    assert.equal(editor.canUndo(), true);
    editor.undo();
    assert.equal(editor.getAtlasDocument().objects.some((object) => object.id === newId), false);
    assert.equal(editor.canRedo(), true);
    editor.redo();
    assert.equal(editor.getAtlasDocument().objects.some((object) => object.id === newId), true);

    editor.destroy();
    assert.equal(root.textContent?.trim() ?? "", "");
    assert.ok(selections.length > 0);
    assert.ok(diagnosticsLog.length > 0);
  } finally {
    restoreRects();
    restoreGlobals();
    dom.window.close();
  }
});

test("editor preserves schema 2.1, supports events in the outline, and drags event poses without mutating base objects", () => {
  const dom = new JSDOM(`<div id="editor"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const restoreRects = installFixedRects(dom.window, 1120, 680);
  const root = dom.window.document.getElementById("editor");
  let editor;

  try {
    editor = createWorldOrbitEditor(root, {
      source: eventSource,
    });

    assert.equal(editor.getAtlasDocument().version, "2.1");
    assert.ok(root.querySelector('[data-path-kind="event"][data-path-id="naar-eclipse"]'));
    assert.ok(
      root.querySelector('[data-path-kind="event-pose"][data-path-id="naar-eclipse"][data-path-key="Seyra"]'),
    );

    const createdEventId = editor.addEvent();
    assert.equal(editor.getSelection()?.path?.kind, "event");
    assert.equal(editor.getSelection()?.path?.id, createdEventId);
    assert.match(editor.getSource(), /^schema 2\.1/m);

    editor.selectPath({ kind: "event-pose", id: "naar-eclipse", key: "Seyra" });
    assert.equal(root.querySelector('[data-editor-form="event-pose"]') !== null, true);

    const originalBasePhase =
      editor.getAtlasDocument().objects.find((object) => object.id === "Seyra")?.placement?.phase?.value ?? null;
    const originalPosePhase =
      editor
        .getAtlasDocument()
        .events.find((entry) => entry.id === "naar-eclipse")
        ?.positions.find((pose) => pose.objectId === "Seyra")
        ?.placement?.phase?.value ?? null;
    assert.equal(originalBasePhase, 40);
    assert.equal(originalPosePhase, 90);

    const { handle, point } = getHandlePoint(root, "orbit-phase");
    const naarPoint = getProjectedObjectPoint(root, "Naar");
    dragHandleFromTo(dom.window, handle, point, {
      x: naarPoint.x + 110,
      y: naarPoint.y,
    });

    const updatedBasePhase =
      editor.getAtlasDocument().objects.find((object) => object.id === "Seyra")?.placement?.phase?.value ?? null;
    const updatedPosePhase =
      editor
        .getAtlasDocument()
        .events.find((entry) => entry.id === "naar-eclipse")
        ?.positions.find((pose) => pose.objectId === "Seyra")
        ?.placement?.phase?.value ?? null;

    assert.equal(updatedBasePhase, 40);
    assert.notEqual(updatedPosePhase, 90);
    assert.match(editor.getSource(), /event naar-eclipse/);
    assert.match(editor.getSource(), /pose Seyra/);
  } finally {
    editor?.destroy();
    restoreRects();
    restoreGlobals();
    dom.window.close();
  }
});

test("editor preserves schema 2.5 viewpoint camera blocks and projection choices", () => {
  const dom = new JSDOM(`<div id="editor"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const restoreRects = installFixedRects(dom.window, 1120, 680);
  const root = dom.window.document.getElementById("editor");
  let editor;

  try {
    editor = createWorldOrbitEditor(root, {
      source: schema25Source,
    });

    assert.equal(editor.getAtlasDocument().version, "2.5");
    editor.selectPath({ kind: "viewpoint", id: "overview" });

    const projectionSelect = root.querySelector('select[name="viewpoint-projection"]');
    const azimuthInput = root.querySelector('input[name="viewpoint-camera-azimuth"]');
    const distanceInput = root.querySelector('input[name="viewpoint-camera-distance"]');
    assert.ok(projectionSelect);
    assert.ok(azimuthInput);
    assert.ok(distanceInput);
    assert.equal(projectionSelect.value, "perspective");
    assert.equal(azimuthInput.value, "28");
    assert.equal(distanceInput.value, "6");

    azimuthInput.value = "40";
    azimuthInput.dispatchEvent(new dom.window.Event("change", { bubbles: true }));

    const updatedViewpoint = editor.getAtlasDocument().system?.viewpoints.find((entry) => entry.id === "overview");
    assert.equal(updatedViewpoint?.camera?.azimuth, 40);
    assert.match(editor.getSource(), /^schema 2.5/m);
    assert.match(editor.getSource(), /camera[\s\S]*azimuth 40/);
  } finally {
    editor?.destroy();
    restoreRects();
    restoreGlobals();
    dom.window.close();
  }
});

test("editor keeps 2D embed output stable and rejects unavailable 3D preview mode", () => {
  const dom = new JSDOM(`<div id="editor"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const restoreRects = installFixedRects(dom.window, 1120, 680);
  const root = dom.window.document.getElementById("editor");
  let editor;

  try {
    editor = createWorldOrbitEditor(root, {
      source: schema25Source,
    });

    assert.equal(editor.getViewMode(), "2d");
    assert.match(editor.exportEmbedMarkup(), /data-worldorbit-mode="interactive-2d"/);
    assert.throws(() => editor.setViewMode("3d"), /WorldOrbit 3D/);
    assert.equal(editor.getViewMode(), "2d");
    assert.match(editor.exportEmbedMarkup(), /data-worldorbit-mode="interactive-2d"/);
  } finally {
    editor?.destroy();
    restoreRects();
    restoreGlobals();
    dom.window.close();
  }
});

test("editor stage handles can retarget at and surface placements and update free offsets", () => {
  const dom = new JSDOM(`<div id="editor"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const restoreRects = installFixedRects(dom.window, 1120, 680);
  const root = dom.window.document.getElementById("editor");

  try {
    const editor = createWorldOrbitEditor(root, {
      source: dragSource,
    });

    editor.selectPath({ kind: "object", id: "Relay" });
    let seraPoint = getProjectedObjectPoint(root, "Sera");
    let handle = root.querySelector('[data-handle-kind="at-reference"]');
    assert.ok(handle, "Expected an at-placement handle");
    dragHandle(dom.window, handle, seraPoint);
    let relay = editor.getAtlasDocument().objects.find((object) => object.id === "Relay");
    assert.equal(relay?.placement?.mode, "at");
    assert.equal(relay?.placement?.target, "Sera");

    editor.selectPath({ kind: "object", id: "Dock" });
    seraPoint = getProjectedObjectPoint(root, "Sera");
    handle = root.querySelector('[data-handle-kind="surface-target"]');
    assert.ok(handle, "Expected a surface-placement handle");
    dragHandle(dom.window, handle, seraPoint);
    const dock = editor.getAtlasDocument().objects.find((object) => object.id === "Dock");
    assert.equal(dock?.placement?.mode, "surface");
    assert.equal(dock?.placement?.target, "Sera");

    editor.selectPath({ kind: "object", id: "Beacon" });
    handle = root.querySelector('[data-handle-kind="free-distance"]');
    assert.ok(handle, "Expected a free-placement handle");
    const beaconPoint = getProjectedObjectPoint(root, "Beacon");
    dragHandle(dom.window, handle, {
      x: beaconPoint.x - 144,
      y: beaconPoint.y,
    });
    const beacon = editor.getAtlasDocument().objects.find((object) => object.id === "Beacon");
    assert.equal(beacon?.placement?.mode, "free");
    assert.ok(beacon?.placement?.distance, "Free dragging should produce a stored distance");
    assert.ok(
      (beacon?.placement?.distance?.value ?? 0) > 1.5,
      "Dragging left should increase the free-placement offset",
    );
    assert.equal(beacon?.placement?.descriptor, undefined);

    assert.match(editor.getSource(), /at Sera/);
    assert.match(editor.getSource(), /surface Sera/);
    editor.destroy();
  } finally {
    restoreRects();
    restoreGlobals();
    dom.window.close();
  }
});

test("editor orbit radius drag keeps moving outward after crossing sibling orbits", () => {
  const dom = new JSDOM(`<div id="editor"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const restoreRects = installFixedRects(dom.window, 1120, 680);
  const root = dom.window.document.getElementById("editor");
  let editor;

  try {
    editor = createWorldOrbitEditor(root, {
      source: dragSource,
    });

    editor.selectPath({ kind: "object", id: "Naar" });

    const startRadius = getStageOrbitRadius(root, "Naar");
    const orbitRadii = [];
    const orbitValues = [];

    for (let index = 0; index < 3; index += 1) {
      const { handle, point } = getHandlePoint(root, "orbit-radius");
      dragHandleFromTo(dom.window, handle, point, {
        x: point.x + 120,
        y: point.y,
      });
      const object = editor.getAtlasDocument().objects.find((entry) => entry.id === "Naar");
      orbitRadii.push(getStageOrbitRadius(root, "Naar"));
      orbitValues.push(object?.placement?.distance?.value ?? 0);
    }

    assert.ok(orbitValues[0] > 1.1, "First drag should increase the orbit distance");
    assert.ok(orbitValues[1] > orbitValues[0], "Second drag should keep increasing the orbit distance");
    assert.ok(orbitValues[2] > orbitValues[1], "Third drag should keep increasing the orbit distance");
    assert.ok(orbitRadii[0] > startRadius, "Orbit radius should increase on the first drag");
    assert.ok(orbitRadii[1] > orbitRadii[0], "Orbit radius should keep increasing after crossing siblings");
    assert.ok(orbitRadii[2] > orbitRadii[1], "Orbit radius should still grow on later drags");
  } finally {
    editor?.destroy();
    restoreRects();
    restoreGlobals();
    dom.window.close();
  }
});

test("editor renders help toggles and preserves collapsed inspector sections across rerenders", () => {
  const dom = new JSDOM(`<div id="editor"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const restoreRects = installFixedRects(dom.window, 1120, 680);
  const root = dom.window.document.getElementById("editor");
  let editor;

  try {
    editor = createWorldOrbitEditor(root, {
      source,
    });

    editor.selectPath({ kind: "object", id: "Naar" });

    const distanceField = root.querySelector('input[name="placement-distance"]')?.closest(".wo-editor-field");
    assert.ok(distanceField, "Expected orbit distance field");
    assert.match(distanceField.textContent ?? "", /Earth-Sun distance/);

    let propertiesSection = root.querySelector('details[data-editor-form-section="properties"]');
    assert.ok(propertiesSection, "Expected a collapsible properties section");
    assert.equal(propertiesSection.open, false, "Properties should default to collapsed");

    propertiesSection.open = false;
    editor.selectPath({ kind: "object", id: "Relay" });
    editor.selectPath({ kind: "object", id: "Naar" });

    propertiesSection = root.querySelector('details[data-editor-form-section="properties"]');
    assert.ok(propertiesSection, "Expected properties section after rerender");
    assert.equal(propertiesSection.open, false, "Collapsed state should persist across rerenders");
    assert.ok(root.querySelector('details[data-editor-panel-section="preview"]'));
  } finally {
    editor?.destroy();
    restoreRects();
    restoreGlobals();
    dom.window.close();
  }
});

test("editor tracks dirty state, debounced source input, and markSaved", async () => {
  const dom = new JSDOM(`<div id="editor"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const restoreRects = installFixedRects(dom.window, 1120, 680);
  const root = dom.window.document.getElementById("editor");
  const dirtyLog = [];
  let editor;

  try {
    editor = createWorldOrbitEditor(root, {
      source,
      onDirtyChange(dirty) {
        dirtyLog.push(dirty);
      },
    });

    assert.equal(editor.isDirty(), false);
    const sourcePane = root.querySelector("[data-editor-source]");
    assert.ok(sourcePane, "Expected source pane");

    sourcePane.value = sourcePane.value.replace("Overview", "Deep Overview");
    sourcePane.dispatchEvent(new dom.window.Event("input", { bubbles: true }));

    assert.equal(editor.isDirty(), true);
    assert.match(root.querySelector("[data-editor-status]").textContent, /Unsaved changes/);

    await delay(160);

    assert.match(editor.getSource(), /label "Deep Overview"/);
    editor.markSaved();
    assert.equal(editor.isDirty(), false);
    assert.match(root.querySelector("[data-editor-status]").textContent, /Saved/);
    assert.ok(dirtyLog.includes(true));
    assert.ok(dirtyLog.includes(false));
  } finally {
    editor?.destroy();
    restoreRects();
    restoreGlobals();
    dom.window.close();
  }
});

test("editor cancels active handle drags with Escape", () => {
  const dom = new JSDOM(`<div id="editor"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const restoreRects = installFixedRects(dom.window, 1120, 680);
  const root = dom.window.document.getElementById("editor");
  let editor;

  try {
    editor = createWorldOrbitEditor(root, {
      source: dragSource,
    });

    editor.selectPath({ kind: "object", id: "Beacon" });
    const handle = root.querySelector('[data-handle-kind="free-distance"]');
    assert.ok(handle, "Expected a free-placement handle");
    const beaconPoint = getProjectedObjectPoint(root, "Beacon");
    const beforeSource = editor.getSource();

    handle.dispatchEvent(
      new dom.window.MouseEvent("pointerdown", {
        bubbles: true,
        clientX: beaconPoint.x,
        clientY: beaconPoint.y,
        button: 0,
      }),
    );
    dom.window.dispatchEvent(
      new dom.window.MouseEvent("pointermove", {
        bubbles: true,
        clientX: beaconPoint.x - 180,
        clientY: beaconPoint.y,
        button: 0,
      }),
    );

    assert.equal(editor.isDirty(), true);
    root.dispatchEvent(
      new dom.window.KeyboardEvent("keydown", {
        bubbles: true,
        key: "Escape",
      }),
    );

    assert.equal(editor.isDirty(), false);
    assert.equal(editor.getSource(), beforeSource);
    const beacon = editor.getAtlasDocument().objects.find((object) => object.id === "Beacon");
    assert.equal(beacon?.placement?.mode, "free");
    assert.equal(beacon?.placement?.distance?.value, 1.5);
  } finally {
    editor?.destroy();
    restoreRects();
    restoreGlobals();
    dom.window.close();
  }
});

test("editor handles large atlas documents without preview regression", () => {
  const dom = new JSDOM(`<div id="editor"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const restoreRects = installFixedRects(dom.window, 1120, 680);
  const root = dom.window.document.getElementById("editor");
  let editor;

  try {
    editor = createWorldOrbitEditor(root, {
      source: buildLargeAtlasSource(),
      showInspector: true,
      showPreview: true,
      showTextPane: true,
    });

    assert.equal(editor.getAtlasDocument().objects.length, 250);
    assert.equal(editor.getAtlasDocument().system?.viewpoints.length, 50);
    assert.equal(editor.getAtlasDocument().system?.annotations.length, 100);
    assert.equal(editor.getDiagnostics().filter((entry) => entry.diagnostic.severity === "error").length, 0);
    assert.ok(root.querySelector("[data-editor-stage] svg"));
    assert.ok((root.querySelector("[data-editor-preview-markup]")?.textContent ?? "").length > 500);
    assert.ok(root.querySelectorAll(".wo-editor-outline-item").length > 350);
  } finally {
    editor?.destroy();
    restoreRects();
    restoreGlobals();
    dom.window.close();
  }
});
