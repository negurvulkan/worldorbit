import assert from "node:assert/strict";
import test from "node:test";

test("package entry points and slim subpaths resolve for core, viewer, markdown, and editor", async () => {
  const core = await import("@worldorbit/core");
  const coreLoad = await import("@worldorbit/core/load");
  const coreScene = await import("@worldorbit/core/scene");
  const viewer = await import("@worldorbit/viewer");
  const viewer2d = await import("@worldorbit/viewer/interactive-2d");
  const markdown = await import("@worldorbit/markdown");
  const editor = await import("@worldorbit/editor");

  assert.equal(typeof core.parse, "function");
  assert.equal(typeof core.renderDocumentToScene, "function");
  assert.equal(typeof core.renderDocumentToSpatialScene, "function");
  assert.equal(typeof core.parseWorldOrbitAtlas, "function");
  assert.equal(typeof core.parseWorldOrbitHierarchyDocument, "function");
  assert.equal(typeof core.renderHierarchyDocumentToScene, "function");
  assert.equal(typeof coreLoad.loadWorldOrbitSourceWithDiagnostics, "function");
  assert.equal(typeof coreScene.renderDocumentToScene, "function");
  assert.equal(typeof viewer.renderSceneToSvg, "function");
  assert.equal(typeof viewer.renderHierarchySceneToSvg, "function");
  assert.equal(typeof viewer.createInteractiveViewer, "function");
  assert.equal(typeof viewer.createHierarchyViewer, "function");
  assert.equal(typeof viewer2d.createInteractiveViewer2D, "function");
  assert.equal(typeof viewer2d.renderSceneToSvg, "function");
  assert.equal(typeof viewer.createAtlasViewer, "function");
  assert.equal(typeof viewer.WorldOrbit3DUnavailableError, "function");
  assert.equal(typeof markdown.remarkWorldOrbit, "function");
  assert.equal(typeof markdown.rehypeWorldOrbit, "function");
  assert.equal(typeof editor.createWorldOrbitEditor, "function");
  assert.equal(typeof editor.createHierarchyEditor, "function");
});
