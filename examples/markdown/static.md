# Static WorldOrbit Embed

This page demonstrates a build-time static SVG diagram.

```worldorbit
schema 2.0

system Iyath
  title "Iyath System"

defaults
  view isometric
  preset markdown

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

object structure Skyhook
  kind elevator
  surface Naar
```
