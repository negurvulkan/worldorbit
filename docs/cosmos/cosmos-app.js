import { createWorldOrbitCosmosEditor } from "@worldorbit-cosmos/editor";

export async function createWorldOrbitCosmosStudio(root, options = {}) {
  if (!(root instanceof HTMLElement)) {
    return null;
  }

  const source = options.exampleUrl
    ? await fetch(options.exampleUrl).then((response) => response.text())
    : `schema 4.0

universe Demo
  galaxy First
    system Sol
      defaults
        view topdown

      object star Sun
      object planet Earth
        orbit Sun
        semiMajor 1au`;

  return createWorldOrbitCosmosEditor(root, {
    source,
    width: 1120,
    height: 720,
  });
}
