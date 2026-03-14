import assert from "node:assert/strict";
import test from "node:test";

import {
  parse,
  renderSourceToSvg,
  tokenizeLine,
} from "../dist/index.js";

test("tokenizer keeps quoted strings and escaped quotes intact", () => {
  assert.deepEqual(tokenizeLine('description "The \\"Blue\\" Home"'), [
    "description",
    'The "Blue" Home',
  ]);
});

test("parser supports rich documents, info blocks, and normalized at references", () => {
  const input = `
system Iyath
  title "Iyath System"

star Iyath
  class G2
  radius 1.08sol

planet Naar
  culture Enari
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.03
  period 412d
  tags habitable homeworld

  info
    faction "Veyrathische Republik"
    description "Heimatwelt der Enari."

moon Leth orbit Naar distance 220000km period 18d
structure Relay kind relay at Naar:L4
structure Skyhook kind elevator surface Naar
structure OuterGate kind gate free deep-space
`.trim();

  const result = parse(input);
  const planet = result.document.objects.find((object) => object.id === "Naar");
  const relay = result.document.objects.find((object) => object.id === "Relay");
  const gate = result.document.objects.find((object) => object.id === "OuterGate");

  assert.equal(result.document.system?.properties.title, "Iyath System");
  assert.equal(planet?.properties.culture, "Enari");
  assert.deepEqual(planet?.properties.tags, ["habitable", "homeworld"]);
  assert.equal(planet?.info.faction, "Veyrathische Republik");
  assert.equal(planet?.placement?.mode, "orbit");

  if (relay?.placement?.mode === "at") {
    assert.equal(relay.placement.reference.kind, "lagrange");
    assert.equal(relay.placement.reference.primary, "Naar");
    assert.equal(relay.placement.reference.point, "L4");
  } else {
    assert.fail("Relay should normalize to an at placement");
  }

  if (gate?.placement?.mode === "free") {
    assert.equal(gate.placement.descriptor, "deep-space");
  } else {
    assert.fail("OuterGate should normalize to a free placement");
  }
});

test("parser reports invalid object types with precise line and column data", () => {
  assert.throws(() => parse("world Iyath"), {
    name: "WorldOrbitError",
    message: /Unknown object type "world" \(line 1, column 1\)/,
  });
});

test("normalization rejects duplicate fields instead of silently overwriting", () => {
  const input = `
system Iyath
star Iyath
planet Naar
  orbit Iyath
  orbit Other
`.trim();

  assert.throws(() => parse(input), {
    name: "WorldOrbitError",
    message: /Duplicate field "orbit" \(line 5, column 3\)/,
  });
});

test("renderer produces an svg document from valid source", () => {
  const input = `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au period 412d
moon Leth orbit Naar distance 220000km
structure Relay kind relay at Naar:L4
`.trim();

  const svg = renderSourceToSvg(input, { width: 960, height: 640 });

  assert.match(svg, /^<svg/);
  assert.match(svg, /Iyath/);
  assert.match(svg, /Naar/);
  assert.match(svg, /wo-orbit/);
});
