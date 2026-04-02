# Migration: v2.6 to v3.0

WorldOrbit `4.0.0` promotes Schema `3.0` to the canonical authoring target. Existing Schema `2.6` atlases still load, but the new migration goal is to normalize ship-like objects and mission structure into the newer declarative trajectory model.

## What stays the same

- existing WorldOrbit documents still load
- Schema `2.6` remains readable as the compatibility base
- `renderDocumentToScene(...)` and `renderDocumentToSpatialScene(...)` both remain available
- 2D viewer, Atlas, Markdown, Editor, and Studio workflows remain available

## What changes in `3.0`

- `craft` becomes the canonical object type for ships, probes, and stations
- `trajectory` becomes a first-class top-level block for reusable mission paths
- swing-by, flyby, capture, and transfer phases can be expressed declaratively
- `event` and `pose` snapshots can reference mission structure directly
- `schema 3.0` becomes the preferred formatter output for new and upgraded atlas documents

## Migration mapping

### Legacy object modeling

- `object structure <id>` with `kind ship|probe|station` upgrades to `object craft <id>`
- existing placement, lore, and presentation metadata stay attached to the upgraded object
- `trajectory` references should be added when a ship or probe needs mission phases beyond plain orbit placement

### Suggested trajectory shape

```worldorbit
schema 3.0

object craft Courier
  trajectory courier-run

trajectory courier-run
  craft Courier
  from DeepSpace
  to Naar

  maneuver departure
    deltaV 1.9km/s

  maneuver flyby
    assist Iyath
    around Iyath
    periapsis 420000km
    turnAngle 12deg
```

## Minimal upgrade checklist

1. Change the document header to `schema 3.0`.
2. Convert ship-like `structure` objects to `craft` where the object is a vessel, probe, or station.
3. Add `trajectory` blocks for missions that need transfers, swing-bys, or phase-based flight structure.
4. Keep `event.positions` for curated snapshots and visual scenes.
5. Re-run formatting so the new canonical output uses Schema `3.0`.

## Notes

- This migration is declarative, not a simulation upgrade.
- No numeric orbit solver is required to author valid Schema `3.0` documents.
- Older Schema `2.6` documents remain valid input even when upgraded documents are written back as `3.0`.
