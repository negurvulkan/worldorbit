# Static WorldOrbit Embed

This page demonstrates a build-time static SVG diagram.

```worldorbit
system Iyath
  title "Iyath System"
  view topdown

star Iyath
planet Naar orbit Iyath distance 1.18au image /demo/assets/naar-map.png
moon Leth orbit Naar distance 220000km
structure Skyhook kind elevator surface Naar
```
