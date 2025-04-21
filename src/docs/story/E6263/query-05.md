<div id="result-05"
data-sgvizler-endpoint="https://nfdi4culture.de/sparql"
data-sgvizler-chart="leaflet.visualization.Map"
data-sgvizler-log="0"
data-sgvizler-query="
PREFIX schema: <http://schema.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX nfdicore: <https://nfdi.fiz-karlsruhe.de/ontology/>
PREFIX cto: <https://nfdi4culture.de/ontology#>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>

SELECT
  (SAMPLE(?latitude) AS ?latitude)
  (SAMPLE(?longitude) AS ?longitude)
  ?opera
  (SAMPLE(?theaterLabel) AS ?description)
  (SAMPLE(?resource) AS ?link)
  (SAMPLE(?image) AS ?url)
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

  BIND(IRI(STR(?theater)) AS ?wd_item)
  {
    SERVICE <https://query.wikidata.org/sparql> {
      ?wd_item wdt:P18 ?image .
    }
  }
}
GROUP BY ?opera ?composerLabel
ORDER BY ?opera ?composerLabel
" data-sgvizler-endpoint-query-parameter="query"
style="width: 100%; height: 500px; margin-bottom: 2rem;" class="n4c-border-black"></div>