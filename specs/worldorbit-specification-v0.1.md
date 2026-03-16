**WorldOrbit Spezifikation v0.1**.

Der Arbeitstitel bleibt hier einfach **`worldorbit`**.

## Ziel von `worldorbit`

`worldorbit` ist eine textbasierte DSL für Markdown-Codeblöcke zur Beschreibung und späteren Visualisierung von fiktiven Sternsystemen, Planetensystemen und orbitalem Worldbuilding.

Die Sprache soll:

* leicht lesbar sein
* schnell schreibbar sein
* git- und markdown-freundlich sein
* sowohl einfache Skizzen als auch ausgearbeitete Systeme erlauben
* physische Daten, Positionen und Lore-Metadaten gemeinsam abbilden

## Einbettung in Markdown

Ein Diagramm steht in einem Codeblock:

````md
```worldorbit
system Iyath
star Iyath
planet Naar orbit Iyath distance 1.18au period 412d
```
````

## Grundtypen v0.1

Diese Objekttypen gehören in die erste Version:

* `system`
* `star`
* `planet`
* `moon`
* `belt`
* `asteroid`
* `comet`
* `ring`
* `structure`
* `phenomenon`

## Grundprinzip

Es gibt keine speziellen Beziehungstypen wie `binary` oder `multiple`.

Beziehungen ergeben sich aus:

* `orbit`
* `at`
* `surface`
* `free`

Das heißt:
Jedes Objekt definiert selbst, wo es sich befindet oder worauf es bezogen ist.

## Platzierungsarten

### 1. Orbit

Normale Umlaufbahn um ein Zielobjekt oder einen benannten Bezugspunkt.

Beispiel:

```worldorbit
planet Naar orbit Iyath distance 1.18au period 412d
moon Leth orbit Naar distance 220000km period 18d
```

### 2. At

Sonderpositionen, vor allem Lagrange-Punkte oder benannte feste Punkte.

Beispiel:

```worldorbit
structure Relay kind relay at Naar:L4
structure Gate kind gate at Iyath-Naar:L2
```

### 3. Surface

Objekt befindet sich auf der Oberfläche eines Körpers.

Beispiel:

```worldorbit
structure Skyhook kind elevator surface Naar
```

### 4. Free

Frei im Raum positioniert, ohne direkte Bahnrelation in der Kurzform.

Beispiel:

```worldorbit
structure OuterGate kind gate free 8.4au
```

## Schreibstile

v0.1 unterstützt zwei Schreibweisen.

### Kurzform

Für schnelle Skizzen in einer Zeile.

```worldorbit
planet Naar orbit Iyath distance 1.18au period 412d
moon Leth orbit Naar distance 220000km period 18d
structure Relay kind relay at Naar:L4
```

### Blockform

Für ausführlichere Objekte mit mehreren Feldern und `info`-Block.

```worldorbit
planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.03
  period 412d
  tags habitable homeworld

  info
    faction "Veyrathische Republik"
    population "8.4 billion"
    description "Heimatwelt der Enari."
```

## Syntaxregeln v0.1

Jede Objektdefinition beginnt mit:

`<type> <name>`

Also zum Beispiel:

* `star Iyath`
* `planet Naar`
* `moon Leth`

### Kurzform-Regel

Nach Typ und Name folgen beliebige Feld-Wert-Paare:

```worldorbit
planet Naar orbit Iyath distance 1.18au period 412d
```

### Blockform-Regel

Nach Typ und Name können eingerückte Felder folgen:

```worldorbit
planet Naar
  orbit Iyath
  distance 1.18au
  period 412d
```

### Info-Block

Ein optionaler `info`-Block enthält freie Metadaten:

```worldorbit
planet Naar
  orbit Iyath

  info
    faction "Veyrathische Republik"
    climate "warm-temperate"
    description "Heimatwelt der Enari."
```

## Gemeinsame Felder

Diese Felder dürfen grundsätzlich bei vielen oder allen Objekttypen vorkommen.

### Identität und Darstellung

* `kind`
* `class`
* `tags`
* `color`
* `hidden`

### Position und Bahn

* `orbit`
* `distance`
* `semiMajor`
* `eccentricity`
* `period`
* `angle`
* `inclination`
* `phase`
* `at`
* `surface`
* `free`

### Physische Eigenschaften

* `radius`
* `mass`
* `density`
* `gravity`
* `temperature`
* `albedo`
* `atmosphere`

## Typen mit empfohlenen Feldern

### `system`

Container für ein Diagramm.

Pflicht:

* Name

Optional:

* `title`
* `scale`
* `view`
* `units`

Beispiel:

```worldorbit
system Iyath
```

Oder als Block:

```worldorbit
system Iyath
  view topdown
  scale compressed
  units metric
```

### `star`

Pflicht:

* Name

Optional:

* `class`
* `radius`
* `mass`
* `temperature`
* `color`
* `orbit`
* `distance`
* `semiMajor`
* `eccentricity`
* `period`
* `angle`

Beispiel:

```worldorbit
star Iyath class G2 radius 1.08sol mass 1.02sol
```

### `planet`

Pflicht:

* Name

Optional:

* `orbit`
* `distance` oder `semiMajor`
* `eccentricity`
* `period`
* `angle`
* `inclination`
* `radius`
* `mass`
* `gravity`
* `atmosphere`
* `temperature`
* `tags`
* `class`

Beispiel:

```worldorbit
planet Naar orbit Iyath semiMajor 1.18au eccentricity 0.03 period 412d
```

### `moon`

Wie `planet`, aber typischerweise mit planetarem Parent.

Beispiel:

```worldorbit
moon Leth orbit Naar distance 220000km period 18d
```

### `belt`

Für Gürtel oder dichte Objektzonen.

Pflicht:

* Name

Optional:

* `orbit`
* `inner`
* `outer`
* `angle`
* `inclination`
* `kind`
* `tags`

Beispiel:

```worldorbit
belt Ilyon orbit Iyath inner 2.1au outer 2.8au
```

### `asteroid`

Pflicht:

* Name

Optional:

* `orbit`
* `distance` oder `semiMajor`
* `eccentricity`
* `period`
* `angle`
* `radius`
* `mass`
* `kind`
* `tags`

Beispiel:

```worldorbit
asteroid Kesh-41 orbit Iyath semiMajor 3.2au eccentricity 0.11
```

### `comet`

Pflicht:

* Name

Optional:

* `orbit`
* `semiMajor`
* `eccentricity`
* `period`
* `angle`
* `inclination`
* `tags`

Beispiel:

```worldorbit
comet Sereth orbit Iyath semiMajor 12.4au eccentricity 0.82 period 41y
```

### `ring`

Für planetare Ringe.

Pflicht:

* Name

Optional:

* `orbit`
* `inner`
* `outer`
* `kind`
* `tags`

Beispiel:

```worldorbit
ring NaarRing orbit Naar inner 80000km outer 140000km
```

### `structure`

Flexibler Typ für künstliche Objekte.

Pflicht:

* Name

Optional:

* `kind`
* `orbit`
* `at`
* `surface`
* `free`
* `distance`
* `period`
* `angle`
* `inclination`
* `tags`
* `faction`
* `population`

Beispiel:

```worldorbit
structure L4-Relay kind relay at Naar:L4
```

Oder:

```worldorbit
structure Tareth kind station orbit Naar distance 42000km period 1.7d
```

### `phenomenon`

Für Ereignisse oder nicht-körperliche Phänomene.

Pflicht:

* Name

Optional:

* `kind`
* `on`
* `source`
* `cycle`
* `tags`

Beispiel:

```worldorbit
phenomenon Emberfall kind meteorShower on Naar cycle 1y
```

## `info`-Block

`info` enthält freie Schlüssel-Wert-Paare und ist absichtlich offen.

Beispiel:

```worldorbit
planet Naar
  orbit Iyath
  distance 1.18au

  info
    faction "Veyrathische Republik"
    population "8.4 billion"
    climate "warm-temperate"
    description "Heimatwelt der Enari."
```

Regeln:

* nur innerhalb eines Objekts
* nur eingerückte Key-Value-Zeilen
* Werte mit Leerzeichen stehen in Anführungszeichen
* keine feste Schlüsselliste in v0.1

## Einheiten v0.1

Empfohlene Einheiten:

* Distanz: `au`, `km`
* Radius: `re`, `sol`
* Masse: `me`, `sol`
* Zeit: `d`, `y`, optional `h`
* Winkel: `deg`

Beispiele:

* `1.18au`
* `220000km`
* `0.97re`
* `1.02sol`
* `412d`
* `41deg`

## Minimale Validierungsregeln v0.1

Ein Parser für v0.1 sollte mindestens das prüfen:

* jedes Objekt hat Typ und Namen
* unbekannte Typen erzeugen Fehler
* `orbit <target>` referenziert ein vorhandenes Ziel oder einen erlaubten Bezugspunkt
* `at <target>` hat gültiges Format wie `Naar:L4`
* `info` darf nur innerhalb eines Objekts stehen
* Einheiten müssen bekannt sein
* `distance` und `semiMajor` sollten nicht gleichzeitig Pflicht sein; mindestens eines davon bei Orbitalobjekten empfohlen

## Komplettbeispiel v0.1

```worldorbit
system Iyath
  view topdown
  scale compressed
  units metric

star Iyath
  class G2
  radius 1.08sol
  mass 1.02sol

planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.03
  period 412d
  angle 41deg
  radius 0.97re
  tags habitable homeworld

  info
    faction "Veyrathische Republik"
    population "8.4 billion"
    climate "warm-temperate"
    description "Heimatwelt der Enari."

moon Leth
  orbit Naar
  distance 220000km
  period 18d

  info
    status "industrial moon"
    population "240 million"

belt Ilyon
  orbit Iyath
  inner 2.1au
  outer 2.8au

structure L4-Relay
  kind relay
  at Naar:L4

  info
    purpose "Traffic control and deep-space relay"

phenomenon Emberfall
  kind meteorShower
  on Naar
  cycle 1y

  info
    description "Jährlicher Meteorstrom."
```