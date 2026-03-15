import type {
  CoordinatePoint,
  RenderScaleModel,
  RenderScene,
  RenderSceneObject,
  SceneRenderOptions,
  ViewProjection,
  WorldOrbitDocument,
} from "@worldorbit/core";

export type WorldOrbitThemeName = "atlas" | "nightglass" | "ember";
export type WorldOrbitEmbedMode = "static" | "interactive";

export interface WorldOrbitTheme {
  name: string;
  backgroundStart: string;
  backgroundEnd: string;
  backgroundGlow: string;
  panel: string;
  panelLine: string;
  orbit: string;
  orbitBand: string;
  guide: string;
  leader: string;
  ink: string;
  muted: string;
  accent: string;
  accentStrong: string;
  selected: string;
  starCore: string;
  starStroke: string;
  starGlow: string;
  fontFamily: string;
  displayFont: string;
}

export interface ViewerLayerOptions {
  background?: boolean;
  guides?: boolean;
  orbits?: boolean;
  labels?: boolean;
  structures?: boolean;
  metadata?: boolean;
}

export interface SvgRenderOptions extends SceneRenderOptions {
  theme?: WorldOrbitTheme | WorldOrbitThemeName;
  layers?: ViewerLayerOptions;
  selectedObjectId?: string | null;
  subtitle?: string;
}

export interface ViewerRenderOptions
  extends Omit<SvgRenderOptions, "selectedObjectId"> {
  projection?: "document" | ViewProjection;
  scaleModel?: Partial<RenderScaleModel>;
}

export interface ViewerState {
  scale: number;
  rotationDeg: number;
  translateX: number;
  translateY: number;
  selectedObjectId: string | null;
}

export interface InteractiveViewerOptions extends ViewerRenderOptions {
  source?: string;
  document?: WorldOrbitDocument;
  scene?: RenderScene;
  minScale?: number;
  maxScale?: number;
  fitPadding?: number;
  keyboard?: boolean;
  pointer?: boolean;
  touch?: boolean;
  selection?: boolean;
  panStep?: number;
  zoomStep?: number;
  rotationStep?: number;
  onSelectionChange?: (selectedObject: RenderSceneObject | null) => void;
  onHoverChange?: (hoveredObject: RenderSceneObject | null) => void;
  onViewChange?: (state: ViewerState) => void;
}

export interface WorldOrbitViewer {
  setSource(source: string): void;
  setDocument(document: WorldOrbitDocument): void;
  setScene(scene: RenderScene): void;
  getScene(): RenderScene;
  getRenderOptions(): ViewerRenderOptions;
  setRenderOptions(options: Partial<ViewerRenderOptions>): void;
  getState(): ViewerState;
  setState(state: Partial<ViewerState>): void;
  zoomBy(factor: number, anchor?: CoordinatePoint): void;
  panBy(dx: number, dy: number): void;
  rotateBy(deg: number): void;
  fitToSystem(): void;
  focusObject(id: string): void;
  resetView(): void;
  exportSvg(): string;
  destroy(): void;
}

export interface WorldOrbitEmbedPayload {
  version: "1.0";
  mode: WorldOrbitEmbedMode;
  scene: RenderScene;
  options?: {
    theme?: WorldOrbitTheme | WorldOrbitThemeName;
    layers?: ViewerLayerOptions;
    subtitle?: string;
  };
}

export interface MountWorldOrbitEmbedsOptions extends SvgRenderOptions {
  mode?: WorldOrbitEmbedMode;
  viewer?: Omit<InteractiveViewerOptions, "source" | "document" | "scene">;
  onMount?: (viewer: WorldOrbitViewer | null, element: HTMLElement) => void;
}

export interface MountedWorldOrbitEmbeds {
  viewers: WorldOrbitViewer[];
  destroy(): void;
}
