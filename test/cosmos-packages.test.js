import assert from "node:assert/strict";
import test from "node:test";

test("cosmos fork packages resolve", async () => {
  const core = await import("@worldorbit-cosmos/core");
  const coreLoad = await import("@worldorbit-cosmos/core/load");
  const coreScene = await import("@worldorbit-cosmos/core/scene");
  const viewer = await import("@worldorbit-cosmos/viewer");
  const editor = await import("@worldorbit-cosmos/editor");

  assert.equal(typeof core.parseCosmosDocument, "function");
  assert.equal(typeof coreLoad.loadCosmosSource, "function");
  assert.equal(typeof coreScene.renderCosmosDocumentToScene, "function");
  assert.equal(typeof viewer.renderCosmosSceneToSvg, "function");
  assert.equal(typeof viewer.createWorldOrbitCosmosViewer, "function");
  assert.equal(typeof editor.createWorldOrbitCosmosEditor, "function");
});
