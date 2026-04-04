import {
  loadCosmosSource,
  renderCosmosDocumentToScene,
  type CosmosScope,
  type LoadedCosmosSource,
} from "@worldorbit-cosmos/core";

import { renderCosmosSceneToSvg } from "./render.js";
import type { WorldOrbitCosmosViewer, WorldOrbitCosmosViewerOptions } from "./types.js";

export function createWorldOrbitCosmosViewer(
  container: HTMLElement,
  options: WorldOrbitCosmosViewerOptions = {},
): WorldOrbitCosmosViewer {
  if (!(container instanceof HTMLElement)) {
    throw new Error("WorldOrbit Cosmos viewer requires an HTMLElement container.");
  }

  let source = options.source ?? "";
  let loaded: LoadedCosmosSource | null = source ? loadCosmosSource(source) : null;
  let scope: CosmosScope = options.scope ?? "system";
  let zoom = options.zoom ?? 1;
  let activeGalaxyId = options.activeGalaxyId ?? null;
  let activeSystemId = options.activeSystemId ?? null;
  let selectedNodeId: string | null = null;
  let destroyed = false;
  let scene = loaded
    ? renderCosmosDocumentToScene(loaded.document, {
        width: options.width,
        height: options.height,
        padding: options.padding,
        scope,
        zoom,
        activeGalaxyId,
        activeSystemId,
      })
    : null;

  container.classList.add("woc-viewer");
  container.addEventListener("click", handleClick);
  render();

  return {
    setSource(nextSource) {
      source = nextSource;
      loaded = nextSource ? loadCosmosSource(nextSource) : null;
      scene = loaded
        ? renderCosmosDocumentToScene(loaded.document, {
            width: options.width,
            height: options.height,
            padding: options.padding,
            scope,
            zoom,
            activeGalaxyId,
            activeSystemId,
          })
        : null;
      render();
    },
    setScope(nextScope) {
      scope = nextScope;
      rerender();
    },
    setZoom(nextZoom) {
      zoom = nextZoom;
      rerender();
    },
    setActiveGalaxy(galaxyId) {
      activeGalaxyId = galaxyId;
      rerender();
    },
    setActiveSystem(systemId) {
      activeSystemId = systemId;
      rerender();
    },
    setSelection(nodeId) {
      selectedNodeId = nodeId;
      render();
    },
    getScene() {
      return scene;
    },
    getLoadedSource() {
      return loaded;
    },
    destroy() {
      destroyed = true;
      container.removeEventListener("click", handleClick);
      container.innerHTML = "";
    },
  };

  function rerender(): void {
    scene = loaded
      ? renderCosmosDocumentToScene(loaded.document, {
          width: options.width,
          height: options.height,
          padding: options.padding,
          scope,
          zoom,
          activeGalaxyId,
          activeSystemId,
        })
      : null;
    render();
  }

  function render(): void {
    if (destroyed) {
      return;
    }
    if (!scene) {
      container.innerHTML = `<div style="padding:16px;color:#edf6ff;background:#07101f;border:1px solid rgba(123,208,255,.16)">WorldOrbit Cosmos viewer is waiting for source.</div>`;
      return;
    }
    container.innerHTML = renderCosmosSceneToSvg(scene, {
      selectedNodeId,
    });
  }

  function handleClick(event: Event): void {
    const target = event.target as Element | null;
    const node = target?.closest?.("[data-cosmos-node-id]") as HTMLElement | null;
    if (!node) {
      return;
    }
    selectedNodeId = node.dataset.cosmosNodeId ?? null;
    render();
    options.onSelectionChange?.(selectedNodeId);
  }
}
