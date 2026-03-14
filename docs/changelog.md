# Changelog

## v1.0.0

- split the project into `@worldorbit/core`, `@worldorbit/viewer`, and `@worldorbit/markdown`
- promoted the normalized document model to schema version `1.0`
- moved SVG rendering to the viewer package and kept scene generation in core
- added theme presets, layer controls, embed payload helpers, and hydration support
- added build-time Markdown integration through Remark and Rehype plugins
- added canonical formatting with `formatDocument(...)`
- tightened semantic validation for field compatibility, units, anchors, surface targets, and special positions
- refreshed the browser demo, examples, migration notes, and test coverage
