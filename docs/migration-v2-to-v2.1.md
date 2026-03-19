# Migration: Schema 2.0 to Schema 2.1

Schema 2.1 is a backward-compatible atlas extension of Schema 2.0.

If you already author canonical `schema 2.0` files, you can move to `schema 2.1` incrementally:

- `schema 2.0` files still load unchanged.
- `schema 2.0-draft` remains a legacy compatibility path.
- No automatic rewrite of existing `info` content is required.
- The recommended upgrade path is "change the header first, then opt into new fields when useful".

## What Schema 2.1 adds

- `#` line comments and optional `/* ... */` block comments
- top-level `group` sections for semantic grouping
- top-level `relation` sections for non-orbital links
- top-level `event` sections for declarative eclipses, transits, conjunctions, and similar moments
- `viewpoint.events`, `layers events`, and event-local `positions` snapshots with `pose <objectId>`
- `system.description`, `system.epoch`, and `system.referencePlane`
- object-level `groups`, `epoch`, `referencePlane`, `tidalLock`
- viewer hints: `renderLabel`, `renderOrbit`, `renderPriority`
- declarative `resonance`
- diagnostic-only consistency helpers: `derive`, `validate`, `locked`, `tolerance`
- structured lore blocks: `climate`, `habitability`, `settlement`

## Minimal upgrade

You can upgrade a Schema 2.0 atlas to Schema 2.1 by changing only the header:

```worldorbit
schema 2.0
```

becomes:

```worldorbit
schema 2.1
```

When no Schema 2.1-only fields are added, this upgrade does not need to change anything else.

The same formatter-based path is available programmatically:

```ts
import { formatDocument, parseWorldOrbitAtlas } from "@worldorbit/core";

const atlas = parseWorldOrbitAtlas(source);
const schema21Source = formatDocument(atlas, { schema: "2.1" });
```

## Typical follow-up additions

After the header upgrade, the most common next steps are:

1. Add comments to make large atlases easier to maintain.
2. Add `epoch` and `referencePlane` where you use `phase` and `inclination`.
3. Introduce semantic `group` sections for navigation and filtering.
4. Add `relation` sections for logistics, infrastructure, or faction links.
5. Add declarative `event` sections when you want named eclipses, transits, or other curated moments.
6. Gradually move selected lore from unstructured `info` keys into typed blocks.

## Example

Schema 2.0:

```worldorbit
schema 2.0

system Iyath
  title "Iyath System"

defaults
  view isometric
  preset atlas-card

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  phase 42deg
  inclination 24deg
```

Schema 2.1:

```worldorbit
schema 2.1

# Canonical epoch and plane for phase/inclination
system Iyath
  title "Iyath System"
  epoch "JY-0001.0"
  referencePlane ecliptic

defaults
  view isometric
  preset atlas-card

group inner-system
  label "Inner System"

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  phase 42deg
  inclination 24deg
  groups inner-system

event naar-eclipse
  kind solar-eclipse
  target Naar
  participants Iyath Naar Seyra
```

## Validator behavior

Schema 2.1 adds new diagnostics, but it is not a simulation engine.

Important checks include:

- unknown IDs in `orbit`, `surface`, `at`, `groups`, `resonance`, `from`, and `to`
- unknown IDs in event `target`, event `participants`, and viewpoint `events`
- duplicate IDs across groups, viewpoints, annotations, relations, events, and objects
- `distance` plus `semiMajor` on the same orbit
- warnings for `phase` without an `epoch`
- warnings for `inclination` without a `referencePlane`
- warnings for events without enough participants or event positions
- basic Kepler consistency checks when enough input data is present

## Compatibility notes

- Schema 2.1 features inside `schema 2.0` are not silently blessed; they produce explicit compatibility diagnostics.
- Comments are accepted only as a first-class feature in `schema 2.1`.
- Renderers that do not understand a Schema 2.1 field can still load the document and ignore the unsupported metadata.
