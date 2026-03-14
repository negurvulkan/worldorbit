import assert from "node:assert/strict";
import test from "node:test";

import { parse } from "../dist/index.js";

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

test("validation rejects malformed lagrange syntax during normalization", () => {
  const input = `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au
structure Relay kind relay at Naar:L8
`.trim();

  assert.throws(() => parse(input), {
    name: "WorldOrbitError",
    message: /Invalid special position "Naar:L8"/,
  });
});

test("validation rejects unknown lagrange references", () => {
  const input = `
system Iyath
star Iyath
structure Relay kind relay at Missing:L4
`.trim();

  assert.throws(() => parse(input), {
    name: "WorldOrbitError",
    message: /Unknown Lagrange reference "Missing" on "Relay"/,
  });
});
