NFDI4Culture Data Story
{: .text-overline-m}

# An Italian Data Journey

## Analysing research data about 18th century Italian opera using the Culture Knowledge Graph and federated European research infrastructures

/// html | div[class='tile']
**Author:** [Torsten Schrade](https://orcid.org/0000-0002-0953-2818)  
**Persistent Identifier:** https://nfdi4culture.de/id/E6263  
**Metadata:** https://nfdi4culture.de/id/E6263/about.html  
**License:** [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)
///

[![Introductory Image](intro.jpg)](https://commons.wikimedia.org/wiki/File:1706_de_la_Feuille_Map_of_Italy_-_Geographicus_-_Italy-lafeuille-1706.jpg)

/// caption
Daniel de Lafeuille, Nouvelle Carte D’Italie - Nieuwe Kaart van Italien, 1706, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:1706_de_la_Feuille_Map_of_Italy_-_Geographicus_-_Italy-lafeuille-1706.jpg), Public Domain
///

**Abstract:** This data story illustrates a digital exploration of reserach data on opera holdings of the [Doria Pamphilj Archive](https://www.doriapamphilj.it/en/rome/the-place/the-archives/) by the [*Partitura*](http://partitura.dhi-roma.it/) project of the [German Historical Institute in Rome (DHI Rome)](http://dhi-roma.it/). By enriching the *Partitura* dataset with established authority sources such as [Wikidata](https://www.wikidata.org/), [RISM](https://rism.online/), [GeoNames](https://www.geonames.org/), and transforming it to LOD, new analytical insights into the historical and musicological dimensions of the opera collection are revealed. Leveraging services provided by [NFDI4Culture](https://nfdi4culture.de/) and [EOSC](https://open-science-cloud.ec.europa.eu/), the study exemplifies how data federation with European infrastructures can significantly enhance interoperability of research data and create multimodal research perspectives. Methodologically, the story uses examples ranging from genre distribution analyses to geospatial mappings of opera premiere locations as well as music information retrieval through federated SPARQL queries. 
{: .intro}

---

## Introduction

The Archivio Doria Pamphilj in Rome houses a significant yet largely unexplored collection of operatic materials dating from the 16th to the 19th centuries. Originally assembled between 1764 and 1777 by Giorgio Andrea IV Doria Landi Pamphilj (1747–1820), this archive includes approximately 300 bibliographic units encompassing sacred music from the 16th and 17th centuries, vocal and instrumental music from the 18th century, and printed music from the 19th century. Notably, the archive contains 27 complete opera scores, 21 collections of varied arias ("Arie diversi"), and 128 individual aria manuscripts from the late 18th and early 19th centuries.

[![Pallazo Doria Pamphilj](pallazo-doria.jpg)](https://commons.wikimedia.org/wiki/File:Calcografia_degli_edifizj_di_Roma_1779_(69608988).jpg)

/// caption
Palazzo Doria Pamphilj, Rome / 1779; [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Calcografia_degli_edifizj_di_Roma_1779_(69608988).jpg), Public Domain
///

To facilitate scholarly access and promote deeper musicological research, the German Historical Institute in Rome (DHI) initiated the "Partitura Project," supported by the German Research Foundation (DFG) between 2008 and 2015 under the leadership of Dr Roland Pfeiffer. The project accomplished comprehensive digitisation of opera scores from both the Doria Pamphilj and the Massimo collections, resulting in a digital archive comprising approximately 115,000 images and a database of around 30,000 aria incipits.

## Research questions

Our data story addresses two research questions: 

1. firstly, whether selected datasets from the DHI can be effectively federated within European data spaces using data-driven methods, thereby generating novel insights that surpass the original data; 
2. and secondly, how these federated data can be employed to unlock new research potentials and concrete scholarly advancements in music-historical studies.

Methodologically, the exploration was designed as a structured experiment, constrained to a 100-hour timeframe spread across four weeks. The investigation exclusively utilised cloud-based European infrastructures, notably those provided by NFDI4Culture and the European Open Science Cloud (EOSC). 

A key aspect involved employing artificial intelligence and knowledge graphs, particularly for data curation, semantic enrichment, and assisted programming. Quality control was maintained through a "human-in-the-loop" approach, while data federation occurred in real-time during analyses. The experiment aimed at demonstrating measurable improvements in data interoperability, enhanced discoverability and interpretative value, and the creation of new multimodal interaction opportunities with historical datasets.

![Envisaged data federation and methodological approach](partitura-federation.png)

/// caption
Envisaged data federation and methodological approach
///

## Data preparation

TEXT

## Data analysis

TEXT

### Example 05: Show all places of opera premieres on an interactive map

--8<-- "; query-05.rq"

### Example 06: Combining Persons in RISM and Partitura

Find all operas in the Doria Pamphilj collection that are based on libretti of Pietro Metastasio.

![Person relations between Partitura and RISM](query-06-visualisation.png)

/// details | **Show SPARQL query**
    type: plain
``` sparql linenums="1"
--8<-- "query-06.rq"
```
/// 

/// details | **Show SPARQL query result**
    type: plain
``` shmarql
--8<-- "query-06.rq"
```
///

## Summary and results

TEXT
