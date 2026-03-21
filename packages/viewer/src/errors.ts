export class WorldOrbitViewerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorldOrbitViewerError";
  }
}

export class WorldOrbit3DUnavailableError extends WorldOrbitViewerError {
  constructor(
    message = "WorldOrbit 3D is unavailable in this environment.",
  ) {
    super(message);
    this.name = "WorldOrbit3DUnavailableError";
  }
}
