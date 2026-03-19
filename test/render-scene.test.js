import assert from "node:assert/strict";
import test from "node:test";

import { loadWorldOrbitSource, parse, renderDocumentToScene } from "@worldorbit/core";
import { renderSceneToSvg } from "@worldorbit/viewer";

const source = `
system Iyath
  title "Iyath System"
  view topdown
  scale presentation
  info
    viewpoint.overview.label "Atlas Overview"
    viewpoint.naar.label "Naar Close"
    viewpoint.naar.focus Naar
    viewpoint.naar.select Naar
    viewpoint.naar.zoom 2.4
    viewpoint.naar.rotation 16
    viewpoint.naar.layers background orbits objects labels metadata -guides

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

const isoSource = `
system Iyath
  title "Iyath System"
  view isometric
  scale presentation
  info
    viewpoint.overview.label "Atlas Overview"
    viewpoint.naar.label "Naar Close Orbit"
    viewpoint.naar.focus Naar
    viewpoint.naar.select Naar
    viewpoint.naar.zoom 2.3
    viewpoint.naar.rotation 14
    viewpoint.naar.layers background orbits objects labels metadata -guides
    viewpoint.infrastructure.label "Infrastructure"
    viewpoint.infrastructure.types structure phenomenon
    viewpoint.infrastructure.query relay skyhook

star Iyath
  radius 1.08sol
  temperature 5840

planet Naar
  image assets/naar-map.png
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  atmosphere nitrogen-oxygen
  albedo 0.34

ring Dawn-Ring
  orbit Naar
  distance 185000km
  angle 22deg
  inclination 18deg
  inner 120000km
  outer 190000km

structure Skyhook
  kind elevator
  surface Naar

structure Relay
  kind relay
  at Naar:L4
`.trim();

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
  groups inner-system

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

const labelPlacementSource = `
schema 2.0

system Iyath
  title "Iyath System"

defaults
  view topdown
  scale presentation
  preset atlas-card

viewpoint overview
  label "Overview"
  projection topdown
  preset atlas-card

object star Iyath
  radius 0.85sol

object planet Naar
  orbit Iyath
  semiMajor 0.92au
  phase 260deg
  radius 1.036re
  atmosphere "nitrogen-oxygen humid"

object moon Orun
  orbit Naar
  distance 515000km
  phase 180deg
  radius 0.153re

object moon Seyra
  orbit Naar
  distance 310000km
  phase 25deg
  radius 0.248re

object structure Naar-Orbitale
  at Naar:L1
  kind station

object structure Seyra-Basen
  surface Seyra
  kind outpost
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
  assert.equal(scene.projection, "topdown");
  assert.equal(scene.viewMode, "topdown");
  assert.equal(scene.layoutPreset, "presentation");
  assert.equal(scene.width, 960);
  assert.equal(scene.scaleModel.orbitDistanceMultiplier, 1.2);
  assert.equal(scene.renderPreset, null);
  assert.ok(scene.contentBounds.width > 0);
  assert.ok(scene.contentBounds.height > 0);
  assert.ok(scene.layers.some((layer) => layer.id === "labels"));
  assert.ok(scene.groups.length >= 1);
  assert.ok(scene.labels.length >= 1);
  assert.ok(scene.viewpoints.some((viewpoint) => viewpoint.id === "overview"));
  assert.ok(scene.viewpoints.some((viewpoint) => viewpoint.id === "naar"));
  assert.ok(planet);
  assert.ok(planet.x > 0);
  assert.ok(planet.y > 0);
  assert.equal(planet.parentId, "Iyath");
  assert.ok(Array.isArray(planet.ancestorIds));
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

test("isometric scenes expose ellipse geometry, scale model overrides, and projected placements", () => {
  const scene = renderDocumentToScene(parse(isoSource).document, {
    width: 960,
    height: 640,
    preset: "atlas-card",
    scaleModel: {
      bodyRadiusMultiplier: 1.25,
      labelMultiplier: 1.1,
    },
  });

  const planetOrbit = scene.orbitVisuals.find((visual) => visual.objectId === "Naar");
  const ringOrbit = scene.orbitVisuals.find((visual) => visual.objectId === "Dawn-Ring");
  const relay = scene.objects.find((object) => object.objectId === "Relay");
  const skyhook = scene.objects.find((object) => object.objectId === "Skyhook");
  const naarViewpoint = scene.viewpoints.find((viewpoint) => viewpoint.id === "naar");
  const infrastructureViewpoint = scene.viewpoints.find(
    (viewpoint) => viewpoint.id === "infrastructure",
  );

  assert.equal(scene.projection, "isometric");
  assert.equal(scene.viewMode, "isometric");
  assert.equal(scene.renderPreset, "atlas-card");
  assert.equal(scene.scaleModel.bodyRadiusMultiplier, 1.25);
  assert.equal(scene.scaleModel.labelMultiplier, 1.1);
  assert.equal(planetOrbit?.kind, "ellipse");
  assert.ok((planetOrbit?.rx ?? 0) > (planetOrbit?.ry ?? 0));
  assert.ok(planetOrbit?.frontArcPath);
  assert.ok(planetOrbit?.backArcPath);
  assert.ok((ringOrbit?.bandThickness ?? 0) >= 8);
  assert.ok(relay);
  assert.ok(skyhook);
  assert.ok(scene.groups.some((group) => group.objectIds.includes("Naar")));
  assert.ok(scene.labels.some((label) => label.objectId === "Naar"));
  assert.equal(naarViewpoint?.objectId, "Naar");
  assert.equal(naarViewpoint?.scale, 2.3);
  assert.equal(naarViewpoint?.layers.guides, false);
  assert.deepEqual(infrastructureViewpoint?.filter?.objectTypes, ["structure", "phenomenon"]);
  assert.equal(infrastructureViewpoint?.filter?.query, "relay skyhook");

  if (!relay || !skyhook) {
    assert.fail("Projected anchor placements should exist in the isometric scene");
  }

  assert.notEqual(relay.x, skyhook.x);
  assert.notEqual(relay.y, skyhook.y);
  assert.ok(skyhook.anchorX !== undefined);
  assert.ok(skyhook.anchorY !== undefined);
});

test("hidden objects are excluded from visible content bounds", () => {
  const hiddenSource = `
system Iyath
star Iyath
structure HiddenFarGate kind gate hidden true free 80au
`.trim();

  const visibleSource = `
system Iyath
star Iyath
structure HiddenFarGate kind gate free 80au
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
    visibleScene.contentBounds.minX < hiddenScene.contentBounds.minX,
    "hidden free objects should not expand visible content bounds",
  );
});

test("orbit visuals keep spreading for large metrics and preserve a readable minimum gap", () => {
  const scene = renderDocumentToScene(
    parse(`
system Spread
  title "Spread"
  view topdown
  scale presentation

star Primary

planet Near
  orbit Primary
  distance 1au

planet NearB
  orbit Primary
  distance 1.05au

planet Mid
  orbit Primary
  distance 2au

planet Far
  orbit Primary
  distance 10au
`.trim()).document,
  );

  const near = scene.orbitVisuals.find((entry) => entry.objectId === "Near");
  const nearB = scene.orbitVisuals.find((entry) => entry.objectId === "NearB");
  const mid = scene.orbitVisuals.find((entry) => entry.objectId === "Mid");
  const far = scene.orbitVisuals.find((entry) => entry.objectId === "Far");
  const nearRadius = near?.radius ?? near?.rx ?? 0;
  const nearBRadius = nearB?.radius ?? nearB?.rx ?? 0;
  const midRadius = mid?.radius ?? mid?.rx ?? 0;
  const farRadius = far?.radius ?? far?.rx ?? 0;

  assert.ok(nearRadius > 0);
  assert.ok(nearBRadius > nearRadius);
  assert.ok(midRadius > nearBRadius);
  assert.ok(farRadius > midRadius);
  assert.ok(nearBRadius - nearRadius >= 20, "Close orbit values should keep a readable gap");
  assert.ok(midRadius - nearRadius >= 40, "2au should render noticeably farther than 1au");
  assert.ok(farRadius - midRadius >= 80, "10au should continue spreading instead of pinning");
});

test("label placement keeps orbiting body names readable near local infrastructure", () => {
  const scene = renderDocumentToScene(loadWorldOrbitSource(labelPlacementSource).document, {
    preset: "atlas-card",
  });

  const naar = scene.objects.find((object) => object.objectId === "Naar");
  const orun = scene.objects.find((object) => object.objectId === "Orun");
  const orbitale = scene.objects.find((object) => object.objectId === "Naar-Orbitale");
  const naarLabel = scene.labels.find((label) => label.objectId === "Naar");
  const orunLabel = scene.labels.find((label) => label.objectId === "Orun");
  const orbitaleLabel = scene.labels.find((label) => label.objectId === "Naar-Orbitale");

  assert.ok(naar);
  assert.ok(orun);
  assert.ok(orbitale);
  assert.ok(naarLabel);
  assert.ok(orunLabel);
  assert.ok(orbitaleLabel);

  if (!naar || !orun || !orbitale || !naarLabel || !orunLabel || !orbitaleLabel) {
    assert.fail("Expected all relevant objects and labels to exist");
  }

  const expectedNaarLabelY = naar.y + naar.radius + 18 * scene.scaleModel.labelMultiplier;
  const expectedOrunLabelY = orun.y + orun.radius + 18 * scene.scaleModel.labelMultiplier;
  const closenessThreshold = 40 * scene.scaleModel.labelMultiplier;

  assert.equal(naarLabel.direction, "below");
  assert.equal(orunLabel.direction, "below");
  assert.ok(
    Math.abs(naarLabel.y - expectedNaarLabelY) < closenessThreshold,
    "Planet labels should remain near the planet instead of being displaced by station labels",
  );
  assert.ok(
    Math.abs(orunLabel.y - expectedOrunLabelY) < closenessThreshold,
    "Moon labels should follow the moon's outward direction instead of flipping above it",
  );
  assert.ok(
    orbitaleLabel.y < naarLabel.y - 20 || Math.abs(orbitaleLabel.x - orbitale.x) > 20,
    "Nearby structure labels should no longer occupy the same slot that pushes the planet label away",
  );
});

test("scene svg keeps a dedicated transformable world layer, image clips, and configurable layers", () => {
  const result = parse(source);
  const scene = renderDocumentToScene(result.document, { preset: "markdown" });
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
  assert.match(svg, /data-layer-id="labels"/);
});

test("isometric svg renders split orbit paths, atmosphere styling, and projected ring bands", () => {
  const scene = renderDocumentToScene(parse(isoSource).document);
  const svg = renderSceneToSvg(scene);

  assert.match(svg, /wo-orbit-back/);
  assert.match(svg, /wo-orbit-front/);
  assert.match(svg, /<path class="wo-orbit wo-orbit-node wo-orbit-front"/);
  assert.match(svg, /rgba\(122, 194, 255, 0\.75\)/);
  assert.match(svg, /data-object-id="Naar"/);
  assert.match(svg, /data-group-id="wo-iyath-group"/);
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

test("schema 2.1 scenes expose semantic groups, relations, and render hints without breaking rendering", () => {
  const loaded = loadWorldOrbitSource(schema21Source);
  const scene = renderDocumentToScene(loaded.document, {
    width: 960,
    height: 640,
  });
  const svg = renderSceneToSvg(scene);
  const innerViewpoint = scene.viewpoints.find((viewpoint) => viewpoint.id === "inner");
  const orun = scene.objects.find((object) => object.objectId === "Orun");
  const relay = scene.objects.find((object) => object.objectId === "Relay");

  assert.equal(loaded.schemaVersion, "2.1");
  assert.ok(scene.semanticGroups.some((group) => group.id === "inner-system"));
  assert.ok(scene.relations.some((relation) => relation.relationId === "supply-route"));
  assert.deepEqual(innerViewpoint?.filter?.groupIds, ["inner-system"]);
  assert.deepEqual(orun?.semanticGroupIds, ["inner-system"]);
  assert.deepEqual(relay?.semanticGroupIds, ["inner-system"]);
  assert.equal(scene.labels.some((label) => label.objectId === "Orun"), false);
  assert.equal(scene.orbitVisuals.some((orbit) => orbit.objectId === "Orun" && !orbit.hidden), false);
  assert.match(svg, /data-layer-id="relations"/);
  assert.match(svg, /data-relation-id="supply-route"/);
});

test("schema 2.1 event scenes expose event overlays and pose-based scene overrides", () => {
  const loaded = loadWorldOrbitSource(schema21EventSource);
  const baseScene = renderDocumentToScene(loaded.document, {
    width: 960,
    height: 640,
  });
  const eventScene = renderDocumentToScene(loaded.document, {
    width: 960,
    height: 640,
    activeEventId: "naar-eclipse",
  });
  const eventSvg = renderSceneToSvg(eventScene);
  const eclipseView = eventScene.viewpoints.find((viewpoint) => viewpoint.id === "eclipse");
  const baseNaar = baseScene.objects.find((object) => object.objectId === "Naar");
  const eventNaar = eventScene.objects.find((object) => object.objectId === "Naar");
  const eventSeyra = eventScene.objects.find((object) => object.objectId === "Seyra");

  assert.deepEqual(eclipseView?.eventIds, ["naar-eclipse"]);
  assert.equal(eventScene.activeEventId, "naar-eclipse");
  assert.ok(eventScene.layers.some((layer) => layer.id === "events"));
  assert.ok(eventScene.events.some((entry) => entry.eventId === "naar-eclipse"));
  assert.ok(eventScene.events[0]?.participantIds.includes("Seyra"));
  assert.notEqual(eventNaar?.x, baseNaar?.x);
  assert.notEqual(eventSeyra?.x, baseScene.objects.find((object) => object.objectId === "Seyra")?.x);
  assert.match(eventSvg, /data-layer-id="events"/);
  assert.match(eventSvg, /data-event-id="naar-eclipse"/);
});
