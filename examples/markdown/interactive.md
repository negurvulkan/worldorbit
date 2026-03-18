# Interactive WorldOrbit Embed

This page demonstrates an interactive WorldOrbit block that can be hydrated in the browser.

```worldorbit
schema 2.1

system Iyath
  title "Iyath System"
  epoch "JY-0001.0"
  referencePlane ecliptic

defaults
  view isometric
  scale presentation
  preset atlas-card

group inner-system
  label "Inner System"
  summary "Naar and nearby infrastructure"
  color #d9b37a

viewpoint overview
  label "Atlas Overview"
  summary "Focus the full system."
  projection isometric

relation supply-route
  from Skyhook
  to Relay
  kind logistics
  label "Supply Route"

object star Iyath
  mass 1.02sol
  temperature 5840

object planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  groups inner-system
  image /demo/assets/naar-map.png
  atmosphere nitrogen-oxygen

  climate
    meanSurfaceTemperature 289K

object moon Leth
  orbit Naar
  distance 220000km
  angle 18deg
  inclination 12deg
  groups inner-system

object ring Dawn-Ring
  orbit Naar
  distance 185000km
  inner 120000km
  outer 190000km
  groups inner-system

object structure Relay
  kind relay
  at Naar:L4
  groups inner-system

object structure Skyhook
  kind elevator
  surface Naar
  groups inner-system
```
