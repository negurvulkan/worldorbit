import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import { buildSolarSystemExampleBlock, getQuickStartMarkdown } from "../packages/obsidian-plugin/dist/examples.js";
import { inferFenceContentStartLine, resolveDiagnosticEditorPosition } from "../packages/obsidian-plugin/dist/positions.js";
import { DEFAULT_SETTINGS } from "../packages/obsidian-plugin/dist/settings.js";
import { createObsidianViewerTheme } from "../packages/obsidian-plugin/dist/theme.js";
import { WorldOrbitEmbeddedView } from "../packages/obsidian-plugin/dist/viewer-host.js";

function createRect(width = 960, height = 540) {
  return {
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON() {
      return {};
    },
  };
}

function installDomGlobals(window) {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    Element: globalThis.Element,
    SVGElement: globalThis.SVGElement,
    SVGSVGElement: globalThis.SVGSVGElement,
    Node: globalThis.Node,
  };

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Element = window.Element;
  globalThis.SVGElement = window.SVGElement;
  globalThis.SVGSVGElement = window.SVGSVGElement;
  globalThis.Node = window.Node;

  return () => {
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.HTMLElement = previous.HTMLElement;
    globalThis.Element = previous.Element;
    globalThis.SVGElement = previous.SVGElement;
    globalThis.SVGSVGElement = previous.SVGSVGElement;
    globalThis.Node = previous.Node;
  };
}

test("fence line inference maps diagnostics to absolute editor positions", () => {
  const contentStartLine = inferFenceContentStartLine({
    text: [
      "```worldorbit",
      "schema 2.5",
      "",
      "object star Helion",
      "```",
    ].join("\n"),
    lineStart: 14,
    lineEnd: 18,
  });

  assert.equal(contentStartLine, 15);
  assert.deepEqual(
    resolveDiagnosticEditorPosition(contentStartLine, {
      code: "parse.failed",
      severity: "error",
      source: "parse",
      message: "Unexpected token",
      line: 4,
      column: 7,
    }),
    { line: 18, ch: 6 },
  );
});

test("obsidian theme uses host CSS variables for viewer colors", () => {
  const theme = createObsidianViewerTheme();

  assert.equal(theme.backgroundStart, "var(--background-primary, #10131a)");
  assert.equal(theme.ink, "var(--text-normal, #e8f0ff)");
  assert.equal(theme.accent, "var(--interactive-accent, #f0b464)");
  assert.equal(theme.fontFamily, "var(--font-interface, \"Segoe UI\", sans-serif)");
});

test("obsidian plugin hides validator warnings by default", () => {
  assert.equal(DEFAULT_SETTINGS.showWarnings, false);
});

test("default diagnostics filter suppresses all validator output", () => {
  const diagnostics = [
    {
      code: "validate.warning",
      severity: "warning",
      source: "validate",
      message: "Validation warning",
    },
    {
      code: "validate.error",
      severity: "error",
      source: "validate",
      message: "Validation error",
    },
    {
      code: "parse.error",
      severity: "error",
      source: "parse",
      message: "Parse error",
    },
  ];

  const visibleByDefault = DEFAULT_SETTINGS.showWarnings
    ? diagnostics
    : diagnostics.filter((diagnostic) => diagnostic.source !== "validate");

  assert.deepEqual(
    visibleByDefault.map((diagnostic) => diagnostic.code),
    ["parse.error"],
  );
});

test("solar system example block is ready to paste into a note", () => {
  const example = buildSolarSystemExampleBlock();

  assert.match(example, /^```worldorbit/m);
  assert.match(example, /object star Sun/);
  assert.match(example, /object planet Earth/);
  assert.match(example, /object moon Luna/);
  assert.match(example, /```$/m);
});

test("quick start help explains locked mode", () => {
  const help = getQuickStartMarkdown();

  assert.match(help, /Locked mode keeps scrolling safe/i);
  assert.match(help, /semiMajor 1au/);
});

test("embedded view destroys interactive viewer only once across repeated cleanup", () => {
  const dom = new JSDOM(`<div id="host"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const host = dom.window.document.getElementById("host");
  let destroyCalls = 0;
  let renderCalls = 0;

  Object.defineProperty(host, "clientWidth", { value: 960, configurable: true });
  Object.defineProperty(host, "clientHeight", { value: 540, configurable: true });
  host.getBoundingClientRect = () => createRect(960, 540);

  const view = new WorldOrbitEmbeddedView({
    container: host,
    scene: {
      width: 920,
      height: 540,
    },
    theme: createObsidianViewerTheme(),
    interactive: true,
    enablePointer: true,
    enableTouch: true,
    createViewer(container) {
      renderCalls += 1;
      container.innerHTML = "<div data-viewer=\"true\"></div>";
      return {
        destroy() {
          destroyCalls += 1;
        },
        setRenderOptions() {},
      };
    },
    renderStatic() {
      return "<svg></svg>";
    },
  });

  try {
    view.mount();
    assert.equal(renderCalls, 1);
    view.destroy();
    view.destroy();
    assert.equal(destroyCalls, 1);
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});

test("embedded view can switch between static and interactive rendering", () => {
  const dom = new JSDOM(`<div id="host"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const host = dom.window.document.getElementById("host");
  let interactiveMounts = 0;

  Object.defineProperty(host, "clientWidth", { value: 800, configurable: true });
  Object.defineProperty(host, "clientHeight", { value: 420, configurable: true });
  host.getBoundingClientRect = () => createRect(800, 420);

  const view = new WorldOrbitEmbeddedView({
    container: host,
    scene: {
      width: 920,
      height: 540,
    },
    theme: createObsidianViewerTheme(),
    interactive: false,
    enablePointer: true,
    enableTouch: true,
    createViewer(container) {
      interactiveMounts += 1;
      container.innerHTML = "<div data-viewer=\"true\"></div>";
      return {
        destroy() {},
        setRenderOptions() {},
      };
    },
    renderStatic() {
      return "<svg data-static=\"true\"></svg>";
    },
  });

  try {
    view.mount();
    assert.match(host.innerHTML, /data-static="true"/);
    view.setInteractive(true);
    assert.equal(interactiveMounts, 1);
    assert.match(host.innerHTML, /data-viewer="true"/);
  } finally {
    view.destroy();
    restoreGlobals();
    dom.window.close();
  }
});
