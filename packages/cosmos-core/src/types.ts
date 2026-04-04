import type {
  DiagnosticResult,
  RenderScene,
  WorldOrbitAtlasDocument,
  WorldOrbitDiagnostic,
  WorldOrbitDocument,
} from "@worldorbit/core";

export type CosmosSchemaVersion = "4.0";
export type CosmosSuiteVersion = "6.0.0";
export type CosmosScope = "universe" | "galaxy" | "system";
export type CosmosContainerKind = "universe" | "galaxy" | "system";

export interface CosmosContainerFields {
  title: string | null;
  description: string | null;
  tags: string[];
  color: string | null;
  image: string | null;
  hidden: boolean;
  epoch?: string | null;
  referencePlane?: string | null;
  properties: Record<string, string | boolean | string[]>;
}

export interface CosmosUniverse extends CosmosContainerFields {
  kind: "universe";
  id: string;
  galaxies: CosmosGalaxy[];
}

export interface CosmosGalaxy extends CosmosContainerFields {
  kind: "galaxy";
  id: string;
  universeId: string;
  systems: CosmosSystem[];
}

export interface CosmosSystem extends CosmosContainerFields {
  kind: "system";
  id: string;
  universeId: string;
  galaxyId: string;
  systemSource: string;
  atlasDocument: WorldOrbitAtlasDocument | null;
  materializedDocument: WorldOrbitDocument | null;
  diagnostics: WorldOrbitDiagnostic[];
}

export interface CosmosDocument {
  format: "worldorbit-cosmos";
  schemaVersion: CosmosSchemaVersion;
  suiteVersion: CosmosSuiteVersion;
  universe: CosmosUniverse;
  diagnostics: WorldOrbitDiagnostic[];
}

export interface LoadedCosmosSource {
  schemaVersion: CosmosSchemaVersion;
  document: CosmosDocument;
  diagnostics: WorldOrbitDiagnostic[];
}

export interface CosmosSceneNode {
  renderId: string;
  id: string;
  kind: CosmosContainerKind | "object";
  label: string;
  subtitle: string | null;
  parentId: string | null;
  x: number;
  y: number;
  radius: number;
  fill: string | null;
  image: string | null;
  hidden: boolean;
  preview: boolean;
}

export interface CosmosSceneLink {
  renderId: string;
  fromId: string;
  toId: string;
  kind: "containment";
}

export interface CosmosRenderScene {
  scope: CosmosScope;
  width: number;
  height: number;
  padding: number;
  title: string;
  subtitle: string;
  universeId: string;
  activeGalaxyId: string | null;
  activeSystemId: string | null;
  zoom: number;
  nodes: CosmosSceneNode[];
  links: CosmosSceneLink[];
  atlasScene: RenderScene | null;
  diagnostics: WorldOrbitDiagnostic[];
}

export interface CosmosSceneRenderOptions {
  width?: number;
  height?: number;
  padding?: number;
  scope?: CosmosScope;
  zoom?: number;
  activeGalaxyId?: string | null;
  activeSystemId?: string | null;
}

export type CosmosDiagnosticResult<T> = DiagnosticResult<T>;
