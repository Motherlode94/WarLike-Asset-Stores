# WarLike Asset Stores

Independent static asset provider. The supported flow is **Store → WarLike Library → WarLike Engine**.

- The catalog, GLBs, images, audio and original licenses live in this repository and are served on the Store origin.
- Store buttons send real bytes to Library. Library validates SHA-256 and file signatures, stores resources, owns prefab configuration and sends files into Engine.
- Store never writes Engine's IndexedDB, prefab localStorage or project state.
- Preserve the compact search/filter bar, seven desktop columns and complete model thumbnails.

`npm test` checks the provider contract. `npm run build` builds a static `dist/` from this repository. No Engine checkout or runtime is required. A one-time bootstrap workflow records the historic licensed catalog's provenance in `assets/migration-receipt.json`; it is not a runtime dependency.

The origin is `https://warlike-asset-stores.pages.dev`; Library receives at `https://warlike-library.pages.dev/store-import.html`.

## WarLike Originals (8 actual GLB files)

The `assets/free/warlike-originals/` package contains eight original low-poly modular models with per-model GLB files, SVG preview illustrations, a JSON manifest, and a CC0 declaration. They are simple prototypes intended for simulation, RTS/FPS scenery, buildings and props, not animated high-fidelity characters. The binaries are committed to this repository and are served as assets, not fabricated catalog links.

## Extension shelf

`extensions.html` reads `extensions/catalog.json`, exposing downloadable ES modules and JSON resource templates for WarLike Engine, Studio, Node, Monteur and MISC. JSON presets can now be sent to their matching application using an origin-checked postMessage handshake and are installed in that application's browser localStorage. Installed presets can be enabled, disabled or removed in its `extensions.html` manager. Engine uses the animation-map preset for GLB clip matching, Studio uses mastering presets, Node loads validated graph-v2 templates, Monteur applies 720/1080p export profiles and MISC displays practice plans. These flows require a separate browser integration test after deployment. JavaScript extension modules remain **download-only** and are never remotely evaluated. Unsupported formats (for example Monteur 4K/H.264) do not become supported just by installing a JSON preset.

`npm test` includes tests that check GLB signatures, their embedded mesh/material definitions, thumbnails and extension files.
