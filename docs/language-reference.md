# WorldOrbit Language Reference

WorldOrbit is a text-first DSL for fictional orbital systems. This reference covers the currently recommended atlas format, Schema 2.1, while also calling out the older compatibility paths that remain supported.

## Version overview

- `schema 2.1` is the recommended header for new atlas documents.
- `schema 2.0` remains fully supported.
- `schema 2.0-draft` remains readable as a legacy compatibility path and emits a deprecation diagnostic.
- Schema 1.0 source without a header is still supported through the older parser/normalization pipeline.

## Document skeleton

```worldorbit
schema 2.1

system Iyath
  title "The Iyath System"
  description "Compact circumprimary planetary system in a wide binary"
  epoch "JY-0001.0"
  referencePlane ecliptic

defaults
  view isometric
  scale presentation
  preset atlas-card
  theme atlas

group inner-system
  label "Inner System"
  color #d9b37a

relation supply-route
  from Skyhook
  to Relay
  kind logistics

event naar-eclipse
  kind solar-eclipse
  target Naar
  participants Iyath Naar Seyra

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  groups inner-system
```

## Comments

Schema 2.1 adds real comments.

- `# ...` starts a line comment and continues to the end of the line.
- `/* ... */` starts a block comment and may span multiple lines.
- Comments are ignored everywhere whitespace is allowed.
- Comments inside strings are not treated as comments.
- Comments are not preserved in the canonical AST/document model.

Example:

```worldorbit
schema 2.1

# Main atlas
system Iyath
  title "The Iyath System"

object planet Naar
  orbit Iyath
  semiMajor 0.92au # canonical orbit
```

## Syntax styles

WorldOrbit supports both authoring styles:

- inline short form
- indented block form

Examples:

```worldorbit
object planet Naar orbit Iyath semiMajor 1.18au eccentricity 0.08
```

```worldorbit
object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
```

## Top-level sections

Schema 2.x atlas documents are a sequence of named top-level sections.

### `system`

Declares the single system container for the document.

Supported fields:

- `title` string
- `description` string, Schema 2.1+
- `epoch` string, Schema 2.1+
- `referencePlane` string, Schema 2.1+

### `defaults`

Document-level presentation defaults.

Supported fields:

- `view`
- `scale`
- `units`
- `preset`
- `theme`

### `atlas`

Optional metadata section.

Supported sub-block:

- `metadata`

Duplicate metadata keys are invalid.

### `viewpoint`

Named saved view or filter.

Supported fields:

- `label`
- `focus`
- `select`
- `summary`
- `projection`
- `preset`
- `zoom`
- `rotation`
- `layers`
- `events`
- `filter`

`filter` supports:

- `query`
- `objectTypes`
- `tags`
- `groups`

In Schema 2.1, `filter.groups` refers to semantic `group` ids. For older atlases it still falls back to the legacy render-group behavior.

`events` is a Schema 2.1 list of event ids that this viewpoint should feature in its panel or event picker.

`layers` may include `events` in Schema 2.1 to enable event overlays in viewers that support them.

### `annotation`

Semantic note attached to an object or atlas entry.

Supported fields:

- `label`
- `target`
- `body`
- `tags`

### `group`

Schema 2.1+ semantic grouping section.

Supported fields:

- `label` string
- `summary` string
- `color` string
- `tags` list
- `hidden` boolean

Groups have no physical position. They exist for filtering, navigation, organization, and atlas tooling.

### `relation`

Schema 2.1+ semantic relationship section.

Supported fields:

- `from` object id
- `to` object id
- `kind` string
- `label` string
- `summary` string
- `tags` list
- `color` string
- `hidden` boolean

Relations are not orbital placement. They model logistics, politics, infrastructure, and other non-spatial links.

### `event`

Schema 2.1+ declarative event section.

Supported fields:

- `kind` string, required
- `label` string
- `summary` string
- `target` object id
- `participants` list of object ids
- `timing` string
- `visibility` string
- `tags` list
- `color` string
- `hidden` boolean
- `positions` block

Events are semantic timeline or snapshot markers for things like eclipses, transits, conjunctions, or ceremonial windows. They do not turn WorldOrbit into a simulation language.

At least one of `target` or `participants` should be present.

#### `positions` and `pose`

Inside an `event`, Schema 2.1 optionally supports a `positions` block with repeated `pose <objectId>` blocks.

Example:

```worldorbit
event naar-eclipse
  kind solar-eclipse
  target Naar
  participants Iyath Naar Seyra

  positions
    pose Naar
      orbit Iyath
      semiMajor 1au
      phase 90deg

    pose Seyra
      orbit Naar
      distance 384400km
      phase 90deg
```

Each `pose` reuses the placement language for a curated event snapshot:

- exactly one of `orbit`, `at`, `surface`, or `free`
- optional placement geometry such as `distance`, `semiMajor`, `eccentricity`, `period`, `angle`, `inclination`, `phase`, `inner`, and `outer`

`pose` blocks are for position and geometry only. They are not a second place to redefine `mass`, `radius`, `info`, typed lore blocks, or other non-placement object metadata.

### `object`

Declares any non-system object.

Header format:

```worldorbit
object <type> <id>
```

Supported object types:

- `star`
- `planet`
- `moon`
- `belt`
- `asteroid`
- `comet`
- `ring`
- `structure`
- `phenomenon`

## Placement modes

Each non-system object may use at most one placement mode.

### `orbit`

The object orbits another object.

Required:

- `orbit <targetObjectId>`

Optional orbit fields:

- `distance`
- `semiMajor`
- `eccentricity`
- `period`
- `angle`
- `inclination`
- `phase`

Notes:

- `distance` and `semiMajor` are mutually exclusive.
- `phase` is most meaningful when an object-level or system-level `epoch` is present.
- `inclination` is most meaningful when an object-level or system-level `referencePlane` is present.

### `at`

Fixed placement relative to another object.

Supported forms:

- named reference: `at Beacon`
- anchor reference: `at Station:dock-north`
- single-primary Lagrange point: `at Naar:L4`
- primary-secondary Lagrange point: `at Naar-Leth:L2`

Only `structure` and `phenomenon` may use `at`.

### `surface`

Surface placement on another body.

```worldorbit
object structure Skyhook
  surface Naar
```

Only surface-capable targets are valid.

### `free`

Free placement.

```worldorbit
object structure OuterGate
  free 8.4au
```

or

```worldorbit
object phenomenon Oort
  free "outer system"
```

## Common object fields

### Physical and descriptive fields

Common scalar and list fields include:

- `radius`
- `mass`
- `density`
- `gravity`
- `temperature`
- `albedo`
- `atmosphere`
- `inner`
- `outer`
- `cycle`
- `kind`
- `class`
- `culture`
- `tags`
- `color`
- `image`
- `hidden`
- `on`
- `source`

Field compatibility still depends on object type.

### Schema 2.1 object metadata

Schema 2.1 adds these optional object-level fields:

- `groups <groupId...>`
- `epoch <string>`
- `referencePlane <string>`
- `tidalLock <boolean>`
- `renderLabel <boolean>`
- `renderOrbit <boolean>`
- `renderPriority <number>`

These are declarative metadata fields. They do not turn WorldOrbit into a simulation language.

### `resonance`

Schema 2.1 adds declarative orbital resonance metadata:

```worldorbit
object moon Orun
  orbit Naar
  resonance Seyra 2:1
```

Format:

- `<targetObjectId> <ratio>`
- ratio must look like `N:M`

### `derive`, `validate`, `locked`, `tolerance`

Schema 2.1 adds lightweight consistency helpers.

Examples:

```worldorbit
object planet Naar
  orbit Iyath
  semiMajor 0.92au
  derive period kepler
  validate kepler
  locked period
  tolerance period 0.5d
```

Supported forms:

- `derive <field> <strategy>`
- `validate <rule>`
- `locked <field...>`
- `tolerance <field> <value>`

Current validator support focuses on:

- `distance` vs. `semiMajor`
- existence of referenced ids
- `at`/`surface` constraints
- group references
- event targets, participants, and viewpoint event references
- simple Kepler-style period checks when enough mass and orbital data are present

## `info` and typed lore blocks

`info` remains valid and is not replaced.

```worldorbit
object planet Naar
  info
    description "Homeworld of the Enari."
    faction "Veyrath Republic"
```

Schema 2.1 also adds optional typed blocks:

- `climate`
- `habitability`
- `settlement`

Example:

```worldorbit
object planet Naar
  climate
    meanSurfaceTemperature 291K
    pressure 1.18bar

  habitability
    biosphere complex
    inhabited true

  settlement
    population "8.2 billion"
    status core-world
```

Rules:

- typed block entries are key/value lines
- duplicate keys inside the same block are invalid
- there is not yet a hard domain schema for the block keys

## Data types

### Strings

Use double quotes when a value contains spaces.

```worldorbit
title "The Iyath System"
```

### Lists

Some fields use space-separated token lists.

```worldorbit
tags trade infrastructure
groups inner-system enari-core
```

### Booleans

Accepted boolean values:

- `true`
- `false`
- `yes`
- `no`

### Unit values

Unit values use a number immediately followed by a suffix.

Examples:

- `1au`
- `384400km`
- `18d`
- `42deg`
- `289K`

Common unit families include:

- distance: `m`, `km`, `au`, `ly`, `pc`, `kpc`
- radius/distance: `re`, `rj`, `sol`
- mass: `me`, `mj`, `sol`
- duration: `s`, `min`, `h`, `d`, `y`, `ky`, `my`, `gy`
- angle: `deg`
- generic: `K`

## Validation and compatibility notes

Important validator rules include:

- exactly one `system`
- unique ids across groups, viewpoints, annotations, relations, events, and objects
- valid references in `orbit`, `surface`, `at`, `target`, `from`, `to`, `groups`, `resonance`, event `participants`, and viewpoint `events`
- `distance` and `semiMajor` may not coexist on the same orbit
- `at` is limited to `structure` and `phenomenon`
- duplicate keys are invalid in `info`, `atlas.metadata`, `climate`, `habitability`, and `settlement`

Common warnings include:

- `phase` without `epoch`
- `inclination` without `referencePlane`
- unknown groups
- unknown events or events without enough participants/positions
- derive rules without enough input data
- period values when central mass is not derivable

Compatibility rule:

- Schema 2.1 features inside a `schema 2.0` document produce explicit compatibility diagnostics instead of being silently treated as native Schema 2.0 fields.
