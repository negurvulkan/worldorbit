# Migration: Schema 2.1 to Schema 2.5

Schema 2.5 is a backward-compatible extension of Schema 2.1.

If you already author `schema 2.1` atlases, the migration path is intentionally small:

- `schema 2.1` files still load unchanged.
- You can switch to `schema 2.5` by updating only the header first.
- Existing `group`, `relation`, `event`, `positions`, and `pose` content remains valid.
- The new features are optional and can be adopted incrementally.

## What Schema 2.5 adds

- new viewpoint projections: `orthographic` and `perspective`
- a new `camera` block on `viewpoint`
- clearer `epoch` / `referencePlane` inheritance across system, object, event, and pose
- stronger validation for viewpoints, camera fields, and event snapshots
- clearer documentation around semantic layers and 2D fallback behavior

## Minimal upgrade

Schema 2.1:

```worldorbit
schema 2.1

system Iyath
  title "Iyath"
```

Schema 2.5:

```worldorbit
schema 2.5

system Iyath
  title "Iyath"
```

When you do not add any Schema 2.5-only fields, this upgrade changes only the declared schema version.

## Adding a camera block

Schema 2.5 keeps `rotation` and adds a separate `camera` block.

```worldorbit
viewpoint overview
  projection perspective
  rotation 15
  camera
    azimuth 32
    elevation 18
    distance 7
```

Rules:

- `rotation` remains the 2D screen-rotation hint.
- `camera.azimuth` is not an alias for `rotation`.
- current viewers preserve `camera` semantically even when the render output still uses a 2D fallback

## Event and pose context

Schema 2.5 lets `event` and `pose` set their own context:

```worldorbit
event naar-eclipse
  kind solar-eclipse
  epoch "JY-0001.0"
  referencePlane ecliptic

  positions
    pose Seyra
      orbit Naar
      phase 90deg
```

Fallback order:

- `pose.epoch -> event.epoch -> object.epoch -> system.epoch`
- `pose.referencePlane -> event.referencePlane -> object.referencePlane -> system.referencePlane`

Leaving these fields empty is valid. It simply means the event snapshot inherits from the base document.

## Compatibility notes

- `schema 2.1` remains a supported read format.
- `schema 2.5` features inside a `schema 2.1` file produce explicit compatibility diagnostics.
- Schema 2.5 still does not add general XYZ positioning, meshes, materials, or a 3D simulation layer.
