import {
  loadWorldOrbitSource,
  renderHierarchyDocumentToScene,
  type LoadedWorldOrbitSource,
  type WorldOrbitHierarchyScope,
} from "@worldorbit/core";

import { renderHierarchySceneToSvg } from "./hierarchy-render.js";
import type { WorldOrbitHierarchyViewer, WorldOrbitHierarchyViewerOptions } from "./hierarchy-types.js";

export function createHierarchyViewer(
  container: HTMLElement,
  options: WorldOrbitHierarchyViewerOptions = {},
): WorldOrbitHierarchyViewer {
  if (!(container instanceof HTMLElement)) {
    throw new Error("WorldOrbit hierarchy viewer requires an HTMLElement container.");
  }

  let source = options.source ?? "";
  let loaded: LoadedWorldOrbitSource | null = source ? loadWorldOrbitSource(source) : null;
  let scope: WorldOrbitHierarchyScope = options.scope ?? "system";
  let zoom = options.zoom ?? 1;
  let activeGalaxyId = options.activeGalaxyId ?? null;
  let activeSystemId = options.activeSystemId ?? null;
  let selectedNodeId: string | null = null;
  let destroyed = false;
  let scene = loaded
    ? loaded.hierarchyDocument
      ? renderHierarchyDocumentToScene(loaded.hierarchyDocument, {
        width: options.width,
        height: options.height,
        padding: options.padding,
        scope,
        zoom,
        activeGalaxyId,
        activeSystemId,
      })
      : null
    : null;

  container.classList.add("woc-viewer");
  container.addEventListener("click", handleClick);
  render();

  return {
    setSource(nextSource) {
      source = nextSource;
      loaded = nextSource ? loadWorldOrbitSource(nextSource) : null;
      scene = loaded
        ? loaded.hierarchyDocument
          ? renderHierarchyDocumentToScene(loaded.hierarchyDocument, {
            width: options.width,
            height: options.height,
            padding: options.padding,
            scope,
            zoom,
            activeGalaxyId,
            activeSystemId,
          })
          : null
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
      ? loaded.hierarchyDocument
        ? renderHierarchyDocumentToScene(loaded.hierarchyDocument, {
          width: options.width,
          height: options.height,
          padding: options.padding,
          scope,
          zoom,
          activeGalaxyId,
          activeSystemId,
        })
        : null
      : null;
    render();
  }

  function render(): void {
    if (destroyed) {
      return;
    }
    if (!scene) {
      container.innerHTML = `<div style="padding:16px;color:#edf6ff;background:#07101f;border:1px solid rgba(123,208,255,.16)">WorldOrbit hierarchy viewer is waiting for a schema 4.0 source.</div>`;
      return;
    }
    container.innerHTML = renderHierarchySceneToSvg(scene, {
      selectedNodeId,
    });
  }

  function handleClick(event: Event): void {
    const target = event.target as Element | null;
    const node = target?.closest?.("[data-worldorbit-hierarchy-node-id]") as HTMLElement | null;
    if (!node) {
      return;
    }
    selectedNodeId = node.dataset.worldorbitHierarchyNodeId ?? null;
    render();
    options.onSelectionChange?.(selectedNodeId);
  }
}
