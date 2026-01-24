# Data Stories: NFDI4Culture Knowledge Graph

Welcome to the Data Stories collection exploring cultural heritage data through the NFDI4Culture Knowledge Graph.

## Featured Data Story

### [Baroque Ceiling Paintings in Germany](baroque-paintings/index.md)

Explore the **Corpus of Baroque Ceiling Painting in Germany (CbDD)** — over 5,800 ceiling paintings spanning 350 years of German art history.

- 🖼️ **[Explore Paintings](baroque-paintings/paintings.md)** — Filter by year, location, subjects
- 🎨 **[Painters & Collaborators](baroque-paintings/painters.md)** — Artist networks and famous families
- 🏛️ **[Buildings & Geography](baroque-paintings/buildings.md)** — Churches, palaces, and maps
- 📚 **[Iconographic Subjects](baroque-paintings/subjects.md)** — ICONCLASS themes and meanings

---

## Sample SPARQL Query

```sparql linenums="1" title="List of Research Data Portals"
PREFIX fabio: <http://purl.org/spar/fabio/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX nfdicore: <https://nfdi.fiz-karlsruhe.de/ontology/>
PREFIX n4c: <https://nfdi4culture.de/id/>

SELECT (SAMPLE(?resource) AS ?entity) (SAMPLE(?label) AS ?name)
WHERE {
    ?resource rdf:type nfdicore:DataPortal,
      				fabio:Database .
    ?resource rdfs:label ?label .
}
GROUP BY ?resource
ORDER BY ?name
```
