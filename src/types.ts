export type WorldOrbitObjectType =
  | "system"
  | "star"
  | "planet"
  | "moon"
  | "belt"
  | "asteroid"
  | "comet"
  | "ring"
  | "structure"
  | "phenomenon";

export type PlacementMode = "orbit" | "at" | "surface" | "free";

export type Unit =
  | "m"
  | "km"
  | "au"
  | "ly"
  | "pc"
  | "kpc"
  | "re"
  | "rj"
  | "sol"
  | "me"
  | "mj"
  | "s"
  | "min"
  | "h"
  | "d"
  | "y"
  | "ky"
  | "my"
  | "gy"
  | "K"
  | "deg";

export interface CoordinatePoint {
  x: number;
  y: number;
}

export interface UnitValue {
  value: number;
  unit: Unit | null;
}

export interface AstSourceLocation {
  line: number;
  column: number;
}

export interface LineToken {
  value: string;
  column: number;
  quoted: boolean;
}

export interface TokenizeOptions {
  line?: number;
  columnOffset?: number;
}

export interface AstDocument {
  type: "document";
  objects: AstObjectNode[];
}

export interface AstObjectNode {
  type: "object";
  objectType: WorldOrbitObjectType;
  name: string;
  inlineFields: AstFieldNode[];
  blockFields: AstFieldNode[];
  infoEntries: AstInfoEntryNode[];
  location: AstSourceLocation;
}

export interface AstFieldNode {
  type: "field";
  key: string;
  values: string[];
  location: AstSourceLocation;
}

export interface AstInfoEntryNode {
  type: "info-entry";
  key: string;
  value: string;
  location: AstSourceLocation;
}

export interface WorldOrbitDocument {
  format: "worldorbit";
  version: "0.1";
  system: WorldOrbitSystem | null;
  objects: WorldOrbitObject[];
}

export interface WorldOrbitSystem {
  type: "system";
  id: string;
  properties: Record<string, NormalizedValue>;
  info: Record<string, string>;
}

export interface WorldOrbitObject {
  type: Exclude<WorldOrbitObjectType, "system">;
  id: string;
  properties: Record<string, NormalizedValue>;
  placement: Placement | null;
  info: Record<string, string>;
}

export type NormalizedValue =
  | string
  | number
  | boolean
  | string[]
  | UnitValue;

export type Placement =
  | OrbitPlacement
  | AtPlacement
  | SurfacePlacement
  | FreePlacement;

export interface OrbitPlacement {
  mode: "orbit";
  target: string;
  distance?: UnitValue;
  semiMajor?: UnitValue;
  eccentricity?: number;
  period?: UnitValue;
  angle?: UnitValue;
  inclination?: UnitValue;
  phase?: UnitValue;
}

export type SpecialPoint = "L1" | "L2" | "L3" | "L4" | "L5";

export type AtReference = NamedReference | LagrangeReference;

export interface NamedReference {
  kind: "named";
  name: string;
}

export interface LagrangeReference {
  kind: "lagrange";
  point: SpecialPoint;
  primary: string;
  secondary: string | null;
}

export interface AtPlacement {
  mode: "at";
  target: string;
  reference: AtReference;
}

export interface SurfacePlacement {
  mode: "surface";
  target: string;
}

export interface FreePlacement {
  mode: "free";
  distance?: UnitValue;
  descriptor?: string;
}

export interface SvgRenderOptions {
  width?: number;
  height?: number;
  padding?: number;
}

export interface RenderBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface RenderSceneObject {
  renderId: string;
  objectId: string;
  object: WorldOrbitObject;
  x: number;
  y: number;
  radius: number;
  visualRadius: number;
  anchorX?: number;
  anchorY?: number;
  label: string;
  secondaryLabel: string;
  fillColor?: string;
  hidden: boolean;
}

export interface RenderOrbitVisual {
  renderId: string;
  objectId: string;
  object: WorldOrbitObject;
  parentId: string;
  cx: number;
  cy: number;
  radius: number;
  band: boolean;
  hidden: boolean;
}

export type LeaderMode = "surface" | "at" | "free";

export interface RenderLeaderLine {
  renderId: string;
  objectId: string;
  object: WorldOrbitObject;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mode: LeaderMode;
  hidden: boolean;
}

export interface RenderScene {
  width: number;
  height: number;
  padding: number;
  title: string;
  contentBounds: RenderBounds;
  objects: RenderSceneObject[];
  orbitVisuals: RenderOrbitVisual[];
  leaders: RenderLeaderLine[];
}

export interface ViewerState {
  scale: number;
  rotationDeg: number;
  translateX: number;
  translateY: number;
  selectedObjectId: string | null;
}

export interface InteractiveViewerOptions extends SvgRenderOptions {
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
  onViewChange?: (state: ViewerState) => void;
}

export interface WorldOrbitViewer {
  setSource(source: string): void;
  setDocument(document: WorldOrbitDocument): void;
  setScene(scene: RenderScene): void;
  getState(): ViewerState;
  setState(state: Partial<ViewerState>): void;
  zoomBy(factor: number, anchor?: CoordinatePoint): void;
  panBy(dx: number, dy: number): void;
  rotateBy(deg: number): void;
  fitToSystem(): void;
  focusObject(id: string): void;
  resetView(): void;
  destroy(): void;
}
