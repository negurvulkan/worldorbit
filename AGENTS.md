# AGENTS.md

This file explains how coding agents should work on the WorldOrbit codebase.

The repository is in an early design and implementation phase. The priority is not speed or flashy output, but building a clean and extensible foundation for a Mermaid-like DSL for fictional stellar systems.

## Core Mission

WorldOrbit is a text-based DSL and parser pipeline for orbital worldbuilding.

The project should become:

- easy to author in Markdown
- easy to parse and validate
- easy to render later in 2D and 3D
- flexible enough for fictional systems, not only realistic astronomy

Agents working on this repository should preserve those goals.

## Product Positioning

Do not treat this as:

- a real-world astronomy toolkit
- a satellite tracker
- an astrophysics engine
- a Cytoscape-like generic graph tool

Treat it as:

- a worldbuilding-focused orbital description language
- a parser-first infrastructure project
- a future rendering pipeline for fictional stellar systems

## Priorities

When making implementation decisions, optimize in this order:

1. clarity of the DSL
2. stability of the normalized data model
3. maintainability of the parser
4. quality of validation and errors
5. rendering support

Do not optimize for visual rendering before the core language is stable.

## Current v0.1 Scope

The current scope is intentionally limited.

Supported object types:

- `system`
- `star`
- `planet`
- `moon`
- `belt`
- `asteroid`
- `comet`
- `ring`
- `structure`
- `phenomenon`

Supported placement modes:

- `orbit`
- `at`
- `surface`
- `free`

Supported syntax styles:

- inline short form
- indented block form
- optional `info` block

## Design Rules

### 1. Keep the DSL small

Avoid adding new top-level keywords unless they are clearly necessary.

Prefer:

- generic object types
- semantic refinement through fields like `kind`, `class`, and `tags`

Example:
Use `structure kind relay`, not a dedicated `relay` keyword.

### 2. Relationships come from placement, not edge types

Do not introduce special relationship object types such as `binary` or `multiple`.

Relationships should emerge from:

- `orbit`
- `at`
- `surface`
- `free`

This is a foundational design choice.

### 3. Preserve the distinction between syntax, AST, and normalized model

Never collapse all logic into a single parsing step.

Keep these layers separate:

- source text
- tokenizer output
- AST
- normalized document model
- validation
- rendering

This separation is important for maintainability and future tooling.

### 4. Renderer concerns must not leak into the parser

Do not add parser behavior that only exists to satisfy a specific renderer.

The parser should produce clean semantic structure.
Renderers should interpret that structure downstream.

### 5. Prefer explicit errors over silent recovery

If the input is structurally invalid, fail clearly.

Good error messages are more important than overly clever recovery behavior.

At minimum, errors should indicate:

- what failed
- where it failed
- what was expected

### 6. Keep extensibility in mind

The first version is intentionally small, but the code should not block likely future additions such as:

- additional object properties
- richer `info` semantics
- SVG rendering
- React or web integration
- style presets
- derived orbital visualization modes

Do not overbuild for those now, but do not paint the codebase into a corner.

## Current Implementation Expectations

Agents should help build and improve:

- tokenizer
- parser
- AST types
- normalization
- validation
- test coverage
- documentation

Renderer work is allowed only after the parser foundation is coherent.

## Coding Guidelines

### TypeScript

Use TypeScript throughout the core package.

Prefer:

- strict typing
- small pure functions
- explicit return types where useful
- readable data transformations

Avoid:

- overly clever generic abstractions
- premature class-heavy architectures
- hidden mutation across parser phases

### Parsing Style

The v0.1 parser should remain simple and understandable.

A hand-written parser is preferred over introducing a parser generator too early.

The language is intentionally small enough that a manual parser is the right starting point.

### Errors

Use project-specific error types rather than raw generic `Error` objects where practical.

Error messages should be readable by humans, not just useful for debugging internals.

### Validation

Validation should happen after normalization, not mixed chaotically into tokenization.

That means:

- parse syntax first
- normalize structure second
- validate semantic references third

### Tests

Add tests whenever you change parsing, normalization, or validation behavior.

At a minimum, test:

- happy-path parsing
- quoted strings
- `info` blocks
- placement modes
- invalid object types
- duplicate IDs
- invalid references
- malformed special positions such as broken Lagrange syntax

## Style Guidance for Features

When adding features, prefer general mechanisms over narrow one-off solutions.

Good:
- extending `structure` via `kind`
- extending metadata via `info`
- extending placement parsing in a consistent way

Bad:
- adding new top-level object types for every use case
- adding renderer-only hacks into normalized data
- creating special-case parsing branches that bypass the model

## Known Weak Spots in the Current Scaffold

Agents should be aware that the current scaffold still has rough edges.

Notable weak spots include:

- inline field parsing depends on a known field-key list
- duplicate fields currently overwrite earlier values
- `free` placement semantics are still minimal
- validation of special positions is basic
- unit parsing is intentionally simple
- no renderer exists yet

Improvements are welcome, but changes should remain aligned with the core design rules above.

## Recommended Next Tasks

Good next tasks for coding agents:

1. improve parse error quality with line and column precision
2. harden tokenization, especially around quotes
3. improve inline field parsing robustness
4. add comprehensive parser and validator tests
5. define a more explicit normalized schema for special positions
6. prepare the first minimal SVG renderer

## What to Avoid Right Now

Do not spend time on these before the parser core is stable:

- advanced 3D rendering
- animation systems
- editor UI
- real astrophysical simulation
- importing real astronomy data
- broad plugin systems
- excessive styling options

## Decision Heuristic

When in doubt, ask:

Does this make the DSL clearer?
Does this keep the normalized model cleaner?
Does this help future renderers without coupling to one?

If the answer is no, do not add it.

## Output Expectations for Agent Work

When implementing a change, prefer delivering:

- a concise explanation
- the exact files changed
- tests for the new behavior
- a note on tradeoffs or limitations

If a design choice is uncertain, say so directly instead of hiding ambiguity.

## Short Summary

Build WorldOrbit as a clean, text-first orbital DSL for fictional systems.

Protect the language design.
Protect the model layer.
Keep the parser understandable.
Do not over-specialize too early.