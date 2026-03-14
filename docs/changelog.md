# Changelog

## v1.1.1

- added PNG-style object textures through the `image` field for supported object types
- carried texture references from `@worldorbit/core` scenes into `@worldorbit/viewer` SVG output and interactive exports
- updated the browser demo, Markdown examples, and release docs with a checked-in sample planet texture
- expanded parser, renderer, viewer, and Markdown test coverage around textured objects

## v1.0.0

- split the project into `@worldorbit/core`, `@worldorbit/viewer`, and `@worldorbit/markdown`
- promoted the normalized document model to schema version `1.0`
- moved SVG rendering to the viewer package and kept scene generation in core
- added theme presets, layer controls, embed payload helpers, and hydration support
- added build-time Markdown integration through Remark and Rehype plugins
- added canonical formatting with `formatDocument(...)`
- added `image` textures for supported object types across scenes, SVG output, viewer export, and Markdown embeds
- tightened semantic validation for field compatibility, units, anchors, surface targets, and special positions
- refreshed the browser demo, examples, migration notes, and test coverage
