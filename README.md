# WarLike Asset Stores

Independent static asset provider. The supported flow is **Store → WarLike Library → WarLike Engine**.

- The catalog, GLBs, images, audio and original licenses live in this repository and are served on the Store origin.
- Store buttons send real bytes to Library. Library validates SHA-256 and file signatures, stores resources, owns prefab configuration and sends files into Engine.
- Store never writes Engine's IndexedDB, prefab localStorage or project state.
- Preserve the compact search/filter bar, five desktop columns and complete model thumbnails.

`npm test` checks the provider contract. `npm run build` builds a static `dist/` from this repository. No Engine checkout or runtime is required. A one-time bootstrap workflow records the historic licensed catalog's provenance in `assets/migration-receipt.json`; it is not a runtime dependency.

The origin is `https://warlike-asset-stores.pages.dev`; Library receives at `https://warlike-library.pages.dev/store-import.html`.
