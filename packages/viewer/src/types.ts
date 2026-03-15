import type {
  CoordinatePoint,
  RenderOrbitVisual,
  RenderPresetName,
  RenderSceneGroup,
  RenderSceneLabel,
  RenderScaleModel,
  RenderScene,
  RenderSceneObject,
  RenderSceneViewpoint,
  SceneRenderOptions,
  ViewProjection,
  WorldOrbitObject,
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
  objects?: boolean;
  labels?: boolean;
  structures?: boolean;
  metadata?: boolean;
}

export interface ViewerFilter {
  query?: string;
  objectTypes?: Array<WorldOrbitObject["type"]>;
  tags?: string[];
  groupIds?: string[];
  includeAncestors?: boolean;
}

export interface ViewerSearchResult {
  objectId: string;
  label: string;
  type: WorldOrbitObject["type"];
  score: number;
  groupId: string | null;
  parentId: string | null;
  tags: string[];
}

export interface SvgRenderOptions extends SceneRenderOptions {
  theme?: WorldOrbitTheme | WorldOrbitThemeName;
  layers?: ViewerLayerOptions;
  filter?: ViewerFilter | null;
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

export interface ViewerObjectDetails {
  objectId: string;
  object: WorldOrbitObject;
  renderObject: RenderSceneObject;
  label: RenderSceneLabel | null;
  group: RenderSceneGroup | null;
  orbit: RenderOrbitVisual | null;
  relatedOrbits: RenderOrbitVisual[];
  parent: RenderSceneObject | null;
  children: RenderSceneObject[];
  ancestors: RenderSceneObject[];
  focusPath: RenderSceneObject[];
}

export interface ViewerAtlasState {
  version: "1.0";
  viewpointId: string | null;
  viewerState: ViewerState;
  renderOptions: {
    preset?: RenderPresetName;
    projection?: "document" | ViewProjection;
    layers?: ViewerLayerOptions;
    scaleModel?: Partial<RenderScaleModel>;
  };
  filter: ViewerFilter | null;
}

export interface ViewerBookmark {
  id: string;
  label: string;
  atlasState: ViewerAtlasState;
}

export interface InteractiveViewerOptions extends ViewerRenderOptions {
  source?: string;
  document?: WorldOrbitDocument;
  scene?: RenderScene;
  initialViewpointId?: string;
  initialSelectionObjectId?: string;
  initialFilter?: ViewerFilter | null;
  minScale?: number;
  maxScale?: number;
  fitPadding?: number;
  keyboard?: boolean;
  pointer?: boolean;
  touch?: boolean;
  selection?: boolean;
  minimap?: boolean;
  panStep?: number;
  zoomStep?: number;
  rotationStep?: number;
  onSelectionChange?: (selectedObject: RenderSceneObject | null) => void;
  onSelectionDetailsChange?: (details: ViewerObjectDetails | null) => void;
  onHoverChange?: (hoveredObject: RenderSceneObject | null) => void;
  onHoverDetailsChange?: (details: ViewerObjectDetails | null) => void;
  onFilterChange?: (filter: ViewerFilter | null, visibleObjects: RenderSceneObject[]) => void;
  onViewpointChange?: (viewpoint: RenderSceneViewpoint | null) => void;
  onViewChange?: (state: ViewerState) => void;
  onAtlasStateChange?: (state: ViewerAtlasState) => void;
}

export interface WorldOrbitViewer {
  setSource(source: string): void;
  setDocument(document: WorldOrbitDocument): void;
  setScene(scene: RenderScene): void;
  getScene(): RenderScene;
  getRenderOptions(): ViewerRenderOptions;
  setRenderOptions(options: Partial<ViewerRenderOptions>): void;
  listViewpoints(): RenderSceneViewpoint[];
  getActiveViewpoint(): RenderSceneViewpoint | null;
  goToViewpoint(id: string): boolean;
  search(query: string, limit?: number): ViewerSearchResult[];
  getFilter(): ViewerFilter | null;
  setFilter(filter: ViewerFilter | null): void;
  getVisibleObjects(): RenderSceneObject[];
  getFocusPath(id: string): RenderSceneObject[];
  getObjectDetails(id: string): ViewerObjectDetails | null;
  getSelectionDetails(): ViewerObjectDetails | null;
  getAtlasState(): ViewerAtlasState;
  setAtlasState(state: ViewerAtlasState | string): void;
  serializeAtlasState(): string;
  captureBookmark(name: string, label?: string): ViewerBookmark;
  applyBookmark(bookmark: ViewerBookmark | string): boolean;
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
    preset?: SceneRenderOptions["preset"];
    initialViewpointId?: string;
    initialSelectionObjectId?: string;
    initialFilter?: ViewerFilter | null;
    atlasState?: ViewerAtlasState | null;
    minimap?: boolean;
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
