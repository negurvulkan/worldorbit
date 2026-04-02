import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateSpatialSceneAtTime,
  loadWorldOrbitSource,
  parse,
  renderDocumentToScene,
  renderDocumentToSpatialScene,
} from "@worldorbit/core";
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

const spatialSource = `
schema 2.5

system Minerva
  title "Minerva"
  epoch "JY-0100.0"
  referencePlane ecliptic

defaults
  view perspective
  scale presentation
  preset atlas-card

viewpoint overview
  label "Overview"
  projection perspective
  camera
    azimuth 28
    elevation 20
    distance 5

object star Primary
  mass 1sol

object planet Home
  orbit Primary
  semiMajor 1au
  phase 24deg
  period 1y

object moon Lantern
  orbit Home
  distance 410000km
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

const radiusScaleSource = `
system Caldera
  title "Caldera"
  view topdown
  scale presentation

star Helios
  radius 700000km

planet Brim
  orbit Helios
  distance 7000000km
  radius 70000km

moon Cinder
  orbit Brim
  distance 700000km
  radius 7000km

planet Fallback
  orbit Helios
  distance 12000000km
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
    visibleScene.contentBounds.maxX > hiddenScene.contentBounds.maxX,
    "visible free objects should expand visible content bounds while hidden ones stay excluded",
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

test("strict body scaling derives explicit radii from the same metric scale as orbit distances", () => {
  const scene = renderDocumentToScene(parse(radiusScaleSource).document, {
    width: 960,
    height: 640,
    bodyScaleMode: "strict",
  });

  const star = scene.objects.find((object) => object.objectId === "Helios");
  const planet = scene.objects.find((object) => object.objectId === "Brim");
  const orbit = scene.orbitVisuals.find((visual) => visual.objectId === "Brim");

  assert.ok(star);
  assert.ok(planet);
  assert.ok(orbit);

  if (!star || !planet || !orbit) {
    assert.fail("Expected Helios, Brim, and Brim's orbit to exist");
  }

  const orbitRadius = orbit.radius ?? orbit.rx ?? 0;
  const starPlanetRatio = star.radius / Math.max(planet.radius, 0.0001);
  const orbitPlanetRatio = orbitRadius / Math.max(planet.radius, 0.0001);
  const expectedOrbitPlanetRatio = 100 / scene.scaleModel.bodyRadiusMultiplier;

  assert.ok(Math.abs(starPlanetRatio - 10) < 0.2, "700000km vs 70000km should stay at a 10:1 visual ratio in strict mode");
  assert.ok(
    Math.abs(orbitPlanetRatio - expectedOrbitPlanetRatio) < 1.5,
    "7000000km orbit vs 70000km radius should share the same scene scale, adjusted only by the body style multiplier",
  );
});

test("readable body scaling keeps tiny explicit radii visible while strict mode stays physically smaller", () => {
  const tinySource = `
system Tiny
  scale presentation

star Helios
  radius 700000km

planet Needle
  orbit Helios
  distance 1au
  radius 1re
`.trim();

  const readableScene = renderDocumentToScene(parse(tinySource).document, {
    width: 960,
    height: 640,
  });
  const strictScene = renderDocumentToScene(parse(tinySource).document, {
    width: 960,
    height: 640,
    bodyScaleMode: "strict",
  });

  const readablePlanet = readableScene.objects.find((object) => object.objectId === "Needle");
  const strictPlanet = strictScene.objects.find((object) => object.objectId === "Needle");

  assert.ok(readablePlanet);
  assert.ok(strictPlanet);

  if (!readablePlanet || !strictPlanet) {
    assert.fail("Expected Needle to exist in both scenes");
  }

  assert.equal(readableScene.scaleModel.bodyScaleMode, "readable");
  assert.equal(strictScene.scaleModel.bodyScaleMode, "strict");
  assert.ok(readablePlanet.radius >= readableScene.scaleModel.minBodyRadius);
  assert.ok(strictPlanet.radius < readablePlanet.radius);
});

test("explicit radii can drive shared scale without hiding fallback bodies", () => {
  const scene = renderDocumentToScene(parse(radiusScaleSource).document, {
    width: 960,
    height: 640,
  });

  const explicitPlanet = scene.objects.find((object) => object.objectId === "Brim");
  const fallbackPlanet = scene.objects.find((object) => object.objectId === "Fallback");

  assert.ok(explicitPlanet);
  assert.ok(fallbackPlanet);

  if (!explicitPlanet || !fallbackPlanet) {
    assert.fail("Expected both Brim and Fallback to exist");
  }

  assert.ok(explicitPlanet.radius > 0);
  assert.ok(fallbackPlanet.radius >= scene.scaleModel.minBodyRadius);
  assert.ok(fallbackPlanet.radius !== explicitPlanet.radius, "Fallback sizing should remain heuristic instead of collapsing onto explicit-radius scaling");
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

test("scene svg reflects radius-driven scale changes from the core scene", () => {
  const scene = renderDocumentToScene(parse(radiusScaleSource).document, {
    width: 960,
    height: 640,
    bodyScaleMode: "strict",
  });
  const svg = renderSceneToSvg(scene);
  const planet = scene.objects.find((object) => object.objectId === "Brim");

  assert.ok(planet);

  if (!planet) {
    assert.fail("Expected Brim to exist");
  }

  assert.match(
    svg,
    new RegExp(
      `data-object-id="Brim"[\\s\\S]*?<circle cx="${planet.x}" cy="${planet.y}" r="${planet.radius}"`,
    ),
  );
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

test("schema 2.5 scenes preserve projection intent, camera metadata, and 2D fallback rendering", () => {
  const loaded = loadWorldOrbitSource(schema25Source);
  const baseScene = renderDocumentToScene(loaded.document, {
    width: 960,
    height: 640,
  });
  const eventScene = renderDocumentToScene(loaded.document, {
    width: 960,
    height: 640,
    activeEventId: "aster-eclipse",
  });
  const eclipseView = eventScene.viewpoints.find((viewpoint) => viewpoint.id === "eclipse");
  const overviewView = eventScene.viewpoints.find((viewpoint) => viewpoint.id === "overview");
  const svg = renderSceneToSvg(eventScene);

  assert.equal(baseScene.projection, "orthographic");
  assert.equal(baseScene.renderProjection, "topdown");
  assert.equal(overviewView?.projection, "orthographic");
  assert.equal(overviewView?.renderProjection, "isometric");
  assert.equal(overviewView?.camera?.azimuth, 28);
  assert.equal(eclipseView?.projection, "perspective");
  assert.equal(eclipseView?.renderProjection, "isometric");
  assert.equal(eclipseView?.camera?.distance, 6);
  assert.match(eventScene.subtitle, /2D topdown fallback/i);
  assert.match(svg, /Orthographic view/i);
  assert.equal(
    eventScene.objects.find((object) => object.objectId === "Beryl")?.object.epoch,
    "JY-0214.0",
  );
  assert.equal(
    eventScene.objects.find((object) => object.objectId === "Beryl")?.object.referencePlane,
    "ecliptic",
  );
});

test("schema 3.1 scenes render visible trajectories, waypoints, and solver samples", () => {
  const loaded = loadWorldOrbitSource(`
schema 3.1

system Voyager
  title "Voyager Mission Diagram"

defaults
  view topdown
  scale presentation

object star Sol
  radius 1sol

object planet Earth
  orbit Sol
  semiMajor 1au

object planet Jupiter
  orbit Sol
  semiMajor 5.2au

object craft Voyager-2
  free deep-space
  trajectory grand-tour

trajectory grand-tour
  craft Voyager-2
  renderMode solver
  stroke #ffb347
  showWaypoints true

  segment departure
    kind departure
    from Earth
    to Jupiter
    waypointLabel Launch
    waypointDate "20 Aug 77"

    maneuver tcm-1
      kind burn
      label "TCM-1"
      epoch "01 Sep 77"

  segment jupiter-flyby
    kind flyby
    from Earth
    to Jupiter
    assist Jupiter
    waypointLabel Jupiter
    waypointDate "09 Jul 79"
    sampleDensity 2

event voyager-jupiter
  kind flyby
  label "Jupiter Encounter"
  target Voyager-2
  participants Jupiter Voyager-2
  trajectory grand-tour
`.trim());

  const scene = renderDocumentToScene(loaded.document, {
    trajectoryMode: "auto",
    showTrajectoryWaypoints: true,
    showTrajectoryLabels: true,
  });
  const spatialScene = renderDocumentToSpatialScene(loaded.document, {
    trajectoryMode: "auto",
  });
  const svg = renderSceneToSvg(scene, {
    showTrajectoryWaypoints: true,
    showTrajectoryLabels: true,
  });

  assert.equal(scene.trajectories.length, 1);
  assert.equal(scene.trajectories[0].mode, "solver");
  assert.match(scene.trajectories[0].path, /^M /);
  assert.ok(scene.trajectories[0].waypoints.some((waypoint) => waypoint.label === "Launch"));
  assert.ok(scene.layers.some((layer) => layer.id === "trajectories"));
  assert.equal(spatialScene.trajectories.length, 1);
  assert.ok(spatialScene.trajectories[0].samples.length >= 2);
  assert.match(svg, /data-layer-id="trajectories"/);
  assert.match(svg, /wo-trajectory/);
  assert.match(svg, /Launch/);
});

test("spatial scenes reuse the shared document model, derive deterministic motion, and freeze event snapshots", () => {
  const loaded = loadWorldOrbitSource(spatialSource);
  const spatialScene = renderDocumentToSpatialScene(loaded.document, {
    width: 960,
    height: 640,
  });
  const home = spatialScene.objects.find((object) => object.objectId === "Home");
  const lantern = spatialScene.objects.find((object) => object.objectId === "Lantern");
  const t0 = evaluateSpatialSceneAtTime(spatialScene, 0);
  const tLater = evaluateSpatialSceneAtTime(spatialScene, 24);

  assert.equal(spatialScene.viewMode, "3d");
  assert.equal(spatialScene.timeFrozen, false);
  assert.ok(spatialScene.focusTargets.some((target) => target.objectId === "Home"));
  assert.equal(home?.motion?.heuristic, false);
  assert.equal(lantern?.motion?.heuristic, true);
  assert.notDeepEqual(t0.get("Home"), tLater.get("Home"));
  assert.notDeepEqual(t0.get("Lantern"), tLater.get("Lantern"));

  const frozenScene = renderDocumentToSpatialScene(loadWorldOrbitSource(schema25Source).document, {
    width: 960,
    height: 640,
    activeEventId: "aster-eclipse",
  });
  const frozenStart = evaluateSpatialSceneAtTime(frozenScene, 0);
  const frozenLater = evaluateSpatialSceneAtTime(frozenScene, 240);

  assert.equal(frozenScene.timeFrozen, true);
  assert.deepEqual(frozenStart.get("Beryl"), frozenLater.get("Beryl"));
});
