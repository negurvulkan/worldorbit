import { Plugin } from "obsidian";
import type { WorldOrbitObsidianPluginSettings } from "./types.js";
export declare class WorldOrbitObsidianPlugin extends Plugin {
    settings: WorldOrbitObsidianPluginSettings;
    onload(): Promise<void>;
    loadSettings(): Promise<void>;
    saveSettings(): Promise<void>;
}
