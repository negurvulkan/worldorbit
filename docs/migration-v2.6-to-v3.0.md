# Migration: v2.6 to v3.0

WorldOrbit `3.0.0` keeps Schema `2.5` as the canonical document format and adds 3D as a viewer-layer capability, not as a new DSL.

## What stays the same

- existing WorldOrbit documents still load
- Schema `2.5` remains the canonical authoring target
- `renderDocumentToScene(...)` stays valid
- 2D viewer, Atlas, Markdown, Editor, and Studio workflows remain available

## What is new in `3.0.0`

- `@worldorbit/core` adds `renderDocumentToSpatialScene(...)`
- `@worldorbit/viewer` adds `viewMode: "2d" | "3d"`
- interactive embeds now distinguish:
  - `interactive-2d`
  - `interactive-3d`
- the legacy embed mode `interactive` is still accepted and maps to `interactive-2d`
- viewer instances now expose:
  - `getViewMode()` / `setViewMode(mode)`
  - `playAnimation()` / `pauseAnimation()` / `resetAnimation()`
  - `setAnimationSpeed(multiplier)` / `getAnimationState()`

## Minimal viewer upgrade

Old:

```ts
createInteractiveViewer(root, {
  document,
});
```

New 2D-explicit:

```ts
createInteractiveViewer(root, {
  document,
  viewMode: "2d",
});
```

New 3D:

```ts
createInteractiveViewer(root, {
  document,
  viewMode: "3d",
});
```

## Markdown / embed upgrade

Old:

```ts
remarkWorldOrbit({ mode: "interactive" });
mountWorldOrbitEmbeds(document, { mode: "interactive" });
```

New:

```ts
remarkWorldOrbit({ mode: "interactive-3d" });
mountWorldOrbitEmbeds(document, { mode: "interactive-3d" });
```

If you do nothing, existing `interactive` usage still hydrates as 2D.

## Behavior notes

- explicit 3D requests do not silently fall back to 2D
- event snapshots still freeze animation time
- missing orbit periods do not block animation; WorldOrbit derives deterministic heuristic motion from existing orbit data
