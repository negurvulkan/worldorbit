import type { TooltipMode, ViewerObjectDetails, ViewerTooltipDetails } from "./types.js";
export declare function buildViewerTooltipDetails(details: ViewerObjectDetails): ViewerTooltipDetails;
export declare function renderDefaultTooltipContent(details: ViewerTooltipDetails, mode: TooltipMode): string;
