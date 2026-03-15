import type { RenderScene } from "@worldorbit/core";

import { renderSceneToSvg } from "./render.js";
import type {
  MountedWorldOrbitEmbeds,
  MountWorldOrbitEmbedsOptions,
  WorldOrbitEmbedPayload,
} from "./types.js";
import { createInteractiveViewer } from "./viewer.js";

const EMBED_SELECTOR = "[data-worldorbit-embed]";

export function serializeWorldOrbitEmbedPayload(payload: WorldOrbitEmbedPayload): string {
  return encodeURIComponent(JSON.stringify(payload));
}

export function deserializeWorldOrbitEmbedPayload(serialized: string): WorldOrbitEmbedPayload {
  return JSON.parse(decodeURIComponent(serialized)) as WorldOrbitEmbedPayload;
}

export function createEmbedPayload(
  scene: RenderScene,
  mode: WorldOrbitEmbedPayload["mode"],
): WorldOrbitEmbedPayload {
  return {
    version: "1.0",
    mode,
    scene,
  };
}

export function createWorldOrbitEmbedMarkup(
  payload: WorldOrbitEmbedPayload,
  options: Pick<MountWorldOrbitEmbedsOptions, "theme" | "layers" | "subtitle" | "preset"> & {
    className?: string;
  } = {},
): string {
  const mergedPayload: WorldOrbitEmbedPayload = {
    ...payload,
    options: {
      ...payload.options,
      theme: options.theme ?? payload.options?.theme,
      layers: options.layers ?? payload.options?.layers,
      subtitle: options.subtitle ?? payload.options?.subtitle,
      preset: options.preset ?? payload.options?.preset,
    },
  };

  const html = renderSceneToSvg(payload.scene, {
    theme: mergedPayload.options?.theme,
    layers: mergedPayload.options?.layers,
    subtitle: mergedPayload.options?.subtitle,
    preset: mergedPayload.options?.preset,
  });

  return `<div class="${escapeAttribute(options.className ?? "worldorbit-embed")}" data-worldorbit-embed="true" data-worldorbit-mode="${payload.mode}" data-worldorbit-preset="${escapeAttribute(mergedPayload.options?.preset ?? payload.scene.renderPreset ?? "custom")}" data-worldorbit-payload="${escapeAttribute(serializeWorldOrbitEmbedPayload(mergedPayload))}">${html}</div>`;
}

export function mountWorldOrbitEmbeds(
  root: ParentNode = document,
  options: MountWorldOrbitEmbedsOptions = {},
): MountedWorldOrbitEmbeds {
  const viewers = new Map<HTMLElement, ReturnType<typeof createInteractiveViewer>>();
  const elements = [...root.querySelectorAll<HTMLElement>(EMBED_SELECTOR)];

  for (const element of elements) {
    const payload = deserializePayloadFromElement(element);
    const mode = options.mode ?? payload.mode;
    const theme = options.theme ?? payload.options?.theme;
    const layers = options.layers ?? payload.options?.layers;
    const subtitle = options.subtitle ?? payload.options?.subtitle;
    const preset = options.preset ?? payload.options?.preset ?? payload.scene.renderPreset ?? undefined;

    if (mode === "interactive") {
      const viewer = createInteractiveViewer(element, {
        ...options.viewer,
        scene: payload.scene,
        width: options.width ?? payload.scene.width,
        height: options.height ?? payload.scene.height,
        padding: options.padding ?? payload.scene.padding,
        preset,
        theme,
        layers,
        subtitle,
      });
      viewers.set(element, viewer);
      options.onMount?.(viewer, element);
    } else {
      element.innerHTML = renderSceneToSvg(payload.scene, {
        width: options.width ?? payload.scene.width,
        height: options.height ?? payload.scene.height,
        padding: options.padding ?? payload.scene.padding,
        preset,
        theme,
        layers,
        subtitle,
      });
      options.onMount?.(null, element);
    }

    element.dataset.worldorbitMounted = "true";
  }

  return {
    viewers: [...viewers.values()],
    destroy(): void {
      for (const [element, viewer] of viewers.entries()) {
        viewer.destroy();
        element.removeAttribute("data-worldorbit-mounted");
      }
      viewers.clear();
    },
  };
}

function deserializePayloadFromElement(element: HTMLElement): WorldOrbitEmbedPayload {
  const serialized = element.dataset.worldorbitPayload;

  if (!serialized) {
    throw new Error("WorldOrbit embed is missing data-worldorbit-payload.");
  }

  return deserializeWorldOrbitEmbedPayload(serialized);
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}
