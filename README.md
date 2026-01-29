# NFDI4Culture Data Stories

This repository contains the NFDI4Culture Data Stories site built on top of Shmarql and MkDocs. The project is configured to serve interactive data stories (SPARQL + client-side DuckDB WASM) via a Dockerized Shmarql instance.

Quick start
1. Clone the repository:

```bash
git clone https://github.com/ThanosDrossos/course-data-stories-baroque.git
cd course-data-stories-baroque
```

2. Build:

```bash
docker compose up -d
```

3. Open the site in your browser:

http://localhost:7014

Important: after you change any files under `src/` (Markdown, JS, CSS, mkdocs config), re-run:

```bash
docker compose up -d --build
```
This rebuilds the image and reloads the site so your edits are picked up.

Repository layout (key locations)
- `src/mkdocs.yml` - site configuration and `extra_javascript` / `extra_css` entries.
- `src/docs/` - MkDocs content for the site.
    - `src/docs/story/` - data story content (each story in its own subfolder, e.g. `CbDD`, `E6263`, `E6477`).
    - `src/docs/story/CbDD/baroque.duckdb` - pre-built DuckDB analytical database used by the CbDD story.
    - `src/docs/story/CbDD/index.md` - the interactive CbDD story (uses DuckDB WASM + visualisations).

- `src/docs/overrides/assets/` - site static assets
    - `javascripts/` - custom JS (e.g. `duckdb-wasm-loader.js`, `baroque-viz.js`, `extra.js`, `local_test_buildings_map.html`)
    - `vendor/` - third-party JS/CSS (Plotly, Leaflet, sgvizler2)
    - `stylesheets/` - custom CSS (`extra.css`)

How to add a new data story
1. Create a new folder under `src/docs/story/` named for the story (e.g. `E1234`).
2. Add an `index.md` with the story content and any `*.rq` SPARQL snippets or assets.
3. Add the story folder to `pymdownx.snippets.base_path` in `src/mkdocs.yml` if you use snippets from that folder.
4. Add the new story entry to `src/docs/.nav.yml` to include it in navigation.
5. Optionally add an accordion entry to `src/docs/story/index.md`.

Where to look for code
- Visualization and query helpers: `src/docs/overrides/assets/javascripts/baroque-viz.js`
- DuckDB WASM initialization and loader: `src/docs/overrides/assets/javascripts/duckdb-wasm-loader.js`
- Site-specific JS and DataTables helpers: `src/docs/overrides/assets/javascripts/extra.js`
- Vendor libraries: `src/docs/overrides/assets/vendor/` (Plotly, Leaflet, sgvizler2)