# WorldOrbit Sprachreferenz

WorldOrbit ist eine text-first DSL fuer fiktionale orbitale Systeme. Diese Referenz beschreibt das aktuell empfohlene Atlasformat Schema 2.1 und nennt zugleich die weiterhin unterstuetzten Kompatibilitaetspfade.

## Versionsueberblick

- `schema 2.1` ist der empfohlene Header fuer neue Atlas-Dokumente.
- `schema 2.0` bleibt voll unterstuetzt.
- `schema 2.0-draft` bleibt als Legacy-Kompatibilitaetspfad lesbar und erzeugt eine Deprecation-Diagnose.
- Schema-1.0-Quellen ohne Header werden weiterhin ueber die aeltere Parser-/Normalisierungsstrecke unterstuetzt.

## Dokumentgeruest

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

object star Iyath

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  groups inner-system
```

## Kommentare

Schema 2.1 fuegt echte Kommentare hinzu.

- `# ...` startet einen Zeilenkommentar bis zum Zeilenende.
- `/* ... */` startet einen Blockkommentar ueber mehrere Zeilen.
- Kommentare sind ueberall erlaubt, wo auch Whitespace erlaubt ist.
- Kommentare innerhalb von Strings gelten nicht als Kommentare.
- Kommentare werden nicht im kanonischen AST bzw. Dokumentmodell erhalten.

Beispiel:

```worldorbit
schema 2.1

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
- `layers`
- `filter`

`filter` unterstuetzt:

- `query`
- `objectTypes`
- `tags`
- `groups`

In Schema 2.1 verweist `filter.groups` auf semantische `group`-IDs. Bei aelteren Atlanten faellt das Verhalten weiter auf die bisherige Render-Gruppierung zurueck.

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
- `phenomenon`

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

### Schema-2.1-Objektmetadaten

Schema 2.1 fuegt diese optionalen Objektfelder hinzu:

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
- eindeutige IDs ueber Gruppen, Viewpoints, Annotations, Relationen und Objekte
- gueltige Referenzen in `orbit`, `surface`, `at`, `target`, `from`, `to`, `groups` und `resonance`
- `distance` und `semiMajor` duerfen nicht auf demselben Orbit koexistieren
- `at` ist auf `structure` und `phenomenon` beschraenkt
- doppelte Keys sind in `info`, `atlas.metadata`, `climate`, `habitability` und `settlement` ungueltig

Haefige Warnungen sind:

- `phase` ohne `epoch`
- `inclination` ohne `referencePlane`
- unbekannte Gruppen
- Ableitungsregeln ohne genug Eingangsdaten
- Periodenwerte ohne ableitbare Zentralmasse

Kompatibilitaetsregel:

- Schema-2.1-Features in einem `schema 2.0`-Dokument erzeugen explizite Kompatibilitaetsdiagnosen statt stillschweigend als native Schema-2.0-Felder akzeptiert zu werden.
