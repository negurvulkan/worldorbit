import { accessSync } from "node:fs";
import { spawnSync } from "node:child_process";

const requiredFiles = [
  "dist/unpkg/worldorbit.min.js",
  "dist/unpkg/worldorbit.js",
  "dist/unpkg/worldorbit-core.min.js",
  "dist/unpkg/worldorbit-viewer.min.js",
  "dist/unpkg/worldorbit-markdown.min.js",
  "dist/unpkg/worldorbit-editor.min.js",
  "dist/browser/core/dist/index.js",
  "dist/browser/core/dist/load.js",
  "dist/browser/core/dist/scene.js",
  "dist/browser/core/dist/types.js",
  "dist/browser/viewer/dist/index.js",
  "dist/browser/viewer/dist/interactive-2d.js",
  "dist/browser/markdown/dist/index.js",
  "dist/browser/editor/dist/index.js",
  "dist/unpkg/core/dist/index.js",
  "dist/unpkg/core/dist/load.js",
  "dist/unpkg/core/dist/scene.js",
  "dist/unpkg/core/dist/types.js",
  "dist/unpkg/viewer/dist/index.js",
  "dist/unpkg/viewer/dist/interactive-2d.js",
  "dist/unpkg/markdown/dist/index.js",
  "dist/unpkg/editor/dist/index.js",
  "packages/core/dist/index.js",
  "packages/core/dist/load.js",
  "packages/core/dist/scene.js",
  "packages/core/dist/types.js",
  "packages/viewer/dist/index.js",
  "packages/viewer/dist/interactive-2d.js",
  "packages/viewer/dist/viewer-state.js",
  "packages/markdown/dist/index.js",
  "packages/editor/dist/index.js",
  "packages/editor/dist/editor.js",
  "packages/obsidian-plugin/dist/index.js",
  "dist/obsidian-plugin/main.js",
  "dist/obsidian-plugin/manifest.json",
  "dist/obsidian-plugin/styles.css",
];

const build = spawnSync(process.execPath, ["./scripts/build.mjs"], {
  stdio: "inherit",
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const missing = [];

for (const file of requiredFiles) {
  try {
    accessSync(file);
  } catch {
    missing.push(file);
  }
}

if (missing.length > 0) {
  console.error("Prepack verification failed. Missing publish artifacts:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("Prepack verification passed.");
