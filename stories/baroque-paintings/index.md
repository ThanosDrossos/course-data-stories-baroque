NFDI4Culture Data Story
{: .text-overline-m}

# Exploring Baroque Ceiling Paintings in Germany

## Analysing the Corpus of Baroque Ceiling Painting in Germany (CbDD) through the NFDI4Culture Knowledge Graph

/// html | div[class='tile']
**Author:** NFDI4Culture Data Stories Course  
**Date:** 2026-01-20  
**License:** [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)
///

[![Baroque Ceiling Painting](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Asam_Weltenburg_ceiling_fresco.jpg/1280px-Asam_Weltenburg_ceiling_fresco.jpg)](https://commons.wikimedia.org/wiki/File:Asam_Weltenburg_ceiling_fresco.jpg)

/// caption
Ceiling fresco "Triumph of St. Benedict" by Cosmas Damian Asam at Weltenburg Abbey (c. 1718-1721), [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Asam_Weltenburg_ceiling_fresco.jpg), Public Domain
///

**Abstract:** This data story explores the **Corpus of Baroque Ceiling Painting in Germany (CbDD)** through the NFDI4Culture Knowledge Graph. The CbDD documents over 5,800 ceiling paintings spanning 350 years of German art history, from the early Baroque period through the Rococo era. Baroque ceiling painting represents one of the most spectacular achievements of European visual culture. German churches, palaces, and monasteries contain extraordinary examples of illusionistic fresco painting, with Bavaria being the center of this artistic tradition. This exploration demonstrates how **SPARQL queries** can be used to analyze cultural heritage data, reveal patterns in artistic production across time and geography, and connect iconographic subjects to their classifications in external vocabularies like **ICONCLASS** and **Getty AAT**.
{: .intro}

---

## Research Questions

This Data Story addresses the following questions through SPARQL queries:

1. **How many paintings** are documented in the CbDD, and how does this compare to other NFDI4Culture portals?
2. **What is the temporal distribution** of ceiling paintings across the Baroque and Rococo periods?
3. **Where are the paintings located**, and which German states have the highest concentration?
4. **What is the organizational structure** of the data (paintings → rooms → buildings)?
5. **What iconographic subjects** are most common, and how can we resolve their labels using federated queries?
6. **Who were the painters and commissioners** associated with these works?

---

## Data Sources

This Data Story combines data from two complementary sources to provide comprehensive analysis:

### Source 1: NFDI4Culture Knowledge Graph (SPARQL)

The NFDI4Culture Knowledge Graph provides the core catalog data through a live SPARQL endpoint. The CbDD data is accessible via:

- **Portal URI:** `n4c:E4264` (CbDD Portal)
- **Data Feed URI:** `n4c:E6077` (CbDD Feed containing all painting records)
- **Data Path:** Feed → `schema:dataFeedElement` → DataFeedItem → `schema:item` → Painting

The KG stores paintings with metadata including title, creation year, geographic coordinates, image URLs, and ICONCLASS/Getty AAT subject classifications.

### Source 2: CbDD Graph Export (graphData.json)

The CbDD portal provides a pre-exported graph dataset (`graphData.json`) with rich relational data that complements the Knowledge Graph:

| Link Type | Description | Example |
|-----------|-------------|---------|
| `PAINTERS` | Direct artist attribution | "Asam, Cosmas Damian" |
| `COMMISSIONERS` | Patrons who funded the work | "Stadion, Maria Maximiliana von" |
| `PART` | Hierarchical relationships | Painting → Room → Building |
| `FUNCTION` | Building type classification | "Klosterkirche", "Residenzschloss" |
| `LOCATION` | Geographic region | German state (Bundesland) |
| `ARCHITECTS` | Building architects | For context of architectural setting |
| `TEMPLATE_PROVIDERS` | Design sources | Template or pattern providers |
| `METHOD` | Painting technique | "Fresko", "Öl auf Leinwand" |

**Matching Strategy:** Paintings are matched between sources using their `rdfs:label` from the KG against the `name` field in the CbDD graph. This provides direct artist names without requiring GND (German National Library) resolution.

### Key Ontology Properties (CTO/NFDI)

The NFDI4Culture data uses property codes from two ontology namespaces:

| Property Code | Label | Description |
|---------------|-------|-------------|
| `CTO_0001073` | Creation date | Year the painting was created |
| `CTO_0001026` | External classifier | ICONCLASS/Getty AAT subject codes |
| `CTO_0001021` | Image URL | Link to painting image |
| `CTO_0001019` | Is part of | Hierarchy: painting → room → building |
| `CTO_0001009` | Has related person | GND person URIs |
| `CTO_0001007` | License | Image usage license |

### Data Enrichment Pipeline

The complete data processing pipeline follows these steps:

1. **Query NFDI4Culture KG** for painting URIs, titles, years, coordinates, images, and subjects
2. **Match paintings by name** with the CbDD graph to retrieve painter/commissioner names
3. **Traverse PART hierarchy** to resolve Room → Building relationships
4. **Enrich coordinates** from building records when paintings lack direct geolocation
5. **Federate to external vocabularies** (ICONCLASS, Getty AAT) to resolve subject labels

---

## Data Exploration

Before diving into analysis, let's explore the structure of the painting data in the Knowledge Graph.

### Discover Painting Properties

First, we inspect what predicates (properties) are used by paintings in the dataset. This helps us understand what metadata is available:

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Discover Painting Properties"
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>

SELECT ?predicate (COUNT(?o) AS ?count) (SAMPLE(?o) AS ?sampleValue)
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  ?painting ?predicate ?o .
}
GROUP BY ?predicate
ORDER BY DESC(?count)
LIMIT 25
```
///

/// details | **Show query result**
    type: plain
``` shmarql
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>

SELECT ?predicate (COUNT(?o) AS ?count) (SAMPLE(?o) AS ?sampleValue)
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  ?painting ?predicate ?o .
}
GROUP BY ?predicate
ORDER BY DESC(?count)
LIMIT 25
```
///

This reveals the available metadata fields including:

- **Standard Schema.org:** `rdfs:label`, `schema:latitude`, `schema:longitude`, `schema:associatedMedia`
- **CTO Properties:** `CTO_0001073` (year), `CTO_0001019` (part-of), `CTO_0001026` (subjects), `CTO_0001009` (related persons)

---

## Data Analysis

### Query 1: Total Paintings in CbDD

Let's begin by counting the total number of paintings in the CbDD feed (identifier `n4c:E6077`):

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Total Paintings in CbDD Feed"
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>

SELECT (COUNT(DISTINCT ?painting) AS ?totalPaintings)
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
}
```
///

/// details | **Show query result**
    type: plain
``` shmarql
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>

SELECT (COUNT(DISTINCT ?painting) AS ?totalPaintings)
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
}
```
///

---

### Query 2: Sample Paintings

Let's preview some paintings from the dataset with their key properties (label, year, coordinates):

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Sample Paintings"
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?painting ?label ?year ?lat ?lon 
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  ?painting rdfs:label ?label .
  OPTIONAL { ?painting <https://nfdi4culture.de/ontology/CTO_0001073> ?year . }
  OPTIONAL {
    ?painting schema:latitude ?lat .
    ?painting schema:longitude ?lon .
  }
}
LIMIT 10
```
///

/// details | **Show query result**
    type: plain
``` shmarql
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?painting ?label ?year ?lat ?lon 
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  ?painting rdfs:label ?label .
  OPTIONAL { ?painting <https://nfdi4culture.de/ontology/CTO_0001073> ?year . }
  OPTIONAL {
    ?painting schema:latitude ?lat .
    ?painting schema:longitude ?lon .
  }
}
LIMIT 10
```
///

---

### Query 3: Temporal Distribution

The Baroque era reached its peak in Germany between 1700-1750. This chart shows the distribution of paintings across 50-year periods:

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Temporal Distribution"
# shmarql-view: barchart
# shmarql-x: period
# shmarql-y: count
# shmarql-label: Distribution of Paintings by 50-Year Period

PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?period (COUNT(DISTINCT ?painting) AS ?count)
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  ?painting <https://nfdi4culture.de/ontology/CTO_0001073> ?year .
  
  BIND(
    IF(?year < 1600, "1550-1600",
    IF(?year < 1650, "1600-1650",
    IF(?year < 1700, "1650-1700",
    IF(?year < 1750, "1700-1750",
    IF(?year < 1800, "1750-1800",
    IF(?year < 1850, "1800-1850",
    IF(?year < 1900, "1850-1900", "1900+"))))))) AS ?period
  )
}
GROUP BY ?period
ORDER BY ?period
```
///

/// details | **Show query result**
    type: plain
``` shmarql
# shmarql-view: barchart
# shmarql-x: period
# shmarql-y: count
# shmarql-label: Distribution of Paintings by 50-Year Period

PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?period (COUNT(DISTINCT ?painting) AS ?count)
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  ?painting <https://nfdi4culture.de/ontology/CTO_0001073> ?year .
  
  BIND(
    IF(?year < 1600, "1550-1600",
    IF(?year < 1650, "1600-1650",
    IF(?year < 1700, "1650-1700",
    IF(?year < 1750, "1700-1750",
    IF(?year < 1800, "1750-1800",
    IF(?year < 1850, "1800-1850",
    IF(?year < 1900, "1850-1900", "1900+"))))))) AS ?period
  )
}
GROUP BY ?period
ORDER BY ?period
```
///

/// caption
Distribution of paintings by 50-year time periods, showing the peak of production during the Late Baroque (1700-1750).
///

The visualization reveals that:

- **Early Baroque (1600-1650)**: Relatively few ceiling paintings survive from this period
- **High Baroque (1650-1700)**: Growing production as the style spread across German territories
- **Late Baroque / Rococo (1700-1750)**: The golden age of German ceiling painting
- **Neoclassical Transition (1750-1800)**: Declining production as tastes shifted

---

### Query 4: Complete Painting Metadata

This comprehensive query demonstrates fetching paintings with all available metadata from the Knowledge Graph: title, year, coordinates, image URL, license, ICONCLASS subjects, and parent structure:

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Complete Painting Metadata"
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?painting ?label ?year ?lat ?lon ?imageUrl ?license
       (GROUP_CONCAT(DISTINCT ?iconclass; separator=", ") AS ?subjects)
       ?parentLabel
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting rdfs:label ?label .
  ?painting schema:associatedMedia ?image .
  ?image <https://nfdi4culture.de/ontology/CTO_0001021> ?imageUrl .
  
  OPTIONAL { ?image <https://nfdi4culture.de/ontology/CTO_0001007> ?license . }
  OPTIONAL { ?painting <https://nfdi4culture.de/ontology/CTO_0001073> ?year . }
  OPTIONAL {
    ?painting schema:latitude ?lat .
    ?painting schema:longitude ?lon .
  }
  OPTIONAL { ?painting <https://nfdi4culture.de/ontology/CTO_0001026> ?iconclass . }
  
  OPTIONAL {
    ?painting <https://nfdi4culture.de/ontology/CTO_0001019> ?parent .
    ?parent rdfs:label ?parentLabel .
  }
}
GROUP BY ?painting ?label ?year ?lat ?lon ?imageUrl ?license ?parentLabel
ORDER BY ?year
LIMIT 20
```
///

/// details | **Show query result**
    type: plain
``` shmarql
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?painting ?label ?year ?lat ?lon ?imageUrl ?license
       (GROUP_CONCAT(DISTINCT ?iconclass; separator=", ") AS ?subjects)
       ?parentLabel
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting rdfs:label ?label .
  ?painting schema:associatedMedia ?image .
  ?image <https://nfdi4culture.de/ontology/CTO_0001021> ?imageUrl .
  
  OPTIONAL { ?image <https://nfdi4culture.de/ontology/CTO_0001007> ?license . }
  OPTIONAL { ?painting <https://nfdi4culture.de/ontology/CTO_0001073> ?year . }
  OPTIONAL {
    ?painting schema:latitude ?lat .
    ?painting schema:longitude ?lon .
  }
  OPTIONAL { ?painting <https://nfdi4culture.de/ontology/CTO_0001026> ?iconclass . }
  
  OPTIONAL {
    ?painting <https://nfdi4culture.de/ontology/CTO_0001019> ?parent .
    ?parent rdfs:label ?parentLabel .
  }
}
GROUP BY ?painting ?label ?year ?lat ?lon ?imageUrl ?license ?parentLabel
ORDER BY ?year
LIMIT 20
```
///

The query returns paintings ordered by year with grouped subject URIs. Note that painter names are **not directly available** in the KG - they must be enriched from the CbDD graph (graphData.json) by matching on the painting label.

---

### Query 5: Sample Paintings with Images

Preview paintings from the dataset with their core metadata:

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Sample Paintings with Images"
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?painting ?label ?year ?imageUrl
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting rdfs:label ?label .
  ?painting schema:associatedMedia ?image .
  ?image <https://nfdi4culture.de/ontology/CTO_0001021> ?imageUrl .
  
  OPTIONAL { ?painting <https://nfdi4culture.de/ontology/CTO_0001073> ?year . }
}
LIMIT 12
```
///

/// details | **Show query result**
    type: plain
``` shmarql
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?painting ?label ?year ?imageUrl
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting rdfs:label ?label .
  ?painting schema:associatedMedia ?image .
  ?image <https://nfdi4culture.de/ontology/CTO_0001021> ?imageUrl .
  
  OPTIONAL { ?painting <https://nfdi4culture.de/ontology/CTO_0001073> ?year . }
}
LIMIT 12
```
///

---

### Query 6: Geographic Distribution Map

This map shows paintings and their buildings with geographic coordinates:

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Geographic Distribution Map"
# shmarql-view: mapchart
# shmarql-zoom: 6
# shmarql-lat: 49.5
# shmarql-lon: 10.5

PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?item ?label ?geo
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .

  {
    ?painting schema:latitude ?lat .
    ?painting schema:longitude ?lon .
    ?painting rdfs:label ?label .
    BIND(?painting AS ?item)
    BIND(CONCAT("Point(", STR(?lon), " ", STR(?lat), ")") AS ?geo)
  }
  UNION
  {
    ?painting <https://nfdi4culture.de/ontology/CTO_0001019> ?parent .
    ?parent schema:latitude ?lat .
    ?parent schema:longitude ?lon .
    ?parent rdfs:label ?label .
    BIND(?parent AS ?item)
    BIND(CONCAT("Point(", STR(?lon), " ", STR(?lat), ")") AS ?geo)
  }
}
LIMIT 300
```
///

/// details | **Show query result**
    type: plain
``` shmarql
# shmarql-view: mapchart
# shmarql-zoom: 6
# shmarql-lat: 49.5
# shmarql-lon: 10.5

PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?item ?label ?geo
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .

  {
    ?painting schema:latitude ?lat .
    ?painting schema:longitude ?lon .
    ?painting rdfs:label ?label .
    BIND(?painting AS ?item)
    BIND(CONCAT("Point(", STR(?lon), " ", STR(?lat), ")") AS ?geo)
  }
  UNION
  {
    ?painting <https://nfdi4culture.de/ontology/CTO_0001019> ?parent .
    ?parent schema:latitude ?lat .
    ?parent schema:longitude ?lon .
    ?parent rdfs:label ?label .
    BIND(?parent AS ?item)
    BIND(CONCAT("Point(", STR(?lon), " ", STR(?lat), ")") AS ?geo)
  }
}
LIMIT 300
```
///

/// caption
Geographic distribution of Baroque ceiling paintings across Germany. Bavaria shows the highest concentration.
///

**Regional Highlights:**

| State (Bundesland) | Approximate % | Characteristics |
|--------------------|---------------|-----------------|
| **Bayern** | ~40% | Catholic heartland, wealthy monasteries |
| **Baden-Württemberg** | ~24% | Swabian churches and residences |
| **Sachsen** | ~10% | Protestant court traditions |
| **Other States** | ~26% | Scattered across northern territories |

---

### Query 7: Painting Hierarchy (Part-Of Relationships)

Paintings are organized hierarchically: **Painting → Room → Building**:

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Painting Hierarchy"
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?painting ?paintingLabel ?parentLabel ?grandparentLabel
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting rdfs:label ?paintingLabel .
  
  OPTIONAL {
    ?painting <https://nfdi4culture.de/ontology/CTO_0001019> ?parent .
    ?parent rdfs:label ?parentLabel .
    
    OPTIONAL {
      ?parent <https://nfdi4culture.de/ontology/CTO_0001019> ?grandparent .
      ?grandparent rdfs:label ?grandparentLabel .
    }
  }
}
LIMIT 25
```
///

/// details | **Show query result**
    type: plain
``` shmarql
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?painting ?paintingLabel ?parentLabel ?grandparentLabel
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting rdfs:label ?paintingLabel .
  
  OPTIONAL {
    ?painting <https://nfdi4culture.de/ontology/CTO_0001019> ?parent .
    ?parent rdfs:label ?parentLabel .
    
    OPTIONAL {
      ?parent <https://nfdi4culture.de/ontology/CTO_0001019> ?grandparent .
      ?grandparent rdfs:label ?grandparentLabel .
    }
  }
}
LIMIT 25
```
///

This hierarchical structure allows researchers to:

- Navigate from individual paintings to their architectural context
- Aggregate statistics at the building level
- Understand spatial relationships within decorative programs

---

### Query 8: Paintings with ICONCLASS Subjects

Query paintings that have iconographic subject classifications:

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Paintings with ICONCLASS Subjects"
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?painting ?label (GROUP_CONCAT(DISTINCT ?subject; separator=", ") AS ?subjects)
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting rdfs:label ?label .
  ?painting <https://nfdi4culture.de/ontology/CTO_0001026> ?subject .
}
GROUP BY ?painting ?label
LIMIT 20
```
///

/// details | **Show query result**
    type: plain
``` shmarql
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?painting ?label (GROUP_CONCAT(DISTINCT ?subject; separator=", ") AS ?subjects)
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting rdfs:label ?label .
  ?painting <https://nfdi4culture.de/ontology/CTO_0001026> ?subject .
}
GROUP BY ?painting ?label
LIMIT 20
```
///

---

### Query 9: Federated Query - ICONCLASS Labels

Use the ICONCLASS SPARQL endpoint to resolve human-readable labels for subject codes. This demonstrates the power of **federated SPARQL queries** to connect distributed knowledge graphs:

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Federated Query - ICONCLASS Labels"
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>

SELECT ?painting ?paintingLabel ?iconclassCode ?iconclassLabel
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting rdfs:label ?paintingLabel .
  ?painting <https://nfdi4culture.de/ontology/CTO_0001026> ?iconclassUri .
  
  FILTER(CONTAINS(STR(?iconclassUri), "iconclass.org"))
  
  BIND(REPLACE(STR(?iconclassUri), "https://iconclass.org/", "") AS ?iconclassCode)
  
  SERVICE <https://iconclass.org/sparql> {
    ?iconclassUri skos:prefLabel ?iconclassLabel .
    FILTER(LANG(?iconclassLabel) = "en")
  }
}
LIMIT 15
```
///

/// details | **Show query result**
    type: plain
``` shmarql
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>

SELECT ?painting ?paintingLabel ?iconclassCode ?iconclassLabel
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting rdfs:label ?paintingLabel .
  ?painting <https://nfdi4culture.de/ontology/CTO_0001026> ?iconclassUri .
  
  FILTER(CONTAINS(STR(?iconclassUri), "iconclass.org"))
  
  BIND(REPLACE(STR(?iconclassUri), "https://iconclass.org/", "") AS ?iconclassCode)
  
  SERVICE <https://iconclass.org/sparql> {
    ?iconclassUri skos:prefLabel ?iconclassLabel .
    FILTER(LANG(?iconclassLabel) = "en")
  }
}
LIMIT 15
```
///

This federated query demonstrates how SPARQL can connect distributed knowledge graphs:

1. Query local NFDI4Culture data for paintings and their ICONCLASS URIs
2. Use `SERVICE` to query the external ICONCLASS endpoint at `https://iconclass.org/sparql`
3. Return enriched results with human-readable English labels

**Note:** Federated queries can also connect to **Getty AAT** (`http://vocab.getty.edu/sparql`) for resolving art and architecture terminology.

---

### Query 10: Subject Category Distribution

Analyze the distribution of iconographic categories:

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Subject Category Distribution"
# shmarql-view: barchart
# shmarql-x: category
# shmarql-y: count
# shmarql-label: Paintings by Iconographic Category

PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?category (COUNT(DISTINCT ?painting) AS ?count)
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting <https://nfdi4culture.de/ontology/CTO_0001026> ?subject .
  
  BIND(
    IF(CONTAINS(STR(?subject), "iconclass.org/7"), "Biblical",
    IF(CONTAINS(STR(?subject), "iconclass.org/11"), "Saints/Religious",
    IF(CONTAINS(STR(?subject), "iconclass.org/9"), "Mythology",
    IF(CONTAINS(STR(?subject), "iconclass.org/5"), "Allegory",
    IF(CONTAINS(STR(?subject), "iconclass.org/4"), "Society",
    "Other"))))) AS ?category
  )
}
GROUP BY ?category
ORDER BY DESC(?count)
```
///

/// details | **Show query result**
    type: plain
``` shmarql
# shmarql-view: barchart
# shmarql-x: category
# shmarql-y: count
# shmarql-label: Paintings by Iconographic Category

PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?category (COUNT(DISTINCT ?painting) AS ?count)
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting <https://nfdi4culture.de/ontology/CTO_0001026> ?subject .
  
  BIND(
    IF(CONTAINS(STR(?subject), "iconclass.org/7"), "Biblical",
    IF(CONTAINS(STR(?subject), "iconclass.org/11"), "Saints/Religious",
    IF(CONTAINS(STR(?subject), "iconclass.org/9"), "Mythology",
    IF(CONTAINS(STR(?subject), "iconclass.org/5"), "Allegory",
    IF(CONTAINS(STR(?subject), "iconclass.org/4"), "Society",
    "Other"))))) AS ?category
  )
}
GROUP BY ?category
ORDER BY DESC(?count)
```
///

/// caption
Distribution of iconographic subjects across the CbDD corpus, showing the predominance of religious themes.
///

**Common Subject Categories:**

| ICONCLASS Range | Category | Typical Subjects |
|-----------------|----------|------------------|
| `7x` | Biblical | Old/New Testament scenes |
| `11x` | Saints/Religious | Hagiography, Church doctrine |
| `9x` | Mythology | Classical gods, allegories |
| `5x` | Allegory | Virtues, vices, abstract concepts |

---

### Query 11: Related Persons (GND Links)

Find persons (painters, commissioners) linked to paintings via GND URIs:

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Related Persons (GND Links)"
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?painting ?paintingLabel ?personUri
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting rdfs:label ?paintingLabel .
  ?painting <https://nfdi4culture.de/ontology/CTO_0001009> ?personUri .
}
LIMIT 25
```
///

/// details | **Show query result**
    type: plain
``` shmarql
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?painting ?paintingLabel ?personUri
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting rdfs:label ?paintingLabel .
  ?painting <https://nfdi4culture.de/ontology/CTO_0001009> ?personUri .
}
LIMIT 25
```
///

**Note:** The `CTO_0001009` property links to GND (German National Library) URIs. To resolve these to actual names, one can use the lobid.org API (`https://lobid.org/gnd/{id}.json`) or query Wikidata. However, the **CbDD graph (graphData.json)** provides pre-resolved painter names directly, which is faster and more reliable for this dataset.

---

### Query 12: Buildings with Coordinates

List buildings that have geographic data:

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Buildings with Coordinates"
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?building ?label ?lat ?lon
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting <https://nfdi4culture.de/ontology/CTO_0001019>+ ?building .
  ?building rdfs:label ?label .
  ?building schema:latitude ?lat .
  ?building schema:longitude ?lon .
}
ORDER BY ?label
LIMIT 40
```
///

/// details | **Show query result**
    type: plain
``` shmarql
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?building ?label ?lat ?lon
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting <https://nfdi4culture.de/ontology/CTO_0001019>+ ?building .
  ?building rdfs:label ?label .
  ?building schema:latitude ?lat .
  ?building schema:longitude ?lon .
}
ORDER BY ?label
LIMIT 40
```
///

---

### Query 13: Building-Room-Painting Counts

Explore which buildings and rooms contain the most paintings:

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1" title="Building-Room-Painting Counts"
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?building ?buildingLabel ?room ?roomLabel (COUNT(?painting) AS ?paintingCount)
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting <https://nfdi4culture.de/ontology/CTO_0001019> ?room .
  ?room rdfs:label ?roomLabel .
  
  ?room <https://nfdi4culture.de/ontology/CTO_0001019> ?building .
  ?building rdfs:label ?buildingLabel .
}
GROUP BY ?building ?buildingLabel ?room ?roomLabel
ORDER BY DESC(?paintingCount)
LIMIT 25
```
///

/// details | **Show query result**
    type: plain
``` shmarql
PREFIX schema:  <http://schema.org/>
PREFIX n4c:     <https://nfdi4culture.de/id/>
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?building ?buildingLabel ?room ?roomLabel (COUNT(?painting) AS ?paintingCount)
WHERE {
  n4c:E6077 schema:dataFeedElement ?feedItem .
  ?feedItem schema:item ?painting .
  
  ?painting <https://nfdi4culture.de/ontology/CTO_0001019> ?room .
  ?room rdfs:label ?roomLabel .
  
  ?room <https://nfdi4culture.de/ontology/CTO_0001019> ?building .
  ?building rdfs:label ?buildingLabel .
}
GROUP BY ?building ?buildingLabel ?room ?roomLabel
ORDER BY DESC(?paintingCount)
LIMIT 25
```
///

---

## CbDD Graph Enrichment: Painters and Commissioners

While the NFDI4Culture Knowledge Graph provides core metadata (title, year, subjects, images), the **CbDD graph export (graphData.json)** contains curated relationships to painters, commissioners, and building hierarchies.

### The Painters

| Rank | Painter Name | Paintings | Notable Works |
|------|-------------|-----------|---------------|
| 1 | **Harms, Johann Oswald** | 146 | North German palaces |
| 2 | **Asam, Cosmas Damian** | 123 | München Asamkirche, Weltenburg |
| 3 | **Castelli, Carlo Ludovico** | 99 | South German monasteries |
| 4 | **Asam, Hans Georg** | 80 | Family collaboration |
| 5 | **Asam, Maria Theresia** | 77 | Family collaboration |
| 6 | **Marchini, Giovanni Francesco** | 70 | Bavarian churches |
| 7 | **Brugger, Andreas** | 35 | Baden-Württemberg |
| 8 | **Zick, Januarius** | 23 | Koblenz, Schloss |

### The Asam Family

The **Asam brothers** represent the most famous ceiling painting dynasty in Bavaria:

- **Cosmas Damian Asam (1686-1739)**: Master of illusionistic frescoes
- **Egid Quirin Asam (1692-1750)**: Sculptor and architect, collaborated with his brother
- **Hans Georg Asam**: Father, worked alongside his children
- **Maria Theresia Asam**: Sister, part of the family workshop

Famous collaborative works include:
- München, Asamkirche St. Johann Nepomuk
- Weltenburg, Klosterkirche
- Aldersbach, Klosterkirche

---

## Commissioners (Patrons)

The paintings were commissioned by nobility, clergy, and religious orders:

### Royal and Noble Patrons

| Commissioner | Role | Notable Commissions |
|--------------|------|---------------------|
| **Karl Philipp, Pfalz** | Elector Palatine | Mannheim Residenz |
| **Friedrich I., Preußen** | King of Prussia | Berlin, Schloss Köpenick |
| **Carl Philipp von Greiffenclau** | Prince-Bishop | Würzburg Residenz (Tiepolo) |

### Religious Patrons

| Commissioner | Role | Buildings |
|--------------|------|-----------|
| **Stadion, Maria Maximiliana von** | Abbess | Bad Buchau, Stiftskirche |
| Various Abbots | Monastery leadership | Weltenburg, Ottobeuren, Weingarten |

---

## Summary and Outcomes

This Data Story demonstrated how the **NFDI4Culture Knowledge Graph** combined with the **CbDD graph export** enables rich exploration of the **Corpus of Baroque Ceiling Painting in Germany**.

### Data Pipeline Summary

The complete data analysis pipeline integrates multiple sources:

| Step | Source | Data | Method |
|------|--------|------|--------|
| 1. Core catalog | NFDI4Culture KG | Title, year, coords, images, subjects | SPARQL via `n4c:E6077` feed |
| 2. Painter/commissioner | CbDD graphData.json | Artist names, roles | Match by painting label |
| 3. Location hierarchy | CbDD graphData.json | Room → Building | PART link traversal |
| 4. Building metadata | CbDD graphData.json | Function, state, architects | FUNCTION/LOCATION links |
| 5. Subject labels | ICONCLASS/Getty AAT | Human-readable themes | Federated SPARQL |
| 6. Coordinate enrichment | KG + graph | Geo-location | Building fallback |

### Key Findings

1. **Scale**: The CbDD documents over 5,800 ceiling paintings, one of the largest digitized collections of Baroque art
2. **Temporal Peak**: The period 1700-1750 represents the golden age of German ceiling painting
3. **Geographic Concentration**: Bavaria dominates with ~40% of documented works, reflecting Catholic patronage
4. **Hierarchical Structure**: Data is organized as Painting → Room → Building, enabling multi-level analysis
5. **Linked Data Value**: Federated queries to ICONCLASS and Getty AAT enrich subject descriptions
6. **Data Integration**: Combining SPARQL queries with the CbDD graph provides complete painter attribution

### Technical Outcomes

- **13+ SPARQL queries** demonstrating different analytical approaches
- **Visualizations**: Bar charts for temporal/categorical distribution, map for geography
- **Federated queries**: Connected NFDI4Culture to external ICONCLASS vocabulary
- **Dual-source enrichment**: KG + CbDD graph for comprehensive metadata
- **Reusable patterns**: Query templates applicable to other NFDI4Culture portals

### CTO/NFDI Ontology Reference

Properties used in this data story:

| Code | Label | Usage |
|------|-------|-------|
| `CTO_0001073` | Creation date | Filter by year/period |
| `CTO_0001026` | External classifier | ICONCLASS/AAT subject URIs |
| `CTO_0001021` | Image URL | Display painting images |
| `CTO_0001019` | Is part of | Navigate hierarchy |
| `CTO_0001009` | Has related person | GND person links |
| `CTO_0001007` | License | Image usage rights |

### Future Research Directions

- Link painter GND URIs to biographical data (Wikidata, Deutsche Biographie)
- Analyze commissioner networks and patronage patterns
- Compare iconographic programs across building types
- Temporal evolution of stylistic features
- Integration with the accompanying Jupyter notebook for Python-based analysis

---

## References and Resources

- [Corpus of Baroque Ceiling Painting in Germany (CbDD)](https://deckenmalerei.badw.de/)
- [NFDI4Culture Knowledge Graph](https://nfdi4culture.de/)
- [ICONCLASS](https://iconclass.org/) - Iconographic classification system
- [Getty Art & Architecture Thesaurus](http://vocab.getty.edu/aat/)
- [SHMARQL - SPARQL Data Stories Platform](https://gitlab.rlp.net/adwmainz/nfdi4culture/knowledge-graph/shmarql/datastories)
- [lobid.org GND API](https://lobid.org/gnd) - For GND URI resolution
- [CTO Ontology](https://github.com/ISE-FIZKarlsruhe/nfdi4culture) - NFDI4Culture domain ontology
- [NFDIcore Ontology](https://github.com/ISE-FIZKarlsruhe/nfdicore) - Mid-level NFDI ontology
