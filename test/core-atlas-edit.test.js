import assert from "node:assert/strict";
import test from "node:test";

import {
  createEmptyAtlasDocument,
  listAtlasDocumentPaths,
  removeAtlasDocumentNode,
  upsertAtlasDocumentNode,
  validateAtlasDocumentWithDiagnostics,
} from "@worldorbit/core";

test("atlas edit helpers can upsert, list, remove, and resolve diagnostics", () => {
  let document = createEmptyAtlasDocument("Iyath", "2.1");

  document = upsertAtlasDocumentNode(
    document,
    { kind: "metadata", key: "atlas.note" },
    "Reference atlas entry",
  );
  document = upsertAtlasDocumentNode(
    document,
    { kind: "viewpoint", id: "overview" },
    {
      id: "overview",
      label: "Overview",
      summary: "",
      focusObjectId: null,
      selectedObjectId: null,
      events: [],
      projection: "isometric",
      preset: "atlas-card",
      zoom: null,
      rotationDeg: 0,
      layers: {},
      filter: null,
    },
  );
  document = upsertAtlasDocumentNode(
    document,
    { kind: "group", id: "inner-system" },
    {
      id: "inner-system",
      label: "Inner System",
      summary: "Inner orbital cluster",
      color: "#d9b37a",
      tags: ["core"],
      hidden: false,
    },
  );
  document = upsertAtlasDocumentNode(
    document,
    { kind: "object", id: "Naar" },
    {
      id: "Naar",
      type: "planet",
      properties: {},
      placement: {
        mode: "orbit",
        target: "Missing",
        distance: { value: 1.2, unit: "au" },
      },
      info: {},
    },
  );
  document = upsertAtlasDocumentNode(
    document,
    { kind: "relation", id: "supply-route" },
    {
      id: "supply-route",
      from: "Naar",
      to: "Missing",
      kind: "logistics",
      label: "Supply Route",
      summary: "",
      tags: ["trade"],
      color: "#d9b37a",
      hidden: false,
    },
  );
  document = upsertAtlasDocumentNode(
    document,
    { kind: "event", id: "naar-eclipse" },
    {
      id: "naar-eclipse",
      kind: "solar-eclipse",
      label: "Naar Eclipse",
      summary: "Seyra crosses the star from Naar.",
      targetObjectId: "Naar",
      participantObjectIds: ["Iyath", "Naar", "Seyra"],
      timing: "Local noon",
      visibility: "Naar equatorial belt",
      tags: ["eclipse"],
      color: "#7ecb74",
      hidden: false,
      positions: [],
    },
  );
  document = upsertAtlasDocumentNode(
    document,
    { kind: "event-pose", id: "naar-eclipse", key: "Naar" },
    {
      objectId: "Naar",
      placement: {
        mode: "orbit",
        target: "Iyath",
        distance: { value: 1.2, unit: "au" },
        phase: { value: 90, unit: "deg" },
      },
    },
  );

  const listedPaths = listAtlasDocumentPaths(document);
  assert.ok(listedPaths.some((path) => path.kind === "metadata" && path.key === "atlas.note"));
  assert.ok(listedPaths.some((path) => path.kind === "viewpoint" && path.id === "overview"));
  assert.ok(listedPaths.some((path) => path.kind === "group" && path.id === "inner-system"));
  assert.ok(listedPaths.some((path) => path.kind === "relation" && path.id === "supply-route"));
  assert.ok(listedPaths.some((path) => path.kind === "event" && path.id === "naar-eclipse"));
  assert.ok(
    listedPaths.some(
      (path) => path.kind === "event-pose" && path.id === "naar-eclipse" && path.key === "Naar",
    ),
  );
  assert.ok(listedPaths.some((path) => path.kind === "object" && path.id === "Naar"));

  const diagnostics = validateAtlasDocumentWithDiagnostics(document);
  assert.ok(diagnostics.length > 0);
  assert.ok(
    diagnostics.some((diagnostic) => /Unknown relation target "Missing"/.test(diagnostic.diagnostic.message)),
  );

  document = removeAtlasDocumentNode(document, { kind: "metadata", key: "atlas.note" });
  document = removeAtlasDocumentNode(document, { kind: "relation", id: "supply-route" });
  document = removeAtlasDocumentNode(document, { kind: "event-pose", id: "naar-eclipse", key: "Naar" });
  document = removeAtlasDocumentNode(document, { kind: "event", id: "naar-eclipse" });
  assert.equal(
    listAtlasDocumentPaths(document).some((path) => path.kind === "metadata" && path.key === "atlas.note"),
    false,
  );
  assert.equal(
    listAtlasDocumentPaths(document).some((path) => path.kind === "relation" && path.id === "supply-route"),
    false,
  );
  assert.equal(
    listAtlasDocumentPaths(document).some((path) => path.kind === "event" && path.id === "naar-eclipse"),
    false,
  );
});
