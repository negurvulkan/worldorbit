# WorldOrbit Language Reference

**WorldOrbit DSL** (Domain Specific Language) — Schema 2.0

The WorldOrbit DSL is designed specifically for text-based worldbuilding of orbital star systems. It describes objects, their properties, and how they are positioned relative to one another, so they can later be rendered statically or interactively in 2D/3D.

---

## Table of Contents

1. [Document Structure](#1-document-structure)
2. [Object Types](#2-object-types)
3. [Placement Modes](#3-placement-modes)
4. [Field Parameters and Data Types](#4-field-parameters-and-data-types)
5. [The `info` Construct](#5-the-info-construct)
6. [Schema 2.0 Top-Level Sections](#6-schema-20-top-level-sections)
   - [system](#61-system)
   - [defaults](#62-defaults)
   - [atlas](#63-atlas)
   - [viewpoint](#64-viewpoint)
   - [annotation](#65-annotation)
   - [object](#66-object)
7. [Complete Example](#7-complete-example)

---

## 1. Document Structure

### Schema Header

Every **Schema 2.0** document must begin with a schema declaration on the very first non-blank line:

```worldorbit
schema 2.0
```

The legacy header `schema 2.0-draft` is still accepted but produces a deprecation diagnostic. Schema 1.0 documents (without a header) are supported via a separate compatibility path.

### Syntax Styles

Objects and their data can be declared in two complementary ways that can be freely mixed:

**Inline short form** — all fields on the same line as the object declaration:

```worldorbit
object planet Naar orbit Iyath semiMajor 1.18au eccentricity 0.08
```

**Indented block form** — each field on its own indented line:

```worldorbit
object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
```

In a Schema 2.0 document every object declaration must begin with the keyword `object`. In the legacy Schema 1.0 format the keyword is optional.

### Quoted Strings

Values that contain spaces must be wrapped in double quotes:

```worldorbit
object system Solaris
  title "The Solaris Expanse"
```

Quoted strings are also accepted anywhere a plain token is valid.

### Comments

Lines starting with `#` are not currently parsed as comments. There is no comment syntax in the current version.

---

## 2. Object Types

The DSL consistently separates the **class** of an object from its **placement**. Special relationships such as a binary system are expressed purely through placement, not through special object types.

| Type | Description |
|---|---|
| `system` | Root element of the document. Only one is allowed per file. |
| `star` | A star or stellar body. |
| `planet` | A planetary body. |
| `moon` | A natural satellite orbiting a planet or other body. |
| `belt` | A distributed field of debris, asteroids, or particles (asteroid belt, ring system zone). |
| `asteroid` | An individual minor body. |
| `comet` | A comet, including long-period or non-periodic comets. |
| `ring` | A ring or torus around a body. |
| `structure` | An artificial or constructed object: station, relay, habitat, etc. |
| `phenomenon` | An unusual or non-standard feature: anomaly, void, black hole, nebula, etc. |

Example:

```worldorbit
schema 2.0

system Iyath

object star Iyath
object planet Naar
object structure "Waypoint Alpha"
object phenomenon "The Wound"
```

---

## 3. Placement Modes

Every non-`system` object can declare at most one placement mode. Placement modes are mutually exclusive. An object without a placement mode is considered positionally unbound (rendered at an unspecified position by the renderer).

### `orbit`

The object orbits another named object. The required value is the ID of the target object.

```worldorbit
object planet Naar
  orbit Iyath
```

Additional optional orbital parameters (all accept unit values unless noted):

| Field | Type | Description |
|---|---|---|
| `distance` | unit (distance) | Mean orbital distance from the target. Alternative to `semiMajor`. |
| `semiMajor` | unit (distance) | Semi-major axis of the orbit ellipse. |
| `eccentricity` | number (0–1) | Orbital eccentricity. 0 = circular. No unit suffix. |
| `period` | unit (duration) | Orbital period. |
| `angle` | unit (angle) | Argument of periapsis or longitude of ascending node in degrees. |
| `inclination` | unit (angle) | Orbital inclination relative to the reference plane. |
| `phase` | unit (angle) | Initial phase angle along the orbit at the reference epoch. |

`distance` and `semiMajor` refer to the same physical concept and should not both be specified for the same object.

### `at`

The object is co-located with another object or at a named special position. Three reference notations are supported:

**Named reference** — placed exactly at the position of another object:

```worldorbit
object structure Relay
  at NavBeacon
```

**Anchor reference** — placed at a named anchor point on a specific object:

```worldorbit
object structure Outpost
  at Station:dock-north
```

The notation is `ObjectId:anchorName` where the anchor name is an alphanumeric identifier. The target object ID must exist in the document. The anchor name itself is not validated beyond syntax.

**Lagrange point — single primary:**

```worldorbit
object structure Trojans
  at Naar:L4
```

The notation is `PrimaryId:Lx` where x is 1–5.

**Lagrange point — primary and secondary body:**

```worldorbit
object structure Relay
  at Naar-Luna:L2
```

The notation is `PrimaryId-SecondaryId:Lx`. Both IDs must exist in the document.

Available Lagrange points: `L1`, `L2`, `L3`, `L4`, `L5`.

> Only `structure` and `phenomenon` objects support `at` placement. Other object types must use `orbit`, `surface`, or `free`.

### `surface`

The object is placed on the surface of another object. The value is the target object ID.

```worldorbit
object structure Outpost
  surface Naar
```

Valid surface targets: `star`, `planet`, `moon`, `asteroid`, `comet`.

### `free`

The object is placed freely, without a rigid orbital relationship. The value is either a distance or a descriptive string.

Distance-based:

```worldorbit
object comet "C-2001 R1"
  free 200au
```

Descriptor-based:

```worldorbit
object phenomenon "Oort Cloud"
  free "outer system"
```

---

## 4. Field Parameters and Data Types

### Unit Values

Unit values consist of a numeric literal (integer or decimal) followed immediately by a unit suffix, with no space:

```
1.18au   384400km   0.08   1y   28deg
```

| Suffix | Meaning | Unit family |
|---|---|---|
| `m` | metres | distance |
| `km` | kilometres | distance |
| `au` | astronomical units | distance |
| `ly` | light-years | distance |
| `pc` | parsecs | distance |
| `kpc` | kiloparsecs | distance |
| `re` | Earth radii | distance / radius |
| `rj` | Jupiter radii | radius |
| `sol` | solar radii | distance / radius / mass |
| `me` | Earth masses | mass |
| `mj` | Jupiter masses | mass |
| `s` | seconds | duration |
| `min` | minutes | duration |
| `h` | hours | duration |
| `d` | days | duration |
| `y` | years | duration |
| `ky` | kiloyears (1,000y) | duration |
| `my` | megayears (1M y) | duration |
| `gy` | gigayears (1G y) | duration |
| `K` | Kelvin | generic (e.g. temperature) |
| `deg` | degrees | angle |

Unit values without a suffix are accepted (unit is stored as `null`).

### Field Reference

The tables below list all fields accepted in `object` and inherited `system` body declarations.

#### Placement fields

| Field | Value type | Mode | Applicable to |
|---|---|---|---|
| `orbit` | string (object ID) | Sets orbit mode and target | all except `system` |
| `at` | string (reference) | Sets at-mode and reference | `structure`, `phenomenon` |
| `surface` | string (object ID) | Sets surface mode | `structure`, `phenomenon` |
| `free` | string or unit | Sets free placement | all except `system` |
| `distance` | unit (distance) | Orbit distance | all except `system` |
| `semiMajor` | unit (distance) | Orbit semi-major axis | all except `system` |
| `eccentricity` | number | Orbit eccentricity | all except `system` |
| `period` | unit (duration) | Orbital period | all except `system` |
| `angle` | unit (angle) | Orbit angle | all except `system` |
| `inclination` | unit (angle) | Orbit inclination | all except `system` |
| `phase` | unit (angle) | Initial phase | all except `system` |

#### Physical properties

| Field | Value type | Applicable to |
|---|---|---|
| `radius` | unit (radius) | all except `system` |
| `mass` | unit (mass) | all except `system` |
| `density` | unit (generic) | all except `system` |
| `gravity` | unit (generic) | all except `system` |
| `temperature` | unit (generic) | all except `system` |
| `albedo` | number | all except `system` |
| `atmosphere` | string | `planet`, `moon`, `asteroid`, `comet`, `phenomenon` |
| `inner` | unit (distance) | `belt`, `ring`, `phenomenon` |
| `outer` | unit (distance) | `belt`, `ring`, `phenomenon` |
| `cycle` | unit (duration) | all except `system` |

#### Classification and appearance

| Field | Value type | Description | Applicable to |
|---|---|---|---|
| `kind` | string | Semantic sub-type (e.g. `relay`, `telescope`, `black-hole`) | all except `system` |
| `class` | string | Stellar or planetary class (e.g. `G2V`, `gas-giant`) | all except `system` |
| `culture` | string | Cultural or factional affiliation | all except `system` |
| `tags` | list (space-separated) | Arbitrary tag set for filtering and grouping | all |
| `color` | string | Display color: hex code (`#3fa8d0`) or CSS keyword | all |
| `image` | string | Image URL or root-relative path for the object icon | `star`, `planet`, `moon`, `asteroid`, `comet`, `structure`, `phenomenon` |
| `hidden` | boolean | When `true`, hides the object from renders | all |

Boolean values: `true`, `false`, `yes`, `no`.

The `image` field accepts:
- Relative paths: `assets/naar.png`
- Root-relative paths: `/images/planet.webp`
- HTTP/HTTPS URLs: `https://example.com/img.png`

Protocol-schemed URLs other than `http` and `https` are rejected. Protocol-relative URLs (`//…`) are also rejected.

#### System-level metadata fields

The following fields are valid only on a `system` object in Schema 1.0. In Schema 2.0 they are expressed via the dedicated `defaults` and `system` sections instead.

| Field | Description |
|---|---|
| `title` | Human-readable display name for the system |
| `view` | Default projection (legacy; use `defaults` in Schema 2.0) |
| `scale` | Scale preset (legacy) |
| `units` | Preferred display unit set (legacy) |

#### Narrative fields

| Field | Value type | Description | Applicable to |
|---|---|---|---|
| `on` | string | A "located in" or "belongs to" reference (conceptual parent) | all except `system` |
| `source` | string | Attribution or source reference | all except `system` |

---

## 5. The `info` Construct

The `info` block stores arbitrary narrative key-value pairs without schema enforcement. It is intended for lore, faction data, descriptive text, and any metadata that does not belong in a typed field.

The `info` keyword appears as an indented line inside an object block. All lines indented beyond it are parsed as `key value` pairs until the indentation level drops back.

```worldorbit
object structure "Goliath Station"
  orbit Naar
  kind station
  info
    faction "United Earth Directorate"
    population "approx 42,000"
    status "Operational"
    established "Year 218 Post-Collapse"
```

Rules:
- Every `info` line must have at least two tokens: a key and a value.
- Values may span multiple tokens and are joined with spaces.
- Quoted strings are supported in values.
- Duplicate keys within one `info` block are rejected.
- There is no schema validation on info keys.

---

## 6. Schema 2.0 Top-Level Sections

Schema 2.0 documents are structured as a sequence of named top-level sections. Each section begins at indentation level zero and contains indented fields.

The recognized top-level section keywords are:

| Keyword | Required | Multiple allowed |
|---|---|---|
| `system` | Yes | No |
| `defaults` | No | No |
| `atlas` | No | No |
| `viewpoint` | No | Yes |
| `annotation` | No | Yes |
| `object` | No | Yes |

`system` must appear before `defaults`, `atlas`, `viewpoint`, and `annotation`.

---

### 6.1 `system`

Declares the root system and its display title.

```worldorbit
system Iyath
  title "The Iyath System"
```

| Field | Type | Description |
|---|---|---|
| `title` | string | Human-readable system name shown in the viewer and atlas header. |

Only `title` is currently accepted as a system field. All other document-wide settings go into `defaults` or `atlas`.

---

### 6.2 `defaults`

Sets document-wide rendering defaults applied whenever a more specific `viewpoint` does not override them.

```worldorbit
defaults
  view isometric
  scale presentation
  preset atlas-card
  theme atlas
```

| Field | Allowed values | Default | Description |
|---|---|---|---|
| `view` | `topdown`, `isometric` | `topdown` | Default projection used when rendering the scene. |
| `scale` | `compact`, `balanced`, `presentation` | — | Layout scale preset: controls how orbit distances and body radii relate visually. |
| `units` | any string | — | Preferred display unit set (informational; renderers may use this). |
| `preset` | `diagram`, `presentation`, `atlas-card`, `markdown` | — | Default render preset that controls overall visual layout and detail level. |
| `theme` | any string (`atlas`, `nightglass`, `ember`, …) | — | Visual theme applied by the viewer. |

All fields are optional. Unset fields fall back to viewer defaults.

---

### 6.3 `atlas`

Provides system-wide metadata key-value pairs that are not tied to individual objects. These are displayed in atlas header cards and can be read by tooling.

```worldorbit
atlas
  metadata
    author "Hanjo Teichert"
    version "1.4"
    language "de"
    license "CC BY 4.0"
```

The `atlas` section supports a single sub-block `metadata` whose indented lines are free-form key-value pairs (similar to `info`). Duplicate keys are rejected.

---

### 6.4 `viewpoint`

Defines a named saved view of the system: a specific projection, zoom level, rotation, preset, and optional filter that the viewer can load on demand.

Each `viewpoint` requires a unique identifier:

```worldorbit
viewpoint overview
  label "Full System Overview"
  summary "Shows all objects from above."
  projection isometric
  preset atlas-card
  zoom 1.0
  rotation 0

viewpoint inner-system
  label "Inner System"
  summary "Focus on the inner planets."
  projection topdown
  focus Naar
  layers -background guides objects labels
  filter
    objecttypes star planet moon structure
    tags inner-system
```

#### Viewpoint fields

| Field | Type | Description |
|---|---|---|
| `label` | string | Human-readable display name for this viewpoint. |
| `summary` | string | Short description shown in the viewpoint picker. |
| `projection` | `topdown`, `isometric` | Render projection for this viewpoint. Inherits from `defaults.view` if not set. |
| `preset` | `diagram`, `presentation`, `atlas-card`, `markdown` | Render preset for this viewpoint. Inherits from `defaults.preset` if not set. |
| `focus` | string (object ID) | Centers the view on this object. |
| `select` | string (object ID) | Pre-selects this object (highlights it and opens its detail panel). |
| `zoom` | positive number | Initial zoom level. 1.0 = fit-to-system. |
| `rotation` | number | Initial rotation in degrees. |
| `layers` | token list | Sets which scene layers are visible. See layer tokens below. |
| `filter` | sub-block | Restricts which objects are visible in this viewpoint. |

#### Layer tokens

The `layers` field accepts a space-separated list of layer names, with optional `!` or `-` prefix to hide a layer:

| Token | Effect |
|---|---|
| `background` | Background fill layer |
| `guides` | Grid / guide lines |
| `orbits` | All orbit rings (shorthand for `orbits-back` + `orbits-front`) |
| `orbits-back` | Orbit arcs behind objects (isometric back half) |
| `orbits-front` | Orbit arcs in front of objects (isometric front half) |
| `objects` | Object icons and body shapes |
| `labels` | Object labels |
| `metadata` | Overlay metadata panel |

Examples:
- `layers objects labels` — show only objects and labels
- `layers -background guides objects labels` — hide background, show rest

#### `filter` sub-block fields

The `filter` sub-block narrows which objects are shown:

| Field | Type | Description |
|---|---|---|
| `query` | string | Free-text search filter applied to object IDs and labels. |
| `objecttypes` | space-separated list | Restricts to specific object types (e.g. `star planet moon`). |
| `tags` | space-separated list | Only shows objects that carry all of these tags. |
| `groups` | space-separated list | Only shows objects that belong to specified groups (by group ID). |

---

### 6.5 `annotation`

Attaches a free-text note or lore entry to the document or to a specific object. Annotations are displayed in the atlas panel and can be filtered by tag.

```worldorbit
annotation naar-notes
  label "Notes on Naar"
  target Naar
  body "Naar is the primary inhabited world of the Iyath system."
  tags lore inhabited
```

| Field | Type | Description |
|---|---|---|
| `label` | string | Display name of the annotation. Auto-generated from the ID if not set. |
| `target` | string (object ID) | The object this annotation is attached to. Optional; omit for system-level notes. |
| `body` | string | The main text content of the annotation. |
| `tags` | space-separated list | Tags for filtering annotations in the atlas panel. |

Annotation IDs are normalized to lowercase alphanumeric + hyphens. Duplicate IDs are rejected.

---

### 6.6 `object`

Declares an orbital object. In Schema 2.0 the `object` keyword is required as the section prefix, followed by the object type and ID.

```worldorbit
object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  color #4a9fbf
  image /assets/naar-map.png
  tags habitable rocky
  atmosphere "nitrogen-oxygen"
  info
    population "2.1 billion"
    government "Federal Senate"
```

See sections 3, 4, and 5 for the full field reference.

---

## 7. Complete Example

```worldorbit
schema 2.0

system Iyath
  title "The Iyath System"

defaults
  view isometric
  preset atlas-card
  theme atlas

atlas
  metadata
    author "WorldOrbit Project"
    version "1.0"

viewpoint overview
  label "Full System"
  summary "Fit the whole system."
  projection isometric
  preset atlas-card

viewpoint inner-focus
  label "Inner System"
  projection topdown
  focus Naar
  filter
    objecttypes star planet moon structure
    tags inner

annotation naar-notes
  label "Naar Overview"
  target Naar
  body "Inhabited homeworld of the Enari people."
  tags lore inhabited

object star Iyath
  radius 1.1sol
  color #ffe08c
  tags inner

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  radius 1re
  mass 1.1me
  albedo 0.32
  atmosphere "nitrogen-oxygen"
  image /assets/naar-map.png
  color #4a9fbf
  tags inner habitable rocky
  info
    population "2.1 billion"
    government "Federal Senate"

object moon "Naar IV"
  orbit Naar
  distance 340000km
  radius 0.3re
  tags inner

object structure "Epsilon Station"
  at Naar:L4
  kind station
  tags inner
  info
    faction "IDF Fleet Command"
    status "Active"

object structure "Mirror Array"
  surface Naar
  kind installation
  info
    purpose "Atmospheric reflector network"

object belt "Outer Debris Field"
  orbit Iyath
  inner 4.2au
  outer 6.8au
  tags outer

object comet "HC-7"
  free 220au
  info
    discovery "Cycle 218"
```