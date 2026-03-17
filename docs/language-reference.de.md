# WorldOrbit Sprachreferenz

**WorldOrbit DSL** (Domain Specific Language) — Schema 2.0

Die WorldOrbit DSL ist speziell für das textbasierte Worldbuilding orbitaler Sternensysteme konzipiert. Sie beschreibt Objekte, ihre Eigenschaften und wie sie relativ zueinander platziert sind, um anschließend statisch oder interaktiv in 2D/3D gerendert zu werden.

---

## Inhaltsverzeichnis

1. [Dokumentstruktur](#1-dokumentstruktur)
2. [Objekttypen](#2-objekttypen)
3. [Platzierungs-Modi](#3-platzierungs-modi)
4. [Feld-Parameter und Datentypen](#4-feld-parameter-und-datentypen)
5. [Das `info`-Konstrukt](#5-das-info-konstrukt)
6. [Schema-2.0-Top-Level-Sektionen](#6-schema-20-top-level-sektionen)
   - [system](#61-system)
   - [defaults](#62-defaults)
   - [atlas](#63-atlas)
   - [viewpoint](#64-viewpoint)
   - [annotation](#65-annotation)
   - [object](#66-object)
7. [Vollständiges Beispiel](#7-vollständiges-beispiel)

---

## 1. Dokumentstruktur

### Schema-Header

Jedes **Schema-2.0**-Dokument muss mit einer Schema-Deklaration in der allerersten nicht-leeren Zeile beginnen:

```worldorbit
schema 2.0
```

Der veraltete Header `schema 2.0-draft` wird noch akzeptiert, erzeugt aber eine Deprecation-Diagnose. Schema-1.0-Dokumente (ohne Header) werden über einen separaten Kompatibilitätspfad unterstützt.

### Syntax-Stile

Objekte und ihre Daten können auf zwei komplementäre Arten deklariert werden, die beliebig kombiniert werden können:

**Inline Short Form** — alle Felder auf derselben Zeile wie die Objektdeklaration:

```worldorbit
object planet Naar orbit Iyath semiMajor 1.18au eccentricity 0.08
```

**Indented Block Form** — jedes Feld auf einer eigenen eingerückten Zeile:

```worldorbit
object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
```

In einem Schema-2.0-Dokument muss jede Objektdeklaration mit dem Schlüsselwort `object` beginnen. Im Legacy-Format Schema 1.0 ist dieses Schlüsselwort optional.

### Zeichenketten mit Leerzeichen

Werte, die Leerzeichen enthalten, müssen in doppelte Anführungszeichen eingeschlossen werden:

```worldorbit
system Solaris
  title "Die Solaris-Weite"
```

Quoted Strings sind an jeder Stelle erlaubt, an der auch ein einfaches Token akzeptiert wird.

### Kommentare

Es gibt in der aktuellen Version keine Kommentar-Syntax.

---

## 2. Objekttypen

Die DSL trennt konsequent zwischen der **Klasse** eines Objekts und seiner **Positionierung**. Spezielle Beziehungen wie ein Binärsystem ergeben sich rein durch die Positionierung und nicht durch besondere Objekttypen.

| Typ | Beschreibung |
|---|---|
| `system` | Wurzelelement des Dokuments. Pro Datei ist nur eines erlaubt. |
| `star` | Ein Stern oder stellarer Körper. |
| `planet` | Ein planetarer Körper. |
| `moon` | Ein natürlicher Satellit, der einen Planeten oder anderen Körper umkreist. |
| `belt` | Ein verteiltes Trümmerfeld, Asteroiden- oder Partikelfeld (Asteroidengürtel, Ringsystem). |
| `asteroid` | Ein einzelner Kleinkörper. |
| `comet` | Ein Komet, einschließlich lang- und nicht-periodischer Kometen. |
| `ring` | Ein Ring oder Torus um einen Körper. |
| `structure` | Ein künstliches oder gebautes Objekt: Station, Relay, Habitat usw. |
| `phenomenon` | Ein ungewöhnliches Merkmal: Anomalie, Void, schwarzes Loch, Nebel usw. |

Beispiel:

```worldorbit
schema 2.0

system Iyath

object star Iyath
object planet Naar
object structure "Wegpunkt Alpha"
object phenomenon "Die Wunde"
```

---

## 3. Platzierungs-Modi

Jedes Objekt außer `system` kann maximal einen Platzierungs-Modus deklarieren. Platzierungs-Modi sind gegenseitig exklusiv. Ein Objekt ohne Platzierungs-Modus gilt als positional ungebunden (wird vom Renderer an einer unbestimmten Position gerendert).

### `orbit`

Das Objekt umkreist ein anderes benanntes Objekt. Der Pflicht-Wert ist die ID des Zielobjekts.

```worldorbit
object planet Naar
  orbit Iyath
```

Optionale Orbital-Parameter (alle mit Einheitswerten, sofern nicht anders angegeben):

| Feld | Typ | Beschreibung |
|---|---|---|
| `distance` | Einheitswert (Distanz) | Mittlerer Orbitalabstand vom Ziel. Alternative zu `semiMajor`. |
| `semiMajor` | Einheitswert (Distanz) | Große Halbachse der Orbitellipse. |
| `eccentricity` | Zahl (0–1) | Exzentrizität des Orbits. 0 = kreisförmig. Kein Einheitssuffix. |
| `period` | Einheitswert (Dauer) | Umlaufzeit. |
| `angle` | Einheitswert (Winkel) | Argument des Periapsis oder Länge des aufsteigenden Knotens. |
| `inclination` | Einheitswert (Winkel) | Orbitalneigung relativ zur Referenzebene. |
| `phase` | Einheitswert (Winkel) | Anfangsphasenwinkel auf der Umlaufbahn. |

`distance` und `semiMajor` beziehen sich auf dasselbe physikalische Konzept und sollten nicht gleichzeitig für dasselbe Objekt angegeben werden.

### `at`

Das Objekt wird mit einem anderen Objekt kopositioniert oder an einem benannten Sonderpunkt platziert. Es werden drei Referenz-Notationen unterstützt:

**Named Reference** — genau an der Position eines anderen Objekts platziert:

```worldorbit
object structure Relay
  at NavBake
```

**Anchor Reference** — an einem benannten Ankerpunkt eines bestimmten Objekts platziert:

```worldorbit
object structure Außenposten
  at Station:dock-north
```

Die Notation ist `ObjektId:AnkerName`. Die Zielobjekt-ID muss im Dokument vorhanden sein. Der Ankername selbst wird syntaktisch, aber nicht semantisch validiert.

**Lagrange-Punkt — einfaches Primärobjekt:**

```worldorbit
object structure Trojaner
  at Naar:L4
```

Die Notation ist `PrimärId:Lx` wobei x zwischen 1 und 5 liegt.

**Lagrange-Punkt — Primär- und Sekundärkörper:**

```worldorbit
object structure Relay
  at Naar-Luna:L2
```

Die Notation ist `PrimärId-SekundärId:Lx`. Beide IDs müssen im Dokument vorhanden sein.

Verfügbare Lagrange-Punkte: `L1`, `L2`, `L3`, `L4`, `L5`.

> Nur `structure`- und `phenomenon`-Objekte unterstützen die `at`-Platzierung. Andere Objekttypen müssen `orbit`, `surface` oder `free` verwenden.

### `surface`

Das Objekt wird auf der Oberfläche eines anderen Objekts platziert. Der Wert ist die ID des Zielobjekts.

```worldorbit
object structure Außenposten
  surface Naar
```

Gültige surface-Ziele: `star`, `planet`, `moon`, `asteroid`, `comet`.

### `free`

Das Objekt wird frei positioniert, ohne eine starre Orbitalbeziehung. Der Wert ist entweder eine Distanz oder eine beschreibende Zeichenkette.

Distanzbasiert:

```worldorbit
object comet "K-2001 R1"
  free 200au
```

Deskriptorbasiert:

```worldorbit
object phenomenon "Ooort-Wolke"
  free "äußeres System"
```

---

## 4. Feld-Parameter und Datentypen

### Einheitswerte

Einheitswerte bestehen aus einem numerischen Literal (Ganzzahl oder Dezimalzahl mit `.`), gefolgt unmittelbar von einem Einheitssuffix ohne Leerzeichen:

```
1.18au   384400km   0.08   1y   28deg
```

| Suffix | Bedeutung | Einheitsfamilie |
|---|---|---|
| `au` | Astronomische Einheiten | Distanz |
| `km` | Kilometer | Distanz |
| `re` | Erdradien | Distanz / Radius |
| `sol` | Sonnenradien | Distanz / Radius / Masse |
| `me` | Erdmassen | Masse |
| `d` | Tage | Dauer |
| `y` | Jahre | Dauer |
| `h` | Stunden | Dauer |
| `deg` | Grad | Winkel |

Einheitswerte ohne Suffix werden akzeptiert (Einheit wird als `null` gespeichert).

### Feldreferenz

Die folgenden Tabellen listen alle Felder auf, die in `object`- und `system`-Körper-Deklarationen akzeptiert werden.

#### Platzierungs- und Orbital-Felder

| Feld | Werttyp | Modus | Anwendbar auf |
|---|---|---|---|
| `orbit` | Zeichenkette (Objekt-ID) | Setzt Orbit-Modus und Ziel | alle außer `system` |
| `at` | Zeichenkette (Referenz) | Setzt at-Modus und Referenz | `structure`, `phenomenon` |
| `surface` | Zeichenkette (Objekt-ID) | Setzt surface-Modus | `structure`, `phenomenon` |
| `free` | Zeichenkette oder Einheitswert | Setzt freie Platzierung | alle außer `system` |
| `distance` | Einheitswert (Distanz) | Orbitaldistanz | alle außer `system` |
| `semiMajor` | Einheitswert (Distanz) | Große Halbachse | alle außer `system` |
| `eccentricity` | Zahl | Orbitalexzentrizität | alle außer `system` |
| `period` | Einheitswert (Dauer) | Umlaufzeit | alle außer `system` |
| `angle` | Einheitswert (Winkel) | Orbitalwinkel | alle außer `system` |
| `inclination` | Einheitswert (Winkel) | Orbitalneigung | alle außer `system` |
| `phase` | Einheitswert (Winkel) | Anfangsphase | alle außer `system` |

#### Physikalische Eigenschaften

| Feld | Werttyp | Anwendbar auf |
|---|---|---|
| `radius` | Einheitswert (Radius) | alle außer `system` |
| `mass` | Einheitswert (Masse) | alle außer `system` |
| `density` | Einheitswert (generisch) | alle außer `system` |
| `gravity` | Einheitswert (generisch) | alle außer `system` |
| `temperature` | Einheitswert (generisch) | alle außer `system` |
| `albedo` | Zahl | alle außer `system` |
| `atmosphere` | Zeichenkette | `planet`, `moon`, `asteroid`, `comet`, `phenomenon` |
| `inner` | Einheitswert (Distanz) | `belt`, `ring`, `phenomenon` |
| `outer` | Einheitswert (Distanz) | `belt`, `ring`, `phenomenon` |
| `cycle` | Einheitswert (Dauer) | alle außer `system` |

#### Klassifizierung und Erscheinungsbild

| Feld | Werttyp | Beschreibung | Anwendbar auf |
|---|---|---|---|
| `kind` | Zeichenkette | Semantischer Subtyp (z.B. `relay`, `telescope`, `black-hole`) | alle außer `system` |
| `class` | Zeichenkette | Stellar- oder Planetenklasse (z.B. `G2V`, `gas-giant`) | alle außer `system` |
| `culture` | Zeichenkette | Kulturelle oder fraktionelle Zugehörigkeit | alle außer `system` |
| `tags` | Liste (leerzeichengetrennt) | Beliebige Tags für Filterung und Gruppierung | alle |
| `color` | Zeichenkette | Anzeigefarbe: Hex-Code (`#3fa8d0`) oder CSS-Keyword | alle |
| `image` | Zeichenkette | Bild-URL oder root-relativer Pfad für das Objektsymbol | `star`, `planet`, `moon`, `asteroid`, `comet`, `structure`, `phenomenon` |
| `hidden` | Boolean | Wenn `true`, wird das Objekt aus Renders ausgeblendet | alle |

Boolean-Werte: `true`, `false`, `yes`, `no`.

Das `image`-Feld akzeptiert:
- Relative Pfade: `assets/naar.png`
- Root-relative Pfade: `/images/planet.webp`
- HTTP/HTTPS-URLs: `https://example.com/img.png`

URL-Schemata außer `http` und `https` werden abgelehnt. Protokoll-relative URLs (`//…`) werden ebenfalls abgelehnt.

#### System-Metadaten-Felder (Schema 1.0)

Die folgenden Felder sind nur bei einem `system`-Objekt in Schema 1.0 gültig. In Schema 2.0 werden sie stattdessen über die Sektionen `defaults` und `system` ausgedrückt.

| Feld | Beschreibung |
|---|---|
| `title` | Lesbarer Anzeigename des Systems |
| `view` | Standard-Projektion (Legacy; in Schema 2.0 `defaults` verwenden) |
| `scale` | Skalierungs-Preset (Legacy) |
| `units` | Bevorzugte Anzeigeeinheit (Legacy) |

#### Narrative Felder

| Feld | Werttyp | Beschreibung | Anwendbar auf |
|---|---|---|---|
| `on` | Zeichenkette | Eine "befindet sich in"- oder "gehört zu"-Referenz (konzeptuelles Elternelement) | alle außer `system` |
| `source` | Zeichenkette | Quellangabe oder Attributionsverweis | alle außer `system` |

---

## 5. Das `info`-Konstrukt

Der `info`-Block speichert beliebige narrative Schlüssel-Wert-Paare ohne Schema-Prüfung. Er ist für Lore, Fraktionsdaten, beschreibende Texte und alle Metadaten gedacht, die nicht in ein typisiertes Feld passen.

Das Schlüsselwort `info` erscheint als eingerückte Zeile innerhalb eines Objektblocks. Alle Zeilen, die weiter eingerückt sind, werden als `Key Value`-Paare geparst, bis der Einrückungsgrad wieder zurückfällt.

```worldorbit
object structure "Goliath-Station"
  orbit Naar
  kind station
  info
    fraktion "Vereinte Erde Direktorat"
    bevoelkerung "ca. 42.000"
    status "Aktiv"
    gegründet "Jahr 218 nach dem Kollaps"
```

Regeln:
- Jede `info`-Zeile muss mindestens zwei Token haben: einen Schlüssel und einen Wert.
- Werte können mehrere Token umfassen und werden mit Leerzeichen zusammengefügt.
- Quoted Strings werden in Werten unterstützt.
- Doppelte Schlüssel innerhalb eines `info`-Blocks werden abgelehnt.
- Es gibt keine Schema-Validierung für info-Schlüssel.

---

## 6. Schema-2.0-Top-Level-Sektionen

Schema-2.0-Dokumente sind als Folge benannter Top-Level-Sektionen aufgebaut. Jede Sektion beginnt auf Einrückungsebene null und enthält eingerückte Felder.

Die erkannten Top-Level-Sektions-Schlüsselwörter sind:

| Schlüsselwort | Pflicht | Mehrfach erlaubt |
|---|---|---|
| `system` | Ja | Nein |
| `defaults` | Nein | Nein |
| `atlas` | Nein | Nein |
| `viewpoint` | Nein | Ja |
| `annotation` | Nein | Ja |
| `object` | Nein | Ja |

`system` muss vor `defaults`, `atlas`, `viewpoint` und `annotation` erscheinen.

---

### 6.1 `system`

Deklariert das Wurzelsystem und seinen Anzeigenamen.

```worldorbit
system Iyath
  title "Das Iyath-System"
```

| Feld | Typ | Beschreibung |
|---|---|---|
| `title` | Zeichenkette | Lesbarer Systemname, der im Viewer und im Atlas-Header angezeigt wird. |

Derzeit wird nur `title` als System-Feld akzeptiert. Alle anderen dokumentweiten Einstellungen gehen in `defaults` oder `atlas`.

---

### 6.2 `defaults`

Legt dokumentweite Render-Voreinstellungen fest, die angewendet werden, wenn kein spezifischerer `viewpoint` sie überschreibt.

```worldorbit
defaults
  view isometric
  scale presentation
  preset atlas-card
  theme atlas
```

| Feld | Erlaubte Werte | Standard | Beschreibung |
|---|---|---|---|
| `view` | `topdown`, `isometric` | `topdown` | Standard-Projektion beim Rendern der Szene. |
| `scale` | `compact`, `balanced`, `presentation` | — | Layout-Skalierungs-Preset: steuert das visuelle Verhältnis von Orbitabständen und Körperradien. |
| `units` | beliebige Zeichenkette | — | Bevorzugter Anzeigeeinheitssatz (informativ; kann von Renderern ausgewertet werden). |
| `preset` | `diagram`, `presentation`, `atlas-card`, `markdown` | — | Standard-Render-Preset, das das visuelle Layout und den Detailgrad steuert. |
| `theme` | beliebige Zeichenkette (`atlas`, `nightglass`, `ember`, …) | — | Visuelles Theme, das vom Viewer angewendet wird. |

Alle Felder sind optional. Nicht gesetzte Felder fallen auf Viewer-Defaults zurück.

---

### 6.3 `atlas`

Stellt systemweite Metadaten-Schlüssel-Wert-Paare bereit, die nicht an einzelne Objekte gebunden sind. Diese werden in Atlas-Header-Karten angezeigt und können von Tooling ausgelesen werden.

```worldorbit
atlas
  metadata
    author "Hanjo Teichert"
    version "1.4"
    sprache "de"
    lizenz "CC BY 4.0"
```

Die `atlas`-Sektion unterstützt einen einzelnen Unterblock `metadata`, dessen eingerückte Zeilen freie Schlüssel-Wert-Paare sind (ähnlich wie `info`). Doppelte Schlüssel werden abgelehnt.

---

### 6.4 `viewpoint`

Definiert eine benannte gespeicherte Ansicht des Systems: eine bestimmte Projektion, Zoom-Stufe, Rotation, Preset und optionalen Filter, den der Viewer auf Befehl laden kann.

Jeder `viewpoint` benötigt eine eindeutige ID:

```worldorbit
viewpoint uebersicht
  label "Gesamtsystemübersicht"
  summary "Zeigt alle Objekte von oben."
  projection isometric
  preset atlas-card
  zoom 1.0
  rotation 0

viewpoint inneres-system
  label "Inneres System"
  summary "Fokus auf die inneren Planeten."
  projection topdown
  focus Naar
  layers -background guides objects labels
  filter
    objecttypes star planet moon structure
    tags inneres-system
```

#### Viewpoint-Felder

| Feld | Typ | Beschreibung |
|---|---|---|
| `label` | Zeichenkette | Lesbarer Anzeigename dieses Viewpoints. |
| `summary` | Zeichenkette | Kurzbeschreibung, die in der Viewpoint-Auswahl angezeigt wird. |
| `projection` | `topdown`, `isometric` | Render-Projektion für diesen Viewpoint. Erbt von `defaults.view`, wenn nicht gesetzt. |
| `preset` | `diagram`, `presentation`, `atlas-card`, `markdown` | Render-Preset für diesen Viewpoint. Erbt von `defaults.preset`, wenn nicht gesetzt. |
| `focus` | Zeichenkette (Objekt-ID) | Zentriert die Ansicht auf dieses Objekt. |
| `select` | Zeichenkette (Objekt-ID) | Vorauswahl dieses Objekts (hebt es hervor und öffnet dessen Detailpanel). |
| `zoom` | positive Zahl | Anfangs-Zoom-Stufe. 1.0 = Fit-to-System. |
| `rotation` | Zahl | Anfangsrotation in Grad. |
| `layers` | Token-Liste | Legt fest, welche Szene-Layer sichtbar sind. Siehe Layer-Tokens unten. |
| `filter` | Unterblock | Schränkt ein, welche Objekte in diesem Viewpoint sichtbar sind. |

#### Layer-Tokens

Das `layers`-Feld akzeptiert eine leerzeichengetrennte Liste von Layer-Namen, optional mit `!`- oder `-`-Präfix zum Ausblenden:

| Token | Effekt |
|---|---|
| `background` | Hintergrundfüll-Layer |
| `guides` | Raster- / Hilfslinien |
| `orbits` | Alle Orbitringe (Kurzform für `orbits-back` + `orbits-front`) |
| `orbits-back` | Orbitbögen hinter Objekten (isometrische Rückhälfte) |
| `orbits-front` | Orbitbögen vor Objekten (isometrische Vorderhälfte) |
| `objects` | Objektsymbole und Körperformen |
| `labels` | Objektbeschriftungen |
| `metadata` | Overlay-Metadatenpanel |

Beispiele:
- `layers objects labels` — zeigt nur Objekte und Beschriftungen
- `layers -background guides objects labels` — blendet Hintergrund aus, zeigt Rest

#### `filter`-Unterblock-Felder

Der `filter`-Unterblock schränkt ein, welche Objekte angezeigt werden:

| Feld | Typ | Beschreibung |
|---|---|---|
| `query` | Zeichenkette | Freitext-Suchfilter, angewendet auf Objekt-IDs und Beschriftungen. |
| `objecttypes` | leerzeichengetrennte Liste | Beschränkt auf bestimmte Objekttypen (z.B. `star planet moon`). |
| `tags` | leerzeichengetrennte Liste | Zeigt nur Objekte, die alle diese Tags tragen. |
| `groups` | leerzeichengetrennte Liste | Zeigt nur Objekte, die zu den angegebenen Gruppen gehören (nach Gruppen-ID). |

---

### 6.5 `annotation`

Hängt eine Freitext-Notiz oder einen Lore-Eintrag an das Dokument oder ein bestimmtes Objekt. Annotationen werden im Atlas-Panel angezeigt und können nach Tag gefiltert werden.

```worldorbit
annotation naar-notizen
  label "Notizen zu Naar"
  target Naar
  body "Naar ist die Hauptbewohnte Welt des Iyath-Systems."
  tags lore bewohnt
```

| Feld | Typ | Beschreibung |
|---|---|---|
| `label` | Zeichenkette | Anzeigename der Annotation. Wird automatisch aus der ID generiert, wenn nicht gesetzt. |
| `target` | Zeichenkette (Objekt-ID) | Das Objekt, an das diese Annotation gehängt wird. Optional; weglassen für systemweite Notizen. |
| `body` | Zeichenkette | Der Haupttextinhalt der Annotation. |
| `tags` | leerzeichengetrennte Liste | Tags zur Filterung von Annotationen im Atlas-Panel. |

Annotations-IDs werden zu Kleinbuchstaben mit alphanumerischen Zeichen und Bindestrichen normalisiert. Doppelte IDs werden abgelehnt.

---

### 6.6 `object`

Deklariert ein orbitales Objekt. In Schema 2.0 ist das Schlüsselwort `object` als Sektionspräfix erforderlich, gefolgt vom Objekttyp und der ID.

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
  tags bewohnbar felsig
  atmosphere "stickstoff-sauerstoff"
  info
    bevoelkerung "2,1 Milliarden"
    regierung "Föderaler Senat"
```

Für die vollständige Feldreferenz siehe Abschnitte 3, 4 und 5.

---

## 7. Vollständiges Beispiel

```worldorbit
schema 2.0

system Iyath
  title "Das Iyath-System"

defaults
  view isometric
  preset atlas-card
  theme atlas

atlas
  metadata
    author "WorldOrbit-Projekt"
    version "1.0"

viewpoint uebersicht
  label "Gesamtsystem"
  summary "Das gesamte System in der Übersicht."
  projection isometric
  preset atlas-card

viewpoint innerer-fokus
  label "Inneres System"
  projection topdown
  focus Naar
  filter
    objecttypes star planet moon structure
    tags innen

annotation naar-notizen
  label "Naar – Übersicht"
  target Naar
  body "Bewohnte Heimatwelt des Enari-Volkes."
  tags lore bewohnt

object star Iyath
  radius 1.1sol
  color #ffe08c
  tags innen

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
  atmosphere "stickstoff-sauerstoff"
  image /assets/naar-karte.png
  color #4a9fbf
  tags innen bewohnbar felsig
  info
    bevoelkerung "2,1 Milliarden"
    regierung "Föderaler Senat"

object moon "Naar IV"
  orbit Naar
  distance 340000km
  radius 0.3re
  tags innen

object structure "Epsilon-Station"
  at Naar:L4
  kind station
  tags innen
  info
    fraktion "IDF-Flottenkommando"
    status "Aktiv"

object structure "Spiegelfeld"
  surface Naar
  kind installation
  info
    zweck "Atmosphärisches Reflektornetzwerk"

object belt "Äußeres Trümmerfeld"
  orbit Iyath
  inner 4.2au
  outer 6.8au
  tags aussen

object comet "HC-7"
  free 220au
  info
    entdeckung "Zyklus 218"
```