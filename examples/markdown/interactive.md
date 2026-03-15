# Interactive WorldOrbit Embed

This page demonstrates an interactive WorldOrbit block that can be hydrated in the browser.

```worldorbit
schema 2.0

system Iyath
  title "Iyath System"

defaults
  view isometric
  scale presentation
  preset atlas-card

viewpoint overview
  label "Atlas Overview"
  summary "Focus the full system."
  projection isometric

object star Iyath
  temperature 5840

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  image /demo/assets/naar-map.png
  atmosphere nitrogen-oxygen

object moon Leth
  orbit Naar
  distance 220000km
  angle 18deg
  inclination 12deg

object ring Dawn-Ring
  orbit Naar
  distance 185000km
  inner 120000km
  outer 190000km

object structure Relay
  kind relay
  at Naar:L4

object structure OuterGate
  kind gate
  free 8.4au
```
