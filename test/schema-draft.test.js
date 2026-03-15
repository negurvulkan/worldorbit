import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDocument,
  parse,
  parseWithDiagnostics,
  stringify,
  upgradeDocumentToDraftV2,
  validateDocumentWithDiagnostics,
} from "@worldorbit/core";

const source = `
system Iyath
  title "Iyath System"
  view isometric
  scale presentation
  units mixed

  info
    atlas.theme atlas
    atlas.note "Reference atlas entry"
    viewpoint.naar.label "Naar Close Orbit"
    viewpoint.naar.focus Naar
    viewpoint.naar.zoom 2.2
    viewpoint.naar.layers background orbits objects labels metadata -guides
    annotation.ember.label "Mining Corridor"
    annotation.ember.target Ember-Belt
    annotation.ember.body "Industrial traffic and salvage fields."

star Iyath

planet Naar
  orbit Iyath
  distance 1.18au
  tags habitable homeworld

  info
    description "Primary population center."

belt Ember-Belt
  orbit Iyath
  distance 2.7au

structure Relay
  kind relay
  at Naar:L4
`.trim();

test("parseWithDiagnostics returns structured diagnostics for invalid source", () => {
  const result = parseWithDiagnostics("world Iyath");

  assert.equal(result.ok, false);
  assert.equal(result.value, null);
  assert.equal(result.diagnostics[0]?.source, "parse");
  assert.match(result.diagnostics[0]?.message ?? "", /Unknown object type "world"/);
});

test("validateDocumentWithDiagnostics reports validation failures without throwing", () => {
  const document = parse(`
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au
`.trim()).document;
  const planet = document.objects.find((object) => object.id === "Naar");

  if (!planet?.placement || planet.placement.mode !== "orbit") {
    assert.fail("Expected Naar to orbit Iyath in the validation test");
  }

  planet.placement.target = "Missing";

  const result = validateDocumentWithDiagnostics(document);

  assert.equal(result.ok, false);
  assert.equal(result.value, null);
  assert.equal(result.diagnostics[0]?.source, "validate");
  assert.match(result.diagnostics[0]?.message ?? "", /Unknown placement target "Missing"/);
});

test("upgradeDocumentToDraftV2 promotes viewpoints, metadata, and annotations into the draft schema", () => {
  const result = parse(source);
  const draft = upgradeDocumentToDraftV2(result.document, { preset: "atlas-card" });

  assert.equal(draft.version, "2.0-draft");
  assert.equal(draft.sourceVersion, "1.0");
  assert.equal(draft.system?.defaults.view, "isometric");
  assert.equal(draft.system?.defaults.preset, "atlas-card");
  assert.equal(draft.system?.defaults.theme, "atlas");
  assert.equal(draft.system?.atlasMetadata["atlas.note"], "Reference atlas entry");
  assert.ok(draft.system?.viewpoints.some((viewpoint) => viewpoint.id === "overview"));
  assert.ok(draft.system?.viewpoints.some((viewpoint) => viewpoint.id === "naar"));
  assert.ok(draft.system?.annotations.some((annotation) => annotation.id === "ember"));
  assert.ok(draft.system?.annotations.some((annotation) => annotation.id === "naar-notes"));
  assert.ok(draft.diagnostics.some((diagnostic) => diagnostic.code === "upgrade.atlasMetadata.preserved"));
  assert.ok(
    draft.diagnostics.some((diagnostic) => diagnostic.code === "upgrade.annotation.objectDescription"),
  );
});

test("formatDocument can emit canonical schema 2 draft output", () => {
  const result = parse(source);
  const formatted = formatDocument(result.document, { schema: "2.0-draft" });

  assert.match(formatted, /^schema 2\.0-draft/m);
  assert.match(formatted, /^defaults$/m);
  assert.match(formatted, /^viewpoint naar$/m);
  assert.match(formatted, /^annotation naar-notes$/m);
  assert.match(formatted, /^object planet Naar$/m);
  assert.match(formatted, /atlas\.note "Reference atlas entry"/);
  assert.match(formatted, /layers orbits background -guides objects labels metadata|layers orbits background objects labels metadata -guides/);
  assert.equal(stringify(result.document, { schema: "2.0-draft" }), formatted);
});
