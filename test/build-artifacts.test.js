import assert from "node:assert/strict";
import { accessSync, readFileSync } from "node:fs";
import test from "node:test";

const requiredArtifacts = [
  "../dist/browser/core/dist/index.js",
  "../dist/browser/core/dist/load.js",
  "../dist/browser/core/dist/scene.js",
  "../dist/browser/core/dist/types.js",
  "../dist/browser/viewer/dist/index.js",
  "../dist/browser/viewer/dist/interactive-2d.js",
  "../dist/browser/viewer/dist/runtime-3d.js",
  "../dist/browser/viewer/dist/vendor/three.module.js",
  "../dist/browser/markdown/dist/index.js",
  "../dist/browser/editor/dist/index.js",
  "../dist/unpkg/core/dist/index.js",
  "../dist/unpkg/core/dist/load.js",
  "../dist/unpkg/core/dist/scene.js",
  "../dist/unpkg/core/dist/types.js",
  "../dist/unpkg/viewer/dist/index.js",
  "../dist/unpkg/viewer/dist/interactive-2d.js",
  "../dist/unpkg/viewer/dist/runtime-3d.js",
  "../dist/unpkg/viewer/dist/vendor/three.module.js",
  "../dist/unpkg/markdown/dist/index.js",
  "../dist/unpkg/editor/dist/index.js",
  "../dist/unpkg/worldorbit.js",
  "../dist/unpkg/worldorbit.min.js",
  "../dist/unpkg/worldorbit-editor.min.js",
  "../dist/obsidian-plugin/main.js",
  "../dist/obsidian-plugin/manifest.json",
  "../dist/obsidian-plugin/styles.css",
  "../docs/assets/worldorbit/worldorbit.min.js",
  "../docs/assets/browser/core/dist/index.js",
  "../docs/assets/browser/viewer/dist/index.js",
  "../docs/assets/browser/viewer/dist/runtime-3d.js",
  "../docs/assets/browser/viewer/dist/vendor/three.module.js",
  "../docs/assets/browser/markdown/dist/index.js",
  "../docs/assets/browser/editor/dist/index.js",
];

test("build emits root dist bundles for all browser packages including editor", () => {
  for (const relativePath of requiredArtifacts) {
    accessSync(new URL(relativePath, import.meta.url));
  }

  const editorBundle = readFileSync(new URL("../dist/unpkg/editor/dist/index.js", import.meta.url), "utf8");
  assert.match(editorBundle, /createWorldOrbitEditor/);

  const rootBundle = readFileSync(new URL("../dist/unpkg/worldorbit.min.js", import.meta.url), "utf8");
  assert.doesNotMatch(rootBundle.slice(0, 200), /\bexport\b/);
  assert.match(rootBundle, /WorldOrbit/);

  const docsBundle = readFileSync(new URL("../docs/assets/worldorbit/worldorbit.min.js", import.meta.url), "utf8");
  assert.match(docsBundle, /WorldOrbit/);

  const obsidianBundle = readFileSync(new URL("../dist/obsidian-plugin/main.js", import.meta.url), "utf8");
  assert.ok(Buffer.byteLength(obsidianBundle, "utf8") < 250_000);
  assert.doesNotMatch(obsidianBundle, /three\.module/);
  assert.doesNotMatch(obsidianBundle, /runtime-3d/);
  assert.doesNotMatch(obsidianBundle, /renderDocumentToSpatialScene/);
  assert.doesNotMatch(obsidianBundle, /createAtlasViewer/);
});
