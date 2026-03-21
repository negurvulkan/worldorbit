import { loadWorldOrbitSource, renderDocumentToScene, } from "@worldorbit/core";
import { WorldOrbit3DUnavailableError } from "./errors.js";
import { render3DUnavailableMarkup } from "./embed.js";
import { renderSceneToSvg } from "./render.js";
import { createAtlasViewer } from "./atlas-viewer.js";
import { createInteractiveViewer } from "./viewer.js";
export function defineWorldOrbitViewerElement(tagName = "worldorbit-viewer") {
    if (typeof window === "undefined" || typeof customElements === "undefined") {
        return;
    }
    if (customElements.get(tagName)) {
        return;
    }
    class WorldOrbitViewerElement extends HTMLElement {
        static get observedAttributes() {
            return ["source", "mode", "theme"];
        }
        viewer = null;
        connectedCallback() {
            this.renderCurrent();
        }
        disconnectedCallback() {
            this.viewer?.destroy();
            this.viewer = null;
        }
        attributeChangedCallback() {
            if (this.isConnected) {
                this.renderCurrent();
            }
        }
        renderCurrent() {
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
            const theme = (this.getAttribute("theme") ?? undefined);
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
                    viewMode: mode === "interactive-3d"
                        ? "3d"
                        : "2d",
                });
            }
            catch (error) {
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
function parseSource(source) {
    return loadWorldOrbitSource(source).document;
}
