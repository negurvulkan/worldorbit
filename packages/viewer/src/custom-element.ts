import {
  loadWorldOrbitSource,
  renderDocumentToScene,
  type WorldOrbitDocument,
} from "@worldorbit/core";

import { WorldOrbit3DUnavailableError } from "./errors.js";
import { render3DUnavailableMarkup } from "./embed.js";
import { renderSceneToSvg } from "./render.js";
import { createAtlasViewer } from "./atlas-viewer.js";
import { createInteractiveViewer } from "./viewer.js";
import type { WorldOrbitAtlasViewer, WorldOrbitViewer } from "./types.js";

export function defineWorldOrbitViewerElement(tagName = "worldorbit-viewer"): void {
  if (typeof window === "undefined" || typeof customElements === "undefined") {
    return;
  }

  if (customElements.get(tagName)) {
    return;
  }

  class WorldOrbitViewerElement extends HTMLElement {
    static get observedAttributes(): string[] {
      return ["source", "mode", "theme"];
    }

    viewer: WorldOrbitViewer | WorldOrbitAtlasViewer | null = null;

    connectedCallback(): void {
      this.renderCurrent();
    }

    disconnectedCallback(): void {
      this.viewer?.destroy();
      this.viewer = null;
    }

    attributeChangedCallback(): void {
      if (this.isConnected) {
        this.renderCurrent();
      }
    }

    renderCurrent(): void {
      this.viewer?.destroy();
      this.viewer = null;

      const source = this.getAttribute("source") ?? this.textContent ?? "";
      const mode = this.getAttribute("mode") ?? "interactive";

      if (!source.trim()) {
        this.innerHTML = "";
        return;
      }

      const documentModel = parseSource(source);
      const scene = renderDocumentToScene(documentModel);
      const theme = (this.getAttribute("theme") ?? undefined) as
        | "atlas"
        | "nightglass"
        | "ember"
        | undefined;

      if (mode === "static") {
        this.innerHTML = renderSceneToSvg(scene, {
          theme,
        });
        return;
      }

      if (mode === "atlas") {
        this.viewer = createAtlasViewer(this, {
          scene,
          theme,
        });
        return;
      }

      try {
        this.viewer = createInteractiveViewer(this, {
          source,
          theme,
          viewMode:
            mode === "interactive-3d"
              ? "3d"
              : "2d",
        });
      } catch (error) {
        if (error instanceof WorldOrbit3DUnavailableError && mode === "interactive-3d") {
          this.innerHTML = render3DUnavailableMarkup(error.message);
          return;
        }

        throw error;
      }
    }
  }

  customElements.define(tagName, WorldOrbitViewerElement);
}

function parseSource(source: string): WorldOrbitDocument {
  return loadWorldOrbitSource(source).document;
}
