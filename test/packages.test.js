import assert from "node:assert/strict";
import test from "node:test";

test("package entry points resolve for core, viewer, markdown, and editor", async () => {
  const core = await import("@worldorbit/core");
  const viewer = await import("@worldorbit/viewer");
  const markdown = await import("@worldorbit/markdown");
  const editor = await import("@worldorbit/editor");

  assert.equal(typeof core.parse, "function");
  assert.equal(typeof core.renderDocumentToScene, "function");
  assert.equal(typeof core.parseWorldOrbitAtlas, "function");
  assert.equal(typeof viewer.renderSceneToSvg, "function");
  assert.equal(typeof viewer.createInteractiveViewer, "function");
  assert.equal(typeof viewer.createAtlasViewer, "function");
  assert.equal(typeof markdown.remarkWorldOrbit, "function");
  assert.equal(typeof markdown.rehypeWorldOrbit, "function");
  assert.equal(typeof editor.createWorldOrbitEditor, "function");
});
