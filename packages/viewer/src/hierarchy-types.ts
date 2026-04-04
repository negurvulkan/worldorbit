import type {
  HierarchySceneRenderOptions,
  RenderHierarchyScene,
  WorldOrbitHierarchyScope,
  LoadedWorldOrbitSource,
} from "@worldorbit/core";

export interface HierarchySvgRenderOptions {
  selectedNodeId?: string | null;
}

export interface WorldOrbitHierarchyViewerOptions extends HierarchySceneRenderOptions {
  source?: string;
  width?: number;
  height?: number;
  onSelectionChange?: (nodeId: string | null) => void;
}

export interface WorldOrbitHierarchyViewer {
  setSource(source: string): void;
  setScope(scope: WorldOrbitHierarchyScope): void;
  setZoom(zoom: number): void;
  setActiveGalaxy(galaxyId: string | null): void;
  setActiveSystem(systemId: string | null): void;
  setSelection(nodeId: string | null): void;
  getScene(): RenderHierarchyScene | null;
  getLoadedSource(): LoadedWorldOrbitSource | null;
  destroy(): void;
}
