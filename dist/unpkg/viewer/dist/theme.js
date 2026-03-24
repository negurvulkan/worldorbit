const DEFAULT_LAYERS = {
    background: true,
    guides: true,
    relations: true,
    events: true,
    orbits: true,
    objects: true,
    labels: true,
    structures: true,
    metadata: true,
};
const THEME_PRESETS = {
    atlas: {
        name: "atlas",
        backgroundStart: "#041018",
        backgroundEnd: "#0a2331",
        backgroundGlow: "rgba(240, 180, 100, 0.18)",
        panel: "rgba(7, 17, 27, 0.9)",
        panelLine: "rgba(168, 207, 242, 0.18)",
        relation: "rgba(240, 180, 100, 0.42)",
        orbit: "rgba(163, 209, 255, 0.24)",
        orbitBand: "rgba(255, 190, 120, 0.28)",
        guide: "rgba(255, 255, 255, 0.04)",
        leader: "rgba(225, 238, 255, 0.4)",
        ink: "#e8f0ff",
        muted: "rgba(232, 240, 255, 0.7)",
        accent: "#f0b464",
        accentStrong: "#ff7f5f",
        selected: "rgba(255, 214, 139, 0.92)",
        starCore: "#ffcc67",
        starStroke: "rgba(255, 245, 203, 0.85)",
        starGlow: "#ffe8a3",
        spaceFog: "#07131d",
        starfield: "rgba(226, 239, 255, 0.9)",
        starfieldDim: "rgba(164, 194, 228, 0.45)",
        objectSpecular: "#f5f8ff",
        orbitOpacity: 0.34,
        orbitBandOpacity: 0.24,
        selectionHalo: "rgba(255, 214, 139, 0.9)",
        atmosphere: "rgba(143, 202, 255, 0.4)",
        cometTail: "rgba(193, 243, 255, 0.7)",
        fontFamily: "\"Segoe UI Variable\", \"Bahnschrift\", sans-serif",
        displayFont: "\"Bahnschrift\", \"Segoe UI Variable\", sans-serif"
    },
    nightglass: {
        name: "nightglass",
        backgroundStart: "#07131f",
        backgroundEnd: "#13283a",
        backgroundGlow: "rgba(120, 255, 215, 0.16)",
        panel: "rgba(7, 20, 30, 0.9)",
        panelLine: "rgba(120, 255, 215, 0.16)",
        relation: "rgba(156, 231, 255, 0.42)",
        orbit: "rgba(120, 255, 215, 0.2)",
        orbitBand: "rgba(137, 185, 255, 0.24)",
        guide: "rgba(255, 255, 255, 0.035)",
        leader: "rgba(192, 255, 233, 0.42)",
        ink: "#edfff8",
        muted: "rgba(237, 255, 248, 0.68)",
        accent: "#78ffd7",
        accentStrong: "#9ce7ff",
        selected: "rgba(120, 255, 215, 0.9)",
        starCore: "#e5f98c",
        starStroke: "rgba(246, 255, 217, 0.9)",
        starGlow: "#fffab4",
        spaceFog: "#071723",
        starfield: "rgba(220, 255, 245, 0.9)",
        starfieldDim: "rgba(124, 212, 195, 0.42)",
        objectSpecular: "#ecfffb",
        orbitOpacity: 0.3,
        orbitBandOpacity: 0.22,
        selectionHalo: "rgba(120, 255, 215, 0.85)",
        atmosphere: "rgba(120, 255, 215, 0.32)",
        cometTail: "rgba(181, 255, 236, 0.68)",
        fontFamily: "\"Segoe UI Variable\", \"Bahnschrift\", sans-serif",
        displayFont: "\"Bahnschrift\", \"Segoe UI Variable\", sans-serif"
    },
    ember: {
        name: "ember",
        backgroundStart: "#17090b",
        backgroundEnd: "#31111a",
        backgroundGlow: "rgba(255, 127, 95, 0.18)",
        panel: "rgba(24, 9, 13, 0.9)",
        panelLine: "rgba(255, 166, 149, 0.16)",
        relation: "rgba(255, 178, 125, 0.42)",
        orbit: "rgba(255, 188, 164, 0.22)",
        orbitBand: "rgba(255, 214, 139, 0.24)",
        guide: "rgba(255, 255, 255, 0.03)",
        leader: "rgba(255, 223, 209, 0.42)",
        ink: "#fff3ee",
        muted: "rgba(255, 243, 238, 0.68)",
        accent: "#ffb27d",
        accentStrong: "#ff7f5f",
        selected: "rgba(255, 178, 125, 0.9)",
        starCore: "#ffb766",
        starStroke: "rgba(255, 236, 205, 0.88)",
        starGlow: "#ffe2ad",
        spaceFog: "#1c0d12",
        starfield: "rgba(255, 232, 214, 0.88)",
        starfieldDim: "rgba(255, 176, 138, 0.38)",
        objectSpecular: "#fff0e6",
        orbitOpacity: 0.3,
        orbitBandOpacity: 0.24,
        selectionHalo: "rgba(255, 178, 125, 0.85)",
        atmosphere: "rgba(255, 190, 140, 0.26)",
        cometTail: "rgba(255, 214, 173, 0.62)",
        fontFamily: "\"Segoe UI Variable\", \"Bahnschrift\", sans-serif",
        displayFont: "\"Bahnschrift\", \"Segoe UI Variable\", sans-serif"
    }
};
export function resolveTheme(theme) {
    if (!theme) {
        return THEME_PRESETS.atlas;
    }
    if (typeof theme === "string") {
        return THEME_PRESETS[theme] ?? THEME_PRESETS.atlas;
    }
    return {
        ...THEME_PRESETS.atlas,
        ...theme,
    };
}
export function resolveLayers(layers) {
    return {
        ...DEFAULT_LAYERS,
        ...layers,
    };
}
export function getThemePreset(name) {
    return THEME_PRESETS[name];
}
