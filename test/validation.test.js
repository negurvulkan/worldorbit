import assert from "node:assert/strict";
import test from "node:test";

import { parse } from "@worldorbit/core";

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
