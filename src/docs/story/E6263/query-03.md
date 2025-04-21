<div id="result-03"
data-sgvizler-endpoint="https://nfdi4culture.de/sparql"
data-sgvizler-chart="leaflet.visualization.Map"
data-sgvizler-log="0"
data-sgvizler-query="
PREFIX schema: <http://schema.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX nfdicore: <https://nfdi.fiz-karlsruhe.de/ontology/>
PREFIX cto: <https://nfdi4culture.de/ontology#>

SELECT
  (SAMPLE(?latitude) AS ?latitude)
  (SAMPLE(?longitude) AS ?longitude)
  ?opera
  (?composerLabel AS ?composer)
  (SAMPLE(?theaterLabel) AS ?theater)
  (SAMPLE(?locationLabel) AS ?location)
  (SAMPLE(?year) AS ?year)
  (COUNT(DISTINCT ?resource) AS ?partitura)
WHERE {
  SERVICE <https://lod.academy/dhi-rom/data/partitura/sparql> {
    ?resource a cto:Item .
    ?resource rdfs:label ?opera .
    ?resource cto:relatedOrganization ?theater .
    ?resource cto:relatedEvent ?event .
    ?resource schema:composer ?composer .

    ?composer rdfs:label ?composerLabel .

    ?theater rdfs:label ?theaterLabel .
    ?theater cto:relatedLocation ?location .

    ?location rdfs:label ?locationLabel .
    ?location schema:latitude ?latitude .
    ?location schema:longitude ?longitude .

    ?event nfdicore:startDate ?year .
  }
}
GROUP BY ?opera ?composerLabel
ORDER BY ?opera ?composerLabel
" data-sgvizler-endpoint-query-parameter="query"
style="width: 100%; height: 500px; margin-bottom: 2rem;" class="n4c-border-black"></div>