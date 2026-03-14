import assert from "node:assert/strict";
import test from "node:test";

import { parse, renderDocumentToScene } from "@worldorbit/core";
import { renderSceneToSvg } from "@worldorbit/viewer";

const source = `
system Iyath
  title "Iyath System"
  view topdown
  scale presentation

star Iyath
  radius 1.08sol

planet Naar
  orbit Iyath
  semiMajor 1.18au

moon Leth
  orbit Naar
  distance 220000km

belt Ember-Belt
  orbit Iyath
  distance 2.7au

structure HiddenGate
  kind gate
  hidden true
  free 8.4au
`.trim();

test("scene creation exposes objects, visuals, visible-content bounds, and metadata", () => {
  const result = parse(source);
  const scene = renderDocumentToScene(result.document, {
    width: 960,
    height: 640,
  });

  const planet = scene.objects.find((object) => object.objectId === "Naar");
  const belt = scene.orbitVisuals.find((visual) => visual.objectId === "Ember-Belt");
  const hiddenGate = scene.objects.find((object) => object.objectId === "HiddenGate");

  assert.equal(scene.title, "Iyath System");
  assert.equal(scene.subtitle, "Topdown view · Presentation layout");
  assert.equal(scene.viewMode, "topdown");
  assert.equal(scene.layoutPreset, "presentation");
  assert.equal(scene.width, 960);
  assert.ok(scene.contentBounds.width > 0);
  assert.ok(scene.contentBounds.height > 0);
  assert.ok(planet);
  assert.ok(planet.x > 0);
  assert.ok(planet.y > 0);
  assert.equal(belt?.band, true);
  assert.equal(hiddenGate?.hidden, true);

  if (!hiddenGate) {
    assert.fail("Hidden gate should exist in the scene");
  }

  assert.ok(
    scene.contentBounds.maxX < hiddenGate.x + hiddenGate.visualRadius,
    "hidden objects should not expand visible content bounds",
  );
});

test("scene svg keeps a dedicated transformable world layer and configurable layers", () => {
  const result = parse(source);
  const scene = renderDocumentToScene(result.document);
  const svg = renderSceneToSvg(scene, {
    layers: {
      metadata: true,
      labels: true,
      structures: false,
    },
  });

  assert.match(svg, /id="worldorbit-camera-root"/);
  assert.match(svg, /data-object-id="Naar"/);
  assert.doesNotMatch(svg, /data-object-id="HiddenGate"/);
  assert.match(svg, /Topdown view/);
});
