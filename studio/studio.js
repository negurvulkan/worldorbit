import { createWorldOrbitEditor } from "@worldorbit/editor";

const fallbackSource = `schema 2.0

system Iyath
  title "Iyath System"

defaults
  view isometric
  scale presentation
  preset atlas-card
  theme atlas

atlas
  metadata
    studio.mode "reference"

viewpoint overview
  label "Atlas Overview"
  summary "The full system with atlas labels."
  projection isometric

viewpoint naar
  label "Naar Orbit"
  summary "Close focus on the homeworld."
  focus Naar
  select Naar
  zoom 2.1
  rotation 10

annotation ember
  label "Mining Corridor"
  target Ember-Belt
  body "Industrial lanes cross the inner belt."
  tags industry salvage

object star Iyath
  class G2
  radius 1.08sol
  mass 1.02sol
  temperature 5840
  color #ffd36a

object planet Naar
  class terrestrial
  culture Enari
  image /demo/assets/naar-map.png
  orbit Iyath
  semiMajor 1.18au
  eccentricity 0.08
  angle 28deg
  inclination 24deg
  phase 42deg
  period 412d
  radius 1.06re
  temperature 289
  albedo 0.34
  atmosphere nitrogen-oxygen
  tags habitable homeworld atlas
  info
    description "Heimatwelt der Enari."

object moon Leth
  orbit Naar
  distance 220000km
  angle 34deg
  inclination 18deg
  phase 210deg
  period 18d
  radius 0.27re
  albedo 0.21

object belt Ember-Belt
  orbit Iyath
  semiMajor 2.7au
  eccentricity 0.16
  angle 14deg
  inclination 11deg
  phase 166deg
  inner 2.45au
  outer 2.95au

object structure Skyhook
  kind elevator
  surface Naar

object structure Relay
  kind relay
  at Naar:L4
`;

const root = document.querySelector("#studio");

const initialSource = await loadInitialSource();

createWorldOrbitEditor(root, {
  source: initialSource,
  showInspector: true,
  showTextPane: true,
  showPreview: true,
});

async function loadInitialSource() {
  try {
    const response = await fetch("../examples/iyath.schema2.worldorbit");
    if (!response.ok) {
      return fallbackSource;
    }

    return await response.text();
  } catch {
    return fallbackSource;
  }
}
