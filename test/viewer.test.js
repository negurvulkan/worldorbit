import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import { createInteractiveViewer, parse } from "../dist/index.js";

const source = `
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au
moon Leth orbit Naar distance 220000km
structure Relay kind relay at Naar:L4
`.trim();

function installDomGlobals(window) {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    Element: globalThis.Element,
    SVGSVGElement: globalThis.SVGSVGElement,
    SVGGElement: globalThis.SVGGElement,
    CSS: globalThis.CSS,
  };

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Element = window.Element;
  globalThis.SVGSVGElement = window.SVGSVGElement;
  globalThis.SVGGElement = window.SVGGElement;
  globalThis.CSS = window.CSS ?? { escape: (value) => value };

  return () => {
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.HTMLElement = previous.HTMLElement;
    globalThis.Element = previous.Element;
    globalThis.SVGSVGElement = previous.SVGSVGElement;
    globalThis.SVGGElement = previous.SVGGElement;
    globalThis.CSS = previous.CSS;
  };
}

test("interactive viewer mounts, updates, selects, and destroys cleanly", () => {
  const dom = new JSDOM(`<div id="preview"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const preview = dom.window.document.getElementById("preview");
  const selections = [];
  const views = [];

  preview.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 1080,
    bottom: 720,
    width: 1080,
    height: 720,
    toJSON() {
      return {};
    },
  });

  try {
    const viewer = createInteractiveViewer(preview, {
      source,
      width: 1080,
      height: 720,
      onSelectionChange(selection) {
        selections.push(selection?.objectId ?? null);
      },
      onViewChange(state) {
        views.push(state);
      },
    });

    assert.ok(preview.querySelector("svg"));
    assert.ok(preview.querySelector("#worldorbit-camera-root"));
    assert.ok(views.length > 0);

    viewer.setDocument(parse(source).document);
    assert.ok(preview.querySelector('[data-object-id="Naar"]'));

    preview
      .querySelector('[data-object-id="Naar"]')
      ?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

    assert.equal(selections.at(-1), "Naar");
    assert.match(
      preview.querySelector('[data-object-id="Naar"]')?.getAttribute("class") ?? "",
      /wo-object-selected/,
    );

    const selectionCount = selections.length;
    viewer.destroy();

    preview
      .querySelector('[data-object-id="Leth"]')
      ?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

    assert.equal(selections.length, selectionCount);
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});
