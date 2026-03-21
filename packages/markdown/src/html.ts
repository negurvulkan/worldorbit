import {
  loadWorldOrbitSource,
  renderDocumentToScene,
  renderDocumentToSpatialScene,
  type LoadedWorldOrbitSource,
} from "@worldorbit/core";
import {
  createEmbedPayload,
  createWorldOrbitEmbedMarkup,
  renderSceneToSvg,
} from "@worldorbit/viewer";

import type { WorldOrbitMarkdownOptions } from "./types.js";

export function renderWorldOrbitBlock(
  source: string,
  options: WorldOrbitMarkdownOptions = {},
): string {
  try {
    const loaded = loadWorldOrbitSource(source);
    const scene = renderDocumentToScene(
      loaded.document,
      resolveSourceRenderOptions(loaded, options),
    );
    const mode = options.mode ?? "static";

    if (mode === "interactive" || mode === "interactive-2d" || mode === "interactive-3d") {
      const normalizedMode = mode === "interactive" ? "interactive-2d" : mode;
      return createWorldOrbitEmbedMarkup(
        createEmbedPayload(scene, normalizedMode, {
          spatialScene:
            normalizedMode === "interactive-3d"
              ? renderDocumentToSpatialScene(
                  loaded.document,
                  resolveSourceRenderOptions(loaded, options),
                )
              : undefined,
          viewMode: normalizedMode === "interactive-3d" ? "3d" : "2d",
          initialViewpointId: options.initialViewpointId,
          initialSelectionObjectId: options.initialSelectionObjectId,
          initialFilter: options.initialFilter ?? null,
          atlasState: options.atlasState ?? null,
          minimap: options.minimap,
        }),
        {
          className: options.className ?? "worldorbit-block worldorbit-interactive",
          theme: options.theme,
          layers: options.layers,
          subtitle: options.subtitle,
          preset: options.preset,
          viewMode: normalizedMode === "interactive-3d" ? "3d" : "2d",
          initialViewpointId: options.initialViewpointId,
          initialSelectionObjectId: options.initialSelectionObjectId,
          initialFilter: options.initialFilter ?? null,
          atlasState: options.atlasState ?? null,
          minimap: options.minimap,
        },
      );
    }

    return `<figure class="${escapeAttribute(options.className ?? "worldorbit-block worldorbit-static")}">${renderSceneToSvg(scene, options)}</figure>`;
  } catch (error) {
    if (options.strict) {
      throw error;
    }

    return renderWorldOrbitError(error instanceof Error ? error.message : String(error));
  }
}

export function renderWorldOrbitError(message: string): string {
  return `<pre class="worldorbit-error">WorldOrbit error: ${escapeHtml(message)}</pre>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("\"", "&quot;");
}

function resolveSourceRenderOptions(
  loaded: LoadedWorldOrbitSource,
  options: WorldOrbitMarkdownOptions,
): WorldOrbitMarkdownOptions {
  const atlasDocument = loaded.atlasDocument ?? loaded.draftDocument;

  if (options.preset || !atlasDocument?.system?.defaults.preset) {
    return options;
  }

  return {
    ...options,
    preset: atlasDocument.system.defaults.preset,
  };
}
