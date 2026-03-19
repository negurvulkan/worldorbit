import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
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
      },
      js: 'export * from "../../../packages/core/dist/index.js";\n',
      dts: 'export * from "../../../packages/core/dist/index.js";\n',
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
];

const browserBundles = [
  {
    name: "core",
    entry: "packages/core/dist/index.js",
    minifiedOutfile: "dist/unpkg/worldorbit-core.min.js",
    minifiedGlobalName: "WorldOrbitCore",
  },
  {
    name: "viewer",
    entry: "packages/viewer/dist/index.js",
    minifiedOutfile: "dist/unpkg/worldorbit-viewer.min.js",
    minifiedGlobalName: "WorldOrbitViewer",
  },
  {
    name: "markdown",
    entry: "packages/markdown/dist/index.js",
    minifiedOutfile: "dist/unpkg/worldorbit-markdown.min.js",
    minifiedGlobalName: "WorldOrbitMarkdown",
  },
  {
    name: "editor",
    entry: "packages/editor/dist/index.js",
    minifiedOutfile: "dist/unpkg/worldorbit-editor.min.js",
    minifiedGlobalName: "WorldOrbitEditor",
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
  createLocalPackageShim(item.shim);
}

function createLocalPackageShim(shim) {
  const baseDir = `node_modules/@worldorbit/${shim.dir}`;
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

async function buildBundle(entry, outfile, options = {}) {
  ensureParentDir(outfile);
  await esbuild.build({
    entryPoints: [entry],
    outfile: outfile,
    bundle: true,
    format: options.format ?? "iife",
    globalName: options.globalName,
    minify: options.minify ?? true,
    platform: "browser",
  });
}

async function buildPackageBundle(name, entry) {
  await buildBundle(entry, `dist/browser/${name}/dist/index.js`, {
    minify: false,
    format: "iife",
  });
  await buildBundle(entry, `dist/unpkg/${name}/dist/index.js`, {
    minify: false,
    format: "iife",
    globalName: "WorldOrbit",
  });
}

try {
  for (const bundle of browserBundles) {
    await buildPackageBundle(bundle.name, bundle.entry);
    await buildBundle(bundle.entry, bundle.minifiedOutfile, {
      format: "iife",
      globalName: bundle.minifiedGlobalName,
      minify: true,
    });
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

  console.log("Browser bundles built!");
} catch (e) {
  console.error("Failed to build browser bundles", e);
  process.exit(1);
}
