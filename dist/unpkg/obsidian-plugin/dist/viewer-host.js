import { createInteractiveViewer2D, renderSceneToSvg, } from "@worldorbit/viewer/interactive-2d";
export class WorldOrbitEmbeddedView {
    options;
    viewer = null;
    state;
    constructor(options) {
        this.options = {
            ...options,
            createViewer: options.createViewer ?? defaultCreateViewer,
            renderStatic: options.renderStatic ?? defaultRenderStatic,
        };
        this.state = {
            interactive: options.interactive,
            destroyed: false,
        };
    }
    getState() {
        return { ...this.state };
    }
    mount() {
        if (this.state.destroyed) {
            return;
        }
        this.renderCurrent();
    }
    setInteractive(interactive) {
        if (this.state.destroyed || this.state.interactive === interactive) {
            return;
        }
        this.state.interactive = interactive;
        this.renderCurrent();
    }
    resize() {
        if (this.state.destroyed) {
            return;
        }
        if (this.viewer) {
            const viewport = measureViewport(this.options.container, this.options.scene);
            this.viewer.setRenderOptions(viewport);
            return;
        }
        this.renderCurrent();
    }
    destroy() {
        if (this.state.destroyed) {
            return;
        }
        this.state.destroyed = true;
        this.destroyViewer();
        clearElement(this.options.container);
    }
    renderCurrent() {
        this.destroyViewer();
        clearElement(this.options.container);
        if (this.state.interactive) {
            const viewport = measureViewport(this.options.container, this.options.scene);
            this.viewer = this.options.createViewer(this.options.container, {
                scene: this.options.scene,
                theme: this.options.theme,
                pointer: this.options.enablePointer,
                touch: this.options.enableTouch,
                ...viewport,
            });
            return;
        }
        const viewport = measureViewport(this.options.container, this.options.scene);
        this.options.container.innerHTML = this.options.renderStatic(this.options.scene, {
            theme: this.options.theme,
            ...viewport,
        });
    }
    destroyViewer() {
        this.viewer?.destroy();
        this.viewer = null;
    }
}
function defaultCreateViewer(container, options) {
    return createInteractiveViewer2D(container, options.scene, {
        theme: options.theme,
        pointer: options.pointer,
        touch: options.touch,
        selection: true,
        width: options.width,
        height: options.height,
    });
}
function defaultRenderStatic(scene, options) {
    return renderSceneToSvg(scene, {
        theme: options.theme,
        width: options.width,
        height: options.height,
    });
}
function measureViewport(container, scene) {
    const rect = container.getBoundingClientRect();
    const width = sanitizeDimension(container.clientWidth || rect.width) ?? scene.width;
    const height = sanitizeDimension(container.clientHeight || rect.height) ??
        Math.max(Math.round(width * (scene.height / Math.max(scene.width, 1))), 280);
    return { width, height };
}
function sanitizeDimension(value) {
    return Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;
}
function clearElement(element) {
    if (typeof element.empty === "function") {
        element.empty();
        return;
    }
    element.replaceChildren();
}
