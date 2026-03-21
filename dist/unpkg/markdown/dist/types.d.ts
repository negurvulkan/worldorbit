import type { SvgRenderOptions, ViewerAtlasState, ViewerFilter, WorldOrbitEmbedMode } from "@worldorbit/viewer";
export interface WorldOrbitMarkdownOptions extends SvgRenderOptions {
    mode?: WorldOrbitEmbedMode;
    strict?: boolean;
    className?: string;
    initialViewpointId?: string;
    initialSelectionObjectId?: string;
    initialFilter?: ViewerFilter | null;
    atlasState?: ViewerAtlasState | null;
    minimap?: boolean;
}
