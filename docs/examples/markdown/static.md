# Static WorldOrbit Embed

This page demonstrates a build-time static SVG diagram.

```worldorbit
schema 2.1

system Iyath
  title "Iyath System"
  epoch "JY-0001.0"
  referencePlane ecliptic

defaults
  view isometric
  preset markdown

group inner-system
  label "Inner System"
  color #d9b37a

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

object moon Leth
  orbit Naar
  distance 220000km
  angle 18deg
  inclination 12deg
  groups inner-system

object structure Skyhook
  kind elevator
  surface Naar
  groups inner-system
```
