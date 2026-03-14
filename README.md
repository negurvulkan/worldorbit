# WorldOrbit

WorldOrbit is a Mermaid-like Markdown DSL and parser pipeline for fictional star systems, orbital structures, and text-first worldbuilding.

The repository now includes:

- a hand-written parser with line/column-aware errors
- normalization into a stable document model
- semantic validation for ids and placement references
- a scene-based SVG renderer
- a browser-side interactive viewer API with zoom, pan, rotate, fit, and selection
- a browser demo in [demo/index.html](/demo/index.html)

## Goals

WorldOrbit is designed to be:

- easy to author in Markdown
- easy to parse and validate
- easy to render later in 2D and 3D
- flexible enough for fictional systems, not only realistic astronomy

## Installation

```bash
npm install
```

The project keeps runtime dependencies at zero and uses a lightweight test stack for browser-smoke coverage.

## Scripts

```bash
npm run build
npm test
```

- `npm run build` compiles the library to `dist/`
- `npm test` builds first and then runs the Node test suite in `test/`

## Example

```worldorbit
system Iyath
  title "Iyath System"
  view topdown
  scale compressed

star Iyath
  class G2
  radius 1.08sol
  mass 1.02sol

planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.03
  period 412d
  tags habitable homeworld

  info
    faction "Veyrathische Republik"
    description "Heimatwelt der Enari."

moon Leth
  orbit Naar
  distance 220000km
  period 18d

structure L4-Relay
  kind relay
  at Naar:L4
```

A richer sample lives in [examples/iyath.worldorbit](/examples/iyath.worldorbit).

## Library Usage

```ts
import {
  createInteractiveViewer,
  parse,
  renderDocumentToScene,
  renderDocumentToSvg,
  renderSourceToSvg,
} from "@worldorbit/core";

const source = `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au
`.trim();

const result = parse(source);
const scene = renderDocumentToScene(result.document);
const svg = renderDocumentToSvg(result.document);

// or in one step
const svgDirect = renderSourceToSvg(source);

// browser-side viewer
const viewer = createInteractiveViewer(document.getElementById("preview"), {
  document: result.document,
});
```

### Parse Result

```ts
type ParseResult = {
  ast: AstDocument;
  document: WorldOrbitDocument;
};
```

`WorldOrbitDocument` separates system metadata, normalized object properties, placements, and free-form `info`.

## Renderer And Viewer

The renderer targets SVG and intentionally stays simple:

- orbiting objects are laid out in a readable top-down diagram
- `surface`, `free`, and `at` placements are visualized distinctly
- `Naar:L4` and `Iyath-Naar:L2` normalize into explicit Lagrange references
- belts and rings render as orbit bands

The rendering stack now has three levels:

- normalized document
- `RenderScene`
- SVG output

The interactive viewer sits on top of `RenderScene` and adds:

- wheel / trackpad zoom
- drag pan
- rotate left / right
- fit-to-system
- object selection and focus helpers
- keyboard shortcuts for the camera

## Demo

After building the project, open [demo/index.html](/demo/index.html).

The demo provides:

- a live DSL editor
- an interactive SVG viewer
- the normalized JSON model
- direct SVG export

If your browser blocks ES modules from `file://`, serve the repository once with any static file server and open `demo/index.html` through `http://localhost/...`.

## Current Scope

Supported object types:

- `system`
- `star`
- `planet`
- `moon`
- `belt`
- `asteroid`
- `comet`
- `ring`
- `structure`
- `phenomenon`

Supported placement modes:

- `orbit`
- `at`
- `surface`
- `free`

## Validation and Errors

The parser and normalization layer now report clearer failures for:

- unknown object types
- unclosed quotes
- duplicate fields
- duplicate info keys
- invalid numeric or unit values
- invalid Lagrange syntax
- unknown placement references

Errors include line and column information when they originate from source syntax.
