# Interactive WorldOrbit Embed

This page demonstrates an interactive WorldOrbit block that can be hydrated in the browser.

```worldorbit
system Iyath
  title "Iyath System"
  view topdown
  scale presentation

star Iyath
planet Naar orbit Iyath distance 1.18au
moon Leth orbit Naar distance 220000km
structure Relay kind relay at Naar:L4
structure OuterGate kind gate free 8.4au
```
