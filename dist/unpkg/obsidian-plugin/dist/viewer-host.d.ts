import type { WorldOrbitEmbeddedViewOptions, WorldOrbitEmbeddedViewState } from "./types.js";
export declare class WorldOrbitEmbeddedView {
    private readonly options;
    private viewer;
    private state;
    constructor(options: WorldOrbitEmbeddedViewOptions);
    getState(): WorldOrbitEmbeddedViewState;
    mount(): void;
    setInteractive(interactive: boolean): void;
    resize(): void;
    destroy(): void;
    private renderCurrent;
    private destroyViewer;
}
