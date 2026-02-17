NFDI4Culture Data Story
{: .text-overline-m}

# Baroque Ceiling Paintings in Germany

## Exploring the Corpus of Baroque Ceiling Painting (CbDD) through Interactive Data Visualization

/// html | div[class='tile']
**Authors:** [Thanos Drossos](https://orcid.org/0009-0001-6545-9096), [Robin Kleemann](https://orcid.org/), [YiMin Cai](https://orcid.org/)  
**Persistent Identifier:** https://nfdi4culture.de/id/CbDD  
**License:** [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)
///

**Abstract:** This data story explores the Corpus of Baroque Ceiling Painting in Germany (CbDD) through interactive visualizations powered by DuckDB WASM. We analyze the geographic distribution, temporal patterns, and thematic content of over 4,500 ceiling paintings across German regions, using client-side SQL queries for responsive data exploration. The study combines data from the NFDI4Culture Knowledge Graph with historical photographs from Bildindex, cross-referenced via GND identifiers.
{: .intro}

---

## Introduction

Baroque ceiling and wall paintings were a hallmark of interior decoration between the 16th and 18th centuries, transforming churches, palaces, and grand halls with vibrant allegorical frescoes. In Germany alone, a dedicated research corpus (Corpus der barocken Deckenmalerei in Deutschland, CbDD) has documented 4,594 such artworks along with their locations and artists. Harnessing this rich cultural heritage data, we set out to explore the careers of Baroque ceiling painters and the distribution and themes of their works. To do so, we leverage linked data and modern analysis tools to combine information from multiple sources. This integrated approach allows us to ask: Who were the key Baroque ceiling painters, when and where did they create their works, and what subjects did they depict? By uniting a specialized art-historical dataset with external knowledge graphs and archives, our data story uncovers patterns and insights that would be difficult to see in isolation. The result is an interactive narrative that not only presents quantitative analyses of these artworks and artists, but also demonstrates the power of semantic data integration in cultural heritage research.

### Methods 

We followed a multi-step data pipeline to gather and analyze the information:

1. Data Retrieval via SPARQL: We used SPARQL queries to retrieve structured data on Baroque ceiling paintings and artists from online knowledge graphs. In particular, the core list of paintings and their metadata was obtained from the CbDD’s digital dataset (via a SPARQL endpoint in NFDI). Using SPARQL ensured that we could precisely filter for relevant works (e.g. paintings dated 1550–1800 in Germany) and fetch associated attributes like titles, locations, dates, and painter names in a single query.

2. Data Enrichment: To enhance the dataset, we cross-linked entities across different sources. Painter names from the corpus were reconciled with the original CbDD knowledg graph entries to gather consistent biographical details (e.g. birth/death years) and further connections between the paintings and buildings. We also connected the paintings to the Bildindex der Kunst und Architektur (the German art and architecture image index) to retrieve image metadata and detailled arhitectural data. This was done by matching GND identifiers and other metadata fields, allowing us to enrich our dataset with historical photographs and additional contextual information about the artworks.

3. Data Integration and Cleaning: All retrieved and enriched data were then merged into a single cohesive dataset. We carefully matched paintings from the CbDD corpus with entries in the Bildindex (and other sources) by comparing titles, locations, and other attributes, flagging any ambiguities or duplicates. Each artwork entry was augmented with the identifiers from multiple sources (such as corpus IDs, ICONLASS, GND numbers, and image links) to enable seamless cross-reference. Unmatched items were reviewed and noted for exclusion. The outcome was a unified dataset of 4,594 paintings, representing the breadth of Baroque ceiling art in Germany.

4. Database and Analysis: The consolidated dataset was imported into a local DuckDB relational database, chosen for its efficiency in analytical querying. Using DuckDB via Python, we could perform complex SQL queries and manipulations on the data directly within our notebook. We analyzed key aspects of the data – for example, counting paintings per artist, examining the timeline of commissions, mapping the geographic distribution of works across regions, and identifying common iconographic themes. We utilized Python libraries (such as Polars for data handling and Altair for charting) to derive summary statistics and create visualizations. This approach allowed interactive exploration of the data with fast query performance on the ~4k records.

5. Visualization and Presentation: Finally, we presented our findings in an interactive format using SHMARQL, a Linked Data storytelling platform. SHMARQL (running in a Docker container for our project) renders the data story Markdown and executes live SPARQL queries embedded in the text. In practice, this means that each figure or chart in our story is generated on the fly by querying the underlying SPARQL endpoints or our prepared dataset. The visualizations (e.g. timelines, maps, bar charts) are thus always consistent with the latest data and can be interactive. Graphs are created using Altair, while maps are rendered with Leaflet. The DuckDB database is accessed via a WASM client-side implementation, allowing users to run SQL queries directly in their browser for a responsive experience. This setup enables us to tell a dynamic data story that combines narrative text with live data exploration.

![Methods Overview](methods.png)

### Limitations

While our data story provides a comprehensive overview of Baroque ceiling paintings in Germany, there are several limitations to consider:

1. **Data Completeness**: The CbDD corpus, while extensive, may not capture every existing Baroque ceiling painting in Germany. Since it CbDD is still considered a work in progress, there may be gaps in the dataset and the dataset has a bias towards weel-documented artworks in Bavaria. Hence, it may not fully represent the diversity of ceiling paintings across all regions and the biographical details of lesser-known artists may be incomplete.

2. **Data Quality and Consistency**: The data retrieved from different sources (CbDD, Bildindex, etc.) may have inconsistencies in naming conventions, metadata formats, and completeness. For example, painter names may be spelled differently across sources, and some paintings may lack precise dating or location information. This can lead to challenges in data integration and may affect the accuracy of our analyses. We have found discrepancies between NFDI and the original CbDD dataset, which we had to resolve manually. Changes in the CbDD dataset were often not reflected in the NFDI endpoint, leading to further mismatches and missing data.

3. **Analytical Scope**: Our analyses are limited to the attributes available in the dataset, which may not capture all relevant aspects of Baroque ceiling paintings. For example, we focus on quantifiable attributes such as the number of paintings per artist or geographic distribution, but we do not analyze the stylistic features, iconography, or artistic techniques in depth. Additionally, our temporal analysis is constrained by the dating information available for each painting, which may be imprecise or missing for some works.

4. **Interpretation of Results**: The patterns and trends we identify in the data may be influenced by the biases and limitations of the dataset, as well as our analytical choices. For example, the prominence of certain artists or regions may reflect historical documentation biases rather than actual production patterns. Therefore, our interpretations should be made with caution and in the context of existing art historical knowledge.

### Dataset Overview

<div id="dataset-stats" class="duckdb-query">
    <div class="loading">Loading database statistics...</div>
</div>

<script type="module">
// Initialize database and show stats
(async function() {
    const statsEl = document.getElementById('dataset-stats');
    
    try {
        // Show loading progress
        statsEl.innerHTML = `
            <div class="db-progress">
                <div class="db-progress-bar" style="width: 0%"></div>
            </div>
            <div class="db-progress-text">Initializing DuckDB WASM...</div>
        `;
        
        await BaroqueDB.init('/story/CbDD/baroque.duckdb', (progress) => {
            statsEl.querySelector('.db-progress-bar').style.width = progress.percent + '%';
            statsEl.querySelector('.db-progress-text').textContent = progress.message;
        });
        
        // Query dataset statistics
        const stats = await BaroqueDB.query(`
            SELECT 
                (SELECT COUNT(*) FROM paintings) as paintings,
                (SELECT COUNT(*) FROM persons) as persons,
                (SELECT COUNT(*) FROM buildings) as buildings,
                (SELECT COUNT(*) FROM rooms) as rooms,
                (SELECT COUNT(*) FROM subjects) as subjects,
                (SELECT COUNT(*) FROM bi_items) as bildindex_items
        `);
        
        const s = stats[0];
        statsEl.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
                <div style="padding: 20px; background: #3498db22; border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #3498db;">${s.paintings.toLocaleString()}</div>
                    <div>Ceiling Paintings</div>
                </div>
                <div style="padding: 20px; background: #27ae6022; border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #27ae60;">${s.persons.toLocaleString()}</div>
                    <div>Artists & Architects</div>
                </div>
                <div style="padding: 20px; background: #9b59b622; border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #9b59b6;">${s.buildings.toLocaleString()}</div>
                    <div>Buildings</div>
                </div>
                <div style="padding: 20px; background: #e67e2222; border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #e67e22;">${s.rooms.toLocaleString()}</div>
                    <div>Rooms</div>
                </div>
                <div style="padding: 20px; background: #e74c3c22; border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #e74c3c;">${s.subjects.toLocaleString()}</div>
                    <div>Subject Classifications</div>
                </div>
                <div style="padding: 20px; background: #1abc9c22; border-radius: 8px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #1abc9c;">${s.bildindex_items.toLocaleString()}</div>
                    <div>Bildindex Photos</div>
                </div>
            </div>
        `;
    } catch (error) {
        statsEl.innerHTML = `<div class="error">Failed to load database: ${error.message}</div>`;
    }
})();
</script>

---

## Research Questions

This data story addresses the following research questions:

1. **Geographic Distribution**: How are Baroque ceiling paintings distributed across German federal states?
2. **Temporal Patterns**: When was the peak period of ceiling painting production?
3. **Artistic Networks**: Who were the most prolific painters, and where did they work?
4. **Thematic Analysis**: What iconographic subjects dominate Baroque ceiling paintings?
5. **Cross-Dataset Links**: How do CbDD records connect to historical photographs in Bildindex?

---

## User experience 

This data story invites users to explore Baroque ceiling painting between **1600 and 1750** through two complementary perspectives: a **macro perspective** and a **micro perspective**.

**Macro perspective:**
This perspective provides an overview of the period by presenting temporal, spatial, and historical information. It visualizes how ceiling paintings are distributed over time, highlights their geographical occurrence across regions and building types, and situates the artworks within broader political and historical settings of the era. This perspective is intended to support orientation and to offer contextual reference points.

**Micro perspective:**
This perspective shifts the focus to an individual level. Users can explore the period through the life and work of a representative artist associated with a selected thematic block. Biographical information, artistic output, and geographical movement are presented to allow users to experience Baroque ceiling painting from a personal viewpoint and to observe how artistic activity unfolds across time and space.

By combining aggregated views with individual trajectories, this data story enables users to navigate between overview and detail, encouraging independent exploration and reflection on Baroque ceiling painting within its historical context.

---

## Macro perspective
### Analysis 01: Geographic Distribution

Where are Baroque ceiling paintings concentrated across Germany?

<div id="state-distribution" class="baroque-chart"></div>

<script type="module">
(async function() {
    // Wait for database to be ready
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderStateDistribution('#state-distribution');
})();
</script>

/// details | **Show SQL Query**
    type: plain
```sql
SELECT 
    location_state,
    COUNT(*) as painting_count,
    COUNT(DISTINCT building_id) as building_count
FROM paintings
WHERE location_state IS NOT NULL
GROUP BY location_state
ORDER BY painting_count DESC
```
///

**Observation:** Bavaria and Baden-Württemberg contain the highest concentrations of Baroque ceiling paintings, reflecting the Catholic cultural sphere's emphasis on elaborate church decoration during the Counter-Reformation period.

---

### Analysis 02: Temporal Distribution

When were most ceiling paintings created?

<div id="temporal-distribution" class="baroque-chart"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderTemporalDistribution('#temporal-distribution');
})();
</script>

/// details | **Show SQL Query**
    type: plain
```sql
SELECT 
    CAST(FLOOR(year_start / 10) * 10 AS INTEGER) as decade,
    COUNT(*) as count
FROM paintings
WHERE year_start IS NOT NULL
  AND year_start >= 1500 AND year_start <= 1900
GROUP BY FLOOR(year_start / 10) * 10
ORDER BY decade
```
///

**Observation:** The peak period for Baroque ceiling painting production was between 1700-1760, coinciding with the height of the Baroque and Rococo periods in German architecture.

---

### Analysis 03: Top Painters

Who were the most prolific ceiling painters in Germany?

<div id="top-painters" class="baroque-chart"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderTopPainters('#top-painters');
})();
</script>

/// details | **Show SQL Query**
    type: plain
```sql
SELECT 
    pp.person_name,
    COUNT(DISTINCT pp.nfdi_uri) as painting_count,
    MIN(p.year_start) as earliest,
    MAX(p.year_end) as latest
FROM painting_persons pp
JOIN paintings p ON pp.nfdi_uri = p.nfdi_uri
WHERE pp.role = 'PAINTER'
GROUP BY pp.person_name
ORDER BY painting_count DESC
LIMIT 20
```
///

---

### Analysis 03b: Co-painter Relationships

Which painters most frequently appear together on the same ceiling paintings?

<div id="co-painter-pairs" class="baroque-chart"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderCoPainterPairs('#co-painter-pairs');
})();
</script>

/// details | **Show SQL Query**
    type: plain
```sql
WITH painters AS (
  SELECT nfdi_uri, person_name AS painter
  FROM painting_persons
  WHERE role='PAINTER' AND person_name IS NOT NULL
),
pairs AS (
  SELECT a.painter AS p1, b.painter AS p2, COUNT(*) AS n_co
  FROM painters a
  JOIN painters b
    ON a.nfdi_uri = b.nfdi_uri
   AND a.painter < b.painter
  GROUP BY 1,2
),
collab_counts AS (
  SELECT painter, SUM(n_co) AS total_collab
  FROM (
    SELECT p1 AS painter, n_co FROM pairs
    UNION ALL
    SELECT p2 AS painter, n_co FROM pairs
  )
  GROUP BY painter
  ORDER BY total_collab DESC
  LIMIT 50
)
SELECT p.p1, p.p2, p.n_co
FROM pairs p
WHERE p.p1 IN (SELECT painter FROM collab_counts)
  AND p.p2 IN (SELECT painter FROM collab_counts)
  AND p.n_co >= 2
ORDER BY p.n_co DESC
```
///

**Observation:** The network graph reveals clusters of closely collaborating painters. Node size reflects each painter's total number of collaborative works, while edge thickness encodes the intensity of each specific partnership. Repeated co-painter pairs suggest stable workshop teams or recurring commissions, highlighting that ceiling painting production was often network-based rather than purely individual authorship.

---

### Analysis 04: Geographic Map of Buildings

Interactive map showing the locations of buildings with ceiling paintings.

<div id="buildings-map" class="baroque-map"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderBuildingsMap('#buildings-map');
})();
</script>

**Tip:** Click on markers to see building details and painting counts. Use the zoom controls to explore specific regions.

---

### Analysis 05: ICONCLASS Subject Categories

What themes dominate Baroque ceiling paintings?

<div id="iconclass-categories" class="baroque-chart"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderIconclassCategories('#iconclass-categories');
})();
</script>

/// details | **Show SQL Query**
    type: plain
```sql
SELECT 
    SUBSTRING(s.iconclass_code, 1, 1) as category,
    COUNT(DISTINCT ps.nfdi_uri) as painting_count
FROM painting_subjects ps
JOIN subjects s ON ps.subject_uri = s.subject_uri
WHERE s.iconclass_code IS NOT NULL
GROUP BY SUBSTRING(s.iconclass_code, 1, 1)
ORDER BY painting_count DESC
```
///

**ICONCLASS Categories:**

- *0* · Abstract, Non-representational Art
- *1* · Religion and Magic
- *2* · Nature
- *3* · Human Being, Man in General
- *4* · Society, Civilization, Culture
- *5* · Abstract Ideas and Concepts
- *6* · History
- *7* · Bible
- *8* · Literature
- *9* · Classical Mythology and Ancient History

---

### Analysis 06: Cross-Dataset Comparison

Comparing CbDD ceiling paintings with Bildindex historical photographs.

<div id="cross-dataset" class="baroque-chart"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderCrossDatasetComparison('#cross-dataset');
})();
</script>

The Bildindex archive contains historical photographs of ceiling paintings, many taken before restoration or destruction during World War II. These images provide invaluable documentation of artworks that may have changed significantly over time.

---

## Interactive Query Explorer

Run your own SQL queries against the database:

<div class="duckdb-query">
    <textarea id="custom-query" class="query-editor" rows="6">SELECT 
    pp.person_name as painter,
    COUNT(*) as paintings,
    STRING_AGG(DISTINCT p.location_state, ', ') as regions
FROM painting_persons pp
JOIN paintings p ON pp.nfdi_uri = p.nfdi_uri
WHERE pp.role = 'PAINTER'
GROUP BY pp.person_name
ORDER BY paintings DESC
LIMIT 10</textarea>
    <button id="run-custom-query" class="run-query">▶ Run Query</button>
    <div id="custom-query-result" class="query-result"></div>
</div>

<script type="module">
document.getElementById('run-custom-query').addEventListener('click', async () => {
    const sql = document.getElementById('custom-query').value;
    const resultEl = document.getElementById('custom-query-result');
    const btn = document.getElementById('run-custom-query');
    
    btn.disabled = true;
    btn.textContent = 'Running...';
    
    try {
        await BaroqueViz.renderCustomQuery('#custom-query-result', sql, 'Query Results');
    } catch (error) {
        resultEl.innerHTML = `<div class="error">Query Error: ${error.message}</div>`;
    }
    
    btn.disabled = false;
    btn.textContent = '▶ Run Query';
});
</script>

### Example Queries to Try

**Paintings by decade and state:**
```sql
SELECT 
    FLOOR(year_start/10)*10 as decade,
    location_state,
    COUNT(*) as count
FROM paintings
WHERE year_start BETWEEN 1650 AND 1800
GROUP BY decade, location_state
ORDER BY decade, count DESC
```

**Buildings with most paintings:**
```sql
SELECT 
    b.label as building,
    b.location_city,
    COUNT(DISTINCT p.nfdi_uri) as paintings
FROM buildings b
JOIN paintings p ON b.building_id = p.building_id
GROUP BY b.building_id, b.label, b.location_city
ORDER BY paintings DESC
LIMIT 20
```

**Subject co-occurrences:**
```sql
SELECT 
    s1.subject_label as subject1,
    s2.subject_label as subject2,
    COUNT(*) as co_occurrences
FROM painting_subjects ps1
JOIN painting_subjects ps2 ON ps1.nfdi_uri = ps2.nfdi_uri AND ps1.subject_uri < ps2.subject_uri
JOIN subjects s1 ON ps1.subject_uri = s1.subject_uri
JOIN subjects s2 ON ps2.subject_uri = s2.subject_uri
WHERE s1.subject_source = 'ICONCLASS' AND s2.subject_source = 'ICONCLASS'
GROUP BY s1.subject_label, s2.subject_label
ORDER BY co_occurrences DESC
LIMIT 20
```

---

## Technical Notes

### Data Sources

- **CbDD**: Corpus of Baroque Ceiling Painting in Germany, accessed via NFDI4Culture Knowledge Graph
- **Bildindex**: Historical photograph archive from Bildindex der Kunst und Architektur

### Technology Stack

- **DuckDB WASM**: Client-side analytical database (~16MB)
- **Plotly.js**: Interactive charts and visualizations
- **Leaflet**: Geographic mapping with marker clustering
- **DataTables**: Sortable, searchable result tables

### Database Schema

| Table | Rows | Description |
|-------|------|-------------|
| `paintings` | 4,594 | Ceiling paintings with metadata |
| `persons` | 2,831 | Artists, architects, patrons |
| `buildings` | 1,260 | Churches, palaces, castles |
| `rooms` | 2,376 | Specific rooms within buildings |
| `subjects` | 4,082 | ICONCLASS + Getty AAT subjects |
| `painting_persons` | 5,848 | Painting ↔ Person relations |
| `painting_subjects` | 17,474 | Painting ↔ Subject relations |
| `bi_items` | 968 | Bildindex historical photos |

---

## Micro perspective

Pick one of the 3 "lenses" below to dive deep into a thematic perspective on Baroque ceiling painting. Each topic opens a full, richly illustrated exploration — click to enter, and use the back button to return here.

<!-- ═══════════════════════════════════════════════════════════════════════
     TOPIC SELECTOR — CSS + HTML + JS
     ═══════════════════════════════════════════════════════════════════ -->

<style>
/* ── Topic Selector Grid ─────────────────────────────────────────────── */
.topic-selector{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin:2.5rem 0 1rem}
@media(max-width:840px){.topic-selector{grid-template-columns:1fr}}

.topic-card{
    position:relative;overflow:hidden;border-radius:14px;
    padding:2.2rem 1.8rem 1.8rem;cursor:pointer;
    transition:transform .25s,box-shadow .25s;
    display:flex;flex-direction:column;align-items:center;text-align:center;
    border:2px solid transparent;min-height:220px;
}
.topic-card:hover{transform:translateY(-6px);box-shadow:0 12px 32px rgba(0,0,0,.18)}

.topic-card .topic-icon{font-size:3rem;margin-bottom:.6rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,.2))}
.topic-card .topic-title{font-family:'Nantes-Bold',serif;font-size:1.35rem;margin-bottom:.55rem;letter-spacing:.02em}
.topic-card .topic-desc{font-size:.88rem;line-height:1.45;opacity:.92}
.topic-card .topic-enter{
    margin-top:auto;padding:.45rem 1.4rem;border-radius:20px;
    font-size:.82rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
    border:2px solid currentColor;background:transparent;cursor:pointer;
    transition:background .2s,color .2s;margin-top:1rem;
}
.topic-card:hover .topic-enter{background:rgba(255,255,255,.25)}

/* Card colour themes */
.topic-card--church{
    background:linear-gradient(135deg,#b8860b 0%,#daa520 50%,#c9920e 100%);
    color:#fff;border-color:#a07610;
}
.topic-card--society{
    background:linear-gradient(135deg,#1a6b52 0%,#2e9e7a 50%,#1e8265 100%);
    color:#fff;border-color:#14503e;
}
.topic-card--mythology{
    background:linear-gradient(135deg,#4a2d7a 0%,#6c3fad 50%,#5a3595 100%);
    color:#fff;border-color:#3d2466;
}

/* ── Deep-dive wrapper (hidden by default) ───────────────────────────── */
.micro-topic{display:none;animation:topicFadeIn .45s ease}
@keyframes topicFadeIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}

/* Back-to-topics banner */
.topic-back-bar{
    position:sticky;top:0;z-index:100;
    display:flex;align-items:center;gap:.7rem;
    padding:.65rem 1.2rem;border-radius:0 0 10px 10px;
    font-weight:700;font-size:.88rem;cursor:pointer;
    transition:opacity .2s;margin-bottom:1.5rem;
    border:none;width:100%;text-align:left;
}
.topic-back-bar:hover{opacity:.85}
.topic-back-bar .back-arrow{font-size:1.1rem}

.topic-back-bar--church{background:#daa520;color:#fff}
.topic-back-bar--society{background:#2e9e7a;color:#fff}
.topic-back-bar--mythology{background:#6c3fad;color:#fff}

/* Colour accent bar at top of each deep-dive */
.micro-topic--church{border-top:5px solid #daa520}
.micro-topic--society{border-top:5px solid #2e9e7a}
.micro-topic--mythology{border-top:5px solid #6c3fad}
</style>

<div id="topic-selector" class="topic-selector">

  <div class="topic-card topic-card--church" onclick="openMicroTopic('church')">
    <div class="topic-icon">⛪</div>
    <div class="topic-title">Church &amp; Religion</div>
    <div class="topic-desc">Explore how faith, divine order, and the supernatural shaped Baroque ceiling iconography across Germany.</div>
    <button class="topic-enter">Enter ➜</button>
  </div>

  <div class="topic-card topic-card--society" onclick="openMicroTopic('society')">
    <div class="topic-icon">🏰</div>
    <div class="topic-title">Society &amp; Culture</div>
    <div class="topic-desc">Discover how aristocratic rituals, courtly life, and social hierarchies were depicted on Baroque ceilings.</div>
    <button class="topic-enter">Enter ➜</button>
  </div>

  <div class="topic-card topic-card--mythology" onclick="openMicroTopic('mythology')">
    <div class="topic-icon">🏛️</div>
    <div class="topic-title">Classical Mythology</div>
    <div class="topic-desc">Uncover how ancient myths legitimised rulers and celebrated the arts in grand palace frescoes.</div>
    <button class="topic-enter">Enter ➜</button>
  </div>

</div>

<script>
/* ── Topic selector logic ──────────────────────────────────────────── */
function openMicroTopic(id){
    document.getElementById('topic-selector').style.display='none';
    document.querySelectorAll('.micro-topic').forEach(el=>el.style.display='none');
    const target=document.getElementById('topic-'+id);
    if(target){
        target.style.display='block';
        target.scrollIntoView({behavior:'smooth',block:'start'});
        /* re-trigger any Plotly / Leaflet charts that need a resize */
        setTimeout(()=>window.dispatchEvent(new Event('resize')),400);
    }
}
function backToTopics(){
    document.querySelectorAll('.micro-topic').forEach(el=>el.style.display='none');
    const sel=document.getElementById('topic-selector');
    sel.style.display='grid';
    sel.scrollIntoView({behavior:'smooth',block:'start'});
}
</script>

<!-- ═══════════════════════════════════════════════════════════════════════
     TOPIC 1 — CHURCH & RELIGION
     ═══════════════════════════════════════════════════════════════════ -->
<div id="topic-church" class="micro-topic micro-topic--church" markdown="1">

<button class="topic-back-bar topic-back-bar--church" onclick="backToTopics()">
  <span class="back-arrow">←</span> Back to Topic Selector
</button>

<a id="analysis-church"></a>

## Church and Religion in Baroque Ceiling Paintings

Religious and spiritual themes played a central role in Baroque visual culture.  
Ceiling paintings in the 17th and 18th centuries were not only decorative, but also served as powerful visual narratives that communicated ideas about faith, the cosmos, divine order, and the supernatural.

Beyond institutional religion, Baroque imagery also reflects a broader early modern worldview that included:
- symbolic representations of creation and the universe,
- different religious traditions,
- beliefs in miracles, magic, and supernatural forces,
- and interest in astrology and cosmic influence.

This micro perspective explores **ICONCLASS 1 (Religion & Magic)** and its five major sub-branches:

- **10** · creation, cosmos, universe, life (symbolic representations)  
- **11** · Christian religion  
- **12** · non-Christian religions  
- **13** · magic, supernaturalism, occultism  
- **14** · astrology  

Use the selector below to explore how each subtheme differs in:
- **Where** it concentrates (regional distribution)
- **When** it peaks (temporal trends)
- **Who** paints it most often (representative painters and sample works)

All counts refer to **distinct paintings (nfdi_uri)**, even if a painting has multiple subject tags.

Together, these categories illustrate how Baroque ceiling paintings visualized a comprehensive early modern worldview — one that connected institutional religion with ideas about the cosmos, divine order, and supernatural forces.

The following interactive exploration reveals how these themes were structured in space, time, and artistic production.

#### Regional patterns

This regional clustering suggests that Baroque ceiling painting was supported by stable local patronage networks and artistic centers rather than being a uniformly distributed artistic practice.

<!-- =========================
     RELIGION MICRO DASHBOARD (ICONCLASS 10–14)
     - Subtheme tabs (10..14), default 11
     - Core counts + 2 charts + gallery + representative painter card
========================= -->

#### Exploring thematic structures

Use the dashboard below to compare the five subthemes of ICONCLASS 1.  
For each category, the data reveals:

- overall scale of production,
- regional concentration,
- periods of peak activity,
- and the painters most strongly associated with the theme.

Together, these indicators show how different aspects of religious and spiritual imagery were embedded in the artistic system of the Baroque period.


<div class="rel-wrap">
  <div class="rel-header">
    <div class="rel-title">
      <span id="rel-title-main">Christian Religion</span>
      <span class="rel-sub">(ICONCLASS <span id="rel-prefix">11</span>)</span>
    </div>

    <div class="rel-controls">
      <label class="rel-label">Gallery size:</label>
      <select id="rel-gallery-n" class="rel-select">
        <option>4</option>
        <option selected>6</option>
        <option>8</option>
        <option>12</option>
      </select>
    </div>
  </div>

  <!-- Tabs -->
  <div class="rel-tabs" id="rel-tabs"></div>

  <!-- Core counts -->
  <section class="rel-card rel-corewide">
    <div class="rel-card-title">Core counts (selected subtheme)</div>
    <table class="rel-table">
      <thead>
        <tr><th>Metric</th><th style="text-align:right">Value</th></tr>
      </thead>
      <tbody id="rel-core-body">
        <tr><td>Paintings</td><td style="text-align:right">…</td></tr>
        <tr><td>Painters (role=PAINTER)</td><td style="text-align:right">…</td></tr>
        <tr><td>States</td><td style="text-align:right">…</td></tr>
        <tr><td>Buildings</td><td style="text-align:right">…</td></tr>
      </tbody>
    </table>
    <div class="rel-note">
      We filter by <b>subject_uri LIKE '%iconclass.org/&lt;prefix&gt;%'</b>.  
      Example: prefix <b>11</b> matches codes such as <b>11D…</b>.
    </div>
  </section>

<h4>Temporal development</h4>

<p>
Across subthemes, most production concentrates between <strong>1700 and 1750</strong>, the high period of Baroque and early Rococo art.  
This phase reflects a period of intensive investment in monumental interior decoration, when churches, monasteries, and courts used ceiling painting to shape powerful visual environments.
</p>

  <!-- Charts -->
  <div class="rel-grid-2">
    <section class="rel-card">
      <div class="rel-card-title">Where does it concentrate?</div>
      <div id="rel-state-chart" class="baroque-chart"></div>
      <div class="rel-hint">Top states by number of paintings.</div>
    </section>

    <section class="rel-card">
      <div class="rel-card-title">When does it peak?</div>
      <div id="rel-timeline-chart" class="baroque-chart"></div>
      <div class="rel-hint">Paintings by decade (1600–1800).</div>
    </section>
  </div>

  <!-- Gallery -->
  <section class="rel-card" style="margin-top:14px;">
    <div class="rel-card-title">Sample paintings (click to open in CbDD)</div>
    <div id="rel-gallery" class="baroque-gallery"></div>
  </section>

  <!-- Representative painter -->

<h4>Artistic production</h4>

<p>
The data shows that thematic production was often dominated by a limited number of highly active painters.  
This pattern reflects the workshop-based organization of Baroque art, where experienced decorative specialists received repeated commissions across multiple buildings and regions.
</p>

  <section class="rel-card" style="margin-top:14px;">
    <div class="rel-card-title">Representative painter (most frequent in this subtheme)</div>
    <div id="rel-painter-card">Loading…</div>
  </section>
</div>

<style>
  .rel-wrap{ margin: 10px 0 26px; }
  .rel-header{
    display:flex; align-items:flex-end; justify-content:space-between;
    gap:14px; margin-bottom: 10px;
  }
  .rel-title{ font-weight:800; font-size:18px; line-height:1.2; }
  .rel-sub{ font-weight:600; font-size:13px; opacity:.65; margin-left:8px; }

  .rel-controls{ display:flex; align-items:center; gap:8px; }
  .rel-label{ font-size:13px; opacity:.7; }
  .rel-select{
    border: 1px solid rgba(0,0,0,.18);
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 14px;
    background: white;
  }

  .rel-tabs{ display:flex; flex-wrap:wrap; gap:8px; margin: 8px 0 14px; }
  .rel-tab{
    border: 1px solid rgba(0,0,0,.14);
    border-radius: 999px;
    padding: 7px 10px;
    font-size: 13px;
    background: rgba(255,255,255,.92);
    cursor:pointer;
    user-select:none;
    transition: transform .05s ease, box-shadow .12s ease, border-color .12s ease;
  }
  .rel-tab:hover{ box-shadow: 0 8px 18px rgba(0,0,0,.06); border-color: rgba(0,0,0,.22); }
  .rel-tab:active{ transform: scale(.99); }
  .rel-tab.is-active{
    border-color: rgba(20,110,200,.55);
    box-shadow: 0 10px 22px rgba(20,110,200,.12);
  }

  .rel-card{
    border-radius: 16px;
    background: rgba(255,255,255,.92);
    box-shadow: 0 6px 24px rgba(0,0,0,.06);
    padding: 14px;
  }
  .rel-card-title{ font-weight:800; margin-bottom:10px; }
  .rel-corewide{ width:100%; margin-bottom: 14px; }

  .rel-grid-2{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    align-items: start;
  }

  .rel-table{ width:100%; border-collapse: collapse; font-size: 14px; }
  .rel-table th{
    text-align:left;
    font-size: 12.5px;
    letter-spacing:.01em;
    opacity:.65;
    border-bottom: 1px solid rgba(0,0,0,.10);
    padding: 8px 4px;
  }
  .rel-table td{ padding: 10px 4px; border-bottom: 1px solid rgba(0,0,0,.06); }
  .rel-note{ margin-top: 10px; font-size: 12.5px; opacity: .65; }
  .rel-hint{ margin-top: 6px; font-size: 12.5px; opacity: .65; }

  @media (max-width: 980px){
    .rel-grid-2{ grid-template-columns: 1fr; }
  }
</style>

<script type="module">
(async function(){
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const $ = (id) => document.getElementById(id);

  while (typeof BaroqueDB === 'undefined' || !BaroqueDB.isReady || !BaroqueDB.isReady()){
    await wait(100);
  }

  // --- Subtheme labels (ICONCLASS 1 → 10..14) ---
  const REL_LABELS = {
    '10': '(symbolic) creation, cosmos, universe, life',
    '11': 'Christian religion',
    '12': 'non-Christian religions',
    '13': 'magic, supernaturalism, occultism',
    '14': 'astrology'
  };

  let currentPrefix = '11';

  // Render tabs
  const tabsEl = $('rel-tabs');
  tabsEl.innerHTML = Object.keys(REL_LABELS).map(p => `
    <div class="rel-tab ${p===currentPrefix ? 'is-active':''}" data-prefix="${p}">
      ${p} · ${REL_LABELS[p]}
    </div>
  `).join('');

  function setActiveTab(){
    for (const el of tabsEl.querySelectorAll('.rel-tab')){
      el.classList.toggle('is-active', el.dataset.prefix === currentPrefix);
    }
    $('rel-title-main').textContent = REL_LABELS[currentPrefix] || 'ICONCLASS';
    $('rel-prefix').textContent = currentPrefix;
  }

  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[c]));
  }

  async function query(sql){ return await BaroqueDB.query(sql); }

  function iconclassPrefixCTE(){
    return `
      WITH rel_paintings AS (
        SELECT DISTINCT ps.nfdi_uri
        FROM painting_subjects ps
        JOIN subjects s ON ps.subject_uri = s.subject_uri
        WHERE s.subject_source='ICONCLASS'
          AND s.subject_uri LIKE '%iconclass.org/${currentPrefix}%'
      )
    `;
  }

  async function refresh(){
    setActiveTab();

    const galleryN = parseInt($('rel-gallery-n').value, 10);

    // 1) Core counts
    const core = await query(`
      ${iconclassPrefixCTE()}
      SELECT
        (SELECT COUNT(*) FROM rel_paintings) AS paintings,
        (SELECT COUNT(DISTINCT pp.person_name)
           FROM painting_persons pp
           JOIN rel_paintings rp ON rp.nfdi_uri=pp.nfdi_uri
          WHERE pp.role='PAINTER' AND pp.person_name IS NOT NULL) AS painters,
        (SELECT COUNT(DISTINCT p.location_state)
           FROM paintings p
           JOIN rel_paintings rp ON rp.nfdi_uri=p.nfdi_uri
          WHERE p.location_state IS NOT NULL AND p.location_state <> '') AS states,
        (SELECT COUNT(DISTINCT p.building_name)
           FROM paintings p
           JOIN rel_paintings rp ON rp.nfdi_uri=p.nfdi_uri
          WHERE p.building_name IS NOT NULL AND p.building_name <> '') AS buildings
    `);
    const c = core?.[0] || {paintings:0,painters:0,states:0,buildings:0};
    $('rel-core-body').innerHTML = `
      <tr><td>Paintings (ICONCLASS ${currentPrefix}…)</td><td style="text-align:right"><b>${c.paintings ?? 0}</b></td></tr>
      <tr><td>Painters (role=PAINTER)</td><td style="text-align:right"><b>${c.painters ?? 0}</b></td></tr>
      <tr><td>States</td><td style="text-align:right"><b>${c.states ?? 0}</b></td></tr>
      <tr><td>Buildings</td><td style="text-align:right"><b>${c.buildings ?? 0}</b></td></tr>
    `;

    // 2) State distribution (top 12)
    const byState = await query(`
      ${iconclassPrefixCTE()}
      SELECT
        p.location_state AS state,
        COUNT(DISTINCT p.nfdi_uri) AS painting_count
      FROM paintings p
      JOIN rel_paintings rp ON rp.nfdi_uri = p.nfdi_uri
      WHERE p.location_state IS NOT NULL AND p.location_state <> ''
      GROUP BY p.location_state
      ORDER BY painting_count DESC
      LIMIT 12
    `);

    Plotly.newPlot($('rel-state-chart'), [{
      x: byState.map(d => d.painting_count),
      y: byState.map(d => d.state),
      type: 'bar',
      orientation: 'h',
      hovertemplate: '%{y}<br>%{x} paintings<extra></extra>'
    }], {
      margin: {l: 140, r: 20, t: 20, b: 40},
      height: 360,
      xaxis: {title: 'Paintings'},
      yaxis: {automargin: true}
    }, {responsive: true});

    // 3) Timeline by decade (1600–1800)
    const byDecade = await query(`
      ${iconclassPrefixCTE()}
      SELECT
        CAST(FLOOR(p.year_start/10)*10 AS INTEGER) AS decade,
        COUNT(DISTINCT p.nfdi_uri) AS painting_count
      FROM paintings p
      JOIN rel_paintings rp ON rp.nfdi_uri = p.nfdi_uri
      WHERE p.year_start IS NOT NULL AND p.year_start BETWEEN 1600 AND 1800
      GROUP BY FLOOR(p.year_start/10)*10
      ORDER BY decade
    `);

    Plotly.newPlot($('rel-timeline-chart'), [{
      x: byDecade.map(d => d.decade),
      y: byDecade.map(d => d.painting_count),
      type: 'bar',
      hovertemplate: '%{x}s<br>%{y} paintings<extra></extra>'
    }], {
      margin: {l: 60, r: 20, t: 20, b: 60},
      height: 360,
      xaxis: {title: 'Decade', tickangle: -45},
      yaxis: {title: 'Paintings'}
    }, {responsive: true});

    // 4) Gallery
    const gallery = await query(`
      ${iconclassPrefixCTE()}
      SELECT DISTINCT
        p.nfdi_uri,
        p.label,
        p.painters,
        p.year_start,
        p.building_name,
        p.imageUrl
      FROM paintings p
      JOIN rel_paintings rp ON rp.nfdi_uri = p.nfdi_uri
      WHERE p.imageUrl IS NOT NULL AND p.imageUrl <> ''
      ORDER BY p.year_start
      LIMIT ${galleryN}
    `);

    $('rel-gallery').innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px;">
        ${gallery.map(g => `
          <figure style="margin:0; border: 1px solid rgba(0,0,0,.12); border-radius: 12px; overflow:hidden; background: white;">
            <a href="${g.nfdi_uri}" target="_blank" rel="noopener">
              <img src="${g.imageUrl}" alt="${esc(g.label)}" style="width:100%; height: 160px; object-fit: cover;">
            </a>
            <figcaption style="padding:10px; font-size:.85em; line-height:1.35;">
              <strong style="display:block; margin-bottom:4px;">${esc(g.label)}</strong>
              <span style="opacity:.75">${esc(g.painters || 'Unknown')} · ${g.year_start || '?'}<br>${esc(g.building_name || '')}</span>
            </figcaption>
          </figure>
        `).join('')}
      </div>
    `;

    // 5) Representative painter (most frequent)
    const topPainter = await query(`
      ${iconclassPrefixCTE()}
      SELECT
        pp.person_name AS painter,
        COUNT(DISTINCT pp.nfdi_uri) AS painting_count
      FROM painting_persons pp
      JOIN rel_paintings rp ON rp.nfdi_uri = pp.nfdi_uri
      WHERE pp.role='PAINTER' AND pp.person_name IS NOT NULL AND pp.person_name <> ''
      GROUP BY pp.person_name
      ORDER BY painting_count DESC
      LIMIT 1
    `);

    const painterName = topPainter?.[0]?.painter;
    if (!painterName){
      $('rel-painter-card').innerHTML = '<div class="ic-empty">No painter found for this subtheme.</div>';
    } else {
      await BaroqueViz.renderPainterBiography('#rel-painter-card', painterName);
    }
  }

  // Events
  tabsEl.addEventListener('click', (e) => {
    const t = e.target.closest('.rel-tab');
    if (!t) return;
    currentPrefix = t.dataset.prefix;
    refresh();
  });
  $('rel-gallery-n').addEventListener('change', refresh);

  refresh();
})();
</script>

### What does this reveal?

The patterns across theme, region, time, and artistic activity show that religious ceiling painting was not a random collection of images, but part of a structured cultural system.

Baroque religious imagery was:
- geographically concentrated,
- historically time-bound,
- and produced within specialized artistic networks.

Together, these works formed a coordinated visual language that expressed how early modern society understood religion, the universe, and the relationship between the earthly and the divine.

</div><!-- /topic-church -->

<!-- ═══════════════════════════════════════════════════════════════════════
     TOPIC 2 — SOCIETY & CULTURE
     ═══════════════════════════════════════════════════════════════════ -->
<div id="topic-society" class="micro-topic micro-topic--society" markdown="1">

<button class="topic-back-bar topic-back-bar--society" onclick="backToTopics()">
  <span class="back-arrow">←</span> Back to Topic Selector
</button>

<a id="analysis-society"></a>

## Society & Culture

In der Barockzeit war die Jagd ein exklusives Vorrecht des Adels und ein repräsentatives Standessymbol, während die Bevölkerung keinerlei Jagdrechte besaß und sogar unter Verboten sowie Frondiensten für die höfischen Jagden litt. Die eigentliche Wildpflege und Alltagsjagd erledigten angestellte Jäger, während der Adel die Jagd vor allem als prunkvolles gesellschaftliches Ereignis inszenierte (vgl.http://barockjagd.de/jagen-vor-250-jahren/index.html#:~:text=Sein%20Plaisier%20fand%20der%20Adel,Fest%20mit%20viel%20Prunk%20zelebriert.)

Diese Ins




</div><!-- /topic-society -->

<!-- ═══════════════════════════════════════════════════════════════════════
     TOPIC 3 — CLASSICAL MYTHOLOGY
     ═══════════════════════════════════════════════════════════════════ -->
<div id="topic-mythology" class="micro-topic micro-topic--mythology" markdown="1">

<button class="topic-back-bar topic-back-bar--mythology" onclick="backToTopics()">
  <span class="back-arrow">←</span> Back to Topic Selector
</button>

<a id="analysis-mythology"></a>

## Classical Mythology

The Baroque era in German-speaking lands produced a dazzling array of ceiling and wall paintings filled with scenes from classical mythology. These grand frescoes and allegorical programs served not merely as decoration, but as visual sermons of princely virtue, power, and Enlightenment ideals. Commissioned for palaces and grand halls, they wove ancient myths into the narrative of contemporary rulers – celebrating peace after war, exalting dynastic glory, and extolling the arts and sciences. In this data-driven exploration, we trace a red thread through several emblematic Baroque interiors in Germany, uncovering how mythology was employed to transform architecture into theatre of statecraft. From the Olympian gods on the ceilings of Munich’s Nymphenburg Palace to Ovid’s metamorphic tales in a Thuringian castle, these case studies reveal a common language of allegory that early modern patrons used to legitimize and immortalize their reigns. We also examine how the tempo of artistic commissions rose and fell with historical tides – ravaging wars followed by renewed prosperity – and briefly highlight two Italian masters behind these works. The result is a panoramic story of Baroque mythological imagery, presented in academic depth yet accessible and engaging.

<style>
/* ── Mythology Intro Gallery ──────────────────────────────────────────── */
.myth-intro__toolbar{
    display:flex;justify-content:flex-end;margin-bottom:.6rem;
}
.myth-intro__refresh{
    display:inline-flex;align-items:center;gap:6px;
    padding:6px 16px;border-radius:20px;
    border:2px solid #6c3fad;background:transparent;color:#6c3fad;
    font-weight:700;font-size:.82rem;cursor:pointer;
    transition:background .2s,color .2s;
}
.myth-intro__refresh:hover{background:#6c3fad;color:#fff}
@keyframes mythSpin{to{transform:rotate(360deg)}}
.myth-intro__refresh-icon{font-size:1.1rem;display:inline-block}

.myth-intro__grid{
    display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;
}
@media(max-width:840px){.myth-intro__grid{grid-template-columns:1fr}}

.myth-intro__card{
    border-radius:12px;overflow:hidden;cursor:pointer;
    border:2px solid rgba(108,63,173,.25);
    transition:transform .2s,box-shadow .2s;
    background:#faf8ff;
}
.myth-intro__card:hover{
    transform:translateY(-4px);
    box-shadow:0 8px 24px rgba(108,63,173,.18);
    border-color:rgba(108,63,173,.5);
}
.myth-intro__img-wrap{
    position:relative;overflow:hidden;height:210px;
}
.myth-intro__img-wrap img{
    width:100%;height:100%;object-fit:cover;
    transition:transform .35s;
}
.myth-intro__card:hover .myth-intro__img-wrap img{
    transform:scale(1.05);
}
.myth-intro__overlay{
    position:absolute;inset:0;
    display:flex;align-items:center;justify-content:center;
    background:rgba(74,45,122,.55);color:#fff;
    font-weight:700;font-size:.85rem;opacity:0;
    transition:opacity .25s;
}
.myth-intro__card:hover .myth-intro__overlay{opacity:1}
.myth-intro__caption{
    padding:10px 12px;font-size:.85rem;line-height:1.4;
}
.myth-intro__meta{color:#666;font-size:.82rem}

/* Detail card */
.myth-intro__detail{
    margin-top:1rem;animation:topicFadeIn .35s ease;
}
.myth-intro__detail-card{
    position:relative;margin:0;border:2px solid #6c3fad;
    border-radius:12px;overflow:hidden;background:#faf8ff;
    box-shadow:0 6px 24px rgba(108,63,173,.12);
}
.myth-intro__detail-close{
    position:absolute;top:10px;right:12px;z-index:2;
    width:30px;height:30px;border-radius:50%;
    border:none;background:rgba(0,0,0,.55);color:#fff;
    font-size:1rem;cursor:pointer;display:flex;
    align-items:center;justify-content:center;
    transition:background .2s;
}
.myth-intro__detail-close:hover{background:rgba(0,0,0,.8)}
.myth-intro__detail-body{
    display:grid;grid-template-columns:1fr 1fr;min-height:260px;
}
@media(max-width:700px){.myth-intro__detail-body{grid-template-columns:1fr}}
.myth-intro__detail-img img{
    width:100%;height:100%;object-fit:cover;
}
.myth-intro__detail-info{
    padding:18px 20px;font-size:.9rem;line-height:1.6;color:#444;
}
.myth-intro__detail-meta div{margin-bottom:4px}
.myth-intro__detail-link{
    display:inline-block;margin-top:12px;padding:6px 16px;
    border-radius:20px;border:2px solid #6c3fad;
    color:#6c3fad;font-weight:700;font-size:.82rem;
    text-decoration:none;transition:background .2s,color .2s;
}
.myth-intro__detail-link:hover{background:#6c3fad;color:#fff}
</style>

<div id="mythology-intro-gallery"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderMythologyIntroGallery('#mythology-intro-gallery', { count: 3 });
})();
</script>


### Nymphenburg Palace: An Olympian Vision of Peace and Prosperity

The ceiling of the Steinerner Saal (Stone Hall) at Nymphenburg Palace presents an Olympian assembly celebrating the return of a golden age of peace. Painted by Johann Baptist Zimmermann in 1755–57, this monumental fresco – framed by lush Rococo stucco – allegorically links the reign of the Bavarian elector to a time of prosperity and plenty.

Nymphenburg Palace was founded in 1664 as a summer residence for Elector Ferdinand Maria of Bavaria and his wife Henriette Adelaide, to celebrate the birth of their heir Max Emanuel. The central pavilion (the core of today’s palace) was constructed in the late 1660s, but major expansions stalled during subsequent conflicts. For example, during the War of the Spanish Succession, after Bavaria’s defeat at the Battle of Höchstädt in 1704, work on Nymphenburg was halted – at that point only the main pavilion and one wing were habitable. It was only after peace was restored and Elector Max Emanuel returned from exile in 1715 that construction resumed with renewed vigor. By the mid-18th century, Max Emanuel’s grandson Max III. Joseph undertook a final magnificent refurbishment of the palace’s great hall, the Steinerner Saal, to serve as the symbolic heart of his court.

Under Max III. Joseph’s patronage, between 1755 and 1758 the aging Johann Baptist Zimmermann – one of Bavaria’s premier fresco painters – created his last masterpiece on the ceiling of the Steinerner Saal. This vast composition is explicitly allegorical. “Alluding to the ruler’s duty to bring and preserve peace, the huge ceiling painting depicts the Olympian sky”, notes the official palace description. In the center, the gods of Mount Olympus convene under a radiant sky, celebrating the restoration of peace and prosperity under the Elector’s enlightened rule. Jupiter presides, while Apollo in his sun chariot brings light – a reference to the elector as a sun bringing enlightenment to his lands. On the west side of the fresco (facing the gardens), a train of cheerful nymphs pays homage to Flora, a nymph-turned-goddess of flowering abundance, which pointedly nods to the palace’s name (Nymphenburg, “castle of the nymphs”) and its idyllic park.

Surrounding the central scene are smaller mythological vignettes that reinforce the message of peace and flourishing. For instance, one corner shows Mars and Venus, an allegory of love triumphing over war; another panel depicts Zephyr and Flora, symbolizing gentle winds and springtime fecundity. We also find Fama and Clio (the personifications of Fame and History) – suggesting that the fame of the Wittelsbach dynasty will be recorded for posterity – and Astronomy and Urania (muse of astronomy), underscoring patronage of knowledge and science. Even cautionary tales appear: the fresco cycle includes Latona turning the Lycian peasants into frogs (a myth about disrespect to the divine), perhaps as a moral reminder to viewers, and playful putti (cherubs) at play, symbolizing the joy and innocence of a peaceful era. Together, these seven mythological scenes and the colossal central tableau form a visual hymn to the Wohlstand und Blüte des Landes im Frieden – the prosperity and blossoming of the land in peace, as contemporary sources described the theme. Zimmermann’s ceiling, completed in 1758, remained untouched through the centuries and still today greets visitors with its authentic Rococo splendor, a testament to how Baroque art glorified peace after turmoil.

<div id="steinerer-saal-card" class="room-card-container"></div>

![Schloss Nymphenburg, Steinerer Saal Hauptfresko: Wohlstand und Blüte des Landes im Frieden](München Schloss Nymphenburg.jpg) 
*caption: Schloss Nymphenburg, Steinerer Saal Hauptfresko: Wohlstand und Blüte des Landes im Frieden (c) CbDD*

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderRoomCard('#steinerer-saal-card', 'ca990351-642b-4739-9753-59c5f7c1da1f');
})();
</script>

### Mannheim Palace: Epic Tales of Destiny and Dynasty

While Nymphenburg’s frescoes celebrated peace and plenty, elsewhere mythological paintings carried more martial and dynastic themes. In the Electoral Palace of Mannheim, built in the 1720s–30s, Elector Carl Philipp of the Palatinate commissioned grand ceiling paintings to decorate the main stairhall (Haupttreppenhaus) and adjoining state rooms. The task fell to the renowned Bavarian artist Cosmas Damian Asam. Between 1729 and 1730, Asam executed a trilogy of frescos for the stairhall that drew upon Virgil’s epic Aeneid and related myths, creating an erudite iconographic program that linked the Elector’s lineage to the heroes and gods of antiquity.

At the center of the Mannheim stairway ceiling shone “Das Urteil des Paris” – the Judgment of Paris, a scene that set in motion the events of the Trojan War and eventually the founding of Rome. Asam’s original fresco (signed “Cosmas D. Asam von München 1730”) was destroyed in World War II, but descriptions and reconstructions allow us to envision its content. Paris, depicted as a shepherd prince under a tree, is approached by Mercury (Hermes) delivering the gods’ command that he choose the fairest goddess. Before Paris stand the three goddesses contending for the golden apple: Juno (Hera) with her peacock, Venus (Aphrodite) receiving the prize apple of victory, and Minerva (Athena) off to the side with her attendant nymphs. A winged figure of Fama brings a wreath to crown Venus as the victor in this fateful beauty contest. By including this scene, the fresco symbolically alluded to the origins of the Trojan War – an epic conflict that ultimately led, via Aeneas, to the rise of Rome and thus (by medieval extension) to the ancestry of European rulers. It was a subtle way for the Palatine Elector to insert his rule into the grand sweep of classical destiny.

<div id="parisurteil-card" class="painting-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPaintingCard('#parisurteil-card', '56698022-bbf7-4859-94b5-10646493da8e');
})();
</script> 

Flanking the central Paris panel were two large oval tondi with further episodes from the Aeneid saga, one on each side of the ceiling vault. On the eastern side, Asam painted “Venus and Aeneas in the Forge of Vulcan”: the goddess Venus, mother of Aeneas, persuades Vulcan to forge weapons for her son before he goes to war. In Asam’s rendition, Venus descends from her swan-drawn chariot and sits enthroned at the center, accompanied by the youthful hero Aeneas and the smith-god Vulcan himself. Around them bustle Cyclops and helpers carrying a heavy shield, while in the background three elegant ladies in modern baroque court dress watch the scene – a charming anachronism, these were likely meant to represent the three granddaughters of Elector Carl Philipp, thus tying the ancient myth to the living dynasty. On the western side, the fresco “Juno, Aeolus and the Storm at Sea” portrayed an episode where Juno, queen of the gods, enlists Aeolus, god of the winds, to wreck Aeneas’s fleet at sea. Asam depicted Juno enthroned under a billowing canopy with her peacocks, gesturing commandingly to Aeolus on a rocky shore; below them, muscular personifications of the winds and waters are shown unleashing a tempest – putti stoke storms, river-gods pour out floods from urns. This dramatic scene of divine wrath balanced the Venus vignette across the hall, illustrating both divine favor and divine opposition in Aeneas’s journey.

Taken together, Mannheim’s stairhall paintings formed a three-part narrative: the Judgment of Paris (the cause of the Trojan War) in the center, flanked by Aeneas’s divine aid (Venus and Vulcan) and trials (Juno’s storm) on either side. The choice of these subjects was rich in meaning. The Aeneid was a favored source in Baroque art because Aeneas, legendary survivor of Troy and ancestor of the Romans, was seen as a model of pietas (duty) and the mythical forefather of rulers (even the Habsburgs traced lineage to him). By having Asam paint Aeneas’s story, Elector Carl Philipp aligned himself with this hero’s virtues and destiny. Contemporary guidelines on fresco programs advised that depictions of ancient battles and adventures could “through their examples incite the viewer to virtuous life”, and Virgil’s epic was considered especially apt for its themes of heroism, founding a new homeland, and devotion to the gods. Mannheim’s implementation was accordingly didactic: the viewer ascending the grand staircase would see, step by step, how gods and heroes shaped the Elector’s illustrious antecedents, implicitly urging loyalty and bravery.

<div id="mannheim-treppenhaus-card" class="room-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderRoomCard('#mannheim-treppenhaus-card', '7430f064-80a8-4b74-b447-55c655cfab4e');
})();
</script>

It is notable that Cosmas Damian Asam’s originals were lost to wartime fires in the 1940s, but the ceiling paintings were later reconstructed (1955–61) by artist Carolus Vocke using surviving photographs. While Vocke’s secco reproductions lack some of Asam’s original vibrancy and Baroque dynamism – one critic found the modern colors “cool and dry, without radiance” – the iconography was preserved intact. Today, visitors can once again admire Paris with his golden apple and Aeneas amid the gods on the ceiling of Mannheim’s reconstructed staircase, a modern echo of the Baroque ambition to connect local dynastic glory with epic myth.



### Arolsen Castle: Apollo and the Muses – Patronage of the Arts

Not all Baroque mythological ceilings emphasized war or political allegory; some celebrated cultural enlightenment and the arts themselves. A case in point is the Residenzschloss Arolsen in Hesse, residence of the Princes of Waldeck. Built largely in the early 18th century (construction from 1713 to 1728, with interiors continuing into the 1740s), Arolsen’s design included a splendid Gartensaal (Garden Hall) also known as the Steinerner Saal. Around 1721–1722, the Italian painter Carlo Ludovico Castelli was commissioned to decorate the vaulted ceiling of this hall with a fresco that exalts the arts and sciences in classical guise.

Castelli’s ceiling painting in Arolsen’s Garden Hall depicts Apollo, the god of light and the arts, accompanied by the nine Muses. The composition shows Apollo seated at the center on an elevated cloud, strumming his lyre as leader of the Muses, who array themselves around him on the billowing clouds of Mount Parnassus. A key detail is the inclusion of Pegasus, the winged horse: in the fresco, Pegasus is shown flying off into the sky in the background. In mythology Pegasus’s hooves released the spring of the Muses (Hippocrene), symbolizing the wellspring of poetic inspiration – an appropriate nod in a gathering of the Muses. Scattered about are putti (cherubs) bearing laurel wreaths and branches, which they bring toward Apollo and the poetic goddesses. The laurel, sacred to Apollo, here signifies eternal glory bestowed on achievement in the arts. The entire scene, set against an ethereal blue sky, radiates a serene harmony. Apollo’s presence as sun-god and leader of the chorus suggests that under the Waldeck princes, the arts flourish in a divinely sanctioned golden age. This message would not have been lost on contemporaries: small princely courts like Waldeck were eager to present themselves as enlightened patrons of culture, keeping pace with larger realms.

<div id="arolsen-musen-card" class="painting-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPaintingCard('#arolsen-musen-card', 'd1c42fea-214e-4652-b77e-74e9978ccbb8');
})();
</script>


Stylistically, Castelli’s work in Arolsen is interesting for its mixture of influences. Research shows that Castelli, who hailed from the Italian-Swiss Ticino region, compiled his design from prints after famous Roman Baroque works. Apollo’s pose, for example, was lifted from a depiction of the gods by Giovanni Lanfranco (1624), while some of the Muses were inspired by Andrea Sacchi’s fresco of Divine Wisdom (1629–30) – likely known to Castelli through engraving reproductions. Such creative borrowing was common practice, enabling artists far from Rome to keep up with the latest artistic models. Castelli executed the Arolsen ceiling in a mixed secco technique (painted on dry plaster with layered glazes), rather than true fresco, which has allowed the work to survive, albeit darkened, into the 21st century. In the late 20th century (1987–2006) the Apollo and Muses painting was carefully restored to its former brightness, so modern visitors can once more appreciate its delicate color harmonies and lively figures.

The iconography of Apollo and the Muses was perfectly suited to a Festsaal of an Enlightenment-era prince. By featuring Apollo Musagetes (leader of Muses), Prince Friedrich Anton Ulrich of Waldeck advertised himself as a cultivated ruler under whose beneficent light the arts thrive. The hall would have hosted musical performances and literary receptions, literally bringing the theme to life. In this way, Arolsen’s mythological ceiling is less about political power and more about cultural prestige. It proclaims that this small German court participates in the grand tradition of artistic patronage, guided by Apollo’s divine inspiration. Such an image was an important part of a prince’s self-fashioning in the Baroque era, complementing the more overtly political allegories elsewhere.



### Sondershausen Palace: Ovidian Transformations and Princely Elevation

One of the most extensive mythological programs of German Baroque adorns the Riesensaal (Giants’ Hall) of Residenzschloss Sondershausen in Thuringia. Sondershausen was the seat of the Counts of Schwarzburg-Sondershausen, who in 1697 were elevated to princely status within the Holy Roman Empire. To reflect this elevation, Fürst (Prince) Christian Wilhelm undertook a lavish redecoration of the palace’s state rooms around 1700. Central to this was the Riesensaal, a great hall on the second floor of the south wing, completed by 1703 with an elaborate stucco ceiling containing no fewer than 22 painted scenes from Ovid’s Metamorphoses. This unified cycle of myths about transformation was uniquely apt, as it subtly paralleled the “metamorphosis” of Christian Wilhelm’s own dynasty – from minor counts to high princes – and placed his court in dialogue with the international vogue for Ovidian imagery.

The Riesensaal’s ceiling is a marvel of quadratura stuccowork and narrative painting. The surface is divided by ornate plaster frames into a grid of oval and rectangular compartments (coffers), each containing a vividly rendered mythological episode. The broad cove (vault springing) of the ceiling also carries larger fresco scenes in monochrome (grisaille) that act as visual transitions between the main panels. All the chosen stories come from Ovid’s Metamorphoses, a classical poem that recounts hundreds of tales of gods and mortals undergoing transformations. The selection in Sondershausen emphasizes heroic quests, divine justice, and love’s consequences – fitting themes for a Baroque princely hall. For instance, one oval shows Apollo slaying the Python, affirming the triumph of light over darkness; another depicts Apollo and Daphne, the nymph transforming into a laurel tree to escape the god’s pursuit. We find scenes of youthful hubris punished, such as Phaeton crashing the sun-chariot and Marsyas being flayed by Apollo, as well as tales of piety rewarded, like Philemon and Baucis (noted in other sources, likely included). Hunting scenes feature prominently – Meleager and Atalanta defeating the Calydonian boar, for example – as do episodes from the Trojan cycle, such as Achilles killing the Amazon Penthesilea, or Aeneas’s adventures (the program included images of Thetis imploring Vulcan to forge Achilles’ armor and Juno’s wrath against Troy, aligning with the broader Trojan theme we saw in Mannheim).

This Ovidian gallery of gods and heroes in action created a rich allegorical environment. A contemporary description notes that the Sondershausen ceiling “shows hunting, battle, and love scenes from the Metamorphoses of Ovid” in a lively, dramatic style. The paintings are executed in a warm color palette – lots of earthy reds, greens, and blues, with bright highlights – and the figures are rendered with the energetic, somewhat provincial Baroque manner of central Germany around 1700. (Art historians cannot definitively identify the painter; candidates include court painters like Johann W. Richter or itinerant Italians, but documentation is scarce.) The stucco framing was provided by the Italian Carlo Domenico and Antonio Carcani, whose workshop of Ticinese stuccoists was active across Thuringia at the time. They sculpted life-sized Atlas figures (giants) at the corners to “support” the vault and added trophy reliefs of weapons and armor in the coves – an allusion to martial prowess appropriate for a knightly hall.

Importantly, the choice of Metamorphoses as the unifying theme carried symbolic resonance for the patron. Christian Wilhelm’s elevation to Reichsfürst (Imperial Prince) was a dramatic social transformation – a metamorphosis of rank – and the ceiling’s parade of transformations could be read as an elaborate metaphor for that change. While no written “program” survives to explicate the intent, scholars surmise that the prince wished to associate his regime with the cycle of renewal and change depicted by Ovid. Just as the characters in the frescoes are elevated, chastised, or transfigured by divine forces, so too had the House of Schwarzburg been transformed by imperial grace. One can imagine the prince’s contemporaries, gathered in this hall for ceremonies or balls, glancing up at Jupiter’s eagle or Diana’s hounds and drawing parallels to the fortunes of their own realm. The very abundance of mythological exempla was a statement: this small principality knew the great stories of the classical world and saw its own story as part of that continuum.

<div id="sondershausen-card" class="building-card-container"></div>
<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderBuildingCard('#sondershausen-card', 'c644529c-1edc-4ad4-9b48-c8348b14283b');
})();
</script>

Even beyond the political subtext, the Riesensaal’s decorative scheme spoke to Baroque viewers on a moral level. The scenes offered lessons on virtue and vice: Apollo versus Marsyas taught the value of humility before the gods, Mercury’s theft of Apollo’s cattle (also depicted in a corner medallion) illustrated cunning and consequences, and so forth. A 19th-century restoration by artist Julius Meyer in 1859 repainted sections of the frescoes, altering some colors (blue skies and green landscapes were refreshed) but otherwise left the compositions intact. Thus, the cycle remains a rare surviving example of a full Ovidian ceiling in northern Europe. It stands as a Baroque encyclopedia of metamorphosis – both artistic and dynastic – witnessing how a newly-minted prince used mythology to legitimize his ancien régime-style authority.
Sondershausen Palace: Ovidian Transformations and Princely Elevation



### Rastatt Palace: Hercules in Olympus – The Apotheosis of a Warrior Prince

If one Baroque fresco cycle epitomizes personal dynastic glorification, it is the Ancestral Hall (Ahnensaal) ceiling of Schloss Rastatt in Baden. Here, the central theme is the apotheosis (deification) of a hero – a transparent parallel to the glorification of the building’s owner, Margrave Ludwig Wilhelm of Baden-Baden. Ludwig Wilhelm (1655–1707), famed as the military hero “Türkenlouis” for his battles against Ottoman forces, constructed Rastatt Palace around 1700 to rival the grandest courts. For the crowning ceiling of his great hall, he brought in Italian talent: Giuseppe Maria Roli of Bologna, who in 1704–1705 painted “Die Aufnahme des Herkules in den Olymp” – The Reception of Hercules into Olympus. This fresco, surrounded by smaller corner scenes and sumptuous stucco, explicitly casts the margrave’s life in allegorical terms of Herculean virtue rewarded by eternal fame.


<div id="ahnensaal-saal-card" class="room-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderRoomCard('#ahnensaal-saal-card', '72df9922-340f-42fa-b7cc-df0ef351cc57');
})();
</script>

Roli stages the apotheosis of Hercules within a circular opening of painted sky where the Olympian gods receive him. Jupiter presides at the top with his eagle (sometimes implied rather than shown). Hercules rises on the right, muscular, in a blue cloak with club and laurel wreath. He looks downward, not up to Jupiter, toward the ancestral portrait gallery around the cornice, turning Hercules into a surrogate for Margrave Ludwig Wilhelm, acknowledging lineage while ascending to divine status. Virtue accompanies him, and putti remove the lion-skin and weapons, signaling his labors are finished and peace achieved.

Opposite, Venus reclines with cherubs but recoils in rejection, shielding her face with red drapery as Hercules chooses immortal virtue over temptation. A Cupid breaks his bow and another spills arrows, showing lust and sin defeated. Above, Minerva (wisdom and strategic war), Mars (war), and especially Justitia appear: Justice sits near Jupiter within a zodiac ring (touching Libra) and raises a sword that forms the composition’s highest point, framing righteous rule as the crowning virtue. A flying Fama blows a trumpet and brings a laurel wreath to proclaim Hercules’ eternal fame.

At the fresco’s lower edge, Roli adds a large eagle’s nest with a mother and eaglets, painted as if on the architectural rim. In a surviving preparatory drawing in Karlsruhe, he labels it with Horace’s motto “Non generant aquilae columbas” (eagles do not beget doves), linking the House of Baden-Baden to power, imperial favor, and dynastic continuity. Placed between earth and Olympus, the nest implies the margrave’s heirs will inherit and continue his virtues, reinforced by Jupiter’s gaze toward it.



<div id="hercules-rastatt-card" class="painting-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPaintingCard('#hercules-rastatt-card', '32229efd-3f75-4a6a-80c4-470b40e7e79d');
})();
</script>

Overall, the Rastatt Ahnensaal ceiling is Baroque political theatre: the ruler-as-Hercules theme is tailored to Ludwig Wilhelm (“Türkenlouis”) and his victories against the Ottomans, echoed by corner sculptures of chained Turks supporting the cornice. The program celebrates military success, moral virtue, just sovereignty, and lineage. The fresco remains well preserved and is often cited as a major Italian Baroque work north of the Alps, with an iconography that later influenced comparable Hercules apotheosis cycles, including Würzburg in the 1740s.

#### Excursus: Hercules in Baroque Art

Hercules (German: Herkules) was among the most popular mythological figures in Baroque ceiling painting. His labors symbolized virtuous struggle, and his apotheosis represented the reward of immortal fame for earthly deeds – themes that resonated deeply with noble patrons seeking to glorify their dynasties:


<div id="hercules-gallery" class="baroque-gallery"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderMythFigureGallery('#hercules-gallery', 'Herkules', { limit: 9 });
})();
</script>

### Commissions Over Time: War, Peace, and the Rhythm of Baroque Art

Ceiling-painting commissions in German Baroque courts rose and fell with war and peace. From 1650 to 1750, you’d see peaks during stable periods and troughs when conflicts drained money and attention.

**Post-1648 rebound:** After the Thirty Years’ War ended (1648), recovery in the 1650s–1670s restarted commissions, first in churches and then palaces. Early palace work included the first phase of Nymphenburg in the 1660s once Bavaria stabilized. Prince-bishops and electors (e.g., Würzburg, Mainz) also began smaller refurbishments.

**1680s–1690s boom, then setbacks:** Late 17th-century rulers, often Italy/France-trained and inspired by Versailles, launched major palace programs and hired many Italian painters. The boom was checked by the Nine Years’ War (1688–1697) and the War of the Spanish Succession (1701–1714). In 1689, French devastation of the Palatinate (Mannheim, Heidelberg) stalled projects. Some courts rebuilt elsewhere, Ludwig Wilhelm shifted from Baden-Baden to Rastatt and began his palace in 1698. Nymphenburg shows the pattern: by 1704 construction halted, parts were repurposed, and artists lost work as funds went to war.

**1715–1730 High Baroque flourishing:** After the Treaty of Rastatt ended the Spanish Succession War (1714), commissions surged. Many princes returned and resumed building, with intense fresco patronage roughly 1715–1730. Major cycles include Mannheim stairhall/chapel by Cosmas Damian Asam (1720s), grand halls at Würzburg and Bruchsal (some extending into the 1740s), Rastatt’s Ahnensaal by Roli (1704–05), Arolsen garden halls by Castelli (1721–22), and Sondershausen’s Riesensaal (finished 1703). Peace and 1720s prosperity enabled importing Italian artists and training locals, producing a pan-German “painted heavens” moment that impressed visitors.

**Mid-century adjustments:** New wars strained budgets again, the War of the Austrian Succession (1740–1748) and Seven Years’ War (1756–1763). Projects slowed in the early 1750s, though some rulers kept commissioning: Bavaria’s Max III Joseph backed Nymphenburg’s Steinener Saal fresco by Zimmermann in the 1750s, and Würzburg’s Prince-Bishop Adam Friedrich von Seinsheim continued patronage, with Tiepolo finishing the Würzburg Residenz fresco in 1753, just before the Seven Years’ War. Still, these conflicts were close to the last peak for high Baroque fresco.

**1760s–1770s shift to Neoclassicism:** By the 1760s, Baroque/Rococo ceilings lost favor as Enlightenment tastes preferred cleaner neoclassicism and treated mythological allegory as dated. In Bavaria, Max III Joseph and later Karl Theodor curtailed Rococo; Nymphenburg’s 1766 refurbishment already looked simpler, and in 1769 Karl Theodor effectively ended Rococo decoration in Bavaria, accelerating neoclassicism. Prussia and Saxony moved similarly by the 1770s. Large mythological ceiling commissions dwindled, some remained incomplete or moved to canvas instead of fresco. Napoleonic-era upheavals finally extinguished the tradition.

Overall: peace and economic strength (roughly the 1660s, 1720s, mid-1740s to mid-1750s) align with bursts of commissions, while wars and fiscal crises create gaps. These ceilings functioned as luxury propaganda, cut first in hard times and showcased most in good times, a practical indicator of a state’s confidence and resources.



<div id="commissions-timeline" class="baroque-chart"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderCommissionsTimeline('#commissions-timeline', { startYear: 1550, endYear: 1800 });
})();
</script>

### Italian Masters in German Courts: Carlo Ludovico Castelli and Alessandro Paduano

Castelli and Paduano were two prolific painters of mythological scenes in Baroque Germany. Their works often featured gods, heroes, and allegorical figures, making them ideal representatives of the mythology theme. Below are galleries showcasing some of their most notable mythological ceiling paintings:

#### Carlo Ludovico Castelli (1671–1738)

Carlo Ludovico Castelli was an Italian painter and decorator from Melide in the Ticino (Swiss-Italian) region, part of a renowned family of artists. Active in Germany in the early 18th century, Castelli made his mark primarily in Thuringia, Franconia, and Hesse. He was one of many itinerant craftsmen from Ticino who supplied central Europe with Baroque artistry in stucco and paint. Castelli’s specialty was ceiling frescoes and secco paintings for palaces. We encountered his work at Arolsen Castle, where he painted the Apollo and the Muses ceiling in 1721/22. Prior to that, Castelli had collaborated on projects in Kassel (he worked on the Orangerie of Kassel around 1715–1719) and possibly at other minor courts. In 1728, he completed the decoration of the Arolsen palace chapel and other rooms, but the Garden Hall remains his best-known achievement there.

Castelli’s style was informed by the High Baroque models of Italy – he cleverly adapted compositions from artists like Lanfranco and Sacchi, as noted, blending them into new syntheses. Working often in fresco-secco (a technique allowing more time for detail by painting on dry plaster with binder), he produced durable works that could withstand the northern climate. Outside Arolsen, Castelli is documented to have participated in decorative schemes in Würzburg (the Juliusspital hospital church, early 1720s) and possibly in Altenburg and Gera. Records indicate he partnered with his brother or cousin, the stuccoist Giovanni Pietro Castelli, on some of these commissions. Carlo Ludovico was esteemed enough that several German princes sought his service; for example, the Duke of Sachsen-Gotha engaged him briefly. By the mid-1730s, Castelli returned to Italy, where he died in 1738.


<div id="castelli-gallery" class="baroque-gallery"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPainterGallery('#castelli-gallery', ['Castelli, Carlo Ludovico'], { limit: 6 });
})();
</script>

### Alessandro Paduano (active 1568–1596)

Alessandro Paduano was an earlier Italian artist whose career foreshadowed the Baroque fascination with myth in Bavaria. Active roughly from 1568 to 1596, Paduano was a painter from Italy (as his surname suggests, likely originating from Padua) who became a Hofkünstler (court artist) in Munich during the late Renaissance period. He is best known as the close collaborator – indeed “the right hand” – of the great architect-painter Friedrich Sustris, who served Duke Wilhelm V of Bavaria. In the 1570s–1580s, Munich’s court was a hive of artistic innovation, and Paduano played a significant role in executing the large decorative programs designed by Sustris.


One of Paduano’s notable contributions was his work on the so-called Narrentreppe (Fools’ Staircase) at the ducal residence in Landshut (Trausnitz Castle). Between 1575 and 1579, he and Sustris adorned this staircase with life-sized fresco scenes of Commedia dell’arte characters – a fascinating mixture of theatrical whimsy and allegory, unprecedented in north of the Alps. Paduano’s hand is evident in the lively figures of masked actors and courtly spectators that still faintly survive on those walls. Additionally, Paduano was involved in creating mythological grottos and bath hall decorations for Duke Wilhelm V. An example is the famous Grottenhof in the Munich Residenz (circa 1580), an artificial grotto courtyard rich with mosaic and painted scenes where classical gods like Venus and water deities were depicted – Paduano likely executed or assisted in those paintings, translating Sustris’s designs into reality.


Historically, Alessandro Paduano is recorded in the Bavarian court accounts and was described as an essential assistant. He is even said to have been Sustris’s brother-in-law, which explains the close partnership. His versatility extended from secular to religious projects, but it’s his secular mythological work that stands out. Paduano brought Italian Mannerist training to Bavaria, helping to lay the groundwork for what would become the German Baroque ceiling tradition. Though he worked a few generations before the likes of Zimmermann or Asam, he directly influenced the courtly aesthetic of integrating classical myths into architectural space. After about 1596, Paduano fades from the records, and it’s presumed he either died or left Bavaria. By then, however, he had helped decorate multiple palatial rooms and perhaps even taught younger German artists (one Hans Werl apprenticed under him in 1588–89).


<div id="paduano-gallery" class="baroque-gallery" style="margin-top: 20px;"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPainterGallery('#paduano-gallery', 'Paduano, Alessandro', { limit: 6 });
})();
</script>




In conclusion, the mythological ceiling and wall paintings of the German Baroque were far more than opulent ornament; they were visual manifestos of an age. Through the examples of Nymphenburg, Mannheim, Arolsen, Sondershausen, and Rastatt, we have seen how ancient myths were ingeniously repurposed to celebrate contemporary themes – peace after war, the heroism and legitimacy of rulers, the flourishing of arts, the transformation and continuity of dynasties, and the ultimate aspiration for eternal fame. These grand compositions required a convergence of talents (patron, painter, stucco sculptor, architect) and could only thrive under favorable historical conditions. When those conditions waned – under the strain of war or changing taste – the commissions slowed and finally ceased, giving way to new artistic paradigms.

</div><!-- /topic-mythology -->

---
## Summary

This data story demonstrates how DuckDB WASM enables interactive, client-side data exploration for cultural heritage research. Key findings include:

1. **Geographic concentration** in Bavaria and Baden-Württemberg reflects Catholic patronage patterns
2. **Temporal peak** between 1700-1760 aligns with the height of Baroque and Rococo architectural styles
3. **Biblical themes** (ICONCLASS category 7) dominate ceiling iconography
4. **Cross-dataset linking** via GND identifiers connects primary documentation with historical photography

The combination of structured analytical data with interactive visualizations enables researchers to explore hypotheses and patterns that would be difficult to perceive in tabular data alone.

---

<a id="painter-explorer"></a>
## Painter Biography Explorer

Explore the life and works of individual Baroque ceiling painters through an interactive map and chronological listing. Select a painter to see:

- **Geographic journey**: Where they worked throughout their career
- **Chronological works**: All paintings ordered by date and grouped by building
- **Detailed information**: Click any painting or building for more details

<div id="painter-explorer-container" class="baroque-explorer"></div>

<script type="module">
(async function() {
    // Wait for database to be ready
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    
    // Check if there's a painter specified in the URL hash
    const hash = window.location.hash;
    let initialPainter = null;
    if (hash.startsWith('#painter=')) {
        initialPainter = decodeURIComponent(hash.replace('#painter=', ''));
    }
    
    await BaroqueViz.renderPainterExplorer('#painter-explorer-container', initialPainter);
})();
</script>

<style>
/* Make painter names clickable throughout the document */
.painter-link {
    color: #3498db;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-style: dotted;
}
.painter-link:hover {
    color: #2980b9;
    text-decoration-style: solid;
}
</style>

<script type="module">
// Make all painter names in galleries clickable to navigate to the explorer
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for content to load
    setTimeout(() => {
        // Find painter names in painting cards and galleries
        document.querySelectorAll('.painter-card h2, .painting-card figcaption, figure figcaption').forEach(el => {
            const text = el.innerHTML;
            // Look for painter patterns like "🎨 Painter Name" or "Painter(s): Name"
            const painterPattern = /🎨\s*([^<]+)|Painter\(s\):\s*([^<]+)/g;
            let match;
            while ((match = painterPattern.exec(text)) !== null) {
                const painterName = (match[1] || match[2]).trim();
                if (painterName && painterName.length > 3) {
                    // Don't replace if it's already a link
                    if (!text.includes(`painter-link`) && !text.includes(`<a `)) {
                        const linkedText = text.replace(
                            painterName, 
                            `<span class="painter-link" onclick="if(window.loadPainterInExplorer){window.loadPainterInExplorer('${painterName.replace(/'/g, "\\'")}');window.scrollToPainterExplorer();}">${painterName}</span>`
                        );
                        el.innerHTML = linkedText;
                    }
                }
            }
        });
    }, 2000);
});
</script>

**Tips for using the explorer:**

- **Search**: Type in the search box to find a specific painter by name
- **Navigate**: Use the ◀ Previous / Next ▶ buttons to move chronologically between buildings
- **Click on map**: Click markers to see building details and jump to that location in the list
- **Click on building header**: Click any building name to pan to its location on the map
- **View details**: Click "Info" for building details, or click any painting for full information
- **Direct links**: You can link directly to a painter using `#painter=Name` in the URL

### Featured Painters to Explore

Try exploring these notable Baroque ceiling painters:

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin: 20px 0;">
    <button onclick="if(window.loadPainterInExplorer){window.loadPainterInExplorer('Asam, Cosmas Damian');document.getElementById('painter-explorer-container').scrollIntoView({behavior:'smooth'});}" 
            style="padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95em;">
        🎨 Cosmas Damian Asam
    </button>
    <button onclick="if(window.loadPainterInExplorer){window.loadPainterInExplorer('Seivert, Lammers');document.getElementById('painter-explorer-container').scrollIntoView({behavior:'smooth'});}" 
            style="padding: 12px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95em;">
        🎨 Lammers Seivert
    </button>
    <button onclick="if(window.loadPainterInExplorer){window.loadPainterInExplorer('Castelli, Carlo Ludovico');document.getElementById('painter-explorer-container').scrollIntoView({behavior:'smooth'});}" 
            style="padding: 12px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95em;">
        🎨 Carlo Ludovico Castelli
    </button>
    <button onclick="if(window.loadPainterInExplorer){window.loadPainterInExplorer('Holzer, Johann Evangelist');document.getElementById('painter-explorer-container').scrollIntoView({behavior:'smooth'});}" 
            style="padding: 12px; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95em;">
        🎨 Johann Evangelist Holzer
    </button>
</div>

## Sources

Baroque:

Art and the thirty years’ war. Die Welt Der Habsburger. Abgerufen 5. Februar 2026, von https://www.habsburger.net/en/chapter/art-and-thirty-years-war

Bayerische schlösserverwaltung | nymphenburg | schloss | rundgang. Abgerufen 5. Februar 2026, von https://www.schloss-nymphenburg.de/deutsch/schloss/raum01.htm

Corpus der barocken Deckenmalerei in Deutschland (Cbdd). Abgerufen 5. Februar 2026, von https://www.deckenmalerei.eu/

Mannheim, kurfürstliches residenzschloss, haupttreppenhaus, ausschnitt aus dem deckengemälde von cosmas damian asam, „urteil des paris“. Google Arts & Culture. Abgerufen 5. Februar 2026, von https://artsandculture.google.com/asset/mannheim-kurfürstliches-residenzschloss-haupttreppenhaus-ausschnitt-aus-dem-deckengemälde-von-cosmas-damian-asam-„urteil-des-paris“/RwHZdS1VCPSpzw

network,  romoe conservators.. Residenzschloss, riesensaal, deckengemälde. Romoe Netzwerk. Abgerufen 5. Februar 2026, von https://www.romoe.com/de/artikel/residenzschloss-riesensaal-deckengemaelde_ef5kcvlt.html

Residenzschloss mannheim. Abgerufen 5. Februar 2026, von https://www.zum.de/Faecher/G/BW/Landeskunde/rhein/ma/schloss/treppenhaus.htm

Pietro, Carlo. Die Stuckateure und Baumeister Castelli aus Melide und Bissone. Abgerufen 5. Februar 2026, von https://www.sueddeutscher-barock.ch/PDF-Bio_M/Castelli_Melide.pdf
