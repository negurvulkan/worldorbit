import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import { createWorldOrbitCosmosEditor } from "@worldorbit-cosmos/editor";

const source = `schema 4.0

universe Asterion
  title "Asterion Verse"

  galaxy Azure-Spindle
    title "Azure Spindle"

    system Helion
      title "Helion"

      defaults
        view isometric

      object star Helion
      object planet Cinder
        orbit Helion
        semiMajor 0.74au
`;

function installDomGlobals(window) {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    Element: globalThis.Element,
    SVGSVGElement: globalThis.SVGSVGElement,
  };

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Element = window.Element;
  globalThis.SVGSVGElement = window.SVGSVGElement;

  return () => {
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.HTMLElement = previous.HTMLElement;
    globalThis.Element = previous.Element;
    globalThis.SVGSVGElement = previous.SVGSVGElement;
  };
}

test("cosmos editor mounts and switches scope", () => {
  const dom = new JSDOM(`<div id="editor"></div>`, {
    pretendToBeVisual: true,
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const root = dom.window.document.getElementById("editor");

  try {
    const editor = createWorldOrbitCosmosEditor(root, {
      source,
      width: 960,
      height: 640,
    });

    assert.ok(root.querySelector("[data-cosmos-source]"));
    assert.ok(root.querySelector("[data-cosmos-viewer] svg"));
    assert.equal(editor.getDocument()?.universe.id, "Asterion");

    editor.setScope("universe");
    assert.match(root.querySelector("[data-cosmos-status]")?.textContent ?? "", /universe scope/);

    editor.destroy();
    assert.equal(root.textContent?.trim() ?? "", "");
  } finally {
    restoreGlobals();
    dom.window.close();
  }
});
