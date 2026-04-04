import type { CosmosRenderScene, CosmosScope, CosmosSceneRenderOptions, LoadedCosmosSource } from "@worldorbit-cosmos/core";
export interface CosmosSvgRenderOptions {
    selectedNodeId?: string | null;
}
export interface WorldOrbitCosmosViewerOptions extends CosmosSceneRenderOptions {
    source?: string;
    width?: number;
    height?: number;
    onSelectionChange?: (nodeId: string | null) => void;
}
export interface WorldOrbitCosmosViewer {
    setSource(source: string): void;
    setScope(scope: CosmosScope): void;
    setZoom(zoom: number): void;
    setActiveGalaxy(galaxyId: string | null): void;
    setActiveSystem(systemId: string | null): void;
    setSelection(nodeId: string | null): void;
    getScene(): CosmosRenderScene | null;
    getLoadedSource(): LoadedCosmosSource | null;
    destroy(): void;
}
