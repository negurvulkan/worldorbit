import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import {
  createWorldOrbitStudio,
  loadRecoveryDraft,
  loadSessionState,
} from "../studio/studio-app.js";

const studioSource = `schema 2.0

system Studio
  title "Studio Test"

defaults
  view isometric
  preset atlas-card

object star Primary

object planet Home
  orbit Primary
  semiMajor 1au
  phase 48deg
`.trim();

function installDomGlobals(window) {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    Element: globalThis.Element,
    HTMLAnchorElement: globalThis.HTMLAnchorElement,
    HTMLInputElement: globalThis.HTMLInputElement,
    HTMLTextAreaElement: globalThis.HTMLTextAreaElement,
    Event: globalThis.Event,
    KeyboardEvent: globalThis.KeyboardEvent,
    MouseEvent: globalThis.MouseEvent,
    Blob: globalThis.Blob,
    CSS: globalThis.CSS,
    URL: globalThis.URL,
    fetch: globalThis.fetch,
  };

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Element = window.Element;
  globalThis.HTMLAnchorElement = window.HTMLAnchorElement;
  globalThis.HTMLInputElement = window.HTMLInputElement;
  globalThis.HTMLTextAreaElement = window.HTMLTextAreaElement;
  globalThis.Event = window.Event;
  globalThis.KeyboardEvent = window.KeyboardEvent;
  globalThis.MouseEvent = window.MouseEvent;
  globalThis.Blob = window.Blob;
  globalThis.CSS = window.CSS ?? { escape: (value) => value };
  globalThis.URL = window.URL;
  globalThis.fetch = async () => ({
    ok: true,
    async text() {
      return studioSource;
    },
  });

  const originalClick = window.HTMLAnchorElement.prototype.click;
  window.HTMLAnchorElement.prototype.click = function click() {};
  window.URL.createObjectURL = () => "blob:test";
  window.URL.revokeObjectURL = () => {};

  return () => {
    window.HTMLAnchorElement.prototype.click = originalClick;
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.HTMLElement = previous.HTMLElement;
    globalThis.Element = previous.Element;
    globalThis.HTMLAnchorElement = previous.HTMLAnchorElement;
    globalThis.HTMLInputElement = previous.HTMLInputElement;
    globalThis.HTMLTextAreaElement = previous.HTMLTextAreaElement;
    globalThis.Event = previous.Event;
    globalThis.KeyboardEvent = previous.KeyboardEvent;
    globalThis.MouseEvent = previous.MouseEvent;
    globalThis.Blob = previous.Blob;
    globalThis.CSS = previous.CSS;
    globalThis.URL = previous.URL;
    globalThis.fetch = previous.fetch;
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("studio mounts, persists session state, warns on unload, and saves canonically", async () => {
  const dom = new JSDOM(`<div id="studio"></div>`, {
    pretendToBeVisual: true,
    url: "https://example.test/studio/",
  });
  const restoreGlobals = installDomGlobals(dom.window);
  const root = dom.window.document.getElementById("studio");
  let studio;

  try {
    studio = await createWorldOrbitStudio(root, {
      initialSource: studioSource,
      fileName: "studio-test.worldorbit",
    });

    assert.ok(root.querySelector('[data-studio-action="save"]'));
    assert.ok(root.querySelector("[data-editor-stage] svg"));
    assert.equal(loadRecoveryDraft(), null);

    root.querySelector('[data-studio-action="toggle-preview"]').click();
    assert.equal(loadSessionState().panels.preview, false);

    const sourcePane = root.querySelector("[data-editor-source]");
    sourcePane.value = `${sourcePane.value}\n`;
    sourcePane.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    await delay(600);

    assert.ok(loadRecoveryDraft(), "Expected local draft recovery after editing");

    const beforeUnload = new dom.window.Event("beforeunload", { cancelable: true });
    dom.window.dispatchEvent(beforeUnload);
    assert.equal(beforeUnload.defaultPrevented, true);

    root.querySelector('[data-studio-action="save"]').click();
    await delay(20);

    assert.equal(loadRecoveryDraft(), null);
    assert.match(root.querySelector("[data-studio-file]").textContent, /studio-test\.worldorbit$/);
    assert.match(root.querySelector("[data-studio-message]").textContent, /Saved/);

  } finally {
    studio?.destroy();
    restoreGlobals();
    dom.window.close();
  }
});
