# Interactive WorldOrbit Embed

This page demonstrates an interactive WorldOrbit block that can be hydrated in the browser.

```worldorbit
system Iyath
  title "Iyath System"
  view isometric
  scale presentation

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
ring Dawn-Ring orbit Naar distance 185000km inner 120000km outer 190000km
structure Relay kind relay at Naar:L4
structure OuterGate kind gate free 8.4au
```
