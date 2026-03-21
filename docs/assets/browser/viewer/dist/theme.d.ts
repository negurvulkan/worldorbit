import type { ViewerLayerOptions, WorldOrbitTheme, WorldOrbitThemeName } from "./types.js";
export declare function resolveTheme(theme?: WorldOrbitTheme | WorldOrbitThemeName): WorldOrbitTheme;
export declare function resolveLayers(layers?: ViewerLayerOptions): Required<ViewerLayerOptions>;
export declare function getThemePreset(name: WorldOrbitThemeName): WorldOrbitTheme;
