# WorldOrbit Sprachreferenz

WorldOrbit ist eine text-first DSL fuer fiktionale orbitale Systeme. Diese Referenz beschreibt das aktuell empfohlene Atlasformat Schema 3.1 und nennt zugleich die weiterhin unterstuetzten Kompatibilitaetspfade.

## Versionsueberblick

- `schema 3.1` ist der empfohlene Header fuer neue Atlas-Dokumente.
- `schema 3.0` und `schema 2.6` bleiben voll lesbare Kompatibilitaetsbasen fuer Schema 3.1.
- `schema 2.1` bleibt voll lesbar fuer aeltere Atlanten.
- `schema 2.0` bleibt voll unterstuetzt.
- `schema 2.0-draft` bleibt als Legacy-Kompatibilitaetspfad lesbar und erzeugt eine Deprecation-Diagnose.
- Schema-1.0-Quellen ohne Header werden weiterhin ueber die aeltere Parser-/Normalisierungsstrecke unterstuetzt.

## Neu in Schema 3.1

Schema 3.1 ist eine rueckwaertskompatible Erweiterung von Schema 3.0 mit Fokus auf sichtbarer Missionsdarstellung, nicht auf einem vollwertigen Orbitalsolver.

Schema 3.1 fuegt hinzu:

- sichtbare Trajektorienkurven in 2D- und 3D-Szenen
- Trajektorien-Render-Metadaten wie `renderMode`, `stroke`, `strokeWidth`, `marker`, `labelMode` und `showWaypoints`
- Segment-Render-Hinweise wie `waypointLabel`, `waypointDate`, `renderHidden` und `sampleDensity`
- offizielle Solver-Sampling-APIs und `auto`-Fallback zwischen illustrativer und solver-basierter Darstellung
- weiterhin deklarative `craft`-, `trajectory`-, `event`- und `pose`-Missionsbeschreibung

Schema 3.1 fuegt weiterhin bewusst **nicht** einen eingebauten N-Koerper-Solver, kontinuierliche freie XYZ-Pfadbeschreibung, Meshes, Materialien, Quaternionen oder Licht hinzu.

Schema 2.6 bleibt die direkte Kompatibilitaetsbasis, und aeltere Dokumente laden weiterhin ueber dieselbe Parser- und Normalisierungsstrecke.

## Dokumentgeruest

```worldorbit
schema 3.0

system Iyath
  title "The Iyath System"
  description "Compact circumprimary planetary system in a wide binary"
  epoch "JY-0001.0"
  referencePlane ecliptic

defaults
  view orthographic
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
  epoch "JY-0001.0"
  referencePlane ecliptic

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  groups inner-system
```

## Kommentare

Schema 2.1 fuegt echte Kommentare hinzu, und Schema 3.0 behaelt sie unveraendert bei.

- `# ...` startet einen Zeilenkommentar bis zum Zeilenende.
- `/* ... */` startet einen Blockkommentar ueber mehrere Zeilen.
- Kommentare sind ueberall erlaubt, wo auch Whitespace erlaubt ist.
- Kommentare innerhalb von Strings gelten nicht als Kommentare.
- Kommentare werden nicht im kanonischen AST bzw. Dokumentmodell erhalten.

Beispiel:

```worldorbit
schema 3.0

# Hauptatlas
system Iyath
  title "The Iyath System"

object planet Naar
  orbit Iyath
  semiMajor 0.92au # kanonische Umlaufbahn
```

## Syntaxstile

WorldOrbit unterstuetzt beide Schreibweisen:

- Inline-Form
- eingerueckte Blockform

Beispiele:

```worldorbit
object planet Naar orbit Iyath semiMajor 1.18au eccentricity 0.08
```

```worldorbit
object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
```

## Top-Level-Sektionen

Schema-2.x-Atlasdokumente bestehen aus einer Folge benannter Top-Level-Sektionen.

### `system`

Deklariert den einzelnen Systemcontainer des Dokuments.

Unterstuetzte Felder:

- `title` string
- `description` string, Schema 2.1+
- `epoch` string, Schema 2.1+
- `referencePlane` string, Schema 2.1+

### `defaults`

Dokumentweite Praesentations-Defaults.

Unterstuetzte Felder:

- `view`
- `scale`
- `units`
- `preset`
- `theme`

`view` akzeptiert:

- `topdown`
- `isometric`
- `orthographic`, Schema 3.0+
- `perspective`, Schema 3.0+

### `theme`

Optionale Sektion zur plattformübergreifenden (2D, 2.5D, 3D) Definition von Design-Vorgaben und visuellen Overrides.

```worldorbit
theme
  preset "blueprint"

  star
    color "#ff00ff"
    emissive true

  planet
    texture "earth_diffuse.jpg"

  orbit
    style "dashed"
```

Unterstützte Eigenschaften:

- `preset`: Erbt von einem vordefinierten Renderer-Design.
- Verschachtelte Blöcke für jeden gültigen Objekttyp (z. B. `star`, `planet`) oder visuelle Elemente wie `orbit`, die beliebige Darstellungs-Eigenschaften wie `color`, `emissive`, `texture`, `width`, `style` usw. enthalten können.

### `atlas`

Optionale Metadaten-Sektion.

Unterstuetzter Unterblock:

- `metadata`

Doppelte Metadata-Keys sind ungueltig.

### `viewpoint`

Gespeicherte Sicht oder Filteransicht.

Unterstuetzte Felder:

- `label`
- `focus`
- `select`
- `summary`
- `projection`
- `preset`
- `zoom`
- `rotation`
- `camera`
- `layers`
- `events`
- `filter`

`projection` akzeptiert:

- `topdown`
- `isometric`
- `orthographic`, Schema 3.0+
- `perspective`, Schema 3.0+

`rotation` bleibt der bestehende 2D-Screen-Rotate-Hinweis. Es bleibt in Schema 3.0 unterstuetzt und ist **kein** Alias fuer `camera.azimuth`.

`camera` ist in Schema 3.0 ein Block mit:

- `azimuth`
- `elevation`
- `roll`, optional
- `distance`, optional

`filter` unterstuetzt:

- `query`
- `objectTypes`
- `tags`
- `groups`

In Schema 2.1 und Schema 3.0 verweist `filter.groups` auf semantische `group`-IDs. Bei aelteren Atlanten faellt das Verhalten weiter auf die bisherige Render-Gruppierung zurueck.

`events` ist ab Schema 2.1 eine Liste von Event-IDs, die ein Viewpoint in seinem Panel oder Event-Picker hervorheben soll.

`layers` darf ab Schema 2.1 auch `events` enthalten, um Event-Overlays in unterstuetzenden Viewern einzublenden.

### `annotation`

Semantische Notiz an einem Objekt oder Atlas-Eintrag.

Unterstuetzte Felder:

- `label`
- `target`
- `body`
- `tags`

### `group`

Semantische Gruppensektion ab Schema 2.1.

Unterstuetzte Felder:

- `label` string
- `summary` string
- `color` string
- `tags` list
- `hidden` boolean

Gruppen haben keine physische Position. Sie dienen Filterung, Navigation, Strukturierung und Atlas-Tooling.

### `relation`

Semantische Beziehungssektion ab Schema 2.1.

Unterstuetzte Felder:

- `from` Objekt-ID
- `to` Objekt-ID
- `kind` string
- `label` string
- `summary` string
- `tags` list
- `color` string
- `hidden` boolean

Relationen sind keine Orbital-Platzierung. Sie modellieren Logistik, Politik, Infrastruktur und andere nicht-raeumliche Verknuepfungen.

### `event`

Deklarative Event-Sektion ab Schema 2.1. Schema 3.0 erweitert sie um expliziten Event-Kontext und optionale Trajectory-Verknuepfungen.

Unterstuetzte Felder:

- `kind` string, erforderlich
- `label` string
- `summary` string
- `target` Objekt-ID
- `participants` Liste von Objekt-IDs
- `timing` string
- `visibility` string
- `epoch` string, Schema 3.0+
- `referencePlane` string, Schema 3.0+
- `tags` list
- `color` string
- `hidden` boolean
- `positions`-Block

Events sind semantische Zeitfenster oder Schnappschuesse fuer Dinge wie Finsternisse, Transits, Konjunktionen oder besondere Beobachtungsfenster. Sie machen WorldOrbit nicht zu einer Simulationssprache.

Mindestens eines von `target` oder `participants` sollte gesetzt sein.

#### `positions` und `pose`

Innerhalb eines `event` unterstuetzt Schema 2.1 optional einen `positions`-Block mit wiederholbaren `pose <objectId>`-Bloecken. Schema 3.0 behaelt diese Form bei und praezisiert, wie fehlende Pose-Daten auf Objekt-, Event- und Systemkontext zurueckfallen.

Beispiel:

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

Jedes `pose` verwendet die Placement-Sprache erneut fuer einen kuratierten Ereignis-Schnappschuss:

- genau eines von `orbit`, `at`, `surface` oder `free`
- optionale Placement-Geometrie wie `distance`, `semiMajor`, `eccentricity`, `period`, `angle`, `inclination`, `phase`, `inner` und `outer`
- optional `epoch`, Schema 3.0+
- optional `referencePlane`, Schema 3.0+

`pose`-Bloecke sind nur fuer Position und Geometrie gedacht. Sie sind kein zweiter Ort fuer `mass`, `radius`, `info`, typisierte Lore-Bloecke oder andere nicht-platzierungsbezogene Objektmetadaten.

Kontextvererbung fuer Event-Snapshots:

- `pose.epoch -> event.epoch -> object.epoch -> system.epoch -> unset`
- `pose.referencePlane -> event.referencePlane -> object.referencePlane -> system.referencePlane -> impliziter Renderer-Default`

Fehlende Pose-Placement-Felder fallen auf das Basisobjekt zurueck. Fehlende Pose-Bloecke machen ein Event nicht ungueltig; sie bedeuten nur, dass fuer diese referenzierten Koerper die normale Dokument-Platzierung verwendet wird.

### `object`

Deklariert jedes Nicht-System-Objekt.

Headerformat:

```worldorbit
object <type> <id>
```

Unterstuetzte Objekttypen:

- `star`
- `planet`
- `moon`
- `belt`
- `asteroid`
- `comet`
- `ring`
- `structure`
- `craft`
- `phenomenon`

### `trajectory`

Deklarative Missionspfad-Sektion fuer wiederverwendbare Flugbahnen, Swing-bys und Transferboegen.

Headerformat:

```worldorbit
trajectory <id>
```

Unterstuetzte Felder:

- `kind` string
- `craft` Objekt-ID
- `from` Objekt-ID
- `to` Objekt-ID
- `around` Objekt-ID
- `assist` Objekt-ID
- `epoch` string
- `referencePlane` string
- `notes` string
- `segments`-Block

`segments` enthaelt wiederholbare `maneuver <type>`-Bloecke. Unterstuetzte Maneuver-Arten sind:

- `departure`
- `transfer`
- `flyby`
- `capture`
- `stationkeeping`
- `escape`

Jedes Maneuver kann semantische Felder enthalten wie:

- `from`
- `to`
- `around`
- `assist`
- `periapsis`
- `apoapsis`
- `inclination`
- `duration`
- `deltaV`
- `phaseAngle`
- `turnAngle`
- `energy`
- `notes`

Trajectory-Bloecke sind deklarativ und koennen von `craft`, `event` oder `pose`-Snapshots referenziert werden. Sie beschreiben Missionsstruktur und Gravity-Assist-Absicht, nicht einen eingebauten numerischen Solver.

## Platzierungsmodi

Jedes Nicht-System-Objekt darf hoechstens einen Platzierungsmodus verwenden.

### `orbit`

Das Objekt umkreist ein anderes Objekt.

Pflicht:

- `orbit <targetObjectId>`

Optionale Orbit-Felder:

- `distance`
- `semiMajor`
- `eccentricity`
- `period`
- `angle`
- `inclination`
- `phase`

Hinweise:

- `distance` und `semiMajor` sind gegenseitig exklusiv.
- `phase` ist am sinnvollsten mit Objekt- oder System-`epoch`.
- `inclination` ist am sinnvollsten mit Objekt- oder System-`referencePlane`.

### `at`

Feste Platzierung relativ zu einem anderen Objekt.

Unterstuetzte Formen:

- benannte Referenz: `at Beacon`
- Ankerreferenz: `at Station:dock-north`
- Lagrange-Punkt mit Primaerkoerper: `at Naar:L4`
- Lagrange-Punkt mit Primaer- und Sekundaerkoerper: `at Naar-Leth:L2`

Nur `structure` und `phenomenon` duerfen `at` verwenden.

### `surface`

Platzierung auf der Oberflaeche eines anderen Koerpers.

```worldorbit
object structure Skyhook
  surface Naar
```

Nur surface-faehige Ziele sind gueltig.

### `free`

Freie Platzierung.

```worldorbit
object structure OuterGate
  free 8.4au
```

oder

```worldorbit
object phenomenon Oort
  free "outer system"
```

## Haefige Objektfelder

### Physische und beschreibende Felder

Uebliche skalare und Listenfelder sind:

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

Die Feldkompatibilitaet haengt weiterhin vom Objekttyp ab.

### Gemeinsame Objektmetadaten

Schema 2.1 und neuer fuegen diese optionalen Objektfelder hinzu:

- `groups <groupId...>`
- `epoch <string>`
- `referencePlane <string>`
- `tidalLock <boolean>`
- `renderLabel <boolean>`
- `renderOrbit <boolean>`
- `renderPriority <number>`

Diese Felder sind deklarative Metadaten. Sie machen WorldOrbit nicht zu einer Simulationssprache.

### `resonance`

Schema 2.1 fuegt deklarative Resonanzmetadaten hinzu:

```worldorbit
object moon Orun
  orbit Naar
  resonance Seyra 2:1
```

Format:

- `<targetObjectId> <ratio>`
- das Verhaeltnis muss wie `N:M` aussehen

### `derive`, `validate`, `locked`, `tolerance`

Schema 2.1 fuegt leichte Konsistenzhelfer hinzu.

Beispiele:

```worldorbit
object planet Naar
  orbit Iyath
  semiMajor 0.92au
  derive period kepler
  validate kepler
  locked period
  tolerance period 0.5d
```

Unterstuetzte Formen:

- `derive <field> <strategy>`
- `validate <rule>`
- `locked <field...>`
- `tolerance <field> <value>`

Die aktuelle Validator-Unterstuetzung konzentriert sich auf:

- `distance` vs. `semiMajor`
- Existenz gegebener IDs
- `at`-/`surface`-Regeln
- Gruppenreferenzen
- Event-Ziele, Teilnehmer und Viewpoint-Event-Referenzen
- Trajectory-Referenzen, inklusive `craft`, `from`, `to`, `around` und `assist`
- Swing-by-Segmente, die ein `assist`-Objekt benoetigen
- einfache Kepler-Pruefungen, wenn genug Massen- und Orbitdaten vorhanden sind

## `info` und typisierte Lore-Bloecke

`info` bleibt gueltig und wird nicht ersetzt.

```worldorbit
object planet Naar
  info
    description "Homeworld of the Enari."
    faction "Veyrath Republic"
```

Schema 2.1 fuegt ausserdem optionale typisierte Bloecke hinzu:

- `climate`
- `habitability`
- `settlement`

Beispiel:

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

Regeln:

- typisierte Blockeintraege sind Key/Value-Zeilen
- doppelte Keys im selben Block sind ungueltig
- es gibt noch kein hartes Fachschema fuer diese Blockkeys

## Datentypen

### Strings

Verwende doppelte Anfuehrungszeichen, wenn ein Wert Leerzeichen enthaelt.

```worldorbit
title "The Iyath System"
```

### Listen

Einige Felder verwenden leerzeichengetrennte Token-Listen.

```worldorbit
tags trade infrastructure
groups inner-system enari-core
```

### Booleans

Akzeptierte Boolean-Werte:

- `true`
- `false`
- `yes`
- `no`

### Einheitswerte

Einheitswerte bestehen aus einer Zahl direkt gefolgt von einem Suffix.

Beispiele:

- `1au`
- `384400km`
- `18d`
- `42deg`
- `289K`

Haefige Einheitsfamilien:

- Distanz: `m`, `km`, `au`, `ly`, `pc`, `kpc`
- Radius/Distanz: `re`, `rj`, `sol`
- Masse: `me`, `mj`, `sol`
- Dauer: `s`, `min`, `h`, `d`, `y`, `ky`, `my`, `gy`
- Winkel: `deg`
- generisch: `K`

## Validierung und Kompatibilitaet

Wichtige Validator-Regeln sind:

- genau ein `system`
- eindeutige IDs ueber Gruppen, Viewpoints, Annotations, Relationen, Events und Objekte
- gueltige Referenzen in `orbit`, `surface`, `at`, `target`, `from`, `to`, `groups`, `resonance`, Event-`participants` und Viewpoint-`events`
- `distance` und `semiMajor` duerfen nicht auf demselben Orbit koexistieren
- `at` ist auf `structure` und `phenomenon` beschraenkt
- doppelte Keys sind in `info`, `atlas.metadata`, `climate`, `habitability` und `settlement` ungueltig

Haefige Warnungen sind:

- `phase` ohne `epoch`
- `inclination` ohne `referencePlane`
- unbekannte Gruppen
- unbekannte Events oder Events ohne genug Teilnehmer/Positionen
- Ableitungsregeln ohne genug Eingangsdaten
- Periodenwerte ohne ableitbare Zentralmasse

Kompatibilitaetsregel:

- Schema-2.1-Features in einem `schema 2.0`-Dokument erzeugen explizite Kompatibilitaetsdiagnosen statt stillschweigend als native Schema-2.0-Felder akzeptiert zu werden.
