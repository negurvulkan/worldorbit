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

const schema21Source = `
schema 2.1

# Main atlas
system Iyath
  title "The Iyath System"
  description "Compact circumprimary planetary system in a wide binary"
  epoch "JY-0001.0"
  referencePlane ecliptic

defaults
  view isometric
  scale presentation
  preset atlas-card

/* Semantic group metadata */
group inner-system
  label "Inner System"
  summary "Naar and its inhabited infrastructure"
  color "#d9b37a"
  tags core inhabited

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
  tags infrastructure trade

object star Iyath
  mass 1sol

object planet Naar
  orbit Iyath
  semiMajor 0.92au
  period 322.1d
  phase 25deg
  inclination 2deg
  radius 1re
  groups inner-system
  epoch "JY-0001.0"
  referencePlane naar-equatorial
  renderPriority 5
  validate kepler
  tolerance period 0.5d
  locked period

  climate
    meanSurfaceTemperature 291K

  habitability
    inhabited true

  settlement
    population "8.2 billion"

object moon Seyra
  orbit Naar
  distance 384400km
  period 18.54d
  phase 25deg
  epoch "JY-0001.0"
  referencePlane naar-equatorial
  tidalLock true
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
  summary "Seyra crosses the star from Naar."
  target Naar
  participants Iyath Naar Seyra
  timing "Local noon"
  visibility "Naar equatorial belt"
  tags eclipse season
  color "#7ecb74"

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
    azimuth 30
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
  semiMajor 0.86au
  phase 40deg

object moon Beryl
  orbit Aster
  distance 310000km
  phase 30deg

event aster-eclipse
  kind solar-eclipse
  target Aster
  participants Helion Aster Beryl
  epoch "JY-0214.0"
  referencePlane ecliptic

  positions
    pose Aster
      orbit Helion
      semiMajor 0.86au
      phase 90deg

    pose Beryl
      orbit Aster
      distance 310000km
      phase 90deg
      epoch "JY-0214.0"
      referencePlane aster-equatorial
`.trim();

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

  assert.equal(atlas.version, "2.6.1");
  assert.equal(atlas.schemaVersion, "2.6.1");
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
  assert.ok(result.diagnostics.every((diagnostic) => diagnostic.severity === "warning"));
  assert.ok(
    result.diagnostics.some((diagnostic) => diagnostic.code === "validate.phase.epochMissing"),
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) => diagnostic.code === "validate.inclination.referencePlaneMissing",
    ),
  );
});

test("loadWorldOrbitSourceWithDiagnostics warns when reading legacy schema 2.0-draft input", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(legacyDraftExample);

  assert.equal(result.ok, true);
  assert.equal(result.value?.schemaVersion, "2.0-draft");
  assert.equal(result.value?.atlasDocument?.version, "2.0");
  assert.equal(result.diagnostics[0]?.code, "load.schema.deprecatedDraft");
});

test("parseWorldOrbitAtlas supports schema 2.1 comments, groups, relations, and typed object blocks", () => {
  const atlas = parseWorldOrbitAtlas(schema21Source);
  const document = materializeAtlasDocument(atlas);
  const naar = document.objects.find((object) => object.id === "Naar");
  const orun = document.objects.find((object) => object.id === "Orun");
  const innerViewpoint = atlas.system?.viewpoints.find((viewpoint) => viewpoint.id === "inner");

  assert.equal(atlas.version, "2.1");
  assert.equal(atlas.schemaVersion, "2.1");
  assert.equal(atlas.groups[0]?.id, "inner-system");
  assert.equal(atlas.relations[0]?.id, "supply-route");
  assert.equal(atlas.system?.description, "Compact circumprimary planetary system in a wide binary");
  assert.equal(atlas.system?.epoch, "JY-0001.0");
  assert.equal(atlas.system?.referencePlane, "ecliptic");
  assert.deepEqual(innerViewpoint?.filter?.groupIds, ["inner-system"]);

  assert.equal(document.schemaVersion, "2.1");
  assert.equal(document.groups[0]?.label, "Inner System");
  assert.equal(document.relations[0]?.kind, "logistics");
  assert.deepEqual(naar?.groups, ["inner-system"]);
  assert.equal(naar?.renderHints?.renderPriority, 5);
  assert.deepEqual(naar?.validationRules, [{ rule: "kepler" }]);
  assert.deepEqual(naar?.lockedFields, ["period"]);
  assert.equal(naar?.typedBlocks?.climate?.meanSurfaceTemperature, "291K");
  assert.equal(naar?.typedBlocks?.habitability?.inhabited, "true");
  assert.equal(naar?.typedBlocks?.settlement?.population, "8.2 billion");
  assert.equal(orun?.resonance?.targetObjectId, "Seyra");
  assert.equal(orun?.resonance?.ratio, "2:1");
  assert.equal(orun?.renderHints?.renderLabel, false);
  assert.equal(orun?.renderHints?.renderOrbit, false);
});

test("schema 2.1 parses declarative events, event poses, and viewpoint event references", () => {
  const atlas = parseWorldOrbitAtlas(schema21EventSource);
  const document = materializeAtlasDocument(atlas, { activeEventId: "naar-eclipse" });
  const eventEntry = atlas.events.find((entry) => entry.id === "naar-eclipse");
  const eclipseView = atlas.system?.viewpoints.find((viewpoint) => viewpoint.id === "eclipse");
  const activeNaar = document.objects.find((object) => object.id === "Naar");
  const activeSeyra = document.objects.find((object) => object.id === "Seyra");

  assert.equal(atlas.version, "2.1");
  assert.equal(eventEntry?.kind, "solar-eclipse");
  assert.deepEqual(eventEntry?.participantObjectIds, ["Iyath", "Naar", "Seyra"]);
  assert.equal(eventEntry?.positions.length, 2);
  assert.equal(eventEntry?.positions[0]?.placement?.mode, "orbit");
  assert.deepEqual(eclipseView?.events, ["naar-eclipse"]);
  assert.equal(eclipseView?.layers.events, true);
  assert.equal(activeNaar?.placement?.phase?.value, 90);
  assert.equal(activeSeyra?.placement?.phase?.value, 90);
});

test("schema 2.1 documents roundtrip through formatting without losing semantic fields", () => {
  const atlas = parseWorldOrbitAtlas(schema21Source);
  const formatted = formatDocument(atlas, { schema: "2.1" });
  const reparsed = parseWorldOrbitAtlas(formatted);
  const reparsedNaar = reparsed.objects.find((object) => object.id === "Naar");
  const reparsedOrun = reparsed.objects.find((object) => object.id === "Orun");

  assert.match(formatted, /^schema 2\.1/m);
  assert.match(formatted, /^group inner-system$/m);
  assert.match(formatted, /^relation supply-route$/m);
  assert.match(formatted, /^  climate$/m);
  assert.doesNotMatch(formatted, /# Main atlas/);

  assert.equal(reparsed.version, "2.1");
  assert.equal(reparsed.groups[0]?.id, "inner-system");
  assert.equal(reparsed.relations[0]?.id, "supply-route");
  assert.equal(reparsedNaar?.typedBlocks?.settlement?.population, "8.2 billion");
  assert.deepEqual(reparsedNaar?.tolerances, [{ field: "period", value: { value: 0.5, unit: "d" } }]);
  assert.equal(reparsedOrun?.resonance?.ratio, "2:1");
});

test("schema 2.1 events roundtrip through formatting without losing poses or viewpoint links", () => {
  const atlas = parseWorldOrbitAtlas(schema21EventSource);
  const formatted = formatDocument(atlas, { schema: "2.1" });
  const reparsed = parseWorldOrbitAtlas(formatted);
  const eventEntry = reparsed.events.find((entry) => entry.id === "naar-eclipse");
  const eclipseView = reparsed.system?.viewpoints.find((viewpoint) => viewpoint.id === "eclipse");

  assert.match(formatted, /^event naar-eclipse$/m);
  assert.match(formatted, /^  positions$/m);
  assert.match(formatted, /^    pose Seyra$/m);
  assert.equal(eventEntry?.positions.find((entry) => entry.objectId === "Seyra")?.placement?.phase?.value, 90);
  assert.deepEqual(eclipseView?.events, ["naar-eclipse"]);
});

test("schema 2.5 parses camera blocks, new projections, and event context fields", () => {
  const atlas = parseWorldOrbitAtlas(schema25Source);
  const overview = atlas.system?.viewpoints.find((viewpoint) => viewpoint.id === "overview");
  const eclipse = atlas.system?.viewpoints.find((viewpoint) => viewpoint.id === "eclipse");
  const eventEntry = atlas.events.find((entry) => entry.id === "aster-eclipse");
  const pose = eventEntry?.positions.find((entry) => entry.objectId === "Beryl");

  assert.equal(atlas.version, "2.5");
  assert.equal(overview?.projection, "orthographic");
  assert.deepEqual(overview?.camera, {
    azimuth: 30,
    elevation: 18,
    roll: null,
    distance: null,
  });
  assert.equal(eclipse?.projection, "perspective");
  assert.equal(eclipse?.camera?.distance, 6);
  assert.equal(eventEntry?.epoch, "JY-0214.0");
  assert.equal(eventEntry?.referencePlane, "ecliptic");
  assert.equal(pose?.epoch, "JY-0214.0");
  assert.equal(pose?.referencePlane, "aster-equatorial");
});

test("schema 2.5 documents roundtrip through formatting without losing camera or event context", () => {
  const atlas = parseWorldOrbitAtlas(schema25Source);
  const formatted = formatDocument(atlas, { schema: "2.5" });
  const reparsed = parseWorldOrbitAtlas(formatted);
  const overview = reparsed.system?.viewpoints.find((viewpoint) => viewpoint.id === "overview");
  const eclipse = reparsed.system?.viewpoints.find((viewpoint) => viewpoint.id === "eclipse");
  const pose = reparsed.events
    .find((entry) => entry.id === "aster-eclipse")
    ?.positions.find((entry) => entry.objectId === "Beryl");

  assert.match(formatted, /^schema 2.5/m);
  assert.match(formatted, /^  camera$/m);
  assert.match(formatted, /^    azimuth 30$/m);
  assert.match(formatted, /^  epoch JY-0214\.0$/m);
  assert.equal(reparsed.version, "2.5");
  assert.equal(overview?.camera?.azimuth, 30);
  assert.equal(eclipse?.camera?.distance, 6);
  assert.equal(pose?.referencePlane, "aster-equatorial");
});

test("schema 2.1 input reports compatibility diagnostics for schema 2.5 camera and projection features", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(`
schema 2.1

system Helion

defaults
  view orthographic

viewpoint overview
  projection perspective
  camera
    azimuth 30
    elevation 18

object star Helion
`.trim());

  assert.equal(result.ok, true);
  assert.ok(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.source === "parse" &&
        /Feature "projection" requires schema 2.5/i.test(diagnostic.message),
    ),
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.source === "parse" &&
        /Feature "viewpoint\.camera" requires schema 2.5/i.test(diagnostic.message),
    ),
  );
});

test("formatDocument can upgrade schema 2.0 atlas source to schema 2.1 without changing content", () => {
  const atlas = parseWorldOrbitAtlas(atlasExample);
  const baseline = formatDocument(atlas, { schema: "2.0" });
  const upgraded = formatDocument(atlas, { schema: "2.1" });

  assert.match(upgraded, /^schema 2\.1/m);
  assert.equal(upgraded.replace("schema 2.1", "schema 2.0"), baseline);
});

test("schema 2.0 input reports compatibility diagnostics for schema 2.1-only comments and sections", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(`
schema 2.0

# Legacy header comment
system Iyath
  title "Iyath"

group inner-system
  label "Inner System"

object star Iyath
`.trim());

  assert.equal(result.ok, true);
  assert.equal(result.value?.schemaVersion, "2.0");
  assert.ok(
    result.diagnostics.some((diagnostic) => diagnostic.code === "parse.schema21.commentCompatibility"),
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.source === "parse" &&
        /requires schema 2\.1/i.test(diagnostic.message) &&
        /group/i.test(diagnostic.message),
    ),
  );
});

test("schema 2.0 input reports compatibility diagnostics for event sections and event layers", () => {
  const result = loadWorldOrbitSourceWithDiagnostics(`
schema 2.0

system Iyath
  title "Iyath"

viewpoint eclipse
  label "Eclipse"
  layers background events objects
  events naar-eclipse

object star Iyath

event naar-eclipse
  kind solar-eclipse
  target Iyath
`.trim());

  assert.equal(result.ok, true);
  assert.ok(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.source === "parse" &&
        /Feature "layers\.events" requires schema 2\.1/i.test(diagnostic.message),
    ),
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.source === "parse" &&
        (/Feature "events" requires schema 2\.1/i.test(diagnostic.message) ||
          /Feature "event" requires schema 2\.1/i.test(diagnostic.message)),
    ),
  );
});

test("schema 2.1 parser rejects duplicate keys inside typed blocks", () => {
  assert.throws(
    () =>
      parseWorldOrbitAtlas(`
schema 2.1

system Iyath

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1au

  climate
    meanSurfaceTemperature 291K
    meanSurfaceTemperature 293K
`.trim()),
    {
      name: "WorldOrbitError",
      message: /Duplicate climate key "meanSurfaceTemperature"/,
    },
  );
});
