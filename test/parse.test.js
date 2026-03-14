import assert from "node:assert/strict";
import test from "node:test";

import {
  extractWorldOrbitBlocks,
  formatDocument,
  parse,
  tokenizeLine,
} from "@worldorbit/core";
import { renderSourceToSvg } from "@worldorbit/viewer";

test("tokenizer keeps quoted strings and escaped quotes intact", () => {
  assert.deepEqual(tokenizeLine('description "The \\"Blue\\" Home"'), [
    "description",
    'The "Blue" Home',
  ]);
});

test("parser supports rich documents, info blocks, and normalized anchor references", () => {
  const input = `
system Iyath
  title "Iyath System"
  view topdown

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
structure Relay kind relay at Naar:port
structure Skyhook kind elevator surface Naar
structure OuterGate kind gate free deep-space
`.trim();

  const result = parse(input);
  const planet = result.document.objects.find((object) => object.id === "Naar");
  const relay = result.document.objects.find((object) => object.id === "Relay");
  const gate = result.document.objects.find((object) => object.id === "OuterGate");

  assert.equal(result.document.version, "1.0");
  assert.equal(result.document.system?.properties.title, "Iyath System");
  assert.equal(planet?.properties.culture, "Enari");
  assert.deepEqual(planet?.properties.tags, ["habitable", "homeworld"]);
  assert.equal(planet?.info.faction, "Veyrathische Republik");
  assert.equal(planet?.placement?.mode, "orbit");

  if (relay?.placement?.mode === "at") {
    assert.equal(relay.placement.reference.kind, "anchor");
    assert.equal(relay.placement.reference.objectId, "Naar");
    assert.equal(relay.placement.reference.anchor, "port");
  } else {
    assert.fail("Relay should normalize to an anchor at placement");
  }

  if (gate?.placement?.mode === "free") {
    assert.equal(gate.placement.descriptor, "deep-space");
  } else {
    assert.fail("OuterGate should normalize to a free placement");
  }
});

test("formatDocument emits canonical worldorbit output", () => {
  const input = `
system Iyath
  title "Iyath System"

star Iyath

planet Naar
  color #72b7ff
  image /demo/assets/naar-map.png
  orbit Iyath
  distance 1.18au
  tags habitable homeworld
`.trim();

  const result = parse(input);
  const formatted = formatDocument(result.document);

  assert.match(formatted, /^system Iyath/m);
  assert.match(formatted, /title "Iyath System"/);
  assert.match(formatted, /planet Naar/);
  assert.match(
    formatted,
    /planet Naar\s+orbit Iyath\s+distance 1\.18au\s+tags habitable homeworld\s+color #72b7ff\s+image \/demo\/assets\/naar-map\.png/s,
  );
  assert.match(formatted, /tags habitable homeworld/);
});

test("parser supports image fields in inline and block forms", () => {
  const input = `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au image assets/naar-map.png
moon Leth
  orbit Naar
  distance 220000km
  image https://cdn.example.test/leth.png
`.trim();

  const result = parse(input);
  const planet = result.document.objects.find((object) => object.id === "Naar");
  const moon = result.document.objects.find((object) => object.id === "Leth");

  assert.equal(planet?.properties.image, "assets/naar-map.png");
  assert.equal(moon?.properties.image, "https://cdn.example.test/leth.png");
});

test("markdown fence extraction finds worldorbit blocks", () => {
  const markdown = `
# Atlas

\`\`\`worldorbit
system Iyath
star Iyath
\`\`\`

\`\`\`js
console.log("skip");
\`\`\`
`.trim();

  const blocks = extractWorldOrbitBlocks(markdown);

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].startLine, 3);
  assert.match(blocks[0].source, /star Iyath/);
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
planet Naar orbit Iyath distance 1.18au period 412d image assets/naar-map.png
moon Leth orbit Naar distance 220000km
structure Relay kind relay at Naar:L4
`.trim();

  const svg = renderSourceToSvg(input, { width: 960, height: 640 });

  assert.match(svg, /^<svg/);
  assert.match(svg, /Iyath/);
  assert.match(svg, /Naar/);
  assert.match(svg, /wo-orbit/);
});
