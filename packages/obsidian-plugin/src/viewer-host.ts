import {
  createInteractiveViewer2D,
  renderSceneToSvg,
  type WorldOrbitViewer2D,
} from "@worldorbit/viewer/interactive-2d";

import type {
  WorldOrbitEmbeddedViewOptions,
  WorldOrbitEmbeddedViewState,
} from "./types.js";

export class WorldOrbitEmbeddedView {
  private readonly options: WorldOrbitEmbeddedViewOptions;
  private viewer: WorldOrbitViewer2D | null = null;
  private state: WorldOrbitEmbeddedViewState;

  constructor(options: WorldOrbitEmbeddedViewOptions) {
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

  getState(): WorldOrbitEmbeddedViewState {
    return { ...this.state };
  }

  mount(): void {
    if (this.state.destroyed) {
      return;
    }

    this.renderCurrent();
  }

  setInteractive(interactive: boolean): void {
    if (this.state.destroyed || this.state.interactive === interactive) {
      return;
    }

    this.state.interactive = interactive;
    this.renderCurrent();
  }

  resize(): void {
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

  destroy(): void {
    if (this.state.destroyed) {
      return;
    }

    this.state.destroyed = true;
    this.destroyViewer();
    clearElement(this.options.container);
  }

  private renderCurrent(): void {
    this.destroyViewer();
    clearElement(this.options.container);

    if (this.state.interactive) {
      const viewport = measureViewport(this.options.container, this.options.scene);
      this.viewer = this.options.createViewer!(this.options.container, {
        scene: this.options.scene,
        theme: this.options.theme,
        pointer: this.options.enablePointer,
        touch: this.options.enableTouch,
        ...viewport,
      });
      return;
    }

    const viewport = measureViewport(this.options.container, this.options.scene);
    this.options.container.innerHTML = this.options.renderStatic!(this.options.scene, {
      theme: this.options.theme,
      ...viewport,
    });
  }

  private destroyViewer(): void {
    this.viewer?.destroy();
    this.viewer = null;
  }
}

function defaultCreateViewer(
  container: HTMLElement,
  options: {
    scene: WorldOrbitEmbeddedViewOptions["scene"];
    theme: WorldOrbitEmbeddedViewOptions["theme"];
    pointer: boolean;
    touch: boolean;
    width?: number;
    height?: number;
  },
): WorldOrbitViewer2D {
  return createInteractiveViewer2D(container, options.scene, {
    theme: options.theme,
    pointer: options.pointer,
    touch: options.touch,
    selection: true,
    width: options.width,
    height: options.height,
  });
}

function defaultRenderStatic(
  scene: WorldOrbitEmbeddedViewOptions["scene"],
  options: {
    theme: WorldOrbitEmbeddedViewOptions["theme"];
    width?: number;
    height?: number;
  },
): string {
  return renderSceneToSvg(scene, {
    theme: options.theme,
    width: options.width,
    height: options.height,
  });
}

function measureViewport(
  container: HTMLElement,
  scene: WorldOrbitEmbeddedViewOptions["scene"],
): { width?: number; height?: number } {
  const rect = container.getBoundingClientRect();
  const width = sanitizeDimension(container.clientWidth || rect.width) ?? scene.width;
  const height =
    sanitizeDimension(container.clientHeight || rect.height) ??
    Math.max(Math.round(width * (scene.height / Math.max(scene.width, 1))), 280);

  return { width, height };
}

function sanitizeDimension(value: number): number | undefined {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;
}

function clearElement(element: HTMLElement): void {
  if (typeof (element as HTMLElement & { empty?: () => void }).empty === "function") {
    (element as HTMLElement & { empty: () => void }).empty();
    return;
  }

  element.replaceChildren();
}
