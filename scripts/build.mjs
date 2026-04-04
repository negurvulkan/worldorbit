import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import * as esbuild from "esbuild-wasm";

const projects = [
  {
    project: "packages/core",
    shim: {
      name: "@worldorbit/core",
      dir: "core",
      exports: {
        ".": {
          import: "./index.js",
          types: "./index.d.ts",
        },
        "./load": {
          import: "./load.js",
          types: "./load.d.ts",
        },
        "./scene": {
          import: "./scene.js",
          types: "./scene.d.ts",
        },
        "./types": {
          import: "./types.js",
          types: "./types.d.ts",
        },
      },
      js: 'export * from "../../../packages/core/dist/index.js";\n',
      dts: 'export * from "../../../packages/core/dist/index.js";\n',
      extra: [
        {
          file: "load.js",
          contents: 'export * from "../../../packages/core/dist/load.js";\n',
        },
        {
          file: "load.d.ts",
          contents: 'export * from "../../../packages/core/dist/load.js";\n',
        },
        {
          file: "scene.js",
          contents: 'export * from "../../../packages/core/dist/scene.js";\n',
        },
        {
          file: "scene.d.ts",
          contents: 'export * from "../../../packages/core/dist/scene.js";\n',
        },
        {
          file: "types.js",
          contents: 'export * from "../../../packages/core/dist/types.js";\n',
        },
        {
          file: "types.d.ts",
          contents: 'export * from "../../../packages/core/dist/types.js";\n',
        },
      ],
    },
  },
  {
    project: "packages/viewer",
    shim: {
      name: "@worldorbit/viewer",
      dir: "viewer",
      exports: {
        ".": {
          import: "./index.js",
          types: "./index.d.ts",
        },
        "./interactive-2d": {
          import: "./interactive-2d.js",
          types: "./interactive-2d.d.ts",
        },
        "./viewer-state": {
          import: "./viewer-state.js",
          types: "./viewer-state.d.ts",
        },
      },
      js: 'export * from "../../../packages/viewer/dist/index.js";\n',
      dts: 'export * from "../../../packages/viewer/dist/index.js";\n',
      extra: [
        {
          file: "viewer-state.js",
          contents: 'export * from "../../../packages/viewer/dist/viewer-state.js";\n',
        },
        {
          file: "viewer-state.d.ts",
          contents: 'export * from "../../../packages/viewer/dist/viewer-state.js";\n',
        },
        {
          file: "interactive-2d.js",
          contents: 'export * from "../../../packages/viewer/dist/interactive-2d.js";\n',
        },
        {
          file: "interactive-2d.d.ts",
          contents: 'export * from "../../../packages/viewer/dist/interactive-2d.js";\n',
        },
      ],
    },
  },
  {
    project: "packages/markdown",
    shim: {
      name: "@worldorbit/markdown",
      dir: "markdown",
      exports: {
        ".": {
          import: "./index.js",
          types: "./index.d.ts",
        },
      },
      js: 'export * from "../../../packages/markdown/dist/index.js";\n',
      dts: 'export * from "../../../packages/markdown/dist/index.js";\n',
    },
  },
  {
    project: "packages/editor",
    shim: {
      name: "@worldorbit/editor",
      dir: "editor",
      exports: {
        ".": {
          import: "./index.js",
          types: "./index.d.ts",
        },
      },
      js: 'export * from "../../../packages/editor/dist/index.js";\n',
      dts: 'export * from "../../../packages/editor/dist/index.js";\n',
    },
  },
  {
    project: "packages/obsidian-plugin",
    shim: {
      name: "@worldorbit/obsidian-plugin",
      dir: "obsidian-plugin",
      exports: {
        ".": {
          import: "./index.js",
          types: "./index.d.ts",
        },
      },
      js: 'export * from "../../../packages/obsidian-plugin/dist/index.js";\n',
      dts: 'export * from "../../../packages/obsidian-plugin/dist/index.js";\n',
    },
  },
];

const browserBundles = [
  {
    entry: "packages/core/dist/index.js",
    outfile: "dist/unpkg/worldorbit-core.min.js",
    globalName: "WorldOrbitCore",
  },
  {
    entry: "packages/viewer/dist/index.js",
    outfile: "dist/unpkg/worldorbit-viewer.min.js",
    globalName: "WorldOrbitViewer",
  },
  {
    entry: "packages/markdown/dist/index.js",
    outfile: "dist/unpkg/worldorbit-markdown.min.js",
    globalName: "WorldOrbitMarkdown",
  },
  {
    entry: "packages/editor/dist/index.js",
    outfile: "dist/unpkg/worldorbit-editor.min.js",
    globalName: "WorldOrbitEditor",
  },
];

for (const item of projects) {
  rmSync(`${item.project}/dist`, { recursive: true, force: true });
  rmSync(`${item.project}/tsconfig.tsbuildinfo`, { force: true });
}

for (const item of projects) {
  const result = spawnSync(
    process.execPath,
    ["./node_modules/typescript/bin/tsc", "-p", `${item.project}/tsconfig.json`],
    {
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  copyPackageVendors(item.project);
  createLocalPackageShim(item.shim);
}

function createLocalPackageShim(shim) {
  const scope = shim.scope ?? "@worldorbit";
  const baseDir = `node_modules/${scope}/${shim.dir}`;
  mkdirSync(baseDir, { recursive: true });
  writeFileSync(
    `${baseDir}/package.json`,
    JSON.stringify(
      {
        name: shim.name,
        type: "module",
        exports: shim.exports,
      },
      null,
      2,
    ),
  );
  writeFileSync(`${baseDir}/index.js`, shim.js);
  writeFileSync(`${baseDir}/index.d.ts`, shim.dts);

  for (const extra of shim.extra ?? []) {
    writeFileSync(`${baseDir}/${extra.file}`, extra.contents);
  }
}

console.log("Generating browser bundles...");
rmSync("dist/browser", { recursive: true, force: true });
rmSync("dist/unpkg", { recursive: true, force: true });
mkdirSync("dist/browser", { recursive: true });
mkdirSync("dist/unpkg", { recursive: true });

function ensureParentDir(filePath) {
  const separatorIndex = filePath.lastIndexOf("/");
  if (separatorIndex >= 0) {
    mkdirSync(filePath.slice(0, separatorIndex), { recursive: true });
  }
}

function copyDirectory(sourceDir, targetDir) {
  rmSync(targetDir, { recursive: true, force: true });
  ensureParentDir(targetDir);
  cpSync(sourceDir, targetDir, { recursive: true });
}

function copyFile(sourceFile, targetFile) {
  rmSync(targetFile, { force: true });
  ensureParentDir(targetFile);
  cpSync(sourceFile, targetFile);
}

async function buildBundle(entry, outfile, options = {}) {
  ensureParentDir(outfile);
  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: options.format ?? "iife",
    globalName: options.globalName,
    minify: options.minify ?? true,
    platform: "browser",
    external: options.external ?? [],
  });
}

function copyPackageVendors(projectDir) {
  const sourceDir = `${projectDir}/vendor`;
  const targetDir = `${projectDir}/dist/vendor`;
  rmSync(targetDir, { recursive: true, force: true });

  try {
    cpSync(sourceDir, targetDir, {
      recursive: true,
    });
  } catch {
    // Packages without vendored runtime assets simply skip this step.
  }
}

try {
  for (const item of projects) {
    const packageName = item.project.split("/").at(-1);
    if (!packageName) {
      continue;
    }

    cpSync(
      `${item.project}/dist`,
      `dist/browser/${packageName}/dist`,
      { recursive: true },
    );
    cpSync(
      `${item.project}/dist`,
      `dist/unpkg/${packageName}/dist`,
      { recursive: true },
    );
  }

  const allInOneSource = `export * from "../../packages/core/dist/index.js";\nexport * from "../../packages/viewer/dist/index.js";\n`;
  writeFileSync("dist/unpkg/worldorbit.esm.js", allInOneSource);
  writeFileSync("dist/unpkg/worldorbit.d.ts", allInOneSource);

  await buildBundle("dist/unpkg/worldorbit.esm.js", "dist/unpkg/worldorbit.js", {
    format: "iife",
    globalName: "WorldOrbit",
    minify: false,
  });
  await buildBundle("dist/unpkg/worldorbit.esm.js", "dist/unpkg/worldorbit.min.js", {
    format: "iife",
    globalName: "WorldOrbit",
    minify: true,
  });

  for (const bundle of browserBundles) {
    await buildBundle(bundle.entry, bundle.outfile, {
      format: "iife",
      globalName: bundle.globalName,
      minify: true,
    });
  }

  console.log("Publishing docs assets...");
  copyFile("dist/unpkg/worldorbit.min.js", "docs/assets/worldorbit/worldorbit.min.js");
  copyDirectory("dist/browser/core", "docs/assets/browser/core");
  copyDirectory("dist/browser/viewer", "docs/assets/browser/viewer");
  copyDirectory("dist/browser/markdown", "docs/assets/browser/markdown");
  copyDirectory("dist/browser/editor", "docs/assets/browser/editor");
  copyFile("studio/studio.js", "docs/studio/studio.js");
  copyFile("studio/studio-app.js", "docs/studio/studio-app.js");
  copyFile("packages/obsidian-plugin/manifest.json", "dist/obsidian-plugin/manifest.json");
  copyFile("packages/obsidian-plugin/styles.css", "dist/obsidian-plugin/styles.css");
  await buildBundle("packages/obsidian-plugin/src/main.ts", "dist/obsidian-plugin/main.js", {
    format: "cjs",
    minify: true,
    target: ["es2020"],
    external: ["obsidian"],
    metafile: true,
  });

  const obsidianPluginStats = await esbuild.build({
    entryPoints: ["packages/obsidian-plugin/src/main.ts"],
    bundle: true,
    format: "cjs",
    minify: true,
    platform: "browser",
    target: ["es2020"],
    external: ["obsidian"],
    write: false,
    metafile: true,
  });
  const mainBytes = obsidianPluginStats.outputFiles[0]?.contents.length ?? 0;
  const topInputs = Object.entries(obsidianPluginStats.metafile.inputs)
    .map(([path, meta]) => ({ path, bytes: meta.bytes }))
    .sort((left, right) => right.bytes - left.bytes)
    .slice(0, 8);
  console.log(`Obsidian plugin bundle: ${mainBytes} bytes (minified)`);
  console.log("Obsidian plugin top inputs:");
  for (const item of topInputs) {
    console.log(`- ${item.path}: ${item.bytes} bytes`);
  }

  console.log("Browser bundles built!");
} catch (e) {
  console.error("Failed to build browser bundles", e);
  process.exit(1);
}
