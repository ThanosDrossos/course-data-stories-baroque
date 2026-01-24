# Copilot Instructions for NFDI4Culture Data Stories

## Project Overview

This is a **Data Stories** course project using the SHMARQL platform to create interactive semantic web narratives. Stories are written in Markdown with embedded SPARQL queries that execute live against the NFDI4Culture knowledge graph.

## Architecture

- **SHMARQL Container**: Docker-based service serving Markdown stories with live SPARQL execution
- **SPARQL Endpoint**: `https://datastoriesnfdi4c.ise.fiz-karlsruhe.de/sparql` (NFDI4Culture knowledge graph)
- **Content Directory**: `stories/` - Markdown files mounted into the container
- **Navigation**: `navigation.yml` - defines sidebar structure and story hierarchy
- **Graph Data**: `graphData.json` - CbDD pre-exported graph for static enrichment (painters, commissioners, buildings)

## Developer Workflow

```bash
# Start the development server (hot-reload enabled via WATCH_DOCS=1)
docker compose up -d

# View stories at: http://localhost:7015/course/
# Access SPARQL explorer at: http://localhost:7015/shmarql
```

## Writing Data Stories

### File Structure
- Place story Markdown files in `stories/`
- Update `navigation.yml` to add stories to the sidebar
- Use nested directories for story organization (e.g., `baroque-paintings/index.md`)

### SPARQL Query Syntax

**Visible query (shows code + results):**
~~~markdown
```sparql linenums="1" title="Query Title"
PREFIX nfdicore: <https://nfdi.fiz-karlsruhe.de/ontology/>
SELECT ?entity ?name WHERE { ... }
```
~~~

**Hidden query (shows only results):**
~~~markdown
```shmarql
SELECT * WHERE { ?s ?p ?o } LIMIT 10
```
~~~

### Chart Visualizations (Plotly)

**Bar Chart:**
~~~markdown
```sparql title="Chart Title"
# shmarql-view: barchart
# shmarql-x: columnName
# shmarql-y: countColumn
# shmarql-label: Display Label

SELECT ?columnName (COUNT(*) AS ?countColumn) WHERE { ... }
```
~~~

**Map Chart:**
~~~markdown
```sparql title="Map Title"
# shmarql-view: mapchart
# shmarql-zoom: 6
# shmarql-lat: 49.5
# shmarql-lon: 10.5

SELECT ?item ?label ?geo WHERE {
  ... 
  BIND(CONCAT("Point(", STR(?lon), " ", STR(?lat), ")") AS ?geo)
}
```
~~~

### Federated Queries

Query external SPARQL endpoints using SERVICE blocks:
```sparql
SERVICE <https://iconclass.org/sparql> {
  ?uri skos:prefLabel ?label .
  FILTER(LANG(?label) = "en")
}

SERVICE <http://vocab.getty.edu/sparql> {
  ?uri gvp:prefLabelGVP/xl:literalForm ?label .
}
```

### Common Prefixes
```sparql
PREFIX nfdicore: <https://nfdi.fiz-karlsruhe.de/ontology/>
PREFIX n4c: <https://nfdi4culture.de/id/>
PREFIX schema:  <http://schema.org/>
PREFIX fabio: <http://purl.org/spar/fabio/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
```

### Key CTO/NFDI Ontology Properties

| Code | Label | Usage |
|------|-------|-------|
| `CTO_0001073` | Creation date | Year of painting |
| `CTO_0001026` | External classifier | ICONCLASS/AAT subjects |
| `CTO_0001021` | Image URL | Painting images |
| `CTO_0001019` | Is part of | Hierarchy (painting→room→building) |
| `CTO_0001009` | Has related person | GND person URIs |

## Data Sources

### NFDI4Culture Knowledge Graph (SPARQL)
- Title, year, coordinates, image, subjects
- CbDD Feed: `n4c:E6077`

### CbDD Graph (graphData.json - Static)
- Painters, commissioners (direct names)
- Room → Building hierarchy
- Building function, location state
- Technique/method

## Navigation Configuration

Edit `navigation.yml`:
```yaml
nav:
  - index.md
  - Baroque Ceiling Paintings:
      - baroque-paintings/index.md
      - Explore Paintings: baroque-paintings/paintings.md
  - SPARQL Exploration: "/shmarql"
```

## Key References

- [NFDI4Culture Datastories Source](https://gitlab.rlp.net/adwmainz/nfdi4culture/knowledge-graph/shmarql/datastories)
- [ICONCLASS](https://iconclass.org/) - Iconographic classification
- [Getty AAT](http://vocab.getty.edu/) - Art & Architecture Thesaurus
