# Static WorldOrbit Embed

This page demonstrates a build-time static SVG diagram.

```worldorbit
system Iyath
  title "Iyath System"
  view isometric

star Iyath
  temperature 5840
planet Naar
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  image /demo/assets/naar-map.png
  atmosphere nitrogen-oxygen
moon Leth orbit Naar distance 220000km angle 18deg inclination 12deg
structure Skyhook kind elevator surface Naar
```
