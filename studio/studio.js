import { createWorldOrbitStudio } from "./studio-app.js";

const root = document.querySelector("#studio");

await createWorldOrbitStudio(root, {
  exampleUrl: root?.dataset.exampleUrl,
});
