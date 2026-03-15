import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  formatDocument,
  load,
  loadWorldOrbitSource,
  loadWorldOrbitSourceWithDiagnostics,
  materializeAtlasDocument,
  materializeDraftDocument,
  parse,
  parseWithDiagnostics,
  parseWorldOrbitAtlas,
  parseWorldOrbitDraft,
  stringify,
  upgradeDocumentToDraftV2,
  upgradeDocumentToV2,
  validateDocumentWithDiagnostics,
} from "@worldorbit/core";

const atlasExample = readFileSync(
  new URL("../examples/iyath.schema2.worldorbit", import.meta.url),
  "utf8",
).trim();

const legacyDraftExample = readFileSync(
  new URL("../examples/iyath.schema2-draft.worldorbit", import.meta.url),
  "utf8",
).trim();

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

test("upgradeDocumentToV2 promotes viewpoints, metadata, and annotations into the atlas schema", () => {
  const result = parse(source);
  const atlas = upgradeDocumentToV2(result.document, { preset: "atlas-card" });

  assert.equal(atlas.version, "2.0");
  assert.equal(atlas.sourceVersion, "1.0");
  assert.equal(atlas.system?.defaults.view, "isometric");
  assert.equal(atlas.system?.defaults.preset, "atlas-card");
  assert.equal(atlas.system?.defaults.theme, "atlas");
  assert.equal(atlas.system?.atlasMetadata["atlas.note"], "Reference atlas entry");
  assert.ok(atlas.system?.viewpoints.some((viewpoint) => viewpoint.id === "overview"));
  assert.ok(atlas.system?.viewpoints.some((viewpoint) => viewpoint.id === "naar"));
  assert.ok(atlas.system?.annotations.some((annotation) => annotation.id === "ember"));
  assert.ok(atlas.system?.annotations.some((annotation) => annotation.id === "naar-notes"));
  assert.ok(atlas.diagnostics.some((diagnostic) => diagnostic.code === "upgrade.atlasMetadata.preserved"));
  assert.ok(
    atlas.diagnostics.some((diagnostic) => diagnostic.code === "upgrade.annotation.objectDescription"),
  );
});

test("formatDocument can emit canonical schema 2.0 output", () => {
  const result = parse(source);
  const formatted = formatDocument(result.document, { schema: "2.0" });

  assert.match(formatted, /^schema 2\.0/m);
  assert.match(formatted, /^defaults$/m);
  assert.match(formatted, /^viewpoint naar$/m);
  assert.match(formatted, /^annotation naar-notes$/m);
  assert.match(formatted, /^object planet Naar$/m);
  assert.match(formatted, /atlas\.note "Reference atlas entry"/);
  assert.match(
    formatted,
    /layers orbits background -guides objects labels metadata|layers orbits background objects labels metadata -guides/,
  );
  assert.equal(stringify(result.document, { schema: "2.0" }), formatted);
});

test("legacy compatibility formatter can still emit schema 2.0-draft output", () => {
  const result = parse(source);
  const draft = upgradeDocumentToDraftV2(result.document, { preset: "atlas-card" });
  const formatted = formatDocument(draft, { schema: "2.0-draft" });

  assert.equal(draft.version, "2.0-draft");
  assert.match(formatted, /^schema 2\.0-draft/m);
  assert.match(formatted, /^object planet Naar$/m);
});

test("parseWorldOrbitAtlas reads schema 2.0 source and materializes it back to a renderable document", () => {
  const atlas = parseWorldOrbitAtlas(atlasExample);
  const document = materializeAtlasDocument(atlas);

  assert.equal(atlas.version, "2.0");
  assert.equal(atlas.system?.defaults.view, "isometric");
  assert.equal(atlas.system?.annotations[0]?.id, "naar-notes");
  assert.equal(document.version, "1.0");
  assert.equal(document.system?.properties.view, "isometric");
  assert.equal(document.system?.info["viewpoint.overview.label"], "Iyath System Overview");
  assert.equal(document.system?.info["annotation.naar-notes.body"], "Heimatwelt der Enari.");
  assert.ok(document.objects.some((object) => object.id === "Naar"));
});

test("parseWorldOrbitDraft still reads legacy schema 2.0-draft source", () => {
  const draft = parseWorldOrbitDraft(legacyDraftExample);
  const document = materializeDraftDocument(draft);

  assert.equal(draft.version, "2.0-draft");
  assert.equal(draft.system?.defaults.view, "isometric");
  assert.equal(document.system?.properties.view, "isometric");
  assert.ok(document.objects.some((object) => object.id === "Naar"));
});

test("loadWorldOrbitSource supports v1, canonical v2, and legacy 2.0-draft sources", () => {
  const stable = load(source);
  const atlas = loadWorldOrbitSource(atlasExample);
  const legacy = loadWorldOrbitSource(legacyDraftExample);

  assert.equal(stable.schemaVersion, "1.0");
  assert.ok(stable.ast);
  assert.equal(stable.atlasDocument, null);
  assert.equal(stable.draftDocument, null);

  assert.equal(atlas.schemaVersion, "2.0");
  assert.equal(atlas.ast, null);
  assert.equal(atlas.atlasDocument?.system?.id, "Iyath");
  assert.equal(atlas.document.system?.properties.scale, "presentation");
  assert.equal(
    atlas.document.system?.info["viewpoint.overview.summary"],
    "Fit the whole system with the current atlas defaults.",
  );

  assert.equal(legacy.schemaVersion, "2.0-draft");
  assert.equal(legacy.atlasDocument?.version, "2.0");
  assert.equal(legacy.draftDocument?.system?.id, "Iyath");
});

test("loadWorldOrbitSourceWithDiagnostics returns structured results for schema 2.0 input", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(atlasExample);

  assert.equal(result.ok, true);
  assert.equal(result.value?.schemaVersion, "2.0");
  assert.equal(result.value?.document.system?.properties.view, "isometric");
  assert.deepEqual(result.diagnostics, []);
});

test("loadWorldOrbitSourceWithDiagnostics warns when reading legacy schema 2.0-draft input", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(legacyDraftExample);

  assert.equal(result.ok, true);
  assert.equal(result.value?.schemaVersion, "2.0-draft");
  assert.equal(result.value?.atlasDocument?.version, "2.0");
  assert.equal(result.diagnostics[0]?.code, "load.schema.deprecatedDraft");
});
