import assert from "node:assert/strict";
import test from "node:test";

import { loadCosmosSource, renderCosmosDocumentToScene } from "@worldorbit-cosmos/core";
import { renderCosmosSceneToSvg } from "@worldorbit-cosmos/viewer";

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
  const loaded = loadCosmosSource(source);

  const universeScene = renderCosmosDocumentToScene(loaded.document, {
    scope: "universe",
    zoom: 1.6,
  });
  assert.equal(universeScene.scope, "universe");
  assert.ok(universeScene.nodes.some((node) => node.kind === "galaxy" && node.preview === false));
  assert.ok(universeScene.nodes.some((node) => node.kind === "system" && node.preview === true));
  assert.match(renderCosmosSceneToSvg(universeScene), /data-cosmos-node-id="Azure-Spindle"/);

  const galaxyScene = renderCosmosDocumentToScene(loaded.document, {
    scope: "galaxy",
    activeGalaxyId: "Azure-Spindle",
    zoom: 1.7,
  });
  assert.equal(galaxyScene.scope, "galaxy");
  assert.ok(galaxyScene.nodes.some((node) => node.kind === "system" && node.preview === false));
  assert.ok(galaxyScene.nodes.some((node) => node.kind === "object" && node.preview === true));

  const systemScene = renderCosmosDocumentToScene(loaded.document, {
    scope: "system",
    activeSystemId: "Helion",
  });
  assert.equal(systemScene.scope, "system");
  assert.ok(systemScene.atlasScene);
  assert.match(renderCosmosSceneToSvg(systemScene), /data-worldorbit-svg="true"/);
});
