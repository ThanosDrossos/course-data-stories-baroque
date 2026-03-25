# CbDD / NFDI4Culture KG Integration Issues

## Scope

- Comparison baseline: CbDD / Deckenmalerei.eu records and source JSON used in this project
- Target system: NFDI4Culture Knowledge Graph records used for SPARQL-based integration
- Focus: missing entities, missing metadata, stale provider resolution

## 1. Missing Entity Coverage: `Malereiteil`

- Problem: `Malereiteil` records (painting parts / sub-works) are not represented in the NFDI4Culture Knowledge Graph.
- Expected: sub-work records should exist as addressable graph entities with their own metadata and parent-child relations.
- Actual: no corresponding painting-part entity was available in the KG export used for the project.
- Impact:
  - no queryable sub-image granularity
  - lost `is part of` and `is documented in` chains
  - manual fallback to source records required for close-reading examples
- Observed pattern: likely systematic for painting-part subclasses, not an isolated record.
- Example:
  - Source record: [A1 Orpheus](https://www.deckenmalerei.eu/423f84cc-0f21-4f8f-8e7f-c108009b95ea)
  - ID: `423f84cc-0f21-4f8f-8e7f-c108009b95ea`
  - Type: `Malereiteil`
  - Is part of group: https://www.deckenmalerei.eu/df063af8-3fd4-4300-a9e5-82e61e5f5cb3 (the larger painting entity, also missing in KG)
<<<<<<< HEAD
  - Is part of painting: https://www.deckenmalerei.eu/c13dde7c-8891-430a-aed7-99fb87e73117 (exists in KG, but subentities are missing)
=======
  - Is part of painting: https://www.deckenmalerei.eu/c13dde7c-8891-430a-aed7-99fb87e73117 (exists in KG, but no subentities)
>>>>>>> 469c6c955080ad1d223326ca712f18cbeef8928e

## 2. Missing Work-Level Metadata on Painting Nodes

- Problem: the KG record keeps only a thin descriptive layer; technical and spatial metadata is missing.
- Expected: painting entities should retain work-level metadata needed for analysis and matching.
- Actual: the compared KG record exposes only label/title, year, artwork type, Iconclass links, Getty/AAT reference, and external URI.
- Missing fields:
  - `technique`
  - `material`
  - `position`
  - `orientation`
  - `diameter`
  - `room` / `building part` relation
- Impact:
  - metadata had to be extracted from the Deckenmalerei source JSON and matched manually
  - room-level analysis was not possible from KG data alone
  - material/technique analysis required out-of-band enrichment
- Example:
  - Source record: [Herkules und Omphale](https://www.deckenmalerei.eu/0ddd3ce0-8b03-4e4d-bb22-b11df4e93269)
  - ID: `0ddd3ce0-8b03-4e4d-bb22-b11df4e93269`
  - Source metadata present: `Technique Ölmalerei`, `Material Ölfarbe; Putz`, `Position Decke`, `Orientation Mitte`, `Diameter 1.8 m`, `is part of Bibliothek [Raum]`
  - KG snapshot used in the project exposes only:
    - `rdfs:label "Herkules und Omphale"`
    - year `1778`
    - type `cto:CTO_0001005`
    - Iconclass links
    - Getty link `http://vocab.getty.edu/aat/300411453`
    - external source URI `https://www.deckenmalerei.eu/0ddd3ce0-8b03-4e4d-bb22-b11df4e93269`

## 3. Stale / Unresolved Provider Link from Bildindex

- Problem: the KG provider item link does not resolve to a stable object page.
- Expected: the provider link should open the referenced Bildindex object record directly.
- Actual: the provider URL resolves, but the target page is a Bildindex no-result page instead of an object detail page.
- Impact:
  - broken provenance chain
  - manual verification needed outside the KG
  - deep links to provider data are unreliable
- Example:
  - KG record: [ark:/60538/E6161_43384b40](https://nfdi4culture.de/id/ark:/60538/E6161_43384b40)
  - Context: `Ehemaliges Klostergebäude - Thronsaal, Südflügel, westlicher Teil, zweites Obergeschoss`
  - Provider: `Bildindex Kunst und Architektur`
  - Provider item in KG: [http://www.bildindex.de/document/obj21082558](http://www.bildindex.de/document/obj21082558)
  - Observed on `2026-03-25`: provider URL returned `HTTP 200`, but the page content indicated a no-result state (`thequery_noresult`, `Ihre Suche ergab leider kein Ergebnis.`)
