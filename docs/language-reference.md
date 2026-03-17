**WorldOrbit DSL** (Domain Specific Language) (Schema 2.0)

The WorldOrbit DSL is designed specifically for text-based worldbuilding of orbital star systems. It describes objects, their properties, and how they are positioned relative to one another so they can later be rendered statically or interactively in 2D/3D.

---

## 1. Syntax and Basic Structure

Every valid WorldOrbit document should begin with the schema version:

```worldorbit
schema 2.0
````

### Syntax Styles

The DSL supports three ways of declaring data areas for an object:

1. **Inline Short Form:** Parameters are written directly after the name on the same line.

   ```worldorbit
   object planet Naar orbit Iyath semiMajor 1.18au
   ```

2. **Indented Block Form:** Parameters are declared below the object, indented (usually with 2 spaces).

   ```worldorbit
   object planet Naar
     orbit Iyath
     semiMajor 1.18au
   ```

3. **Info Block:** Arbitrary metadata can be defined clearly inside an `info` block.

   ```worldorbit
   object planet Naar
     info
       description "Homeworld of the Enari."
       climate "Temperate to dry"
   ```

*(Note: The keyword `object` before the type is optional; often you can simply write `planet Naar`.)*

---

## 2. Supported Object Types

The DSL consistently separates the **class** of an object from its **placement**. Special relationships (such as a “binary system”) are derived purely from positioning.

* **`system`**: The root element for the entire project (only one `system` is allowed per file).
* **Celestial bodies:** `star`, `planet`, `moon`, `asteroid`, `comet`
* **Orbital formations:** `belt`, `ring`
* **Artificial / special objects:** `structure` (for example stations or relays), `phenomenon` (anomalies, black holes, etc.)

Example:

```worldorbit
system Iyath
star Iyath-Prime
structure Deep-Space-Relay
```

---

## 3. Placement Modes

The most important property of almost every object except the `system` itself is how and where it is placed. An object requires (at most) one of these four mutually exclusive placement parameters:

### A. `orbit`

Makes the object orbit another object (the target object must be specified).

* **Additional parameters** (all optional, usually requiring units):

  * `distance` or `semiMajor`: Orbit distance / semi-major axis
  * `eccentricity`: Eccentricity (numeric value, no unit)
  * `period`: Orbital period
  * `angle`, `inclination`, `phase`: Orbital angle, inclination, and phase

### B. `at` (Lagrange and Reference Points)

Places the object exactly at another object or at a Lagrange point shared within an orbit.

* **Target notation:**

  * Simple object: `at Deep-Space-Center` (essentially synonymous with “exactly at that position”)
  * Simple Lagrange point: `at PlanetX:L4`
  * Detailed Lagrange point (primary and secondary body): `at PlanetX-MoonY:L1`

* **Supported points:** `L1`, `L2`, `L3`, `L4`, `L5`

### C. `surface`

Places the object on the surface of another object.

* In actual renderings, this is typically shown very close to the parent object or visually linked to it.
* **Syntax:** `surface PlanetName`

### D. `free`

Allows a free, semantic, or roughly distance-based placement, typically in outer regions or detached from the dominant star/center.

* **Optional additions:** Can include an exact distance (for example `free 100au`) or a descriptive text (`free "Oort Cloud"`).

---

## 4. Parameters and Data Types

Aside from placement, additional properties can be assigned. These are grouped into different type categories.

### Allowed Units

When a value is expected as a “Unit Value,” it consists of a number (integer or decimal with `.`) plus a suffix:

* **Distance / length:** `au` (astronomical units), `km`, `re` (Earth radii), `sol` (solar radii)
* **Weight / mass:** `me` (Earth masses)
* **Time:** `d` (days), `y` (years), `h` (hours)
* **Angle:** `deg` (degrees)

### All Field Parameters (Field Keys)

**1. Placement and orbital parameters** (mostly unit values or floats):
`orbit`, `at`, `surface`, `free`, `distance`, `semiMajor`, `eccentricity` (number without unit), `period`, `angle`, `inclination`, `phase`

**2. Physical properties** (unit values):

* `radius`: The size of the object
* `mass`: Mass of the object
* `density`: Density
* `gravity`: Surface gravity
* `temperature`: Temperature (expects a unit; often ignored or fictional, but syntactically supported)
* `inner`, `outer`: Often used with `ring` or `belt` to define inner and outer radii
* `cycle`: Cycles

**3. Regular numeric values**:

* `albedo` (reflectivity)

**4. Boolean values**:

* Allowed values: `true`, `false`, `yes`, `no`
* **Fields:** `hidden` (systematically hides an object/path from rendering)

**5. Lists** (space-separated):

* **Fields:** `tags` (example: `tags gas-giant habitable-zone`)

**6. Classification and text metadata** (strings):
Values that allow multiple words or strings (assembled from tokens).

* `kind`: Gives a generic object more specific semantics (for example `structure kind relay`)
* `class`: Object classes, for example M-Class or gas giant
* `color`: Hex color codes or CSS colors
* `atmosphere`: Description of the atmosphere (for example `nitrogen-oxygen`)
* `title`: Human-readable display name in the UI/render
* **General metadata:** `view`, `scale`, `units`, `on`, `source` (often used inside `defaults` or for the `system`)

---

## 5. The `info` Construct

Anything intended as free text, long-form text, or extended storytelling belongs inside an `info` block. It allows storing arbitrary key-value pairs without requiring predefined field names.

**Example:**

```worldorbit
object structure "Goliath Station"
  orbit Naar
  info
    faction "United Earth Directorate"
    population "approx 42,000"
    status "Operational"
```

## Complete Example

```worldorbit
schema 2.0

system Sol
  title "Solar System"

object star Sun
  radius 1sol
  mass 333000me

object planet Earth
  orbit Sun
  semiMajor 1au
  period 1y
  mass 1me
  radius 1re
  atmosphere "nitrogen-oxygen"
  tags habitable rocky
  info
    description "Homeworld of humanity."

object moon Luna
  orbit Earth
  distance 384400km
  radius 0.27re
  hidden false

object structure "James Webb Space Telescope"
  at Earth:L2
  kind telescope
  info
    status "Active"
```