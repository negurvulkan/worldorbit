import type { RenderScene, SpatialScene } from "@worldorbit/core";
import type { MountedWorldOrbitEmbeds, MountWorldOrbitEmbedsOptions, ViewerAtlasState, ViewerFilter, WorldOrbitEmbedPayload } from "./types.js";
export declare function serializeWorldOrbitEmbedPayload(payload: WorldOrbitEmbedPayload): string;
export declare function deserializeWorldOrbitEmbedPayload(serialized: string): WorldOrbitEmbedPayload;
export declare function createEmbedPayload(scene: RenderScene, mode: WorldOrbitEmbedPayload["mode"], options?: {
    spatialScene?: SpatialScene;
    viewMode?: "2d" | "3d";
    initialViewpointId?: string;
    initialSelectionObjectId?: string;
    initialFilter?: ViewerFilter | null;
    atlasState?: ViewerAtlasState | null;
    minimap?: boolean;
}): WorldOrbitEmbedPayload;
export declare function createWorldOrbitEmbedMarkup(payload: WorldOrbitEmbedPayload, options?: Pick<MountWorldOrbitEmbedsOptions, "theme" | "layers" | "subtitle" | "preset"> & {
    className?: string;
    viewMode?: "2d" | "3d";
    initialViewpointId?: string;
    initialSelectionObjectId?: string;
    initialFilter?: ViewerFilter | null;
    atlasState?: ViewerAtlasState | null;
    minimap?: boolean;
}): string;
export declare function mountWorldOrbitEmbeds(root?: ParentNode, options?: MountWorldOrbitEmbedsOptions): MountedWorldOrbitEmbeds;
export declare function render3DUnavailableMarkup(message: string): string;
