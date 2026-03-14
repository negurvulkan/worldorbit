import type { SvgRenderOptions, WorldOrbitEmbedMode } from "@worldorbit/viewer";

export interface WorldOrbitMarkdownOptions extends SvgRenderOptions {
  mode?: WorldOrbitEmbedMode;
  strict?: boolean;
  className?: string;
}
