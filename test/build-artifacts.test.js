import assert from "node:assert/strict";
import { accessSync, readFileSync } from "node:fs";
import test from "node:test";

const requiredArtifacts = [
  "../dist/browser/core/dist/index.js",
  "../dist/browser/viewer/dist/index.js",
  "../dist/browser/viewer/dist/runtime-3d.js",
  "../dist/browser/viewer/dist/vendor/three.module.js",
  "../dist/browser/markdown/dist/index.js",
  "../dist/browser/editor/dist/index.js",
  "../dist/unpkg/core/dist/index.js",
  "../dist/unpkg/viewer/dist/index.js",
  "../dist/unpkg/viewer/dist/runtime-3d.js",
  "../dist/unpkg/viewer/dist/vendor/three.module.js",
  "../dist/unpkg/markdown/dist/index.js",
  "../dist/unpkg/editor/dist/index.js",
  "../dist/unpkg/worldorbit-editor.min.js",
];

test("build emits root dist bundles for all browser packages including editor", () => {
  for (const relativePath of requiredArtifacts) {
    accessSync(new URL(relativePath, import.meta.url));
  }

  const editorBundle = readFileSync(new URL("../dist/unpkg/editor/dist/index.js", import.meta.url), "utf8");
  assert.match(editorBundle, /createWorldOrbitEditor/);
});
