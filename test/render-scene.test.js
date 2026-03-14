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
  image assets/naar-map.png
  orbit Iyath
  semiMajor 1.18au

moon Leth
  orbit Naar
  distance 220000km

belt Ember-Belt
  orbit Iyath
  distance 2.7au

structure OuterGatePrime
  kind gate
  free 8.4au

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
  const outerGate = scene.objects.find((object) => object.objectId === "OuterGatePrime");
  const hiddenGate = scene.objects.find((object) => object.objectId === "HiddenGate");

  assert.equal(scene.title, "Iyath System");
  assert.equal(scene.subtitle, "Topdown view - Presentation layout");
  assert.equal(scene.viewMode, "topdown");
  assert.equal(scene.layoutPreset, "presentation");
  assert.equal(scene.width, 960);
  assert.ok(scene.contentBounds.width > 0);
  assert.ok(scene.contentBounds.height > 0);
  assert.ok(planet);
  assert.ok(planet.x > 0);
  assert.ok(planet.y > 0);
  assert.equal(planet.imageHref, "assets/naar-map.png");
  assert.equal(belt?.band, true);
  assert.ok(outerGate);
  assert.equal(hiddenGate?.hidden, true);

  if (!hiddenGate) {
    assert.fail("Hidden gate should exist in the scene");
  }

  if (!outerGate) {
    assert.fail("OuterGatePrime should exist in the scene");
  }

  assert.ok(
    scene.contentBounds.maxX > outerGate.x + 40,
    "visible labels should expand content bounds enough for fit-to-system",
  );
});

test("hidden objects are excluded from visible content bounds", () => {
  const hiddenSource = `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au
structure HiddenFarGate kind gate hidden true free 8.4au
`.trim();

  const visibleSource = `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au
structure HiddenFarGate kind gate free 8.4au
`.trim();

  const hiddenScene = renderDocumentToScene(parse(hiddenSource).document, {
    width: 960,
    height: 640,
  });
  const visibleScene = renderDocumentToScene(parse(visibleSource).document, {
    width: 960,
    height: 640,
  });

  assert.ok(
    visibleScene.contentBounds.maxX > hiddenScene.contentBounds.maxX,
    "hidden free objects should not expand visible content bounds",
  );
});

test("scene svg keeps a dedicated transformable world layer, image clips, and configurable layers", () => {
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
  assert.match(svg, /<image[^>]+href="assets\/naar-map\.png"/);
  assert.match(svg, /clipPath id="wo-naar-clip"/);
  assert.doesNotMatch(svg, /data-object-id="HiddenGate"/);
  assert.match(svg, /Topdown view/);
});

test("scene svg clips textured comet, structure, and phenomenon objects", () => {
  const texturedSource = `
system Iyath
star Iyath
comet Cinder orbit Iyath distance 3.4au image assets/cinder.png
structure Relay kind gate free 8.4au image assets/relay.png
phenomenon Scar orbit Iyath distance 5.2au image assets/scar.png
`.trim();

  const scene = renderDocumentToScene(parse(texturedSource).document);
  const svg = renderSceneToSvg(scene);

  assert.match(svg, /data-object-id="Cinder"/);
  assert.match(svg, /href="assets\/cinder\.png"/);
  assert.match(svg, /clipPath id="wo-cinder-clip"/);
  assert.match(svg, /clipPath id="wo-relay-clip"/);
  assert.match(svg, /clipPath id="wo-scar-clip"/);
});
