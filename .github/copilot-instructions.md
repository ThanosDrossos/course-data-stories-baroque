# NFDI4Culture Data Stories - Copilot Instructions

## Project Overview

This is an **MkDocs-based documentation site** for NFDI4Culture Data Stories, using the [Shmarql](https://github.com/epoz/shmarql) platform for interactive SPARQL query visualization. Data stories explore cultural heritage data through federated Knowledge Graph queries and **DuckDB WASM** for client-side analytical databases.

## Architecture

- **MkDocs site** with custom `nfdi4culture` theme, built via Docker
- **Shmarql integration** enables live SPARQL query execution and visualization
- **DuckDB WASM** for client-side analytical database queries (baroque ceiling paintings)
- **Content in `src/docs/`** with stories organized by NFDI4Culture entity IDs (e.g., `E6263`, `E6477`, `CbDD`)

## Adding a New Data Story

Follow these four steps (see [README.md](README.md) for full details):

1. **Create story directory**: `src/docs/story/<EntityID>/` containing `index.md` plus assets
2. **Register snippet path** in [src/mkdocs.yml](src/mkdocs.yml) under `pymdownx.snippets.base_path`
3. **Add to navigation** in [src/docs/.nav.yml](src/docs/.nav.yml) under `Stories:`
4. **Add accordion entry** in [src/docs/story/index.md](src/docs/story/index.md)

## Content Patterns

### Story Index Template (`index.md`)
```markdown
NFDI4Culture Data Story
{: .text-overline-m}

# Title

/// html | div[class='tile']
**Author:** [Name](https://orcid.org/...)  
**Persistent Identifier:** https://nfdi4culture.de/id/EXXXX  
**License:** [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)
///

**Abstract:** ...
{: .intro}
```

### SPARQL Queries
- Store queries as `.rq` files in story directory
- Include via snippets: `--8<-- "query-01.rq"`
- Use `language-sparql` for syntax highlighting, `language-shmarql` for live execution

### Fenced Code Blocks for Queries
```markdown
/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="query-01.rq"
--8<-- "query-01.rq"
```
///
```

### Visualizations with sgvizler2
For maps and charts, use `data-sgvizler-*` attributes in HTML divs (see [query-03.md](src/docs/story/E6263/query-03.md)).

---

## DuckDB WASM Integration (CbDD Story)

### Overview
The CbDD (Baroque Ceiling Paintings) story uses **DuckDB WASM** to load a pre-built analytical database (`baroque.duckdb`, ~16MB) directly in the browser. This enables interactive SQL queries, charts, maps, and tables without server-side processing.

### Database Schema

The `baroque.duckdb` database contains data from two sources:
- **CbDD** (Corpus der barocken Deckenmalerei in Deutschland) - 10 tables
- **Bildindex** (Historical art photograph collection) - 5 tables, prefixed with `bi_`

**CbDD Core Entity Tables:**
| Table | Rows | Primary Key | Description |
|-------|------|-------------|-------------|
| `paintings` | 4,594 | `nfdi_uri` | Ceiling paintings with metadata |
| `persons` | 2,831 | `person_id` (UUID) | Unique people (painters, commissioners, architects) |
| `buildings` | 1,260 | `building_id` (UUID) | Buildings where paintings are located |
| `rooms` | 2,376 | `room_id` | Rooms within buildings |
| `ensembles` | 32 | `ensemble_id` | Groups of related buildings |
| `subjects` | 4,082 | `subject_uri` | Iconographic subjects (ICONCLASS, Getty AAT) |

**CbDD Junction/Relationship Tables:**
| Table | Rows | Foreign Keys | Description |
|-------|------|--------------|-------------|
| `painting_persons` | 5,848 | `cbdd_painting_id` → paintings, `person_id` → persons | Links paintings to people with roles |
| `painting_subjects` | 17,474 | `cbdd_painting_id` → paintings, `subject_uri` → subjects | Links paintings to iconographic subjects |
| `building_persons` | 1,983 | `building_id` → buildings, `person_id` → persons | Links buildings to people with roles |
| `room_persons` | 4,676 | `room_id` → rooms, `person_id` → persons | Links rooms to people with roles |

**Bildindex Tables (prefixed with `bildindex_`):**
| Table | Rows | Primary Key | Description |
|-------|------|-------------|-------------|
| `bildindex_items` | 968 | `bildindex_uri` | Historical photographs/items |
| `bildindex_painters` | 753 | `bildindex_uri` + `painter_gnd` | Links items to painters via GND |
| `bildindex_buildings` | 215 | `bildindex_uri` + `building_gnd` | Links items to buildings via GND |
| `bildindex_subjects` | 964 | `bildindex_uri` + `iconclass_code` | Links items to iconographic subjects |
| `bildindex_gnd_overlaps` | 433 | `gnd_uri` | Pre-computed GND overlap (364 painters, 69 buildings) |

### Key Relationships

**Within CbDD:**
```
paintings.cbdd_painting_id ←→ painting_persons.cbdd_painting_id
paintings.cbdd_painting_id ←→ painting_subjects.cbdd_painting_id  
paintings.building_id ←→ buildings.building_id
paintings.room_id ←→ rooms.room_id
buildings.ensemble_id ←→ ensembles.ensemble_id
painting_persons.person_id ←→ persons.person_id
```

**Cross-Dataset (CbDD ↔ Bildindex) via GND:**

⚠️ **CRITICAL**: There is NO direct foreign key between CbDD and Bildindex! Connection happens through GND URIs:

- `paintings.creatorGnds` contains pipe-separated GND URIs (`gnd1|gnd2|gnd3`)
- `bi_painters.painter_gnd` contains single GND URIs
- Join requires `STRING_SPLIT` on pipe character

### Key Data Notes

- **Dates**: Pre-parsed into `year_start`, `year_end`, `year_is_approximate` columns
- **Painters column**: `paintings.painters` is a display string; use `painting_persons` for proper joins
- **person_id is NOT a GND**: The `persons` table uses UUIDs, not GND URIs. GNDs are in `paintings.creatorGnds`
- **No GND column in persons**: GNDs are attached to paintings, not person records directly
- **Pipe-separated GNDs**: Multiple painters stored as `https://d-nb.info/gnd/123|https://d-nb.info/gnd/456`
- **bi_gnd_overlaps**: Pre-computed helper showing which GNDs exist in BOTH datasets

### DuckDB WASM Setup Pattern
```javascript
// Initialize DuckDB WASM (in extra.js or story-specific JS)
import * as duckdb from '@duckdb/duckdb-wasm';

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
const worker = new Worker(bundle.mainWorker);
const logger = new duckdb.ConsoleLogger();
const db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

// Load the baroque.duckdb file
const response = await fetch('/story/CbDD/baroque.duckdb');
const buffer = await response.arrayBuffer();
await db.registerFileBuffer('baroque.duckdb', new Uint8Array(buffer));
const conn = await db.connect();
await conn.query("ATTACH 'baroque.duckdb' AS baroque");
```

### Interactive Query Pattern (HTML)
```html
<div class="duckdb-query" data-query="SELECT * FROM paintings LIMIT 10">
  <button class="run-query">Run Query</button>
  <div class="query-result"></div>
</div>
```

### Visualization Libraries
- **Plotly.js** (already included): Charts, timelines, histograms
- **Leaflet** (already included): Geographic maps with markers
- **DataTables** (already included): Interactive sortable tables

### Example Queries for CbDD Story

```sql
-- Paintings by German state
SELECT location_state, COUNT(*) as count 
FROM paintings GROUP BY location_state ORDER BY count DESC;

-- Temporal distribution by decade
SELECT FLOOR(year_start/10)*10 as decade, COUNT(*) as count
FROM paintings WHERE year_start BETWEEN 1500 AND 1900
GROUP BY decade ORDER BY decade;

-- Top painters by painting count
SELECT pp.person_name, COUNT(*) as paintings
FROM painting_persons pp WHERE pp.role = 'PAINTER'
GROUP BY pp.person_name ORDER BY paintings DESC LIMIT 20;

-- Cross-dataset: painters with Bildindex photos
SELECT DISTINCT pp.person_name, COUNT(DISTINCT bp.bildindex_uri) as photos
FROM painting_persons pp
JOIN paintings p ON pp.nfdi_uri = p.nfdi_uri
JOIN bi_painters bp ON TRIM(STRING_SPLIT(p.creatorGnds, '|')) = bp.painter_gnd
GROUP BY pp.person_name ORDER BY photos DESC;
```

### File Structure for DuckDB Stories
```
src/docs/story/CbDD/
├── index.md              # Main story with embedded visualizations
├── baroque.duckdb        # Pre-built analytical database (~16MB)
├── js/
│   └── baroque-queries.js  # Story-specific query functions
└── images/               # Static images for the story
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/mkdocs.yml` | Site config, plugins, snippet paths |
| `src/docs/.nav.yml` | Navigation structure |
| `src/docs/story/index.md` | Story listing with accordions |
| `src/docs/overrides/assets/javascripts/extra.js` | SPARQL execution, DataTables, DuckDB init |
| `src/docs/overrides/assets/vendor/` | Plotly, Leaflet, sgvizler2 libraries |
| `src/docs/story/CbDD/baroque.duckdb` | Pre-built DuckDB database for baroque story |

## Development Workflow

```bash
# Start development server (hot-reload enabled via WATCH_DOCS=1)
docker compose up -d

# Access at http://localhost:7014

# Rebuild after mkdocs.yml changes
docker compose up -d --build
```

## SPARQL Query Conventions

- Use standard prefixes: `schema:`, `rdf:`, `rdfs:`, `cto:`, `nfdicore:`, `wd:`
- Default endpoint: `https://nfdi4culture.de/sparql`
- Federated queries via `SERVICE <endpoint>` clauses
- Common external endpoints: `https://lod.academy/...`, Wikidata

## PyMdown Extensions Used

- `pymdownx.blocks.details` - Collapsible sections (`/// details |`)
- `pymdownx.snippets` - File inclusion (`--8<-- "file"`)
- `pymdownx.blocks.caption` - Image captions (`/// caption`)
- `shmarql` - Live SPARQL execution
