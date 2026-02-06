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

Baroque ceiling and wall paintings were a hallmark of interior decoration between the 16th and 18th centuries, transforming churches, palaces, and grand halls with vibrant allegorical frescoes. In Germany alone, a dedicated research corpus (Corpus der barocken Deckenmalerei in Deutschland, CbDD) has documented over 4,000 (CHECK EXACT NUMBER) such artworks along with their locations and artists. Harnessing this rich cultural heritage data, we set out to explore the careers of Baroque ceiling painters and the distribution and themes of their works. To do so, we leverage linked data and modern analysis tools to combine information from multiple sources. This integrated approach allows us to ask: Who were the key Baroque ceiling painters, when and where did they create their works, and what subjects did they depict? By uniting a specialized art-historical dataset with external knowledge graphs and archives, our data story uncovers patterns and insights that would be difficult to see in isolation. The result is an interactive narrative that not only presents quantitative analyses of these artworks and artists, but also demonstrates the power of semantic data integration in cultural heritage research.

### Methods 

We followed a multi-step data pipeline to gather and analyze the information:

1. Data Retrieval via SPARQL: We used SPARQL queries to retrieve structured data on Baroque ceiling paintings and artists from online knowledge graphs. In particular, the core list of paintings and their metadata was obtained from the CbDD’s digital dataset (via a SPARQL endpoint in NFDI). Using SPARQL ensured that we could precisely filter for relevant works (e.g. paintings dated 1550–1800 in Germany) and fetch associated attributes like titles, locations, dates, and painter names in a single query.

2. Data Enrichment: To enhance the dataset, we cross-linked entities across different sources. Painter names from the corpus were reconciled with the original CbDD knowledg graph entries to gather consistent biographical details (e.g. birth/death years) and further connections between the paintings and buildings.. We also connected the paintings to the Bildindex der Kunst und Architektur (the German art and architecture image index) to confirm the existence of high-quality photographs and to retrieve image metadata. This enrichment step added valuable context and helped unify records that refer to the same person or artwork under different identifiers.

3. Data Integration and Cleaning: All retrieved and enriched data were then merged into a single cohesive dataset. We carefully matched paintings from the CbDD corpus with entries in the Bildindex (and other sources) by comparing titles, locations, and other attributes, flagging any ambiguities or duplicates. Each artwork entry was augmented with the identifiers from multiple sources (such as corpus IDs, ICONLASS, GND numbers, and image links) to enable seamless cross-reference. Unmatched items were reviewed and noted for exclusion. The outcome was a unified table of 4,594 paintings by 332 painters, representing the breadth of Baroque ceiling art in Germany.

4. Database and Analysis: The consolidated dataset was imported into a local DuckDB relational database, chosen for its efficiency in analytical querying. Using DuckDB via Python, we could perform complex SQL queries and manipulations on the data directly within our notebook. We analyzed key aspects of the data – for example, counting paintings per artist, examining the timeline of commissions, mapping the geographic distribution of works across regions, and identifying common iconographic themes. We utilized Python libraries (such as Polars for data handling and Altair for charting) to derive summary statistics and create visualizations. This approach allowed interactive exploration of the data with fast query performance on the ~4k records.

5. Visualization and Presentation: Finally, we presented our findings in an interactive format using SHMARQL, a Linked Data storytelling platform. SHMARQL (running in a Docker container for our project) renders the data story Markdown and executes live SPARQL queries embedded in the text. In practice, this means that each figure or chart in our story is generated on the fly by querying the underlying SPARQL endpoints or our prepared dataset. The visualizations (e.g. timelines, maps, bar charts) are thus always consistent with the latest data and can be interactive. By deploying the story via a SHMARQL instance, readers can engage with dynamic charts and even adjust queries or filters in real time. This containerized setup made it straightforward to share the story: the Docker-based SHMARQL server encapsulates the environment needed to serve the narrative and ensures that our integrated data (and any external endpoints required) can be queried seamlessly. In summary, the methods combine semantic data querying, data integration, and modern analytics to transform raw cultural data into a coherent, engaging analysis.

![Methods Overview](methods.png)

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
  SELECT
    a.painter AS p1,
    b.painter AS p2,
    COUNT(*) AS n_co
  FROM painters a
  JOIN painters b
    ON a.nfdi_uri = b.nfdi_uri
   AND a.painter < b.painter
  GROUP BY 1,2
)
SELECT *
FROM pairs
WHERE n_co >= 8
ORDER BY n_co DESC
LIMIT 30
```
///

**Observation:** Repeated co-painter pairs suggest stable collaboration (e.g., workshop teams or recurring commissions). This highlights that ceiling painting production was often network-based rather than purely individual authorship.

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


This section provides an overview of the ICONCLASS categories represented across the corpus of Baroque ceiling paintings.

The dashboard below allows you to explore basic statistics for each category, including the number of paintings, artists, locations, and key actors such as commissioners. By switching between categories, you can quickly compare thematic emphases within the dataset.

The level of detail can be adjusted using the Top N selector, enabling a closer look at the most frequent painters, states, buildings, or commissioners for each ICONCLASS category.

Have fun while exploring the data! 

<!-- =========================
     ICONCLASS QUICK STATS DASHBOARD (0–9)
     - Category tabs (0..9), default 4
     - Core counts (paintings, painters, states, buildings, rooms)
     - Top N lists: painters, states, buildings, commissioners
     - N selector
========================= -->



 <h3 style="margin-top:0">Micro perspective statistics</h3>

<div class="ic-wrap">
  <div class="ic-header">
    <div class="ic-title">
      <span id="ic-title-main">Society &amp; Culture</span>
      <span class="ic-sub">(ICONCLASS Category <span id="ic-cat-digit">4</span>)</span>
    </div>

    <div class="ic-controls">
      <label class="ic-label">Top N:</label>
      <select id="ic-topn" class="ic-select">
        <option>3</option>
        <option>5</option>
        <option selected>10</option>
        <option>20</option>
      </select>
    </div>
  </div>

  <!-- Tabs -->
  <div class="ic-tabs" id="ic-tabs"></div>

  <!-- Core full width -->
  <section class="ic-card ic-corewide">
    <div class="ic-card-title">Core counts (selected category)</div>
    <table class="ic-table">
      <thead>
        <tr><th>Metric</th><th style="text-align:right">Value</th></tr>
      </thead>
      <tbody id="ic-core-body">
        <tr><td>Paintings</td><td style="text-align:right">…</td></tr>
        <tr><td>Painters (role=PAINTER)</td><td style="text-align:right">…</td></tr>
        <tr><td>States</td><td style="text-align:right">…</td></tr>
        <tr><td>Buildings</td><td style="text-align:right">…</td></tr>
        <tr><td>Rooms</td><td style="text-align:right">…</td></tr>
      </tbody>
    </table>
    <div class="ic-note">
      Note: A painting can appear multiple times via multiple subjects; here we always count <b>distinct nfdi_uri</b>.
    </div>
  </section>

  <!-- Bottom 2x2 -->
  <div class="ic-grid-2x2">
    <section class="ic-card">
      <div class="ic-card-title">Top <span class="ic-topn-label">10</span> painters</div>
      <div id="ic-top-painters" class="ic-list">Loading…</div>
    </section>

    <section class="ic-card">
      <div class="ic-card-title">Top <span class="ic-topn-label">10</span> states</div>
      <div id="ic-top-states" class="ic-list">Loading…</div>
    </section>

    <section class="ic-card">
      <div class="ic-card-title">Top <span class="ic-topn-label">10</span> buildings</div>
      <div id="ic-top-buildings" class="ic-list">Loading…</div>
    </section>

    <section class="ic-card">
      <div class="ic-card-title">Top <span class="ic-topn-label">10</span> commissioners</div>
      <div id="ic-top-commissioners" class="ic-list">Loading…</div>
    </section>
  </div>
</div>

<style>
  .ic-wrap{ margin: 10px 0 26px; }
  .ic-header{
    display:flex; align-items:flex-end; justify-content:space-between;
    gap:14px; margin-bottom: 10px;
  }
  .ic-title{ font-weight:800; font-size:18px; line-height:1.2; }
  .ic-sub{ font-weight:600; font-size:13px; opacity:.65; margin-left:8px; }
  .ic-controls{ display:flex; align-items:center; gap:8px; }
  .ic-label{ font-size:13px; opacity:.7; }
  .ic-select{
    border: 1px solid rgba(0,0,0,.18);
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 14px;
    background: white;
  }

  .ic-tabs{
    display:flex; flex-wrap:wrap; gap:8px;
    margin: 8px 0 14px;
  }
  .ic-tab{
    border: 1px solid rgba(0,0,0,.14);
    border-radius: 999px;
    padding: 7px 10px;
    font-size: 13px;
    background: rgba(255,255,255,.92);
    cursor:pointer;
    user-select:none;
    transition: transform .05s ease, box-shadow .12s ease, border-color .12s ease;
  }
  .ic-tab:hover{ box-shadow: 0 8px 18px rgba(0,0,0,.06); border-color: rgba(0,0,0,.22); }
  .ic-tab:active{ transform: scale(.99); }
  .ic-tab.is-active{
    border-color: rgba(20,110,200,.55);
    box-shadow: 0 10px 22px rgba(20,110,200,.12);
  }

  .ic-card{
    border-radius: 16px;
    background: rgba(255,255,255,.92);
    box-shadow: 0 6px 24px rgba(0,0,0,.06);
    padding: 14px;
  }
  .ic-card-title{ font-weight:800; margin-bottom:10px; }

  /* NEW: core full width */
  .ic-corewide{
    width:100%;
    margin-bottom: 14px;
  }

  /* NEW: bottom 2x2 grid */
  .ic-grid-2x2{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    align-items: start;
  }

  .ic-table{
    width:100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .ic-table th{
    text-align:left;
    font-size: 12.5px;
    letter-spacing:.01em;
    opacity:.65;
    border-bottom: 1px solid rgba(0,0,0,.10);
    padding: 8px 4px;
  }
  .ic-table td{
    padding: 10px 4px;
    border-bottom: 1px solid rgba(0,0,0,.06);
  }
  .ic-note{
    margin-top: 10px;
    font-size: 12.5px;
    opacity: .65;
  }

  .ic-list{ display:flex; flex-direction:column; gap:8px; }
  .ic-row{
    display:flex;
    justify-content:space-between;
    gap:12px;
    padding: 9px 10px;
    border: 1px solid rgba(0,0,0,.07);
    border-radius: 12px;
    background: white;
  }
  .ic-row .k{ font-weight:650; font-size: 13.5px; }
  .ic-row .v{ font-variant-numeric: tabular-nums; opacity:.8; }

  .ic-empty{
    padding: 10px;
    font-size: 13px;
    opacity: .7;
    border: 1px dashed rgba(0,0,0,.18);
    border-radius: 12px;
    background: rgba(0,0,0,.02);
  }

  @media (max-width: 980px){
    .ic-grid-2x2{ grid-template-columns: 1fr; }
  }
</style>

<script type="module">
(async function(){
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const $ = (id) => document.getElementById(id);

  // Wait for BaroqueDB
  while (typeof BaroqueDB === 'undefined' || !BaroqueDB.isReady || !BaroqueDB.isReady()){
    await wait(100);
  }

  // --- Category labels (0..9) ---
  const CAT_LABELS = {
    '0': 'Abstract',
    '1': 'Religion & Magic',
    '2': 'Nature',
    '3': 'Human Being',
    '4': 'Society & Culture',
    '5': 'Abstract Ideas',
    '6': 'History',
    '7': 'Bible',
    '8': 'Literature',
    '9': 'Classical Mythology'
  };

  // --- UI state ---
  let currentCat = '4';

  // Render tabs
  const tabsEl = $('ic-tabs');
  tabsEl.innerHTML = Object.keys(CAT_LABELS).map(d => `
    <div class="ic-tab ${d===currentCat ? 'is-active':''}" data-cat="${d}">
      ${d} · ${CAT_LABELS[d]}
    </div>
  `).join('');

  function setActiveTab(){
    for (const el of tabsEl.querySelectorAll('.ic-tab')){
      el.classList.toggle('is-active', el.dataset.cat === currentCat);
    }
    $('ic-title-main').textContent = CAT_LABELS[currentCat] || 'ICONCLASS';
    $('ic-cat-digit').textContent = currentCat;
  }

  function renderList(containerId, rows, keyName, valueName){
    const el = $(containerId);
    if (!rows || !rows.length){
      el.innerHTML = `<div class="ic-empty">No data returned.</div>`;
      return;
    }
    el.innerHTML = rows.map(r => {
      const k = r[keyName] ?? '(unknown)';
      const v = r[valueName] ?? 0;
      return `<div class="ic-row"><div class="k">${escapeHtml(k)}</div><div class="v">${v}</div></div>`;
    }).join('');
  }

  function escapeHtml(s){
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[c]));
  }

  async function query(sql){
    return await BaroqueDB.query(sql);
  }

  // Robust iconclass_code extraction (no regex)
  // -> split on iconclass.org/ then take first path segment
  function iconclassCTE(){
    return `
      WITH iconclass_parsed AS (
        SELECT
          ps.nfdi_uri,
          CASE
            WHEN s.subject_uri LIKE '%iconclass.org/%'
              THEN split_part(split_part(s.subject_uri, 'iconclass.org/', 2), '/', 1)
            ELSE NULL
          END AS iconclass_code
        FROM painting_subjects ps
        JOIN subjects s ON ps.subject_uri = s.subject_uri
        WHERE s.subject_source='ICONCLASS'
      ),
      cat_paintings AS (
        SELECT DISTINCT nfdi_uri
        FROM iconclass_parsed
        WHERE iconclass_code LIKE '${currentCat}%'
      )
    `;
  }

  async function refresh(){
    const topN = parseInt($('ic-topn').value, 10);
    for (const x of document.querySelectorAll('.ic-topn-label')) x.textContent = String(topN);

    setActiveTab();

    // 1) Core counts
    const core = await query(`
      ${iconclassCTE()}
      SELECT
        (SELECT COUNT(*) FROM cat_paintings) AS paintings,
        (SELECT COUNT(DISTINCT pp.person_name)
           FROM painting_persons pp
           JOIN cat_paintings cp ON cp.nfdi_uri=pp.nfdi_uri
          WHERE pp.role='PAINTER' AND pp.person_name IS NOT NULL) AS painters,
        (SELECT COUNT(DISTINCT p.location_state)
           FROM paintings p
           JOIN cat_paintings cp ON cp.nfdi_uri=p.nfdi_uri
          WHERE p.location_state IS NOT NULL AND p.location_state <> '') AS states,
        (SELECT COUNT(DISTINCT p.building_name)
           FROM paintings p
           JOIN cat_paintings cp ON cp.nfdi_uri=p.nfdi_uri
          WHERE p.building_name IS NOT NULL AND p.building_name <> '') AS buildings,
        (SELECT COUNT(DISTINCT p.room_name)
           FROM paintings p
           JOIN cat_paintings cp ON cp.nfdi_uri=p.nfdi_uri
          WHERE p.room_name IS NOT NULL AND p.room_name <> '') AS rooms
    `);

    const c = (core && core[0]) ? core[0] : {paintings:0,painters:0,states:0,buildings:0,rooms:0};
    $('ic-core-body').innerHTML = `
      <tr><td>Paintings (ICONCLASS ${currentCat}…)</td><td style="text-align:right"><b>${c.paintings ?? 0}</b></td></tr>
      <tr><td>Painters (role=PAINTER)</td><td style="text-align:right"><b>${c.painters ?? 0}</b></td></tr>
      <tr><td>States</td><td style="text-align:right"><b>${c.states ?? 0}</b></td></tr>
      <tr><td>Buildings</td><td style="text-align:right"><b>${c.buildings ?? 0}</b></td></tr>
      <tr><td>Rooms</td><td style="text-align:right"><b>${c.rooms ?? 0}</b></td></tr>
    `;

    // 2) Top N painters
    const topPainters = await query(`
      ${iconclassCTE()}
      SELECT
        pp.person_name AS painter,
        COUNT(DISTINCT pp.nfdi_uri) AS painting_count
      FROM painting_persons pp
      JOIN cat_paintings cp ON cp.nfdi_uri = pp.nfdi_uri
      WHERE pp.role='PAINTER' AND pp.person_name IS NOT NULL AND pp.person_name <> ''
      GROUP BY pp.person_name
      ORDER BY painting_count DESC
      LIMIT ${topN}
    `);
    renderList('ic-top-painters', topPainters, 'painter', 'painting_count');

    // 3) Top N states
    const topStates = await query(`
      ${iconclassCTE()}
      SELECT
        p.location_state AS state,
        COUNT(DISTINCT p.nfdi_uri) AS painting_count
      FROM paintings p
      JOIN cat_paintings cp ON cp.nfdi_uri = p.nfdi_uri
      WHERE p.location_state IS NOT NULL AND p.location_state <> ''
      GROUP BY p.location_state
      ORDER BY painting_count DESC
      LIMIT ${topN}
    `);
    renderList('ic-top-states', topStates, 'state', 'painting_count');

    // 4) Top N buildings
    const topBuildings = await query(`
      ${iconclassCTE()}
      SELECT
        p.building_name AS building,
        COUNT(DISTINCT p.nfdi_uri) AS painting_count
      FROM paintings p
      JOIN cat_paintings cp ON cp.nfdi_uri = p.nfdi_uri
      WHERE p.building_name IS NOT NULL AND p.building_name <> ''
      GROUP BY p.building_name
      ORDER BY painting_count DESC
      LIMIT ${topN}
    `);
    renderList('ic-top-buildings', topBuildings, 'building', 'painting_count');

    // 5) Top N commissioners
    const topCommissioners = await query(`
      ${iconclassCTE()}
      SELECT
        pp.person_name AS commissioner,
        COUNT(DISTINCT pp.nfdi_uri) AS painting_count
      FROM painting_persons pp
      JOIN cat_paintings cp ON cp.nfdi_uri = pp.nfdi_uri
      WHERE pp.role='COMMISSIONER' AND pp.person_name IS NOT NULL AND pp.person_name <> ''
      GROUP BY pp.person_name
      ORDER BY painting_count DESC
      LIMIT ${topN}
    `);
    renderList('ic-top-commissioners', topCommissioners, 'commissioner', 'painting_count');
  }

  // Tab clicks
  tabsEl.addEventListener('click', (e) => {
    const t = e.target.closest('.ic-tab');
    if (!t) return;
    currentCat = t.dataset.cat;
    refresh();
  });

  // N selector
  $('ic-topn').addEventListener('change', refresh);

  // initial
  setActiveTab();
  refresh();

})();
</script>
---


### Analysis 1: Select a Category 

You can select a thematic category that interests you. Based on your selection, you can explore Baroque ceiling painting through related artworks, artists, and contextual information.

OR

Select a subtheme to explore where and how it appears in Baroque ceiling paintings.



<div class="iconclass-picker" id="iconclass-picker">
 
 <a class="iconclass-tile"
     href="#analysis-politics"
     data-cat="4"
     title="Politics and Military">
    <img src="https://picsum.photos/200?random=23" alt="Politics and Military">
    <span>Politics and Military</span>
  </a>

  <a class="iconclass-tile is-active"
     href="#analysis-diseases"
     data-cat="2"
     title="Diseases">
    <img src="https://picsum.photos/200?random=21" alt="Diseases">
    <span>Diseases</span>
  </a>

  <a class="iconclass-tile"
     href="#analysis-church"
     data-cat="9"
     title="Church and Religion">
    <img src="https://picsum.photos/200?random=22" alt="Church and Religion">
    <span>Church and Religion</span>
  </a>

</div>


<style>
.iconclass-picker{
    display: flex;
  justify-content: space-between;   /* gleichmäßig verteilen */
  align-items: flex-start;
  gap: 0;                           /* kein zusätzliches spacing */
  max-width: 720px;                 /* an Textbreite angepasst */
  margin: 24px auto 16px auto;      /* zentriert unter dem Text */
}
.iconclass-tile{
  border:0;
  background:transparent;
  padding:0;
  cursor:pointer;
  width:140px;
  text-align:center;
}
.iconclass-tile img{
  width:120px;
  height:120px;
  border-radius:999px;
  object-fit:cover;
  display:block;
  margin:0 auto 10px auto;
  box-shadow: 0 6px 16px rgba(0,0,0,.12);
  border: 3px solid transparent;
}
.iconclass-tile span{
  display:block;
  font-size: 0.95rem;
}
.iconclass-tile.is-active img{
  border-color: rgba(0,0,0,.45);
}
</style>

<script type="module">
(function(){
  const picker = document.getElementById('iconclass-picker');
  if(!picker) return;

  picker.addEventListener('click', (e) => {
    const btn = e.target.closest('.iconclass-tile');
    if(!btn) return;

    picker.querySelectorAll('.iconclass-tile').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    // altert -> ausgeschaltet, sodass keine pop ups mehr kommen
    //console.log('Selected ICONCLASS category:', btn.dataset.cat);
    //alert(`Selected category: ${btn.dataset.cat}`);
  });
})();
</script>





---



<a id="analysis-politics"></a>
## Politics and Military Affairs in Baroque Ceiling Paintings

This section provides an overview of how themes of social order, political life, and cultural practices are represented across the corpus of Baroque ceiling paintings.





---
---
<a id="analysis-society"></a>
## Society & Culture


---
<a id="analysis-nature"></a>
## Nature


---
<a id="analysis-mythology"></a>

## Classical Mythology

The Baroque era in German-speaking lands produced a dazzling array of ceiling and wall paintings filled with scenes from classical mythology. These grand frescoes and allegorical programs served not merely as decoration, but as visual sermons of princely virtue, power, and Enlightenment ideals. Commissioned for palaces and grand halls, they wove ancient myths into the narrative of contemporary rulers – celebrating peace after war, exalting dynastic glory, and extolling the arts and sciences. In this data-driven exploration, we trace a red thread through several emblematic Baroque interiors in Germany, uncovering how mythology was employed to transform architecture into theatre of statecraft. From the Olympian gods on the ceilings of Munich’s Nymphenburg Palace to Ovid’s metamorphic tales in a Thuringian castle, these case studies reveal a common language of allegory that early modern patrons used to legitimize and immortalize their reigns. We also examine how the tempo of artistic commissions rose and fell with historical tides – ravaging wars followed by renewed prosperity – and briefly highlight two Italian masters behind these works. The result is a panoramic story of Baroque mythological imagery, presented in academic depth yet accessible and engaging.

<div id="mythology-intro-gallery" class="baroque-gallery"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    // Show a selection of mythology paintings as an introductory gallery
    await BaroqueViz.renderMythologyGallery('#mythology-intro-gallery', { limit: 6 });
})();
</script>

### Rebuilding Splendor after the Thirty Years’ War

In the first half of the 17th century, Germany was devastated by the Thirty Years’ War (1618–1648). This protracted conflict not only decimated populations and economies, but also brought high art patronage to a standstill. As one contemporary art historian lamented, “Queen Germania saw her palaces and churches with their magnificent paintings go up in flames... those who made it their profession fell into poverty and contempt, putting away their palette and instead taking up a pike or beggar’s staff”. Indeed, the war was a catastrophe that caused a sharp decline in artistic production – many artists fled or turned to other trades to survive.

Yet, once peace was established in 1648, the German states slowly recovered. By the late 17th century, a generation of rulers embarked on ambitious building projects to assert their renewed power and prestige. These post-war princes drew inspiration from Italian and French Baroque models, adorning their new palaces with lavish mythological frescoes that proclaimed a return of stability and the arts. As we will see, each major commission carried an implicit message: the horrors of war have given way to a golden age under wise and victorious leadership. Nowhere is this more evident than in Nymphenburg Palace near Munich, whose very inception and decoration are tied to themes of peace and prosperity.


### Patronage and the Baroque Cult of Magnificence

Importantly, these grand mythological paintings did not emerge in a vacuum – they were typically commissioned by the nobility of the Baroque era. Kings, princes, dukes, prince-bishops and other aristocrats (Adel) enthusiastically paid artists to fill their residences with scenes from antiquity. The practice was rooted in the Baroque (and Renaissance) notion of princely magnificence. Following the examples of ancient Roman emperors and the Italian Renaissance princes, Baroque rulers embraced the idea that a sovereign’s greatness should be manifest in lavish art and architecture. In the Baroque age of absolutism, art was a form of propaganda and self-fashioning: monarchs and princes used mythological allegory to magnify their status. As art historians note, “absolute monarchs embraced the ancient notion of princely magnificence… translated into expensive and sumptuous displays of wealth through… monumental scale, and allegorical symbolism”. Nowhere was this more evident than in the painted ceiling frescoes and grand canvases adorning Baroque palaces. These works often literally placed the patron among the gods – sometimes the ruler’s portrait features would appear on a figure like Apollo or Hercules – or at least drew flattering parallels between the patron and the virtues of mythic heroes.

<div id="apollo-gallery" class="baroque-gallery"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderMythFigureGallery('#apollo-gallery', 'Apollo', { limit: 6 });
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

Flanking the central Paris panel were two large oval tondi with further episodes from the Aeneid saga, one on each side of the ceiling vault. On the eastern side, Asam painted “Venus and Aeneas in the Forge of Vulcan”: the goddess Venus, mother of Aeneas, persuades Vulcan to forge weapons for her son before he goes to war. In Asam’s rendition, Venus descends from her swan-drawn chariot and sits enthroned at the center, accompanied by the youthful hero Aeneas and the smith-god Vulcan himself. Around them bustle Cyclops and helpers carrying a heavy shield, while in the background three elegant ladies in modern baroque court dress watch the scene – a charming anachronism, these were likely meant to represent the three granddaughters of Elector Carl Philipp, thus tying the ancient myth to the living dynasty. On the western side, the fresco “Juno, Aeolus and the Storm at Sea” portrayed an episode where Juno, queen of the gods, enlists Aeolus, god of the winds, to wreck Aeneas’s fleet at sea. Asam depicted Juno enthroned under a billowing canopy with her peacocks, gesturing commandingly to Aeolus on a rocky shore; below them, muscular personifications of the winds and waters are shown unleashing a tempest – putti stoke storms, river-gods pour out floods from urns. This dramatic scene of divine wrath balanced the Venus vignette across the hall, illustrating both divine favor and divine opposition in Aeneas’s journey.

Taken together, Mannheim’s stairhall paintings formed a three-part narrative: the Judgment of Paris (the cause of the Trojan War) in the center, flanked by Aeneas’s divine aid (Venus and Vulcan) and trials (Juno’s storm) on either side. The choice of these subjects was rich in meaning. The Aeneid was a favored source in Baroque art because Aeneas, legendary survivor of Troy and ancestor of the Romans, was seen as a model of pietas (duty) and the mythical forefather of rulers (even the Habsburgs traced lineage to him). By having Asam paint Aeneas’s story, Elector Carl Philipp aligned himself with this hero’s virtues and destiny. Contemporary guidelines on fresco programs advised that depictions of ancient battles and adventures could “through their examples incite the viewer to virtuous life”, and Virgil’s epic was considered especially apt for its themes of heroism, founding a new homeland, and devotion to the gods. Mannheim’s implementation was accordingly didactic: the viewer ascending the grand staircase would see, step by step, how gods and heroes shaped the Elector’s illustrious antecedents, implicitly urging loyalty and bravery.

It is notable that Cosmas Damian Asam’s originals were lost to wartime fires in the 1940s, but the ceiling paintings were later reconstructed (1955–61) by artist Carolus Vocke using surviving photographs. While Vocke’s secco reproductions lack some of Asam’s original vibrancy and Baroque dynamism – one critic found the modern colors “cool and dry, without radiance” – the iconography was preserved intact. Today, visitors can once again admire Paris with his golden apple and Aeneas amid the gods on the ceiling of Mannheim’s reconstructed staircase, a modern echo of the Baroque ambition to connect local dynastic glory with epic myth.

// Parisurteil Schloss Mannheim

<div id="parisurteil-card" class="painting-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPaintingCard('#parisurteil-card', '56698022-bbf7-4859-94b5-10646493da8e');
})();
</script> 


### Arolsen Castle: Apollo and the Muses – Patronage of the Arts

Not all Baroque mythological ceilings emphasized war or political allegory; some celebrated cultural enlightenment and the arts themselves. A case in point is the Residenzschloss Arolsen in Hesse, residence of the Princes of Waldeck. Built largely in the early 18th century (construction from 1713 to 1728, with interiors continuing into the 1740s), Arolsen’s design included a splendid Gartensaal (Garden Hall) also known as the Steinerner Saal. Around 1721–1722, the Italian painter Carlo Ludovico Castelli was commissioned to decorate the vaulted ceiling of this hall with a fresco that exalts the arts and sciences in classical guise.

Castelli’s ceiling painting in Arolsen’s Garden Hall depicts Apollo, the god of light and the arts, accompanied by the nine Muses. The composition shows Apollo seated at the center on an elevated cloud, strumming his lyre as leader of the Muses, who array themselves around him on the billowing clouds of Mount Parnassus. A key detail is the inclusion of Pegasus, the winged horse: in the fresco, Pegasus is shown flying off into the sky in the background. In mythology Pegasus’s hooves released the spring of the Muses (Hippocrene), symbolizing the wellspring of poetic inspiration – an appropriate nod in a gathering of the Muses. Scattered about are putti (cherubs) bearing laurel wreaths and branches, which they bring toward Apollo and the poetic goddesses. The laurel, sacred to Apollo, here signifies eternal glory bestowed on achievement in the arts. The entire scene, set against an ethereal blue sky, radiates a serene harmony. Apollo’s presence as sun-god and leader of the chorus suggests that under the Waldeck princes, the arts flourish in a divinely sanctioned golden age. This message would not have been lost on contemporaries: small princely courts like Waldeck were eager to present themselves as enlightened patrons of culture, keeping pace with larger realms.

Stylistically, Castelli’s work in Arolsen is interesting for its mixture of influences. Research shows that Castelli, who hailed from the Italian-Swiss Ticino region, compiled his design from prints after famous Roman Baroque works. Apollo’s pose, for example, was lifted from a depiction of the gods by Giovanni Lanfranco (1624), while some of the Muses were inspired by Andrea Sacchi’s fresco of Divine Wisdom (1629–30) – likely known to Castelli through engraving reproductions. Such creative borrowing was common practice, enabling artists far from Rome to keep up with the latest artistic models. Castelli executed the Arolsen ceiling in a mixed secco technique (painted on dry plaster with layered glazes), rather than true fresco, which has allowed the work to survive, albeit darkened, into the 21st century. In the late 20th century (1987–2006) the Apollo and Muses painting was carefully restored to its former brightness, so modern visitors can once more appreciate its delicate color harmonies and lively figures.

The iconography of Apollo and the Muses was perfectly suited to a Festsaal of an Enlightenment-era prince. By featuring Apollo Musagetes (leader of Muses), Prince Friedrich Anton Ulrich of Waldeck advertised himself as a cultivated ruler under whose beneficent light the arts thrive. The hall would have hosted musical performances and literary receptions, literally bringing the theme to life. In this way, Arolsen’s mythological ceiling is less about political power and more about cultural prestige. It proclaims that this small German court participates in the grand tradition of artistic patronage, guided by Apollo’s divine inspiration. Such an image was an important part of a prince’s self-fashioning in the Baroque era, complementing the more overtly political allegories elsewhere.

<div id="arolsen-musen-card" class="painting-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPaintingCard('#arolsen-musen-card', 'd1c42fea-214e-4652-b77e-74e9978ccbb8');
})();
</script>


### Sondershausen Palace: Ovidian Transformations and Princely Elevation

One of the most extensive mythological programs of German Baroque adorns the Riesensaal (Giants’ Hall) of Residenzschloss Sondershausen in Thuringia. Sondershausen was the seat of the Counts of Schwarzburg-Sondershausen, who in 1697 were elevated to princely status within the Holy Roman Empire. To reflect this elevation, Fürst (Prince) Christian Wilhelm undertook a lavish redecoration of the palace’s state rooms around 1700. Central to this was the Riesensaal, a great hall on the second floor of the south wing, completed by 1703 with an elaborate stucco ceiling containing no fewer than 22 painted scenes from Ovid’s Metamorphoses. This unified cycle of myths about transformation was uniquely apt, as it subtly paralleled the “metamorphosis” of Christian Wilhelm’s own dynasty – from minor counts to high princes – and placed his court in dialogue with the international vogue for Ovidian imagery.

The Riesensaal’s ceiling is a marvel of quadratura stuccowork and narrative painting. The surface is divided by ornate plaster frames into a grid of oval and rectangular compartments (coffers), each containing a vividly rendered mythological episode. The broad cove (vault springing) of the ceiling also carries larger fresco scenes in monochrome (grisaille) that act as visual transitions between the main panels. All the chosen stories come from Ovid’s Metamorphoses, a classical poem that recounts hundreds of tales of gods and mortals undergoing transformations. The selection in Sondershausen emphasizes heroic quests, divine justice, and love’s consequences – fitting themes for a Baroque princely hall. For instance, one oval shows Apollo slaying the Python, affirming the triumph of light over darkness; another depicts Apollo and Daphne, the nymph transforming into a laurel tree to escape the god’s pursuit. We find scenes of youthful hubris punished, such as Phaeton crashing the sun-chariot and Marsyas being flayed by Apollo, as well as tales of piety rewarded, like Philemon and Baucis (noted in other sources, likely included). Hunting scenes feature prominently – Meleager and Atalanta defeating the Calydonian boar, for example – as do episodes from the Trojan cycle, such as Achilles killing the Amazon Penthesilea, or Aeneas’s adventures (the program included images of Thetis imploring Vulcan to forge Achilles’ armor and Juno’s wrath against Troy, aligning with the broader Trojan theme we saw in Mannheim).

This Ovidian gallery of gods and heroes in action created a rich allegorical environment. A contemporary description notes that the Sondershausen ceiling “shows hunting, battle, and love scenes from the Metamorphoses of Ovid” in a lively, dramatic style. The paintings are executed in a warm color palette – lots of earthy reds, greens, and blues, with bright highlights – and the figures are rendered with the energetic, somewhat provincial Baroque manner of central Germany around 1700. (Art historians cannot definitively identify the painter; candidates include court painters like Johann W. Richter or itinerant Italians, but documentation is scarce.) The stucco framing was provided by the Italian Carlo Domenico and Antonio Carcani, whose workshop of Ticinese stuccoists was active across Thuringia at the time. They sculpted life-sized Atlas figures (giants) at the corners to “support” the vault and added trophy reliefs of weapons and armor in the coves – an allusion to martial prowess appropriate for a knightly hall.

Importantly, the choice of Metamorphoses as the unifying theme carried symbolic resonance for the patron. Christian Wilhelm’s elevation to Reichsfürst (Imperial Prince) was a dramatic social transformation – a metamorphosis of rank – and the ceiling’s parade of transformations could be read as an elaborate metaphor for that change. While no written “program” survives to explicate the intent, scholars surmise that the prince wished to associate his regime with the cycle of renewal and change depicted by Ovid. Just as the characters in the frescoes are elevated, chastised, or transfigured by divine forces, so too had the House of Schwarzburg been transformed by imperial grace. One can imagine the prince’s contemporaries, gathered in this hall for ceremonies or balls, glancing up at Jupiter’s eagle or Diana’s hounds and drawing parallels to the fortunes of their own realm. The very abundance of mythological exempla was a statement: this small principality knew the great stories of the classical world and saw its own story as part of that continuum.

Even beyond the political subtext, the Riesensaal’s decorative scheme spoke to Baroque viewers on a moral level. The scenes offered lessons on virtue and vice: Apollo versus Marsyas taught the value of humility before the gods, Mercury’s theft of Apollo’s cattle (also depicted in a corner medallion) illustrated cunning and consequences, and so forth. A 19th-century restoration by artist Julius Meyer in 1859 repainted sections of the frescoes, altering some colors (blue skies and green landscapes were refreshed) but otherwise left the compositions intact. Thus, the cycle remains a rare surviving example of a full Ovidian ceiling in northern Europe. It stands as a Baroque encyclopedia of metamorphosis – both artistic and dynastic – witnessing how a newly-minted prince used mythology to legitimize his ancien régime-style authority.
Sondershausen Palace: Ovidian Transformations and Princely Elevation


<div id="sondershausen-card" class="building-card-container"></div>
<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderBuildingCard('#sondershausen-card', 'c644529c-1edc-4ad4-9b48-c8348b14283b');
})();
</script>

### Rastatt Palace: Hercules in Olympus – The Apotheosis of a Warrior Prince

If one Baroque fresco cycle epitomizes personal dynastic glorification, it is the Ancestral Hall (Ahnensaal) ceiling of Schloss Rastatt in Baden. Here, the central theme is the apotheosis (deification) of a hero – a transparent parallel to the glorification of the building’s owner, Margrave Ludwig Wilhelm of Baden-Baden. Ludwig Wilhelm (1655–1707), famed as the military hero “Türkenlouis” for his battles against Ottoman forces, constructed Rastatt Palace around 1700 to rival the grandest courts. For the crowning ceiling of his great hall, he brought in Italian talent: Giuseppe Maria Roli of Bologna, who in 1704–1705 painted “Die Aufnahme des Herkules in den Olymp” – The Reception of Hercules into Olympus. This fresco, surrounded by smaller corner scenes and sumptuous stucco, explicitly casts the margrave’s life in allegorical terms of Herculean virtue rewarded by eternal fame.

Roli’s composition unfolds across a pseudo-circular opening in a painted sky, where the gods of Olympus welcome the ascendant Hercules. At the zenith sits Jupiter, thundering king of gods, with eagle by his side (in some interpretations, Jupiter’s eagle was represented indirectly – more on that below). On the right half of the fresco, the muscular Hercules is shown rising from the earthly realm up to the heavens. He is draped in a blue cloak, brandishes his trademark club, and wears a laurel wreath as sign of his virtue. Notably, Hercules does not gaze upward at Jupiter, but instead looks downward – significantly, toward the walls of the hall where Ludwig Wilhelm’s ancestral portraits hung in a gallery around the cornice. This clever detail made Hercules a stand-in for the margrave: the hero acknowledges his mortal lineage (the ancestors on the walls) even as he is elevated to godhood. Hercules is flanked by allegorical figures: one of his companions on the cloud bank is a personification of Virtue, who in Baroque iconography often guides Hercules. At Hercules’ feet, putti remove his lion-skin and arms – symbols that his labors are complete and peace has been won.

On the opposite side, Venus (the goddess of love) is depicted reclining semi-nude with her cherubs, but she is shown in an act of rejection and despair: her arm raised, she shields her face with a red drapery as she realizes Hercules has chosen immortal virtue over her temptations. One Cupid breaks his bow in frustration, while another tumbles downward, spilling a quiver of arrows – a clear sign that lust and sin have been vanquished by heroic virtue. This scene of Venus en déroute is a direct moral allegory: the Margrave, like Hercules, has spurned idleness and vice (represented by Venus) in favor of glory and duty.

Above, on a bank of clouds, other gods observe the apotheosis. We see Minerva (Athena) with helmet and spear, a symbol of strategic warfare and wisdom – appropriate for Ludwig Wilhelm as a general. Mars is present as well, representing war, but notably Justitia (Justice) also appears prominently: she sits by Jupiter, and her figure is fitted into a ring of the zodiac (she touches the scales of Libra) while holding aloft a great sword whose point pierces the sky. This dramatic inclusion of Lady Justice – her upraised sword forming the highest pinnacle of the composition – signified that righteous rule was the supreme virtue crowning the hero. In other words, the margrave is not only a successful warrior (a new Hercules) but a just sovereign who wields the sword of justice. The entire Olympian gathering is linked by a flying Fama (Fame) who blows a trumpet and carries a laurel wreath toward Hercules, announcing his eternal renown across the world.

Perhaps the most personal touch in Roli’s design is found at the lower edge of the fresco. There, painted as if perched on the architectural rim, is a large eagle’s nest with a mother eagle and her eaglets. The mother eagle rears back, wings spread protectively, while the fledgling eaglets gaze upward. In the preparatory drawing for this fresco (which survives in Karlsruhe), Roli annotated this motif with a Latin motto from Horace: “Non generant aquilae columbas” – eagles do not beget doves. The meaning was clear: great parents produce great offspring. The eagle, a long-standing symbol of power and a device of Jupiter (and by extension imperial power), here alluded to the House of Baden-Baden itself. Margrave Ludwig Wilhelm had married into the Imperial Habsburg family and had high hopes for his descendants. The eagle nest in the fresco is positioned as if on the threshold between the mortal realm and Olympus, implying that the margrave’s young heirs (the eaglets) will carry on his heroic virtues and one day soar among the gods as well. Jupiter himself casts his gaze down toward the nest, linking the divine favor to the princely lineage on earth.

In its totality, the Ahnensaal ceiling at Rastatt is a masterful piece of Baroque political theatre. It takes the classical myth of Hercules – long a favorite allegory for rulers (the so-called Herculean Virtue theme) – and customizes it to Ludwig Wilhelm’s narrative. The margrave was nicknamed “Türkenlouis” for his victories against the Ottoman Turks, and indeed four corner sculptures in the hall depict captured Turks in chains, literally supporting the cornice as caryatids. This ties directly to Hercules’ story: just as Hercules vanquished monstrous threats in his Labors, Türkenlouis subdued the “infidel” enemies of Austria. A contemporary description of the hall noted that “the ceiling fresco showing the reception of Hercules into Olympus clearly refers to the victorious margrave; even the statues of the fettered Ottomans speak volumes”. The Apotheosis of Hercules thus operates on multiple levels – celebrating military success, moral virtue, dynastic continuity, and the just governance of the prince. It is propaganda in pigment and plaster, executed with Italian Baroque skill. Notably, Giuseppe Roli’s fresco in Rastatt remains very well preserved (having fortunately escaped war damage). Art historians regard it as one of the finest Italian frescoes north of the Alps, and its iconography of ruler-as-Hercules influenced many later works (for instance, it likely inspired a similar Hercules apotheosis painted by Carlo Carlone in the Würzburg Residenz in the 1740s).

In sum, the mythological ceilings at Nymphenburg, Mannheim, Arolsen, Sondershausen, and Rastatt each demonstrate a different facet of Baroque storytelling. Whether the emphasis was on peace and prosperity (Nymphenburg), epic lineage and virtue (Mannheim), cultural enlightenment (Arolsen), metamorphic destiny (Sondershausen), or heroic apotheosis (Rastatt), all these programs harnessed the power of classical myths to convey messages about the rulers and their values. They turned the ceilings and walls of palatial rooms into grand canvases where history, politics, and art were seamlessly intertwined.


<div id="hercules-rastatt-card" class="painting-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPaintingCard('#hercules-rastatt-card', '32229efd-3f75-4a6a-80c4-470b40e7e79d');
})();
</script>


### Commissions Over Time: War, Peace, and the Rhythm of Baroque Art

The ebbs and flows of these ambitious art projects were closely tied to historical events. The timeline of ceiling painting commissions in German Baroque courts reflects periods of war-induced stagnation followed by bursts of building activity in peacetime. A chart of major ceiling fresco commissions from 1650 to 1750 would show several notable peaks and troughs corresponding to conflicts and recoveries:

Post-1648 Rebound: After the Thirty Years’ War ended in 1648, decades of impoverishment gave way to a gradual revival. In the 1650s–1670s, commissions resumed, initially in ecclesiastical contexts and then in palaces. For instance, the first phase of Nymphenburg Palace (including a modest painted hall) began in the 1660s once Bavaria’s economy stabilized. Rulers like the Prince-Bishop of Würzburg or the Electors of Mainz also started refurbishing their residences in this period, though on a smaller scale.

1680s–1690s Boom: The late 17th century saw a building boom. Many princes who had come of age after the war – often educated in Italy or France – poured resources into new palaces and their decoration. This was the age of expansion for Versailles-inspired complexes across Germany. Ceiling painters from Italy were in high demand. However, this boom was partly curtailed by new conflicts: the Nine Years’ War (1688–1697) and the War of the Spanish Succession (1701–1714). These wars directly affected German territories. In 1689 French armies devastated the Palatinate, burning Mannheim and Heidelberg – a major setback for artistic endeavors there. Conversely, some rulers decided to relocate and rebuild: Ludwig Wilhelm moved his capital from war-torn Baden-Baden to Rastatt and started his palace in 1698 as a fresh start. We see in Nymphenburg’s timeline a microcosm of this: by 1704, due to the War of Spanish Succession, construction stopped and parts of the palace were cannibalized for other uses. Skilled artists found themselves without work as courts redirected funds to the war effort.

1715–1730 High Baroque Flourishing: After the Treaty of Rastatt in 1714 ended the Spanish Succession War, a spectacular flowering of art occurred. Many exiled or cash-strapped princes returned to their lands and resumed projects. The period from about 1715 to 1730 was one of feverish commissioning of frescoes. In these fifteen years, numerous great cycles were completed: the stairhall and chapel in Mannheim by Cosmas Damian Asam (1720s), the grand halls of Würzburg and Bruchsal (though some of those would extend into the 1740s), the Ahnensaal in Rastatt by Roli (1704–05), the garden halls of smaller palaces like Arolsen by Castelli (1721–22), and the Riesensaal in Sondershausen (finished by 1703) as we saw. Importantly, peace and prosperity in the 1720s meant patrons could afford to import Italian painters or send locals for training. The result was a pan-German golden age of Baroque art. Visitors to German courts in these years marveled at the newly painted heavens filled with Olympian gods, reflecting the confidence of a post-war generation.

Mid-Century Adjustments: The mid-18th century brought new disruptions. The War of the Austrian Succession (1740–1748) and the Seven Years’ War (1756–1763) once again embroiled German states in conflict. These wars did not wreak the same universal destruction as 1618–48, but they did strain treasuries and sometimes put cultural projects on hold. For example, work on some late Baroque churches and palaces slowed during the early 1750s due to the uncertainty of war. Bavaria, while neutral in the Seven Years’ War, still felt economic pressure; yet intriguingly, it was precisely in the 1750s that Max III. Joseph invested in Nymphenburg’s Steinener Saal fresco by Zimmermann – perhaps as a statement of optimism amid continental strife. Other princes, like Prince-Bishop Adam Friedrich von Seinsheim in Würzburg, continued to patronize the arts through the Seven Years’ War (the famed Würzburg Residenz fresco by Tiepolo was completed in 1753, just before the war broke out). Nonetheless, the mid-century conflicts mark a last hurrah for high Baroque fresco. After the Seven Years’ War, the political climate and aesthetic tastes began to shift significantly.

1760s–1770s Transition to Neoclassicism: By the 1760s, the elaborate Baroque and Rococo ceiling paintings were gradually falling out of favor. The next generation of rulers, influenced by Enlightenment ideals, often preferred cleaner, neoclassical styles and viewed the old mythological allegories as outdated. In Bavaria, for instance, the new Elector Max III. Joseph (after 1745) and later Elector Karl Theodor (after 1777) curtailed Rococo extravagance. In 1766, a final Rococo refurbishment of a room at Nymphenburg was done in a markedly simpler ornament, heralding the end of the Baroque era. Just three years later, in 1769, Elector Karl Theodor issued a mandate effectively ending Rococo decoration in Bavaria and ushering in Neoclassicism. Similar patterns occurred elsewhere: courts like Prussia’s or Saxony’s embraced classical restraint by the 1770s. Consequently, large-scale mythological ceiling commissions dwindled. Some planned projects were even left incomplete or executed on canvas rather than fresco. The age of Napoleon at the turn of the 19th century, with its political upheavals, finally extinguished the Baroque tradition of princely allegorical ceilings.

In reflecting on this trajectory, we see that Baroque ceiling painting in Germany was highly sensitive to the winds of history. Periods of peace and relative economic strength – roughly 1660s, 1720s, mid-1740s to mid-1750s – coincide with spikes in artistic production and the hiring of artists to create these mythic tableaux. Conversely, major wars or fiscal crises correlate with gaps or conservatism in commissions. This rhythm underscores that these artworks were luxury propaganda: the first expenses to be cut in hard times, yet among the most prominent expenditures in good times to display a ruler’s magnificence. They were, in a sense, barometers of a state’s health and a prince’s confidence.


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

In summary, Carlo Ludovico Castelli exemplifies the cosmopolitan artistry of Baroque Europe – an Italian who worked across German states to spread the splendors of mythological painting. His legacy includes not only surviving works like the Apollo fresco at Arolsen, but also the influence he imparted to local German artists through his designs and methods. Today, he is recognized as a key figure who helped infuse the German Baroque interiors with an international flavor of classicism and allegory.


<div id="castelli-gallery" class="baroque-gallery"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPainterGallery('#castelli-gallery', ['Castelli, Carlo Ludovico'], { limit: 4 });
    await BaroqueViz.renderPainterGallery('#castelli-gallery', ['Castelli, Carlo Ludovico'], { limit: 4 });
})();
</script>

### Alessandro Paduano (active 1568–1596)

Alessandro Paduano was an earlier Italian artist whose career foreshadowed the Baroque fascination with myth in Bavaria. Active roughly from 1568 to 1596, Paduano was a painter from Italy (as his surname suggests, likely originating from Padua) who became a Hofkünstler (court artist) in Munich during the late Renaissance period. He is best known as the close collaborator – indeed “the right hand” – of the great architect-painter Friedrich Sustris, who served Duke Wilhelm V of Bavaria. In the 1570s–1580s, Munich’s court was a hive of artistic innovation, and Paduano played a significant role in executing the large decorative programs designed by Sustris.


One of Paduano’s notable contributions was his work on the so-called Narrentreppe (Fools’ Staircase) at the ducal residence in Landshut (Trausnitz Castle). Between 1575 and 1579, he and Sustris adorned this staircase with life-sized fresco scenes of Commedia dell’arte characters – a fascinating mixture of theatrical whimsy and allegory, unprecedented in north of the Alps. Paduano’s hand is evident in the lively figures of masked actors and courtly spectators that still faintly survive on those walls. Additionally, Paduano was involved in creating mythological grottos and bath hall decorations for Duke Wilhelm V. An example is the famous Grottenhof in the Munich Residenz (circa 1580), an artificial grotto courtyard rich with mosaic and painted scenes where classical gods like Venus and water deities were depicted – Paduano likely executed or assisted in those paintings, translating Sustris’s designs into reality.


Historically, Alessandro Paduano is recorded in the Bavarian court accounts and was described as an essential assistant. He is even said to have been Sustris’s brother-in-law, which explains the close partnership. His versatility extended from secular to religious projects, but it’s his secular mythological work that stands out. Paduano brought Italian Mannerist training to Bavaria, helping to lay the groundwork for what would become the German Baroque ceiling tradition. Though he worked a few generations before the likes of Zimmermann or Asam, he directly influenced the courtly aesthetic of integrating classical myths into architectural space. After about 1596, Paduano fades from the records, and it’s presumed he either died or left Bavaria. By then, however, he had helped decorate multiple palatial rooms and perhaps even taught younger German artists (one Hans Werl apprenticed under him in 1588–89).


In retrospect, Alessandro Paduano’s career illustrates the early diffusion of Italian painting expertise into Germany. He was a pioneer who demonstrated how allegorical and theatrical motifs from the South could be transplanted into a German court context. The exuberant spirit of late Renaissance Munich – with its mix of classical imagery and Counter-Reformation display – owes much to artisans like Paduano. His legacy continued indirectly as the Bavarian court maintained a taste for Italianate decoration, culminating a century later in projects such as Nymphenburg’s Steinerner Saal.


<div id="paduano-gallery" class="baroque-gallery" style="margin-top: 20px;"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPainterGallery('#paduano-gallery', 'Paduano, Alessandro', { limit: 4 });
})();
</script>


#### Hercules in Baroque Art

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

In conclusion, the mythological ceiling and wall paintings of the German Baroque were far more than opulent ornament; they were visual manifestos of an age. Through the examples of Nymphenburg, Mannheim, Arolsen, Sondershausen, and Rastatt, we have seen how ancient myths were ingeniously repurposed to celebrate contemporary themes – peace after war, the heroism and legitimacy of rulers, the flourishing of arts, the transformation and continuity of dynasties, and the ultimate aspiration for eternal fame. These grand compositions required a convergence of talents (patron, painter, stucco sculptor, architect) and could only thrive under favorable historical conditions. When those conditions waned – under the strain of war or changing taste – the commissions slowed and finally ceased, giving way to new artistic paradigms.

Yet the surviving Baroque mythological paintings continue to speak. In their allegories one finds a window into the Baroque mindset: profoundly learned yet theatrical, pious yet worldly, and ever eager to cast the present in the guise of the exalted past. In palace after palace, Olympus was invited to reside on the ceiling, and the Olympians dutifully extolled the patrons below. The dialogue between heaven and earth in these artworks is what makes them so compelling. They are richly layered narratives that still captivate scholars and visitors alike, testifying to a time when art, power, and myth seamlessly entwined to elevate both buildings and the ambitions of those who built them.

---

<!-- =========================
     ARTIST — Intro Section (Step 1)
     - Anchor jump
     - Manual bio (birth/death)
     - Data-check KPIs from BaroqueDB (works, span, states, top commissioner)
========================= -->

<a id="artist-asam"></a>

<h3 style="margin-top:0">Artist — Cosmas Damian Asam</h3>

<div class="ai-wrap">
  <div class="ai-left">
    <div class="ai-card">
      <div class="ai-small">Artist profile</div>
      <div class="ai-name">Cosmas Damian Asam</div>
      <div class="ai-dates">
        Born: <b>29 Sep 1686</b> (Benediktbeuern) · Died: <b>10 May 1739</b> (Munich)
      </div>

      <p class="ai-text">
        This section provides a quick entry point into the artist’s works in the dataset.
        Below you can see how many works are available (with coordinates), the covered time span,
        and the most frequent commissioners. Later we will add an interactive map + chronological journey.
      </p>

      <div class="ai-jump">
        <a class="ai-jumpbtn" href="#artist-asam">🔗 Copy link to this section</a>
      </div>
    </div>
  </div>

  <div class="ai-right">
    <div class="ai-kpis">
      <div class="ai-kpi">
        <div class="ai-kpi-v" id="ai-works">…</div>
        <div class="ai-kpi-k">Works (with coords)</div>
      </div>
      <div class="ai-kpi">
        <div class="ai-kpi-v" id="ai-span">…</div>
        <div class="ai-kpi-k">Time span (min–max)</div>
      </div>
      <div class="ai-kpi">
        <div class="ai-kpi-v" id="ai-states">…</div>
        <div class="ai-kpi-k">States</div>
      </div>
      <div class="ai-kpi">
        <div class="ai-kpi-v" id="ai-topcomm">…</div>
        <div class="ai-kpi-k">Top commissioner</div>
      </div>
    </div>

    <div class="ai-status" id="ai-status">Loading data…</div>
  </div>
</div>

<style>
  .ai-wrap{
    display:grid;
    grid-template-columns: 1.15fr 1fr;
    gap: 14px;
    align-items: stretch;
    margin: 10px 0 24px;
  }
  .ai-card{
    border-radius: 16px;
    background: rgba(255,255,255,.92);
    box-shadow: 0 6px 24px rgba(0,0,0,.06);
    padding: 14px;
  }
  .ai-small{ font-weight:800; font-size:12px; opacity:.65; letter-spacing:.02em; }
  .ai-name{ font-weight:900; font-size:20px; margin-top:6px; }
  .ai-dates{ margin-top:6px; font-size:13px; opacity:.8; }
  .ai-text{ margin:10px 0 0; font-size:13px; opacity:.78; line-height:1.4; }
  .ai-jump{ margin-top:10px; }
  .ai-jumpbtn{
    display:inline-block;
    font-size:12.5px;
    padding: 8px 10px;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,.12);
    background: white;
    text-decoration:none;
    color: inherit;
  }
  .ai-jumpbtn:hover{ box-shadow: 0 8px 18px rgba(0,0,0,.06); }

  .ai-kpis{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .ai-kpi{
    border-radius: 16px;
    background: rgba(255,255,255,.92);
    box-shadow: 0 6px 24px rgba(0,0,0,.06);
    padding: 12px 14px;
  }
  .ai-kpi-v{ font-weight:900; font-size:20px; }
  .ai-kpi-k{ font-size:12.5px; opacity:.7; margin-top:2px; }

  .ai-status{
    margin-top: 10px;
    border-radius: 14px;
    padding: 10px 12px;
    font-size: 12.5px;
    opacity: .75;
    border: 1px dashed rgba(0,0,0,.18);
    background: rgba(0,0,0,.02);
  }

  @media (max-width: 980px){
    .ai-wrap{ grid-template-columns: 1fr; }
  }
</style>

<script type="module">
(async function(){
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const $ = (id) => document.getElementById(id);

  const ARTIST = "Asam, Cosmas Damian";

  // 1) Wait for BaroqueDB
  while (typeof BaroqueDB === 'undefined' || !BaroqueDB.isReady || !BaroqueDB.isReady()){
    await wait(100);
  }

  const status = $('ai-status');
  status.textContent = "BaroqueDB ready. Running queries…";

  function fmt(n){
    if (n === null || n === undefined) return "—";
    try { return Number(n).toLocaleString(); } catch(e){ return String(n); }
  }

  try{
    // Works with coords for this artist
    const rows = await BaroqueDB.query(`
      WITH artist_paintings AS (
        SELECT DISTINCT nfdi_uri
        FROM painting_persons
        WHERE role='PAINTER' AND person_name='${ARTIST}'
      )
      SELECT
        COUNT(*) AS works_with_coords,
        MIN(year_start) AS min_year,
        MAX(COALESCE(year_end, year_start)) AS max_year,
        COUNT(DISTINCT location_state) AS n_states
      FROM paintings p
      JOIN artist_paintings ap ON ap.nfdi_uri = p.nfdi_uri
      WHERE p.lat IS NOT NULL AND p.lon IS NOT NULL
    `);

    const r = rows && rows[0] ? rows[0] : null;

    $('ai-works').textContent  = r ? fmt(r.works_with_coords) : "0";
    $('ai-span').textContent   = (r && r.min_year && r.max_year) ? `${r.min_year}–${r.max_year}` : "—";
    $('ai-states').textContent = r ? fmt(r.n_states) : "0";

    // Top commissioner for this artist (by number of distinct works)
    const top = await BaroqueDB.query(`
      WITH artist_paintings AS (
        SELECT DISTINCT nfdi_uri
        FROM painting_persons
        WHERE role='PAINTER' AND person_name='${ARTIST}'
      )
      SELECT
        pp.person_name AS commissioner,
        COUNT(DISTINCT pp.nfdi_uri) AS painting_count
      FROM painting_persons pp
      JOIN artist_paintings ap ON ap.nfdi_uri = pp.nfdi_uri
      WHERE pp.role='COMMISSIONER'
        AND pp.person_name IS NOT NULL AND pp.person_name <> ''
      GROUP BY pp.person_name
      ORDER BY painting_count DESC
      LIMIT 1
    `);

    $('ai-topcomm').textContent =
      (top && top[0]) ? `${top[0].commissioner} (${top[0].painting_count})` : "—";

    // Status text
    if (r && r.works_with_coords > 0){
      status.textContent = `✅ Data OK: ${r.works_with_coords} works with coordinates found for ${ARTIST}.`;
    } else {
      status.textContent = `⚠️ No works with coordinates found for ${ARTIST}. (We can still build a timeline without map, or relax the lat/lon filter.)`;
    }

  } catch (err){
    // show readable error in UI (no console needed)
    status.textContent = "❌ Query failed: " + (err && err.message ? err.message : String(err));
    $('ai-works').textContent  = "—";
    $('ai-span').textContent   = "—";
    $('ai-states').textContent = "—";
    $('ai-topcomm').textContent= "—";
  }
})();
</script>

---


<!-- =========================
     ARTIST JOURNEY — Map + chronological stops (Step 2)
     - Asam, Cosmas Damian
     - map + right-side timeline list
     - popups include ICONCLASS category digits (0..9) and codes (sample)
========================= -->

<a id="asam-journey"></a>
<h3 style="margin-top:0">Artist Journey — Map & timeline</h3>

<p style="opacity:.75; margin-top:-6px; font-size:13px;">
  Click a stop in the list to jump to the location on the map. Works are ordered chronologically (based on <code>year_start</code> / <code>year</code>).
</p>

<div class="aj-wrap">
  <div class="aj-map" id="aj-map"></div>

  <aside class="aj-panel">
    <div class="aj-panel__top">
      <div class="aj-panel__title">Stops</div>
      <div class="aj-panel__meta"><span id="aj-count">0</span> works</div>

      <div class="aj-controls">
        <button class="aj-btn" id="aj-prev">← Prev</button>
        <button class="aj-btn" id="aj-next">Next →</button>
      </div>

      <input id="aj-search" class="aj-search" type="search" placeholder="Search (state, building, iconclass)..." />
      <input id="aj-slider" class="aj-slider" type="range" min="0" max="0" step="1" value="0" />
      <div class="aj-slider-meta" id="aj-slider-meta">—</div>
    </div>

    <div class="aj-list" id="aj-list">
      <div class="aj-hint">Loading…</div>
    </div>

    <div class="aj-status" id="aj-status">Loading data…</div>
  </aside>
</div>

<style>
  .aj-wrap{
    display:grid;
    grid-template-columns: 1fr 390px;
    gap: 14px;
    align-items: stretch;
    margin: 10px 0 26px;
  }
  .aj-map{
    height: 680px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 6px 24px rgba(0,0,0,.06);
    background: #f6f6f6;
  }
  .aj-panel{
    height: 680px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 6px 24px rgba(0,0,0,.06);
    background: rgba(255,255,255,.92);
    display:flex;
    flex-direction: column;
  }
  .aj-panel__top{
    padding: 14px 14px 10px;
    border-bottom: 1px solid rgba(0,0,0,.08);
  }
  .aj-panel__title{
    font-weight: 900;
    font-size: 16px;
    line-height: 1.2;
  }
  .aj-panel__meta{
    font-size: 12.5px;
    opacity: .7;
    margin-top: 4px;
  }
  .aj-controls{
    margin-top: 10px;
    display:flex;
    gap: 8px;
  }
  .aj-btn{
    border: 1px solid rgba(0,0,0,.14);
    border-radius: 12px;
    padding: 8px 10px;
    background: white;
    font-size: 13px;
    cursor: pointer;
  }
  .aj-btn:hover{ box-shadow: 0 8px 18px rgba(0,0,0,.06); }
  .aj-btn:active{ transform: scale(.99); }

  .aj-search{
    width: 100%;
    margin-top: 10px;
    border: 1px solid rgba(0,0,0,.14);
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 14px;
    outline: none;
    background: white;
  }
  .aj-search:focus{
    border-color: rgba(20,110,200,.45);
    box-shadow: 0 0 0 4px rgba(20,110,200,.12);
  }

  .aj-slider{
    width: 100%;
    margin-top: 10px;
  }
  .aj-slider-meta{
    font-size: 12.5px;
    opacity: .7;
    margin-top: 4px;
  }

  .aj-list{
    padding: 8px 8px 10px;
    overflow: auto;
    flex: 1 1 auto;
  }
  .aj-hint{
    padding: 10px;
    font-size: 13px;
    opacity: .7;
  }

  .aj-item{
    border: 1px solid rgba(0,0,0,.07);
    border-radius: 14px;
    padding: 10px 10px;
    margin: 8px 6px;
    background: white;
    cursor: pointer;
    transition: box-shadow .12s ease, border-color .12s ease, transform .05s ease;
  }
  .aj-item:hover{
    border-color: rgba(20,110,200,.25);
    box-shadow: 0 8px 20px rgba(0,0,0,.10);
  }
  .aj-item:active{ transform: scale(.99); }
  .aj-item.is-active{
    border-color: rgba(20,110,200,.55);
    box-shadow: 0 10px 22px rgba(20,110,200,.12);
  }
  .aj-item__t{ font-weight: 800; font-size: 13.5px; }
  .aj-item__m{ font-size: 12.5px; opacity: .75; margin-top: 4px; line-height: 1.25; }

  .aj-status{
    border-top: 1px solid rgba(0,0,0,.08);
    padding: 10px 12px;
    font-size: 12.5px;
    opacity: .75;
    background: rgba(0,0,0,.02);
  }

  @media (max-width: 1050px){
    .aj-wrap{ grid-template-columns: 1fr; }
    .aj-map{ height: 520px; }
    .aj-panel{ height: 520px; }
  }
</style>

<script type="module">
(async function(){
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const $ = (id) => document.getElementById(id);

  const ARTIST = "Asam, Cosmas Damian";

  // Approx coordinates (so we can place birth/death markers)
  const BIRTH = { label: "Born — Benediktbeuern (approx.)", lat: 47.702, lon: 11.415, year: 1686 };
  const DEATH = { label: "Died — Munich (approx.)", lat: 48.137, lon: 11.575, year: 1739 };

  // Category labels
  const CAT_LABELS = {
    '0': 'Abstract',
    '1': 'Religion & Magic',
    '2': 'Nature',
    '3': 'Human Being',
    '4': 'Society & Culture',
    '5': 'Abstract Ideas',
    '6': 'History',
    '7': 'Bible',
    '8': 'Literature',
    '9': 'Classical Mythology'
  };

  // Wait for BaroqueDB
  while (typeof BaroqueDB === 'undefined' || !BaroqueDB.isReady || !BaroqueDB.isReady()){
    await wait(100);
  }

  // Ensure Leaflet exists (your project already uses it)
  if (typeof L === 'undefined'){
    $('aj-status').textContent = "❌ Leaflet not loaded on this page.";
    return;
  }

  $('aj-status').textContent = "Running query…";

  // Helper
  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[c]));
  }
  function timeLabel(r){
    if (r.year_start && r.year_end && r.year_start !== r.year_end) return `${r.year_start}–${r.year_end}`;
    if (r.year_start) return `${r.year_start}`;
    if (r.year) return `${r.year}`;
    return "—";
  }
  function sortKey(r){
    const y = r.year_start ?? null;
    const y2 = r.year ?? null;
    return (y ?? y2 ?? 999999);
  }

  try{
    // 1) Query works with coords + ICONCLASS summary per work
    // iconclass_code extraction without regex: split on iconclass.org/
    const rows = await BaroqueDB.query(`
      WITH artist_paintings AS (
        SELECT DISTINCT nfdi_uri
        FROM painting_persons
        WHERE role='PAINTER' AND person_name='${ARTIST}'
      ),
      iconclass_parsed AS (
        SELECT
          ps.nfdi_uri,
          CASE
            WHEN s.subject_uri LIKE '%iconclass.org/%'
              THEN split_part(split_part(s.subject_uri, 'iconclass.org/', 2), '/', 1)
            ELSE NULL
          END AS iconclass_code
        FROM painting_subjects ps
        JOIN subjects s ON ps.subject_uri = s.subject_uri
        WHERE s.subject_source='ICONCLASS'
      ),
      iconclass_agg AS (
        SELECT
          nfdi_uri,
          STRING_AGG(DISTINCT iconclass_code, ', ') AS iconclass_codes,
          STRING_AGG(DISTINCT SUBSTRING(iconclass_code, 1, 1), ', ') AS iconclass_digits
        FROM iconclass_parsed
        WHERE iconclass_code IS NOT NULL
        GROUP BY nfdi_uri
      ),
      commissioners AS (
        SELECT nfdi_uri, STRING_AGG(DISTINCT person_name, ', ') AS commissioners
        FROM painting_persons
        WHERE role='COMMISSIONER'
        GROUP BY nfdi_uri
      ),
      donors AS (
        SELECT nfdi_uri, STRING_AGG(DISTINCT person_name, ', ') AS donors
        FROM painting_persons
        WHERE role='DONOR'
        GROUP BY nfdi_uri
      )
      SELECT
        p.nfdi_uri,
        p.building_name,
        p.room_name,
        p.location_state,
        p.year_start,
        p.year_end,
        p.year,
        p.lat,
        p.lon,
        p.imageUrl,
        COALESCE(ia.iconclass_digits, '') AS iconclass_digits,
        COALESCE(ia.iconclass_codes, '') AS iconclass_codes,
        COALESCE(c.commissioners, '') AS commissioners,
        COALESCE(d.donors, '') AS donors
      FROM paintings p
      JOIN artist_paintings ap ON ap.nfdi_uri = p.nfdi_uri
      LEFT JOIN iconclass_agg ia ON ia.nfdi_uri = p.nfdi_uri
      LEFT JOIN commissioners c ON c.nfdi_uri = p.nfdi_uri
      LEFT JOIN donors d ON d.nfdi_uri = p.nfdi_uri
      WHERE p.lat IS NOT NULL AND p.lon IS NOT NULL
    `);

    // 2) Sort chronologically
    const works = (rows || []).slice().sort((a,b) => sortKey(a) - sortKey(b));

    $('aj-count').textContent = works.length;

    if (!works.length){
      $('aj-list').innerHTML = `<div class="aj-hint">
        ⚠️ No works with coordinates found for <b>${esc(ARTIST)}</b>.<br>
        (We can still build a non-map timeline, or relax the <code>lat/lon</code> filter.)
      </div>`;
      $('aj-status').textContent = "No coordinate data for this artist.";
      return;
    }

    // 3) Build map
    const map = L.map('aj-map', { scrollWheelZoom: true });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Fit bounds to works (+ birth/death)
    const bounds = L.latLngBounds([
      ...works.map(w => [w.lat, w.lon]),
      [BIRTH.lat, BIRTH.lon],
      [DEATH.lat, DEATH.lon]
    ]);
    map.fitBounds(bounds.pad(0.15));

    const layer = (L.markerClusterGroup ? L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 18,
      maxClusterRadius: 42
    }) : L.layerGroup()).addTo(map);

    // Birth/death markers
    const birthM = L.marker([BIRTH.lat, BIRTH.lon]).bindPopup(
      `<div style="font-size:13px"><b>${esc(BIRTH.label)}</b><br>Year: ${BIRTH.year}</div>`
    );
    const deathM = L.marker([DEATH.lat, DEATH.lon]).bindPopup(
      `<div style="font-size:13px"><b>${esc(DEATH.label)}</b><br>Year: ${DEATH.year}</div>`
    );
    layer.addLayer(birthM);
    layer.addLayer(deathM);

    // ✅ NEW: route line connecting all works chronologically
    let routeLine = null;
    const routePoints = works
      .filter(w => w.lat != null && w.lon != null)
      .map(w => [w.lat, w.lon]);

    if (routePoints.length >= 2){
      routeLine = L.polyline(routePoints, { weight: 4, opacity: 0.75 }).addTo(map);
    }

    // Index: marker per work
    const markerByUri = new Map();

    function iconclassPrettyDigits(digits){
      if (!digits) return '';
      // digits is "4, 7" etc. -> map each
      const ds = digits.split(',').map(x => x.trim()).filter(Boolean);
      if (!ds.length) return '';
      const parts = ds.map(d => `${d}: ${CAT_LABELS[d] ?? 'Unknown'}`);
      return parts.join(' · ');
    }

    // Add markers
    for (const w of works){
      const t = timeLabel(w);
      const title = w.building_name || w.room_name || 'Ceiling painting';

      const icDigitsPretty = iconclassPrettyDigits(w.iconclass_digits);
      const icLine = (icDigitsPretty || w.iconclass_codes)
        ? `<div style="margin-top:6px; opacity:.9">
             <b>ICONCLASS:</b> ${esc(icDigitsPretty)}<br>
             <span style="opacity:.8; font-size:12px">${esc(w.iconclass_codes)}</span>
           </div>`
        : '';

      const commLine = w.commissioners ? `<div><b>Commissioner:</b> ${esc(w.commissioners)}</div>` : '';
      const donorLine = w.donors ? `<div><b>Donor:</b> ${esc(w.donors)}</div>` : '';
      const metaLine = [
        t !== "—" ? `Time: ${esc(t)}` : '',
        w.location_state ? `State: ${esc(w.location_state)}` : '',
        w.room_name ? `Room: ${esc(w.room_name)}` : ''
      ].filter(Boolean).join(' · ');

      const img = w.imageUrl ? `<div style="margin-top:8px">
        <img src="${esc(w.imageUrl)}" alt="" style="width:100%;max-width:260px;border-radius:10px;display:block" />
      </div>` : '';

      const popup = `
        <div style="font-size:13px; line-height:1.25">
          <div style="font-weight:800; margin-bottom:4px">${esc(title)}</div>
          <div style="opacity:.75">${metaLine}</div>
          <div style="margin-top:8px; opacity:.95">
            ${commLine}
            ${donorLine}
          </div>
          ${icLine}
          <div style="opacity:.6; margin-top:8px; font-size:12px">${esc(w.nfdi_uri)}</div>
          ${img}
        </div>
      `;

      const m = L.circleMarker([w.lat, w.lon], {
        radius: 6,
        weight: 1,
        fillOpacity: 0.85
      }).bindPopup(popup);

      m.__row = w;
      markerByUri.set(w.nfdi_uri, m);
      layer.addLayer(m);
    }

    // 4) Right-side timeline list (+ interactions)
    const listEl = $('aj-list');
    const searchEl = $('aj-search');
    const sliderEl = $('aj-slider');
    const sliderMetaEl = $('aj-slider-meta');
    const statusEl = $('aj-status');

    let filtered = works.slice();
    let activeIdx = 0;

    function passesSearch(w, q){
      if (!q) return true;
      const hay = [
        w.location_state, w.building_name, w.room_name, w.iconclass_digits, w.iconclass_codes,
        w.commissioners, w.donors, w.year_start, w.year_end, w.year
      ].join(' ').toLowerCase();
      return hay.includes(q);
    }

    function renderList(){
      const q = (searchEl.value || '').trim().toLowerCase();
      filtered = works.filter(w => passesSearch(w, q));

      $('aj-count').textContent = filtered.length;

      if (!filtered.length){
        listEl.innerHTML = `<div class="aj-hint">No matches. Clear search or try a different term.</div>`;
        sliderEl.max = 0;
        sliderEl.value = 0;
        sliderMetaEl.textContent = "—";
        return;
      }

      // ensure activeIdx in range
      activeIdx = Math.max(0, Math.min(activeIdx, filtered.length - 1));
      sliderEl.max = String(filtered.length - 1);
      sliderEl.value = String(activeIdx);

      listEl.innerHTML = filtered.map((w, i) => {
        const t = timeLabel(w);
        const title = w.building_name || w.room_name || 'Ceiling painting';
        const ic = w.iconclass_digits ? `ICONCLASS: ${w.iconclass_digits}` : '';
        const meta = [
          t !== "—" ? `Time: ${t}` : '',
          w.location_state ? `State: ${w.location_state}` : '',
          ic
        ].filter(Boolean).join(' · ');

        return `
          <div class="aj-item ${i===activeIdx ? 'is-active':''}" data-idx="${i}">
            <div class="aj-item__t">${esc(title)}</div>
            <div class="aj-item__m">${esc(meta)}</div>
          </div>
        `;
      }).join('');

      for (const el of listEl.querySelectorAll('.aj-item')){
        el.addEventListener('click', () => {
          const i = parseInt(el.dataset.idx, 10);
          setActive(i, true);
        });
      }

      updateSliderMeta();
      highlightActive();
    }

    function updateSliderMeta(){
      if (!filtered.length){ sliderMetaEl.textContent = "—"; return; }
      const w = filtered[activeIdx];
      sliderMetaEl.textContent = `${activeIdx+1}/${filtered.length} · ${timeLabel(w)} · ${w.location_state || '—'}`;
    }

    function highlightActive(){
      for (const el of listEl.querySelectorAll('.aj-item')){
        el.classList.toggle('is-active', parseInt(el.dataset.idx,10) === activeIdx);
      }
    }

    function setActive(i, panTo){
      if (!filtered.length) return;
      activeIdx = Math.max(0, Math.min(i, filtered.length - 1));
      sliderEl.value = String(activeIdx);
      updateSliderMeta();
      highlightActive();

      const w = filtered[activeIdx];
      const m = markerByUri.get(w.nfdi_uri);
      if (m && panTo){
        map.setView(m.getLatLng(), Math.max(map.getZoom(), 13), { animate: true });
        m.openPopup();
      }
    }

    $('aj-prev').addEventListener('click', () => setActive(activeIdx - 1, true));
    $('aj-next').addEventListener('click', () => setActive(activeIdx + 1, true));
    sliderEl.addEventListener('input', () => setActive(parseInt(sliderEl.value, 10), true));
    searchEl.addEventListener('input', () => { activeIdx = 0; renderList(); });

    // when popup opens -> set active
    for (const [uri, m] of markerByUri.entries()){
      m.on('popupopen', () => {
        const idx = filtered.findIndex(w => w.nfdi_uri === uri);
        if (idx >= 0) setActive(idx, false);
      });
    }

    renderList();
    setActive(0, false);

    statusEl.textContent = `✅ Loaded ${works.length} mapped works for ${ARTIST}.`;

  } catch (err){
    $('aj-status').textContent = "❌ Query failed: " + (err && err.message ? err.message : String(err));
    $('aj-list').innerHTML = `<div class="aj-hint">Query failed. See status below.</div>`;
  }
})();
</script>

---









<!-- =========================
     MAP + SIDE PANEL (with Category Toggle)
     Default: ICONCLASS 4 (Society & Culture)
========================= -->

<div class="map-panel-wrap">
  <div id="works-map" class="works-map"></div>

  <aside class="works-panel">
    <div class="works-panel__header">
      <div class="works-panel__top">
        <div>
          <div class="works-panel__title">Works in view</div>
          <div class="works-panel__meta">
            <span id="works-count">0</span> items
          </div>
        </div>

        <!-- Toggle -->
        <div class="works-toggle" role="group" aria-label="Filter works">
          <button id="btn-cat4" class="works-toggle__btn is-active" type="button" title="Only ICONCLASS category 4">
            Society & Culture
          </button>
          <button id="btn-all" class="works-toggle__btn" type="button" title="All works with coordinates">
            All
          </button>
        </div>
      </div>

      <input id="works-search" class="works-panel__search" type="search"
             placeholder="Search (artist, building, room, state)..." />
    </div>

    <div id="works-list" class="works-panel__list">
      <div class="works-panel__hint">Move/zoom the map to load items…</div>
    </div>
  </aside>
</div>

<style>
  .map-panel-wrap{
    display:flex; gap:24px; align-items:stretch;
    width:100%; max-width:100%; margin:12px 0 24px;
  }
  .works-map{
    flex:1 1 65%; min-width:420px; height:640px;
    border-radius:14px; overflow:hidden;
    box-shadow:0 6px 24px rgba(0,0,0,.08);
  }
  .works-panel{
    flex:0 0 420px; max-width:520px; height:640px;
    border-radius:14px;
    box-shadow:0 6px 24px rgba(0,0,0,.08);
    background:rgba(255,255,255,.9);
    backdrop-filter:blur(6px);
    overflow:hidden; display:flex; flex-direction:column;
  }
  .works-panel__header{
    padding:16px 16px 10px;
    border-bottom:1px solid rgba(0,0,0,.08);
  }
  .works-panel__top{
    display:flex; justify-content:space-between; gap:14px; align-items:flex-start;
    margin-bottom:10px;
  }
  .works-panel__title{ font-weight:700; font-size:16px; line-height:1.2; margin-bottom:6px; }
  .works-panel__meta{ font-size:13px; opacity:.75; }

  .works-toggle{
    display:flex; gap:8px; align-items:center; justify-content:flex-end;
    flex-wrap:wrap;
  }
  .works-toggle__btn{
    border:1px solid rgba(0,0,0,.12);
    background:white;
    border-radius:999px;
    padding:8px 10px;
    font-size:12.5px;
    cursor:pointer;
    line-height:1;
    transition: box-shadow .12s ease, border-color .12s ease, transform .05s ease;
    white-space:nowrap;
  }
  .works-toggle__btn:hover{
    border-color: rgba(20,110,200,.35);
    box-shadow: 0 6px 16px rgba(0,0,0,.10);
  }
  .works-toggle__btn:active{ transform:scale(.99); }
  .works-toggle__btn.is-active{
    border-color: rgba(20,110,200,.55);
    box-shadow: 0 10px 22px rgba(20,110,200,.12);
  }

  .works-panel__search{
    width:100%;
    border:1px solid rgba(0,0,0,.12);
    border-radius:10px;
    padding:10px 12px;
    font-size:14px;
    outline:none;
  }
  .works-panel__search:focus{
    border-color: rgba(20,110,200,.45);
    box-shadow: 0 0 0 4px rgba(20,110,200,.12);
  }
  .works-panel__list{ overflow:auto; padding:8px 8px 10px; }
  .works-panel__hint{ padding:10px 10px; font-size:13px; opacity:.7; }

  .work-item{
    display:block;
    border:1px solid rgba(0,0,0,.06);
    border-radius:12px;
    padding:10px 10px;
    margin:8px 6px;
    background:white;
    transition: transform .05s ease, box-shadow .12s ease, border-color .12s ease;
    cursor:pointer;
  }
  .work-item:hover{
    border-color: rgba(20,110,200,.25);
    box-shadow: 0 8px 20px rgba(0,0,0,.10);
  }
  .work-item.is-active{
    border-color: rgba(20,110,200,.55);
    box-shadow: 0 10px 22px rgba(20,110,200,.12);
  }
  .work-item__title{ font-weight:650; font-size:13.5px; margin-bottom:4px; }
  .work-item__meta{ font-size:12.5px; opacity:.75; line-height:1.25; }

  @media (max-width: 1050px){
    .map-panel-wrap{ flex-direction:column; }
    .works-map{ min-width:0; height:520px; }
    .works-panel{ flex:1 1 auto; max-width:100%; height:520px; }
  }
</style>

<script type="module">
(async function(){
  const $ = (id) => document.getElementById(id);

  // Wait for BaroqueDB
  while (typeof BaroqueDB === 'undefined' || !BaroqueDB.isReady || !BaroqueDB.isReady()){
    await new Promise(r => setTimeout(r, 100));
  }

  // Leaflet present?
  if (typeof L === 'undefined'){
    $('works-list').innerHTML = `<div class="works-panel__hint">
      Leaflet not loaded. Make sure Leaflet is included (it should be, if your other map works).
    </div>`;
    return;
  }

  // ---------- Load base rows (all geocoded works) ----------
  let rowsAll;
  try{
    rowsAll = await BaroqueDB.query(`
      SELECT
        nfdi_uri,
        building_name,
        room_name,
        location_state,
        year_start,
        year_end,
        year,
        lat,
        lon,
        imageUrl,
        painters,
        commissioners
      FROM paintings
      WHERE lat IS NOT NULL AND lon IS NOT NULL
    `);
  } catch(e){
    console.error(e);
    $('works-list').innerHTML = `<div class="works-panel__hint">
      Query failed (paintings). Open console to see the error.
    </div>`;
    return;
  }

  // ---------- Load cat4 URI set ----------
  let cat4Set = new Set();
  try{
    const cat4 = await BaroqueDB.query(`
      WITH cat4 AS (
        SELECT DISTINCT ps.nfdi_uri
        FROM painting_subjects ps
        JOIN subjects s ON ps.subject_uri = s.subject_uri
        WHERE s.subject_source = 'ICONCLASS'
          AND REGEXP_EXTRACT(s.subject_uri, 'iconclass\\.org/([^/]+)', 1) LIKE '4%'
      )
      SELECT nfdi_uri FROM cat4
    `);
    cat4Set = new Set(cat4.map(d => d.nfdi_uri));
  } catch(e){
    console.warn("Could not load category 4 set:", e);
    // not fatal – toggle still works for "All"
  }

  // ---------- Map ----------
  const map = L.map('works-map', { scrollWheelZoom: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // Fit Germany-ish
  if (rowsAll.length){
    const b = L.latLngBounds(rowsAll.map(r => [r.lat, r.lon]));
    map.fitBounds(b.pad(0.12));
  } else {
    map.setView([51.1657, 10.4515], 6);
  }

  const hasCluster = !!L.markerClusterGroup;
  let layer = null;
  let markerByUri = new Map();
  let activeUri = null;

  const listEl = $('works-list');
  const countEl = $('works-count');
  const searchEl = $('works-search');

  const btnCat4 = $('btn-cat4');
  const btnAll  = $('btn-all');

  // Default: cat4
  let mode = 'cat4'; // 'cat4' | 'all'

  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[c]));
  }

  function formatTime(r){
    if (r.year_start && r.year_end && r.year_start !== r.year_end) return `${r.year_start}–${r.year_end}`;
    if (r.year_start) return `${r.year_start}`;
    if (r.year) return `${r.year}`;
    return '';
  }

  function getRows(){
    if (mode === 'cat4' && cat4Set.size){
      return rowsAll.filter(r => cat4Set.has(r.nfdi_uri));
    }
    return rowsAll;
  }

  function clearLayer(){
    if (layer){
      layer.clearLayers();
      map.removeLayer(layer);
    }
    markerByUri = new Map();
    activeUri = null;
  }

  function buildLayer(){
    const rows = getRows();

    layer = hasCluster ? L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 18,
      maxClusterRadius: 40
    }) : L.layerGroup();

    for (const r of rows){
      const time = formatTime(r);
      const title = r.building_name || r.room_name || 'Ceiling painting';
      const meta1 = [time, r.location_state].filter(Boolean).join(' | ');
      const meta2 = [
        r.painters ? `Painter(s): ${esc(r.painters)}` : '',
        r.commissioners ? `Commissioner(s): ${esc(r.commissioners)}` : '',
      ].filter(Boolean).join('<br>');

      const img = r.imageUrl ? `<div style="margin-top:8px">
          <img src="${esc(r.imageUrl)}" alt="" style="width:100%;max-width:260px;border-radius:10px;display:block" />
        </div>` : '';

      const popup = `
        <div style="font-size:13px; line-height:1.25">
          <div style="font-weight:700; margin-bottom:4px">${esc(title)}</div>
          <div style="opacity:.75; margin-bottom:6px">${esc(meta1)}</div>
          <div style="opacity:.9">${meta2}</div>
          <div style="opacity:.75; margin-top:8px; font-size:12px">${esc(r.nfdi_uri)}</div>
          ${img}
        </div>
      `;

      const m = L.circleMarker([r.lat, r.lon], { radius: 6, weight: 1, fillOpacity: 0.8 })
        .bindPopup(popup);

      m.__row = r;
      markerByUri.set(r.nfdi_uri, m);
      m.on('popupopen', () => setActive(r.nfdi_uri));
      layer.addLayer(m);
    }

    layer.addTo(map);
  }

  function setActive(uri){
    activeUri = uri;
    for (const el of listEl.querySelectorAll('.work-item')){
      el.classList.toggle('is-active', el.dataset.uri === uri);
    }
  }

  function inView(r, bounds){ return bounds.contains([r.lat, r.lon]); }

  function passesSearch(r, q){
    if (!q) return true;
    const hay = [
      r.painters, r.building_name, r.room_name, r.location_state, r.commissioners,
      r.year_start, r.year_end, r.year
    ].join(' ').toLowerCase();
    return hay.includes(q);
  }

  function renderList(){
    const rows = getRows();
    const bounds = map.getBounds();
    const q = (searchEl.value || '').trim().toLowerCase();

    const filtered = rows
      .filter(r => inView(r, bounds))
      .filter(r => passesSearch(r, q))
      .sort((a,b) => (a.year_start ?? 999999) - (b.year_start ?? 999999));

    countEl.textContent = filtered.length;

    if (!filtered.length){
      listEl.innerHTML = `<div class="works-panel__hint">
        No items in view (or filtered out). Try zooming out or clearing search.
      </div>`;
      return;
    }

    listEl.innerHTML = filtered.map(r => {
      const time = formatTime(r);
      const title = r.building_name || r.room_name || 'Ceiling painting';
      const meta = [
        time ? `Time: ${time}` : '',
        r.location_state ? `State: ${r.location_state}` : '',
        r.room_name ? `Room: ${r.room_name}` : ''
      ].filter(Boolean).join(' · ');

      const painters = r.painters ? `Painter(s): ${r.painters}` : '';
      return `
        <div class="work-item ${activeUri===r.nfdi_uri ? 'is-active':''}" data-uri="${esc(r.nfdi_uri)}">
          <div class="work-item__title">${esc(title)}</div>
          <div class="work-item__meta">${esc(meta)}</div>
          ${painters ? `<div class="work-item__meta" style="margin-top:4px">${esc(painters)}</div>` : ''}
        </div>
      `;
    }).join('');

    for (const el of listEl.querySelectorAll('.work-item')){
      el.addEventListener('click', () => {
        const uri = el.dataset.uri;
        const m = markerByUri.get(uri);
        if (!m) return;
        setActive(uri);
        const latlng = m.getLatLng();
        map.setView(latlng, Math.max(map.getZoom(), 14), { animate: true });
        m.openPopup();
      });
    }
  }

  function setMode(next){
    mode = next;
    btnCat4.classList.toggle('is-active', mode === 'cat4');
    btnAll.classList.toggle('is-active', mode === 'all');

    // rebuild markers for the new subset
    clearLayer();
    buildLayer();
    renderList();
  }

  // build initial (cat4)
  buildLayer();
  renderList();

  map.on('moveend zoomend', renderList);
  searchEl.addEventListener('input', renderList);

  btnCat4.addEventListener('click', () => setMode('cat4'));
  btnAll.addEventListener('click', () => setMode('all'));
})();
</script>





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
