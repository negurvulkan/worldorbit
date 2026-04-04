import assert from "node:assert/strict";
import test from "node:test";

import { loadWorldOrbitSource, renderHierarchyDocumentToScene } from "@worldorbit/core";
import { renderHierarchySceneToSvg } from "@worldorbit/viewer";

const source = `schema 4.0

universe Asterion
  title "Asterion Verse"

  galaxy Azure-Spindle
    title "Azure Spindle"

    system Helion
      title "Helion"

      defaults
        view isometric

      object star Helion
      object planet Cinder
        orbit Helion
        semiMajor 0.74au

    system Nacre
      title "Nacre"

      defaults
        view topdown

      object star Nacre
`;

test("cosmos viewer renders galaxies in universe scope and systems in galaxy scope", () => {
  const loaded = loadWorldOrbitSource(source);
  assert.ok(loaded.hierarchyDocument);

  const universeScene = renderHierarchyDocumentToScene(loaded.hierarchyDocument, {
    scope: "universe",
    zoom: 1.6,
  });
  assert.equal(universeScene.scope, "universe");
  assert.ok(universeScene.nodes.some((node) => node.kind === "galaxy" && node.preview === false));
  assert.ok(universeScene.nodes.some((node) => node.kind === "system" && node.preview === true));
  assert.match(renderHierarchySceneToSvg(universeScene), /data-worldorbit-hierarchy-node-id="Azure-Spindle"/);

  const galaxyScene = renderHierarchyDocumentToScene(loaded.hierarchyDocument, {
    scope: "galaxy",
    activeGalaxyId: "Azure-Spindle",
    zoom: 1.7,
  });
  assert.equal(galaxyScene.scope, "galaxy");
  assert.ok(galaxyScene.nodes.some((node) => node.kind === "system" && node.preview === false));
  assert.ok(galaxyScene.nodes.some((node) => node.kind === "object" && node.preview === true));

  const systemScene = renderHierarchyDocumentToScene(loaded.hierarchyDocument, {
    scope: "system",
    activeSystemId: "Helion",
  });
  assert.equal(systemScene.scope, "system");
  assert.ok(systemScene.atlasScene);
  assert.match(renderHierarchySceneToSvg(systemScene), /data-worldorbit-svg="true"/);
});
