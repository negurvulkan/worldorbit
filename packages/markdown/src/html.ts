import {
  normalizeDocument,
  parseWorldOrbit,
  renderDocumentToScene,
  validateDocument,
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
    const ast = parseWorldOrbit(source);
    const document = normalizeDocument(ast);
    validateDocument(document);
    const scene = renderDocumentToScene(document, options);

    if ((options.mode ?? "static") === "interactive") {
      return createWorldOrbitEmbedMarkup(createEmbedPayload(scene, "interactive"), {
        className: options.className ?? "worldorbit-block worldorbit-interactive",
        theme: options.theme,
        layers: options.layers,
        subtitle: options.subtitle,
        preset: options.preset,
      });
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
