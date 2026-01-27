NFDI4Culture Data Story
{: .text-overline-m}

# Baroque Art and History in Germany

## Analysing research data about 18th century Italian opera using the Culture Knowledge Graph and federated European research infrastructures

/// html | div[class='tile']
**Author:** []()  
**Persistent Identifier:**  
**Metadata:** 
**License:** []()
///

![Introductory Image]()

/// caption
///

**Abstract:**

---

## Introduction

The Archivio Doria Pamphilj in Rome houses a significant yet largely unexplored collection of operatic materials dating from the 16th to the 19th centuries. Originally assembled between 1764 and 1777 by Giorgio Andrea IV Doria Landi Pamphilj (1747–1820), this archive includes approximately 300 bibliographic units encompassing sacred music from the 16th and 17th centuries, vocal and instrumental music from the 18th century, and printed music from the 19th century. Notably, the archive contains 27 complete opera scores, 21 collections of varied arias ("Arie diversi"), and 128 individual aria manuscripts from the late 18th and early 19th centuries.

[![]()]()

/// caption
///


---

## Research questions

Our data story addresses the following research questions:

1. Firstly, how did the activity of Baroque painters in German regions evolve over time and across locations?
2. Secondly, which thematic patterns can be observed in paintings, and how do these themes change throughout painters’ careers?
3. Thirdly, to what extent do collaboration patterns and shared contexts emerge from co-occurrences in artworks and locations?


![Envisaged data federation and methodological approach](partitura-federation.png)

/// caption
Envisaged data federation and methodological approach
///

---

## Data preparation

### Initial Dataset

The initial dataset for this data story is derived from the NFDI4Culture Knowledge Graph, with a particular focus on the Corpus of Baroque Ceiling Painting in Germany (CbDD).
CbDD is registered as a cultural data portal within NFDI4Culture and serves as a structured aggregation of metadata on Baroque ceiling paintings, including information on artworks, painters, locations, iconographic subjects, and related institutions.

The NFDI4Culture Knowledge Graph provides these data via a SPARQL endpoint, enabling federated queries across multiple cultural heritage sources. In this project, the CbDD portal acts as the primary entry point for identifying relevant painting records and their associated metadata.

![Challenges in the source data]()

/// caption
Challenges in the Partitura source data
///


### Step 1: Migration to a structured relational dataset (DuckDB)

As a preliminary step, the curated Baroque ceiling painting data were migrated into a persistent relational database using DuckDB (baroque.duckdb).
This migration transformed heterogeneous tabular inputs into a normalized relational schema, explicitly modelling many-to-many relationships between paintings, persons, subjects, buildings, and rooms via junction tables.

To support efficient analytical queries and interactive exploration, indexes were created on key identifiers and foreign keys (e.g. painting IDs, person IDs, subject URIs).

The migration resulted in a structured relational dataset comprising:

* 4,594 paintings
* 4,082 iconographic subjects
* 17,474 painting–subject annotations
* 1,260 buildings
* 2,376 rooms

**Check out the data interactively:** 

### Step 2: Data cleaning, normalization, and quality assessment

To enable systematic temporal and spatial analysis, several data cleaning and normalization steps were applied.

First, heterogeneous German-language date expressions were parsed using custom year-parsing functions. These transformed free-text year strings into normalized temporal fields (year_start, year_end, and approximation flags), allowing both precise and approximate dates to be represented analytically.

Second, data completeness and consistency were assessed through coverage statistics. This included evaluating the availability of parsed dates, geographic coordinates, image URLs, painter attributions, and CbDD matches across the paintings table.
The resulting data quality summary provides an explicit account of usable versus missing information and supports transparent interpretation of subsequent analyses.

### Step 3: Integration decisions and semantic structuring

Rather than performing additional post-hoc authority reconciliation, semantic enrichment was inherited from the curated dataset structure itself. Iconographic subjects are represented as distinct entities and retain their associated controlled vocabulary sources (e.g. ICONCLASS and Getty AAT), enabling comparative analysis of descriptive frameworks.

For painter-related analyses, explicit methodological decisions were documented. In particular, painter productivity analyses rely on consolidated painter name strings at the painting level to avoid artefacts introduced by fragmented person entries in junction tables.
These integration decisions ensure analytical coherence while preserving traceability to the underlying data structures.

/// caption
///

### Step 4: Analytical layers and interactive visual exploration

The prepared relational dataset serves as the foundation for multiple analytical layers presented in this data story.

These include:

1. geographic distributions of paintings and buildings by German federal state,

2. temporal distributions of ceiling paintings across decades,

3. painter productivity and active periods,

4. collaboration networks based on co-authored paintings,

5. and frequency analyses of iconographic themes across controlled vocabularies.

All analyses are implemented as reproducible SQL queries and rendered through interactive visualizations, enabling exploratory engagement with spatial, temporal, social, and thematic dimensions of Baroque ceiling painting production.

/// caption
///

---

## Data analysis

### Analysis 01: 

/// details | **Show SPARQL query 01**
    type: plain
``` sparql linenums="1" title="query-01.rq"
--8<-- "query-01.rq"
```
///

/// details | **Show query result 01**
    type: plain
``` shmarql linenums="1" title="query-01.rq"
--8<-- "query-01.rq"
```
///

---

### Analysis 02: 

/// details | **Show SPARQL query 02**
    type: plain
``` sparql linenums="1" title="query-02.rq"
--8<-- "query-02.rq"
```
///

/// details | **Show query result 02**
    type: plain
``` shmarql linenums="1" title="query-02.rq"
--8<-- "query-02.rq"
```
///

<img src="query-02-visualisation.svg" style="width: 100%" title="Statistics on opera buffa, opera seria and oratorio"/>

/// caption
Statistics on opera buffa, opera seria and oratorio in the Doria Pamphilj dataset
///

---

### Example 03: 

/// details | **Show SPARQL query 03**
    type: plain
``` sparql linenums="1" title="query-03.rq"
--8<-- "query-03.rq"
```
/// 

--8<-- "query-03.md"

---

### Analysis 04: 

/// details | **Show SPARQL query 04**
    type: plain
``` sparql linenums="1" title="query-04.rq"
--8<-- "query-04.rq"
```
/// 

--8<-- "query-04.md"

---

### Example 05: 

/// details | **Show SPARQL query 05**
    type: plain
``` sparql linenums="1" title="query-05.rq"
--8<-- "query-05.rq"
```
/// 

--8<-- "query-05.md"

---

### Example 06: 

Find all operas in the Doria Pamphilj collection that are based on libretti of Pietro Metastasio.

![Person relations between Partitura and RISM](query-06-visualisation.png)

/// details | **Show SPARQL query 06**
    type: plain
``` sparql linenums="1" title="query-06.rq"
--8<-- "query-06.rq"
```
/// 

/// details | **Show query result 06**
    type: plain
``` shmarql
--8<-- "query-06.rq"
```
///

---

### Example 07: 

/// details | **Show SPARQL query 07**
    type: plain
``` sparql linenums="1" title="query-07.rq"
--8<-- "query-07.rq"
```
/// 

/// details | **Show query result 07**
    type: plain
``` shmarql
--8<-- "query-07.rq"
```
///

---

### Example 08: 

/// details | **Show SPARQL query 08**
    type: plain
``` sparql linenums="1" title="query-08.rq"
--8<-- "query-08.rq"
```
/// 

/// details | **Show query result 08**
    type: plain
``` shmarql
--8<-- "query-08.rq"
```
///

---

### Example 09: 

/// details | **Show SPARQL query 09**
    type: plain
``` sparql linenums="1" title="query-09.rq"
--8<-- "query-09.rq"
```
/// 

![Alluvial diagram showing the relation between works and places of premiere](query-09-visualisation.png)

/// caption
Alluvial diagram showing the relation between works and places of premiere
///

---

### Example 10: 

/// details | **Show SPARQL query 10**
    type: plain
``` sparql linenums="1" title="query-10.rq"
--8<-- "query-10.rq"
```
/// 

![Beeswarm plot showing the staging history of Demofoonte](query-10-visualisation.png)

/// caption
Beeswarm plot showing the staging history of Demofoonte
///

---

### Example 11: 

/// details | **Show SPARQL query 11**
    type: plain
``` sparql linenums="1" title="query-11.rq"
--8<-- "query-11.rq"
```
/// 

![Relation between RISM incipits and resources from Partitura](query-11-visualisation.png)

/// caption
Relation between RISM incipits and resources from Partitura
///

**Experimental Search interface for notated music (Plaine & Easy format)**

![](https://nfdi4culture.de/fileadmin/incipits/doria-p-incipitsearch.gif)

**Try it out live:** https://nfdi4culture.de/kg-incipit-search.html

---

## Summary and Outcomes

/// caption

///