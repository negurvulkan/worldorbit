import { createWorldOrbitCosmosStudio } from "./cosmos-app.js";

const root = document.querySelector("#cosmos-studio");

await createWorldOrbitCosmosStudio(root, {
  exampleUrl: root?.dataset.exampleUrl,
});
