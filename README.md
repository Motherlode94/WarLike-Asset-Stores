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

## WarLike Genre Starter — 176 assets 2D/3D générés au build

Le script `scripts/generate-genre-models.mjs` produit **88 modèles GLB autonomes** et **88 sprites PNG transparents de 64×64 pixels** sous `assets/free/warlike-genre-packs/`. Les GLB contiennent de vrais maillages, normales et matériaux PBR simples ; le catalogue est alimenté par les manifestes générés `models.json` et `sprites.json`. Le build copie les fichiers générés vers `dist/assets/free/` avant le déploiement Cloudflare.

Onze genres couverts : guerre moderne, stratégie, simulation/restauration, horreur, survie, RPG, arcade, course, science-fiction, agriculture/construction et enquête. Chaque genre comprend huit éléments statiques ; les previews SVG des GLB sont schématiques, pas des captures de leurs meshes. **Ce sont des prototypes stylisés low-poly et des sprites procéduraux simples**, pas des personnages riggés, des animations, des textures AAA ni des objets dotés de gameplay. Leur licence est CC0-1.0, leur auteur est WarLike Originals, et les fichiers sont créés localement sans dépendance réseau.

Pour reproduire le catalogue : `npm test` puis `npm run build`. Les fichiers produits sont des ressources réelles téléchargeables que Library peut recevoir via les transferts déjà existants ; l'intégration et la jouabilité dans Engine restent à valider séparément.

## WarLike Gaia — Terrain Studio (prototype 0.1)

`terrain-generator.html` est un outil **indépendant, fonctionnel dans le navigateur** et visible depuis le rayon Extensions. Le module ES local `extensions/warlike-gaia.js` génère des reliefs reproductibles à partir d'une graine, avec 8 biomes (forêt, plaines, montagnes, îles, désert, canyon, toundra, marécage), grille 17–257 points, niveau d'eau, et coordonnées de placement d'arbres et rochers.

Les trois exports contiennent des **données réelles** : `.glb` = maillage 3D triangulé avec normales, couleurs de vertex et métadonnées du monde ; `.png` = heightmap 8 bits ; `.json` = configuration et liste d'instances proposées, sans exécution de scripts. Génération locale et déterministe, sans dépendance à un service tiers.

**Limites connues :** la vue est une carte du dessus 2D ; le terrain exporté n'est pas encore un composant Terrain natif de WarLike Engine. Les arbres et rochers ne sont pas inclus dans le GLB et les placements JSON ne sont pas automatiquement interprétés par Engine. L'eau est un niveau numérique de référence, sans maillage ni physique. Pas d'érosion, de peinture manuelle, de streaming ou de sauvegarde de sessions d'édition dans ce prototype. L'utilisateur importe manuellement le GLB comme asset 3D dans Library ou Engine ; collisions et matériaux doivent être vérifiés dans Engine.
