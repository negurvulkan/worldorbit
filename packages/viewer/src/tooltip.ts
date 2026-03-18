import type { NormalizedValue, UnitValue } from "@worldorbit/core";

import type {
  TooltipMode,
  ViewerObjectDetails,
  ViewerTooltipDetails,
  ViewerTooltipField,
} from "./types.js";

const FIELD_ORDER = [
  "radius",
  "temperature",
  "atmosphere",
  "period",
  "semiMajor",
  "distance",
  "eccentricity",
  "angle",
  "inclination",
  "phase",
  "albedo",
  "mass",
  "density",
  "gravity",
];

export function buildViewerTooltipDetails(
  details: ViewerObjectDetails,
): ViewerTooltipDetails {
  return {
    objectId: details.objectId,
    title: details.objectId,
    typeLabel: humanizeType(details.object.type),
    imageHref: details.renderObject.imageHref ?? null,
    description: readTooltipDescription(details),
    tags: normalizeTags(details.object.properties.tags),
    fields: buildTooltipFields(details),
    parentLabel: details.parent?.objectId ?? null,
    orbitLabel: details.orbit?.parentId ?? null,
    details,
  };
}

export function renderDefaultTooltipContent(
  details: ViewerTooltipDetails,
  mode: TooltipMode,
): string {
  const tagMarkup = details.tags.length
    ? `<div class="wo-tooltip-tags">${details.tags
        .map((tag) => `<span class="wo-tooltip-tag">${escapeHtml(tag)}</span>`)
        .join("")}</div>`
    : "";
  const fieldMarkup = details.fields.length
    ? `<dl class="wo-tooltip-fields">${details.fields
        .map(
          (field) =>
            `<div class="wo-tooltip-field"><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(field.value)}</dd></div>`,
        )
        .join("")}</dl>`
    : "";
  const relationBits = [
    details.parentLabel ? `Parent: ${details.parentLabel}` : null,
    details.orbitLabel ? `Orbit: ${details.orbitLabel}` : null,
    mode === "pinned" ? "Pinned tooltip" : "Hover tooltip",
  ].filter(Boolean);

  return `<article class="wo-tooltip-card" data-tooltip-object-id="${escapeHtml(details.objectId)}">
    <div class="wo-tooltip-head">
      ${
        details.imageHref
          ? `<img class="wo-tooltip-image" src="${escapeAttribute(details.imageHref)}" alt="" />`
          : `<div class="wo-tooltip-image wo-tooltip-image-placeholder">${escapeHtml(details.typeLabel.slice(0, 1))}</div>`
      }
      <div class="wo-tooltip-heading">
        <strong>${escapeHtml(details.title)}</strong>
        <span>${escapeHtml(details.typeLabel)}</span>
      </div>
    </div>
    ${details.description ? `<p class="wo-tooltip-description">${escapeHtml(details.description)}</p>` : ""}
    ${tagMarkup}
    ${fieldMarkup}
    ${
      relationBits.length
        ? `<p class="wo-tooltip-relations">${escapeHtml(relationBits.join(" - "))}</p>`
        : ""
    }
  </article>`;
}

function buildTooltipFields(details: ViewerObjectDetails): ViewerTooltipField[] {
  const fields = new Map<string, ViewerTooltipField>();

  for (const key of FIELD_ORDER) {
    const value = details.object.properties[key];
    if (value === undefined) {
      continue;
    }
    fields.set(key, {
      key,
      label: humanizeField(key),
      value: formatTooltipValue(value),
    });
  }

  const placement = details.object.placement;
  if (details.object.groups?.length) {
    fields.set("groups", {
      key: "groups",
      label: "Groups",
      value: details.object.groups.join(", "),
    });
  }
  if (details.object.epoch) {
    fields.set("epoch", {
      key: "epoch",
      label: "Epoch",
      value: details.object.epoch,
    });
  }
  if (details.object.referencePlane) {
    fields.set("referencePlane", {
      key: "referencePlane",
      label: "Reference Plane",
      value: details.object.referencePlane,
    });
  }
  if (details.object.tidalLock !== undefined) {
    fields.set("tidalLock", {
      key: "tidalLock",
      label: "Tidal Lock",
      value: details.object.tidalLock ? "true" : "false",
    });
  }
  if (details.object.resonance) {
    fields.set("resonance", {
      key: "resonance",
      label: "Resonance",
      value: `${details.object.resonance.targetObjectId} ${details.object.resonance.ratio}`,
    });
  }

  if (placement?.mode === "at") {
    fields.set("placement", {
      key: "placement",
      label: "Placement",
      value: `At ${placement.target}`,
    });
  } else if (placement?.mode === "surface") {
    fields.set("placement", {
      key: "placement",
      label: "Placement",
      value: `Surface ${placement.target}`,
    });
  } else if (placement?.mode === "free") {
    fields.set("placement", {
      key: "placement",
      label: "Placement",
      value: placement.distance
        ? `Free ${formatTooltipValue(placement.distance)}`
        : `Free ${placement.descriptor ?? "custom"}`,
    });
  }

  return [...fields.values()];
}

function normalizeTags(value: NormalizedValue | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function readTooltipDescription(details: ViewerObjectDetails): string | null {
  const direct = details.object.info.description?.trim();
  if (direct) {
    return direct;
  }

  const summary = details.group?.label?.trim();
  return summary && summary !== details.objectId ? summary : null;
}

function formatTooltipValue(value: NormalizedValue): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return formatUnitValue(value);
}

function formatUnitValue(value: UnitValue): string {
  return `${value.value}${value.unit ?? ""}`;
}

function humanizeType(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function humanizeField(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/^./, (match) => match.toUpperCase());
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
