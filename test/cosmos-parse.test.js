import assert from "node:assert/strict";
import test from "node:test";

import { parseCosmosDocument } from "@worldorbit-cosmos/core";

const source = `schema 4.0

universe Asterion
  title "Asterion Verse"

  galaxy Azure-Spindle
    title "Azure Spindle"

    system Helion
      title "Helion"
      description "A bright border system."

      defaults
        view isometric
        preset atlas-card

      object star Helion

      object planet Cinder
        orbit Helion
        semiMajor 0.74au
        phase 38deg
`;

test("schema 4.0 parses nested universe, galaxy, and system containers", () => {
  const document = parseCosmosDocument(source);

  assert.equal(document.schemaVersion, "4.0");
  assert.equal(document.suiteVersion, "6.0.0");
  assert.equal(document.universe.id, "Asterion");
  assert.equal(document.universe.galaxies.length, 1);
  assert.equal(document.universe.galaxies[0].systems.length, 1);
  assert.equal(document.universe.galaxies[0].systems[0].atlasDocument?.system?.id, "Helion");
  assert.equal(document.universe.galaxies[0].systems[0].materializedDocument?.objects.length, 2);
});
