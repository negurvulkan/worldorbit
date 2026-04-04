import assert from "node:assert/strict";
import test from "node:test";

test("integrated hierarchy APIs resolve from main worldorbit packages", async () => {
  const core = await import("@worldorbit/core");
  const viewer = await import("@worldorbit/viewer");
  const editor = await import("@worldorbit/editor");

  assert.equal(typeof core.parseWorldOrbitHierarchyDocument, "function");
  assert.equal(typeof core.loadWorldOrbitHierarchySource, "function");
  assert.equal(typeof core.renderHierarchyDocumentToScene, "function");
  assert.equal(typeof viewer.renderHierarchySceneToSvg, "function");
  assert.equal(typeof viewer.createHierarchyViewer, "function");
  assert.equal(typeof editor.createHierarchyEditor, "function");
});
