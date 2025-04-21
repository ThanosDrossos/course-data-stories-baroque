# An Italian Data Journey

## Analysing Data about 18th Century Opera in the NFDI4Culture Knowledge Graph

**Author: Torsten Schrade**

```sparql
PREFIX rism: <http://rism.online/>
PREFIX ct: <http://data.linkedct.org/resource/linkedct/>
PREFIX schema: <http://schema.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX nfdicore: <https://nfdi.fiz-karlsruhe.de/ontology/>
PREFIX cto: <https://nfdi4culture.de/ontology#>
PREFIX partitura: <https://nocodb.nfdi4culture.de/dashboard/#/nc/pxjfen9oerev7k9/mj3w842gefzot7u?rowId=>
PREFIX rism: <https://rism.online/sources/>

SELECT
  (?partituraLabel as ?opera)
  (?composerLabel as ?composer)
  (SAMPLE(?locationLabel) as ?locationLabel)
  (SAMPLE(?year) as ?year)
  (SAMPLE(?rismItem) as ?rism)
  (SAMPLE(?partitura) as ?partitura)
  (SAMPLE(?latitude) as ?latitude)
  (SAMPLE(?longitude) as ?longitude)
WHERE {
  SERVICE <https://lod.academy/dhi-rom/data/partitura/sparql> {
    SELECT 
      ?partitura
      ?partituraLabel
      ?composerLabel
      ?rismItem
      ?locationLabel
      ?latitude
      ?longitude
      ?year
    {
      ?partitura a cto:Item .
      ?partitura rdfs:label ?partituraLabel .

      ?partitura schema:composer ?composer .
      ?composer rdfs:label ?composerLabel .

      ?partitura cto:relatedLocation ?location .      
      ?location rdfs:label ?locationLabel .
      ?location schema:latitude ?latitude .
      ?location schema:longitude ?longitude .
      
      ?partitura cto:relatedEvent ?event .      
      ?event nfdicore:startDate ?year .

      ?partitura cto:relatedItem ?rismItem .
    }
  }
  
  # with a relation to Pietro Metastasio
  ?rismItem cto:relatedPerson <https://rism.online/people/97823> .
}
GROUP BY ?partituraLabel ?composerLabel
ORDER BY ?partituraLabel ?composerLabel
```

```shmarql
PREFIX rism: <http://rism.online/>
PREFIX ct: <http://data.linkedct.org/resource/linkedct/>
PREFIX schema: <http://schema.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX nfdicore: <https://nfdi.fiz-karlsruhe.de/ontology/>
PREFIX cto: <https://nfdi4culture.de/ontology#>
PREFIX partitura: <https://nocodb.nfdi4culture.de/dashboard/#/nc/pxjfen9oerev7k9/mj3w842gefzot7u?rowId=>
PREFIX rism: <https://rism.online/sources/>

SELECT
  (?partituraLabel as ?opera)
  (?composerLabel as ?composer)
  (SAMPLE(?locationLabel) as ?locationLabel)
  (SAMPLE(?year) as ?year)
  (SAMPLE(?rismItem) as ?rism)
  (SAMPLE(?partitura) as ?partitura)
  (SAMPLE(?latitude) as ?latitude)
  (SAMPLE(?longitude) as ?longitude)
WHERE {
  SERVICE <https://lod.academy/dhi-rom/data/partitura/sparql> {
    SELECT 
      ?partitura
      ?partituraLabel
      ?composerLabel
      ?rismItem
      ?locationLabel
      ?latitude
      ?longitude
      ?year
    {
      ?partitura a cto:Item .
      ?partitura rdfs:label ?partituraLabel .

      ?partitura schema:composer ?composer .
      ?composer rdfs:label ?composerLabel .

      ?partitura cto:relatedLocation ?location .      
      ?location rdfs:label ?locationLabel .
      ?location schema:latitude ?latitude .
      ?location schema:longitude ?longitude .
      
      ?partitura cto:relatedEvent ?event .      
      ?event nfdicore:startDate ?year .

      ?partitura cto:relatedItem ?rismItem .
    }
  }
  
  # with a relation to Pietro Metastasio
  ?rismItem cto:relatedPerson <https://rism.online/people/97823> .
}
GROUP BY ?partituraLabel ?composerLabel
ORDER BY ?partituraLabel ?composerLabel
```
