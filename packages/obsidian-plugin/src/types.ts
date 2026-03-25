import type { EditorPosition } from "obsidian";
import type {
  RenderScene,
  WorldOrbitDiagnostic,
} from "@worldorbit/core/types";
import type {
  WorldOrbitTheme,
  WorldOrbitViewer2D,
} from "@worldorbit/viewer/interactive-2d";

export type EmbeddedInteractionMode = "locked" | "enabled";

export interface WorldOrbitObsidianPluginSettings {
  embeddedInteraction: EmbeddedInteractionMode;
  showWarnings: boolean;
  showFullscreenButton: boolean;
}

export interface BlockNavigationContext {
  sourcePath: string;
  contentStartLine: number;
}

export interface WorldOrbitEmbeddedViewOptions {
  container: HTMLElement;
  scene: RenderScene;
  theme: WorldOrbitTheme;
  interactive: boolean;
  enablePointer: boolean;
  enableTouch: boolean;
  createViewer?: (
    container: HTMLElement,
    options: {
      scene: RenderScene;
      theme: WorldOrbitTheme;
      pointer: boolean;
      touch: boolean;
      width?: number;
      height?: number;
    },
  ) => WorldOrbitViewer2D;
  renderStatic?: (
    scene: RenderScene,
    options: {
      theme: WorldOrbitTheme;
      width?: number;
      height?: number;
    },
  ) => string;
}

export interface WorldOrbitEmbeddedViewState {
  interactive: boolean;
  destroyed: boolean;
}

export interface DiagnosticNavigationTarget {
  diagnostic: WorldOrbitDiagnostic;
  position: EditorPosition | null;
}
