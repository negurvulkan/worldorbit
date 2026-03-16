# WorldOrbit

**WorldOrbit is a text-first DSL, atlas viewer, and editor platform for fictional orbital systems.**

Built for worldbuilders, sci-fi authors, game designers, and hobbyists, WorldOrbit makes it easy to design, visualize, and share complex stellar systems without getting tangled in node-spaghetti or hard math.

With `v2.5`, WorldOrbit provides a production-ready authoring baseline that turns simple text into interactive, beautiful system atlases.

## Why WorldOrbit?

- **Text-First & Git-Friendly**: Write your systems in a simple, human-readable Domain Specific Language (DSL). Perfect for version control and Markdown integration.
- **Relational by Position**: No complex edge types or manual graph drawing. You define where an object is (`orbit`, `at`, `surface`, `free`), and the relationships emerge naturally.
- **Lore Meets Data**: An intuitive `info` block allows you to attach narrative metadata (factions, population, climate) directly to the physical bodies.
- **Beautiful Results**: The built-in viewer renders your text into interactive SVG atlases with themes, viewpoints, and rich tooltips.

## ⚡ Quick Example

Here is how simple it is to build a star system:

```worldorbit
schema 2.0

system Iyath
  title "Iyath System"

defaults
  view isometric
  scale presentation
  preset atlas-card
  theme atlas

star Iyath

planet Naar
  orbit Iyath
  semiMajor 1.18au
  period 412d
  
  info
    faction "Veyrathische Republik"
    population "8.4 billion"
    description "Heimatwelt der Enari."
```

## The Studio Editor

The easiest way to get started is the **WorldOrbit Studio**, our browser-based authoring environment. 

Capabilities include:
- Interactive 2D stage with themes (`atlas`, `nightglass`, `ember`).
- Live inspector editing for system defaults, viewpoints, annotations, and object properties.
- Direct manipulation handles for `orbit`, `at`, `surface`, and `free` placements.
- Split-pane view with live source synchronization.
- Export to static SVG or interactive Embeds.

**[Try the browser demo](/demo/index.html)**
**[Open Studio Editor](/studio/index.html)**

---

## For Developers: The Ecosystem

Under the hood, WorldOrbit is a monorepo offering several packages to integrate orbital worldbuilding into your own tools, games, or sites.

### `@worldorbit/core`
The engine room. Use `core` when you need language tooling, schema conversion, diagnostics, or scene generation.
- Parsing, normalization, validation, and AST generation.
- Turn WorldOrbit source into a structured document and stable render scene.

<details>
<summary><b>Show Example Usage</b></summary>

```ts
import {
  formatDocument,
  loadWorldOrbitSource,
  parse,
  parseWorldOrbitAtlas,
  renderDocumentToScene,
  upgradeDocumentToV2,
} from "@worldorbit/core";

const stable = parse(`
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au
`.trim());

// Upgrade and format
const atlasDocument = upgradeDocumentToV2(stable.document, { preset: "atlas-card" });
const atlasSource = formatDocument(atlasDocument, { schema: "2.0" });

// Load and render
const loaded = loadWorldOrbitSource(atlasSource);
const scene = renderDocumentToScene(loaded.document, {
  projection: "isometric",
  scaleModel: {
    orbitDistanceMultiplier: 1.1,
    bodyRadiusMultiplier: 1.15,
  },
});
```
</details>

### `@worldorbit/viewer`
The presentation layer. Use `viewer` for SVG output, atlas navigation, embeds, and browser interactivity.
- Scene-based SVG rendering with theme presets (`atlas`, `nightglass`, `ember`).
- Rich tooltip cards, layers, projections, and serialized state for embeds.

<details>
<summary><b>Show Example Usage</b></summary>

```ts
import { loadWorldOrbitSource } from "@worldorbit/core";
import {
  createAtlasViewer,
  createInteractiveViewer,
  renderSceneToSvg,
} from "@worldorbit/viewer";

const loaded = loadWorldOrbitSource(source);
const scene = renderDocumentToScene(loaded.document, {
  projection: "isometric",
});

const svg = renderSceneToSvg(scene, {
  theme: "atlas",
  preset: "atlas-card",
});

// High-level atlas with search, filters, and viewpoints
const atlasViewer = createAtlasViewer(document.getElementById("atlas"), {
  source,
  theme: "atlas",
});
```
</details>

### `@worldorbit/markdown`
The publishing bridge. Use `markdown` to transform fenced `worldorbit` blocks into static or hydrated atlas output.
- Remark/Rehype plugins to parse and render `.md` files.
- Modes for inline static SVGs or fully interactive serialised embeds.

<details>
<summary><b>Show Example Usage</b></summary>

```ts
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { remarkWorldOrbit } from "@worldorbit/markdown";

const html = String(
  await unified()
    .use(remarkParse)
    .use(remarkWorldOrbit, { mode: "interactive" })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdownSource),
);
```
</details>

### `@worldorbit/editor`
The authoring component. Use `editor` when you want a browser-based authoring surface that roundtrips to canonical `schema 2.0`.
- The foundation of the Studio app, exposing `createWorldOrbitEditor(...)`.

<details>
<summary><b>Show Example Usage</b></summary>

```ts
import { createWorldOrbitEditor } from "@worldorbit/editor";

const editor = createWorldOrbitEditor(document.getElementById("studio"), {
  source,
  showInspector: true,
  showTextPane: true,
  showPreview: true,
});
```
</details>

---

## Installation & Build

Want to build WorldOrbit locally or contribute to the packages?

```bash
# Install dependencies
npm install

# Build all packages locally
npm run build

# Run tests
npm test
```

The workspace builds package outputs into `packages/*/dist` and refreshes local package shims in `node_modules/@worldorbit/...` for seamless package-style development.

### Development Notes
- `npm run build` compiles all packages and refreshes local package shims.
- `npm test` rebuilds first, then runs the Node and jsdom-based regression suite.
- **Parser-first**: The repository guarantees that rendering and atlas interaction always stay downstream of parse, normalize, and validate.

---

## Documentation & Resources

- API inventory: [docs/api-inventory.md](docs/api-inventory.md)
- Changelog: [docs/changelog.md](docs/changelog.md)

### Examples
You can find various example atlases and markdown files in the [`examples/`](examples/) directory, showcasing minimal setups, complex systems, and markdown integrations.