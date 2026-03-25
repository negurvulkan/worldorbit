# WorldOrbit for Obsidian

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-gold?style=for-the-badge" alt="Version 1.0.0">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License MIT">
  <img src="https://img.shields.io/badge/Obsidian-v1.5.0+-purple?style=for-the-badge&logo=obsidian" alt="Obsidian v1.5.0+">
</p>

---

Treat your Obsidian Vault as a stellar atlas. WorldOrbit provides a text-first DSL (Domain Specific Language) to render fictional star systems, orbital mechanics, and space infrastructure directly inside your notes.

See the **Examples** section below for a quick start, or the [full reference](https://github.com/negurvulkan/worldorbit) for all the details.

## Examples

Render a basic star system with a star and a planet:

Code-Snippet

```
schema 2.6
system Sol

object star Sun
  radius 695700km

object planet Earth
  orbit Sun
  semiMajor 1au
  color #6fa8ff
```

  
*.*
<p align="center">
  <img src="https://negurvulkan.github.io/worldorbit/obsidian_scsh_1.png" width="700" alt="WorldOrbit Simple System Preview">
  <br>
  <em>WorldOrbit Simple System Preview</em>
</p>

Visualize complex orbital hierarchies including moons and rings:

Code-Snippet

```
schema 2.6
system Sol

object star Sun
  radius 695700km

object planet Earth
  orbit Sun
  semiMajor 1au
  color #6fa8ff

object planet Saturn
  orbit Sun
  semiMajor 9.58au

object ring Saturn-Rings
  orbit Saturn
  inner 67000km
  outer 140000km

object moon Titan
  orbit Saturn
  distance 1221870km
```


<p align="center">
  <img src="https://negurvulkan.github.io/worldorbit/obsidian_scsh_2.png" width="700" alt="WorldOrbit Advanced System Preview">
  <br>
  <em>WorldOrbit Advanced System</em>
</p>

## Usage

WorldOrbit consists of two major aspects: **Data (DSL)** and **Visualizing**.

### Data

WorldOrbit generates diagrams from fenced code blocks using the `.ks` (KeplerScript) syntax. It is designed for fictional worldbuilding, focusing on readability and logic rather than strict astrophysical simulation.

- **Objects**: Define stars, planets, moons, or space stations.
- **Placement**: Use `orbit`, `at` (for Lagrange points or anchors), or `surface` to position objects.
- **Physical Traits**: Assign `mass`, `radius`, `color`, and `atmosphere` to enrich the simulation.

### Visualizing

Once you've defined your system, the plugin renders it using three modes:

1. **Reading View & Live Preview**: Automatically turns code blocks into interactive 2D diagrams.
2. **Lazy Loading**: Previews are only rendered when they become visible, keeping your Obsidian vault fast and responsive.
3. **Locked Mode**: By default, diagrams are locked to allow safe scrolling. Click "Activate Interaction" to enable pan and zoom.

## Features

- **2D Interactive Viewer**: Pan, zoom, and explore your systems.
- **Diagnostics**: Real-time validation of your orbital data. If a planet's period doesn't match its mass (Kepler's Laws), the plugin will tell you.
- **Command Palette**: Use `WorldOrbit: Insert Solar System Example` to quickly bootstrap a new system.
- **Fullscreen Mode**: Open any diagram in a high-resolution modal view for detailed inspection.

## Installation

### Community Plugin

Search for **WorldOrbit** in the Obsidian Community Plugins settings and click Install. (Note: Submission pending).

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/negurvulkan/worldorbit/releases).
2. Create a folder `.obsidian/plugins/worldorbit` in your vault.
3. Move the files into that folder and enable the plugin in Obsidian.

## Contributing

Contributions via bug reports, documentation, and improvements are welcome.

### Local Development

The codebase is part of a TypeScript monorepo. To set up locally:

Bash

```
git clone https://github.com/negurvulkan/worldorbit.git
cd worldorbit
npm install
npm run build
```

## License

Licensed under the **MIT License**.

![NPM Version](https://img.shields.io/npm/v/worldorbit?style=flat-square&color=cb3837&logo=npm)
![Downloads](https://img.shields.io/npm/dm/worldorbit?style=flat-square&color=blue)
![GitHub stars](https://img.shields.io/github/stars/negurvulkan/worldorbit?style=flat-square&color=gold)
