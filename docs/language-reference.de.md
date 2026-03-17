**WorldOrbit DSL** (Domain Specific Language) (Schema 2.0).

Die WorldOrbit DSL ist speziell für das textbasierte "Worldbuilding" orbitaler Sternensysteme konzipiert. Sie beschreibt Objekte, ihre Eigenschaften und wie sie relativ zueinander platziert sind, um anschließend statisch oder interaktiv in 2D/3D gerendert zu werden. 

---

## 1. Syntax und Grundaufbau

Jedes valide WorldOrbit-Dokument sollte mit der Schema-Version beginnen:
```worldorbit
schema 2.0
```

### Syntax-Stile
Die DSL unterstützt drei Arten, Datenbereiche für ein Objekt zu deklarieren:

1. **Inline Short Form:** Parameter werden direkt hinter den Namen in derselben Zeile geschrieben.
   ```worldorbit
   object planet Naar orbit Iyath semiMajor 1.18au
   ```
2. **Indented Block Form:** Parameter werden unter dem Objekt deklariert, eingerückt (meist 2 Leerzeichen).
   ```worldorbit
   object planet Naar
     orbit Iyath
     semiMajor 1.18au
   ```
3. **Info-Block:** Beliebige Metadaten lassen sich übersichtlich innerhalb eines `info`-Blocks definieren.
   ```worldorbit
   object planet Naar
     info
       description "Heimatwelt der Enari."
       climate "Gemäßigt bis trocken"
   ```

*(Hinweis: Das Schlüsselwort `object` vor dem Typ ist optional, oft schreibt man einfach nur `planet Naar`).*

---

## 2. Unterstützte Objekttypen

Die DSL trennt konsequent zwischen der **Klasse** des Objekts und seiner **Positionierung**. Spezielle Beziehungen (wie "Binärsystem") ergeben sich rein durch die Positionierung.

* **`system`**: Das Wurzelelement für das gesamte Projekt (Es darf nur ein `system` pro Datei geben).
* **Himmelskörper:** `star`, `planet`, `moon`, `asteroid`, `comet`
* **Orbitale Formationen:** `belt`, `ring`
* **Künstliche/Besondere Objekte:** `structure` (z.B. Stationen, Relays), `phenomenon` (Anomalien, schwarze Löcher etc.)

Beispiel:
```worldorbit
system Iyath
star Iyath-Prime
structure Deep-Space-Relay
```

---

## 3. Platzierungs-Modi (Placement Modes)

Die wichtigste Eigenschaft fast aller Objekte außer dem `system` selbst ist, wie und wo sie platziert sind. Ein Objekt verlangt (maximal) einen dieser vier zueinander exklusiven Platzierungs-Parameter:

### A. `orbit`
Lässt das Objekt um ein anderes kreisen (Ziel-Objekt angeben).
* **Zusätzliche Parameter (alle optional, erfordern zumeist Einheiten):**
  * `distance` oder `semiMajor`: Distanz/Große Halbachse des Orbits.
  * `eccentricity`: Exzentrizität (numerischer Wert, keine Einheit).
  * `period`: Umlaufzeit.
  * `angle`, `inclination`, `phase`: Winkel, Neigung und Phase im Orbit.

### B. at (Lagrange- & Referenzpunkte)
Platziert das Objekt genau bei einem anderen Objekt oder an einem in der Bahn geteilten Lagrange-Punkt. 
* **Ziel-Notation:**
  * Einfaches Objekt: `at Deep-Space-Center` (ist im Grunde synonym zu "genau an dessen Position")
  * Einfacher Lagrange-Punkt: `at PlanetX:L4`
  * Detaillierter Lagrange-Punkt (Primär- & Sekundärkörper): `at PlanetX-MondY:L1`
* **Unterstützte Punkte:** `L1`, `L2`, `L3`, `L4`, `L5`

### C. `surface`
Platziert das Objekt auf der Oberfläche eines anderen Objekts.
* Wird in echten Rendern typischerweise sehr nah ans Eltern-Objekt herangerückt oder visuell verknüpft dargestellt. 
* **Syntax:** `surface PlanetName`

### D. `free`
Erlaubt eine freie, semantische oder grob abstandsbasierte Positionierung, typischerweise am Randbereich oder losgelöst vom dominierenden Stern/Zentrum.
* **Optionale Zusätze:** Kann eine genaue Distanz (z. B. `free 100au`) oder einen beschreibenden Text haben (`free "Oort Cloud"`).

---

## 4. Parameter & Datentypen

Abgesehen von der Platzierung können Eigenschaften (Properties) vergeben werden. Diese setzen sich aus unterschiedlichen Typ-Zuordnungen zusammen. 

### Erlaubte Einheiten (Units)
Wird ein Wert als "Unit Value" erwartet, setzt er sich aus einer Zahl (Ganzzahl oder Dezimal mit `.`) und einem Suffix zusammen:
* **Entfernung/Länge:** `au` (Astronomische Einheiten), `km`, `re` (Erdradius), `sol` (Sonnenradien)
* **Gewicht/Masse:** `me` (Erdmassen)
* **Zeit:** `d` (Tage), `y` (Jahre), `h` (Stunden)
* **Winkel:** `deg` (Grad)

### Alle Feld-Parameter (Field Keys)

**1. Platzierungs- & Orbital-Parameter (meist Unit Values oder Float):**
`orbit`, `at`, `surface`, `free`, `distance`, `semiMajor`, `eccentricity` (Zahl ohne Einheit), `period`, `angle`, `inclination`, `phase`.

**2. Physikalische Eigenschaften (Unit Values):**
* `radius`: Die Größe des Objekts.
* `mass`: Masse des Objekts.
* `density`: Dichte.
* `gravity`: Oberflächengravitation.
* `temperature`: Temperatur (Erwartet Einheit, meist unberücksichtigt oder fiktiv, aber Syntax-konform gebunden).
* `inner`, `outer`: Oft bei `ring` oder `belt` verwendet, um innere und äußere Radien festzulegen.
* `cycle`: Zyklen.

**3. Reguläre Zahlwerte (Number):**
* `albedo` (Rückstrahlvermögen)

**4. Boolean (Wahrheitswerte):**
* Erlaubte Werte: `true`, `false`, `yes`, `no`
* **Felder:** `hidden` (Blendet ein Objekt/Pfad fürs Rendern systematisch aus).

**5. Listen (Space-separated):**
* **Felder:** `tags` (Bsp: `tags gas-giant habitable-zone`)

**6. Klassifizierung & Text-Metadaten (Strings):**
Werte, die mehrere Wörter oder Zeichenketten zulassen (werden aus den Tokens zusammengesetzt).
* `kind`: Um einem generischen Objekt eine genauere Semantik zu geben (z.B. `structure kind relay`).
* `class`: Etwa Objektklassen (M-Class, Gasriese).
* `color`: Hex-Farbcodes oder CSS-Farben.
* `atmosphere`: Beschreibung der Atmosphäre (z. B. `nitrogen-oxygen`).
* `title`: Der lesbare Anzeigename im UI/Render.
* **Allgemeine Metadaten:** `view`, `scale`, `units`, `on`, `source` (oft innerhalb der `defaults` oder fürs `system` benutzt).

---

## 5. Das `info` Konstrukt

Alles, was als freier Text, Fließtext oder langes Story-Telling hinterlegt wird, gehört in einen `info`-Block. Er erlaubt pauschales Speichern von Key-Value-Paaren ohne harte Prüfung auf vordefinierte Namen.

**Beispiel:**
```worldorbit
object structure "Goliath Station"
  orbit Naar
  info
    faction "United Earth Directorate"
    population "approx 42,000"
    status "Operational"
```

## Komplettes Anwendungsbeispiel

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