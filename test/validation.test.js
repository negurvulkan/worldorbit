import assert from "node:assert/strict";
import test from "node:test";

import { loadWorldOrbitSourceWithDiagnostics, parse, parseWorldOrbitAtlas } from "@worldorbit/core";

test("validation rejects unknown orbit targets", () => {
  const input = `
system Iyath
star Iyath
planet Naar orbit Missing distance 1.18au
`.trim();

  assert.throws(() => parse(input), {
    name: "WorldOrbitError",
    message: /Unknown placement target "Missing" on "Naar"/,
  });
});

test("validation rejects invalid fields for object types", () => {
  const input = `
system Iyath
star Iyath
  atmosphere nitrogen
`.trim();

  assert.throws(() => parse(input), {
    name: "WorldOrbitError",
    message: /Field "atmosphere" is not valid on "star"/,
  });
});

test("validation rejects malformed lagrange syntax during normalization", () => {
  const input = `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au
structure Relay kind relay at Naar:L8
`.trim();

  assert.throws(() => parse(input), {
    name: "WorldOrbitError",
    message: /Invalid special position "Naar:L8"|Unknown field/,
  });
});

test("validation rejects unknown anchor references", () => {
  const input = `
system Iyath
star Iyath
structure Relay kind relay at Missing:port
`.trim();

  assert.throws(() => parse(input), {
    name: "WorldOrbitError",
    message: /Unknown anchor target "Missing" on "Relay"/,
  });
});

test("validation rejects invalid units for field families", () => {
  const input = `
system Iyath
star Iyath
planet Naar orbit Iyath period 30km
`.trim();

  assert.throws(() => parse(input), {
    name: "WorldOrbitError",
    message: /Unit "km" is not valid for "period"/,
  });
});

test("validation rejects invalid surface targets", () => {
  const input = `
system Iyath
star Iyath
belt Ember orbit Iyath distance 2.8au
structure Relay kind relay surface Ember
`.trim();

  assert.throws(() => parse(input), {
    name: "WorldOrbitError",
    message: /Surface target "Ember" on "Relay" is not surface-capable/,
  });
});

test("validation rejects image on unsupported object types", () => {
  const input = `
system Iyath
star Iyath
belt Ember orbit Iyath distance 2.7au image assets/ember.png
`.trim();

  assert.throws(() => parse(input), {
    name: "WorldOrbitError",
    message: /Field "image" is not valid on "belt"/,
  });
});

test("validation rejects unsupported image URL schemes", () => {
  const input = `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au image javascript:alert(1)
`.trim();

  assert.throws(() => parse(input), {
    name: "WorldOrbitError",
    message: /Field "image" does not support the "javascript" scheme/,
  });
});

test("validation accepts relative and https image sources", () => {
  const input = `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au image assets/naar-map.png
moon Leth orbit Naar distance 220000km image https://cdn.example.test/leth.png
`.trim();

  const result = parse(input);
  const planet = result.document.objects.find((object) => object.id === "Naar");
  const moon = result.document.objects.find((object) => object.id === "Leth");

  assert.equal(planet?.properties.image, "assets/naar-map.png");
  assert.equal(moon?.properties.image, "https://cdn.example.test/leth.png");
});

test("schema 2.1 parser rejects duplicate group ids", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(`
schema 2.1

system Iyath
  epoch "JY-0001.0"

group inner-system
  label "Inner System"

group inner-system
  label "Duplicate Inner System"

object star Iyath
  mass 1sol

object planet Naar
  orbit Iyath
  distance 1au
`.trim());

  assert.equal(result.ok, false);
  assert.ok(
    result.diagnostics.some((diagnostic) => /Duplicate group id "inner-system"/.test(diagnostic.message)),
  );
});

test("schema 2.1 validation reports unknown groups and distance conflicts", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(`
schema 2.1

system Iyath
  epoch "JY-0001.0"

group inner-system
  label "Inner System"

object star Iyath
  mass 1sol

object planet Naar
  orbit Iyath
  distance 1au
  semiMajor 0.92au
  period 349.6d
  groups missing-group
`.trim());

  assert.equal(result.ok, false);
  assert.ok(
    result.diagnostics.some((diagnostic) => /Unknown group "missing-group" on "Naar"/.test(diagnostic.message)),
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) => /cannot declare both "distance" and "semiMajor"/.test(diagnostic.message),
    ),
  );
});

test("schema 2.1 parser rejects invalid resonance ratios", () => {
  assert.throws(
    () =>
      parseWorldOrbitAtlas(`
schema 2.1

system Iyath

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1au

object moon Seyra
  orbit Naar
  distance 384400km

object moon Orun
  orbit Naar
  distance 192200km
  resonance Seyra two-to-one
`.trim()),
    {
      name: "WorldOrbitError",
      message: /Invalid resonance ratio "two-to-one"/,
    },
  );
});

test("schema 2.1 validation warns when phase, inclination, and derive lack reference context", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(`
schema 2.1

system Iyath

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1au
  period 365d
  phase 25deg
  inclination 3deg
  derive period kepler
  validate kepler
`.trim());

  assert.equal(result.ok, true);
  assert.ok(
    result.diagnostics.some((diagnostic) => /sets "phase" without an object or system epoch/i.test(diagnostic.message)),
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) => /sets "inclination" without an object or system reference plane/i.test(diagnostic.message),
    ),
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) => /requests "derive period kepler" but lacks enough input data/i.test(diagnostic.message),
    ),
  );
});

test("schema 2.1 validation reports unknown events, invalid event targets, and missing event positions", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(`
schema 2.1

system Iyath

viewpoint eclipse
  label "Eclipse"
  layers background events objects
  events missing-event

object star Iyath
  mass 1sol

object planet Naar
  orbit Iyath
  semiMajor 1au

object moon Seyra
  orbit Naar
  distance 384400km

event bad-eclipse
  kind solar-eclipse
  target Missing
  participants Iyath Missing
`.trim());

  assert.equal(result.ok, false);
  assert.ok(
    result.diagnostics.some(
      (diagnostic) => /Unknown event "missing-event" in viewpoint "eclipse"/i.test(diagnostic.message),
    ),
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) => /Unknown event target "Missing" on "bad-eclipse"/i.test(diagnostic.message),
    ),
  );
  assert.ok(
    result.diagnostics.some((diagnostic) => /has no positions block/i.test(diagnostic.message)),
  );
});

test("schema 2.1 validation rejects duplicate pose objects and pose placement conflicts", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(`
schema 2.1

system Iyath

object star Iyath
  mass 1sol

object planet Naar
  orbit Iyath
  semiMajor 1au

event bad-eclipse
  kind solar-eclipse
  target Naar
  participants Iyath Naar

  positions
    pose Naar
      orbit Iyath
      distance 1au
      semiMajor 1.1au

    pose Naar
      orbit Iyath
      distance 1au
`.trim());

  assert.equal(result.ok, false);
  assert.ok(
    result.diagnostics.some(
      (diagnostic) => /cannot declare both "distance" and "semiMajor"/i.test(diagnostic.message),
    ),
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) => /defines "Naar" more than once in positions/i.test(diagnostic.message),
    ),
  );
});

test("schema 2.0 input emits compatibility diagnostics for 2.1-only fields", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(`
schema 2.0

system Iyath
  title "Iyath System"

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1au
  epoch "JY-0001.0"
  groups inner-system
`.trim());

  assert.equal(result.ok, true);
  assert.ok(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.source === "parse" &&
        /Feature "epoch" requires schema 2\.1/i.test(diagnostic.message),
    ),
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.source === "parse" &&
        /Feature "groups" requires schema 2\.1/i.test(diagnostic.message),
    ),
  );
});

test("schema 2.5 validation reports camera ambiguity and missing event context", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(`
schema 2.5

system Helion

defaults
  view orthographic

viewpoint overview
  projection perspective
  rotation 20
  camera
    azimuth 30
    elevation 18
    distance 6

object star Helion
  mass 1sol

object planet Aster
  orbit Helion
  semiMajor 1au

object moon Beryl
  orbit Aster
  distance 300000km

event partial-eclipse
  kind solar-eclipse
  target Aster
  participants Helion Aster Beryl

  positions
    pose Beryl
      orbit Aster
      distance 300000km
      phase 90deg
      inclination 3deg
`.trim());

  assert.equal(result.ok, true);
  assert.ok(
    result.diagnostics.some((diagnostic) => /camera\.azimuth/i.test(diagnostic.field ?? "")),
  );
  assert.ok(
    result.diagnostics.some((diagnostic) => /effective epoch/i.test(diagnostic.message)),
  );
  assert.ok(
    result.diagnostics.some((diagnostic) => /effective reference plane/i.test(diagnostic.message)),
  );
  assert.ok(
    result.diagnostics.some((diagnostic) => /base placement/i.test(diagnostic.message)),
  );
});

test("schema 3.0 parses craft trajectories and declarative maneuvers", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(`
schema 3.0

system Iyath
  epoch "JY-0001.0"
  referencePlane ecliptic

object star Primary
  mass 1sol

object planet Home
  orbit Primary
  semiMajor 1au

object moon Moonlet
  orbit Home
  distance 384400km

object craft Courier
  trajectory courier-run
  at Home:L4
  kind shuttle

trajectory courier-run
  craft Courier

  segment departure
    kind departure
    from Home
    to Moonlet
    duration 6h

  segment transfer
    kind transfer
    from Home
    to Moonlet
    duration 18h
    deltaV 0.9km
    maneuver correction
      kind correction-burn
      deltaV 0.1km
      duration 12min
`.trim());

  assert.equal(result.ok, true);
  assert.equal(result.value?.atlasDocument?.version, "3.0");
  assert.equal(result.value?.atlasDocument?.trajectories.length, 1);
  assert.equal(result.value?.atlasDocument?.objects.find((object) => object.id === "Courier")?.type, "craft");
});

test("schema 3.0 validation requires assist on flyby trajectory segments", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(`
schema 3.0

system Iyath

object star Primary
  mass 1sol

object planet Home
  orbit Primary
  semiMajor 1au

object craft Courier
  trajectory courier-run
  kind shuttle
  free "inner system"

trajectory courier-run
  craft Courier

  segment slingshot
    kind flyby
    from Home
    to Home
    duration 2d
`.trim());

  assert.equal(result.ok, false);
  assert.ok(
    result.diagnostics.some((diagnostic) => /requires an "assist" object/i.test(diagnostic.message)),
  );
});
