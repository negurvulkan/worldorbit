import type { CosmosDocument, CosmosScope } from "@worldorbit-cosmos/core";

export interface WorldOrbitCosmosEditorOptions {
  source?: string;
  width?: number;
  height?: number;
}

export interface WorldOrbitCosmosEditor {
  getSource(): string;
  setSource(source: string): void;
  getDocument(): CosmosDocument | null;
  setScope(scope: CosmosScope): void;
  destroy(): void;
}
