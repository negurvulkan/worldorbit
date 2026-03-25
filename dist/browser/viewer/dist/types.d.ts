import type { CoordinatePoint, RenderOrbitVisual, RenderProjectionFallback, RenderPresetName, RenderSceneEvent, RenderSceneGroup, RenderSceneLabel, RenderScaleModel, RenderScene, RenderSceneObject, RenderSceneViewpoint, SceneRenderOptions, SpatialScene, ViewProjection, WorldOrbitObject, WorldOrbitDocument, WorldOrbitViewCamera } from "@worldorbit/core";
export type WorldOrbitThemeName = "atlas" | "nightglass" | "ember";
export type WorldOrbitViewMode = "2d" | "3d";
export type WorldOrbit3DQuality = "low" | "balanced" | "high";
export type WorldOrbit3DStyle = "symbolic" | "cinematic";
export type WorldOrbitEmbedMode = "static" | "interactive" | "interactive-2d" | "interactive-3d";
export type TooltipMode = "hover" | "pinned" | "disabled";
export interface WorldOrbitTheme {
    name: string;
    backgroundStart: string;
    backgroundEnd: string;
    backgroundGlow: string;
    panel: string;
    panelLine: string;
    relation: string;
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
    spaceFog: string;
    starfield: string;
    starfieldDim: string;
    objectSpecular: string;
    orbitOpacity: number;
    orbitBandOpacity: number;
    selectionHalo: string;
    atmosphere: string;
    cometTail: string;
    fontFamily: string;
    displayFont: string;
}
export interface ViewerLayerOptions {
    background?: boolean;
    guides?: boolean;
    relations?: boolean;
    events?: boolean;
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
export interface ViewerRenderOptions extends Omit<SvgRenderOptions, "selectedObjectId"> {
    projection?: "document" | ViewProjection;
    scaleModel?: Partial<RenderScaleModel>;
    viewMode?: WorldOrbitViewMode;
    quality?: WorldOrbit3DQuality;
    style3d?: WorldOrbit3DStyle;
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
    semanticGroups: RenderScene["semanticGroups"];
    orbit: RenderOrbitVisual | null;
    relatedOrbits: RenderOrbitVisual[];
    relations: RenderScene["relations"];
    relatedEvents: RenderSceneEvent[];
    parent: RenderSceneObject | null;
    children: RenderSceneObject[];
    ancestors: RenderSceneObject[];
    focusPath: RenderSceneObject[];
}
export interface ViewerTooltipField {
    key: string;
    label: string;
    value: string;
}
export interface ViewerTooltipDetails {
    objectId: string;
    title: string;
    typeLabel: string;
    imageHref: string | null;
    description: string | null;
    tags: string[];
    fields: ViewerTooltipField[];
    parentLabel: string | null;
    orbitLabel: string | null;
    details: ViewerObjectDetails;
}
export interface ViewerAtlasState {
    version: "2.0" | "2.5";
    viewpointId: string | null;
    activeEventId?: string | null;
    viewerState: ViewerState;
    renderOptions: {
        preset?: RenderPresetName;
        projection?: "document" | ViewProjection;
        camera?: WorldOrbitViewCamera | null;
        layers?: ViewerLayerOptions;
        scaleModel?: Partial<RenderScaleModel>;
        bodyScaleMode?: SceneRenderOptions["bodyScaleMode"];
        activeEventId?: string | null;
        viewMode?: WorldOrbitViewMode;
        quality?: WorldOrbit3DQuality;
        style3d?: WorldOrbit3DStyle;
    };
    filter: ViewerFilter | null;
}
export interface ViewerAnimationState {
    playing: boolean;
    speed: number;
    timeSeconds: number;
    frozenByEvent: boolean;
}
export interface ViewerBookmark {
    id: string;
    label: string;
    atlasState: ViewerAtlasState;
}
export interface AtlasViewerControls {
    search?: boolean;
    typeFilter?: boolean;
    groupFilter?: boolean;
    viewpointSelect?: boolean;
    inspector?: boolean;
    bookmarks?: boolean;
}
export interface AtlasInspectorSnapshot {
    selection: ViewerObjectDetails | null;
    activeViewpoint: RenderSceneViewpoint | null;
    filter: ViewerFilter | null;
    atlasState: ViewerAtlasState;
    visibleObjectIds: string[];
    scene: {
        title: string;
        projection: ViewProjection;
        renderProjection: RenderProjectionFallback;
        camera: WorldOrbitViewCamera | null;
        renderPreset: RenderPresetName | null;
        groupCount: number;
        semanticGroupCount: number;
        relationCount: number;
        eventCount: number;
        viewpointCount: number;
    };
}
export interface InteractiveViewerOptions extends ViewerRenderOptions {
    source?: string;
    document?: WorldOrbitDocument;
    scene?: RenderScene;
    spatialScene?: SpatialScene;
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
    tooltipMode?: TooltipMode;
    tooltipRenderer?: (details: ViewerTooltipDetails, mode: TooltipMode) => HTMLElement | string;
    minimap?: boolean;
    panStep?: number;
    zoomStep?: number;
    rotationStep?: number;
    onSelectionChange?: (selectedObject: RenderSceneObject | null) => void;
    onSelectionDetailsChange?: (details: ViewerObjectDetails | null) => void;
    onHoverChange?: (hoveredObject: RenderSceneObject | null) => void;
    onHoverDetailsChange?: (details: ViewerObjectDetails | null) => void;
    onTooltipChange?: (details: ViewerTooltipDetails | null) => void;
    onFilterChange?: (filter: ViewerFilter | null, visibleObjects: RenderSceneObject[]) => void;
    onViewpointChange?: (viewpoint: RenderSceneViewpoint | null) => void;
    onViewChange?: (state: ViewerState) => void;
    onAtlasStateChange?: (state: ViewerAtlasState) => void;
}
export interface AtlasViewerOptions extends Omit<InteractiveViewerOptions, "initialFilter"> {
    controls?: AtlasViewerControls;
    initialFilter?: ViewerFilter | null;
    initialQuery?: string;
    initialObjectType?: WorldOrbitObject["type"] | null;
    onInspectorChange?: (snapshot: AtlasInspectorSnapshot) => void;
}
export interface WorldOrbitViewer {
    setSource(source: string): void;
    setDocument(document: WorldOrbitDocument): void;
    setScene(scene: RenderScene): void;
    getScene(): RenderScene;
    getRenderOptions(): ViewerRenderOptions;
    setRenderOptions(options: Partial<ViewerRenderOptions>): void;
    getViewMode(): WorldOrbitViewMode;
    setViewMode(mode: WorldOrbitViewMode): void;
    listViewpoints(): RenderSceneViewpoint[];
    getActiveViewpoint(): RenderSceneViewpoint | null;
    goToViewpoint(id: string): boolean;
    getActiveEventId(): string | null;
    setActiveEvent(id: string | null): void;
    playAnimation(): void;
    pauseAnimation(): void;
    resetAnimation(): void;
    setAnimationSpeed(multiplier: number): void;
    getAnimationState(): ViewerAnimationState;
    search(query: string, limit?: number): ViewerSearchResult[];
    getFilter(): ViewerFilter | null;
    setFilter(filter: ViewerFilter | null): void;
    getVisibleObjects(): RenderSceneObject[];
    getFocusPath(id: string): RenderSceneObject[];
    getObjectDetails(id: string): ViewerObjectDetails | null;
    getSelectionDetails(): ViewerObjectDetails | null;
    getTooltipDetails(): ViewerTooltipDetails | null;
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
    pinTooltip(id: string | null): void;
    resetView(): void;
    exportSvg(): string;
    destroy(): void;
}
export interface WorldOrbitAtlasViewer {
    element: HTMLElement;
    viewer: WorldOrbitViewer;
    getViewer(): WorldOrbitViewer;
    setSource(source: string): void;
    setDocument(document: WorldOrbitDocument): void;
    setScene(scene: RenderScene): void;
    getAtlasState(): ViewerAtlasState;
    setAtlasState(state: ViewerAtlasState | string): void;
    getInspectorSnapshot(): AtlasInspectorSnapshot;
    getSearchQuery(): string;
    setSearchQuery(query: string): void;
    getObjectTypeFilter(): WorldOrbitObject["type"] | null;
    setObjectTypeFilter(type: WorldOrbitObject["type"] | null): void;
    listSearchResults(limit?: number): ViewerSearchResult[];
    listBookmarks(): ViewerBookmark[];
    captureBookmark(name: string, label?: string): ViewerBookmark;
    applyBookmark(bookmark: ViewerBookmark | string): boolean;
    goToViewpoint(id: string): boolean;
    exportSvg(): string;
    destroy(): void;
}
export interface WorldOrbitEmbedPayload {
    version: "2.0";
    mode: WorldOrbitEmbedMode;
    scene: RenderScene;
    spatialScene?: SpatialScene;
    options?: {
        theme?: WorldOrbitTheme | WorldOrbitThemeName;
        layers?: ViewerLayerOptions;
        subtitle?: string;
        preset?: SceneRenderOptions["preset"];
        viewMode?: WorldOrbitViewMode;
        quality?: WorldOrbit3DQuality;
        style3d?: WorldOrbit3DStyle;
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
