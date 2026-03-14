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
  | "au"
  | "km"
  | "re"
  | "sol"
  | "me"
  | "d"
  | "y"
  | "h"
  | "deg";

export type WorldOrbitDocumentVersion = "1.0";

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
  version: WorldOrbitDocumentVersion;
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

export type AtReference =
  | NamedReference
  | NamedAnchorReference
  | LagrangeReference;

export interface NamedReference {
  kind: "named";
  name: string;
}

export interface NamedAnchorReference {
  kind: "anchor";
  objectId: string;
  anchor: string;
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

export interface SceneRenderOptions {
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
  imageHref?: string;
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
  subtitle: string;
  systemId: string | null;
  viewMode: string;
  layoutPreset: SceneLayoutPreset;
  metadata: Record<string, string>;
  contentBounds: RenderBounds;
  objects: RenderSceneObject[];
  orbitVisuals: RenderOrbitVisual[];
  leaders: RenderLeaderLine[];
}

export type SceneLayoutPreset = "compact" | "balanced" | "presentation";

export type FieldValueKind =
  | "string"
  | "list"
  | "boolean"
  | "number"
  | "unit";

export type UnitFamily =
  | "distance"
  | "radius"
  | "mass"
  | "duration"
  | "angle"
  | "generic";

export interface WorldOrbitFieldSchema {
  key: string;
  kind: FieldValueKind;
  placement: boolean;
  arity: "single" | "multiple";
  objectTypes: WorldOrbitObjectType[];
  unitFamily?: UnitFamily;
}

export interface MarkdownFenceBlock {
  source: string;
  info: string | null;
  startLine: number;
  endLine: number;
}
