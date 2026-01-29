NFDI4Culture Data Story
{: .text-overline-m}

# Baroque Ceiling Paintings in Germany

## Exploring the Corpus of Baroque Ceiling Painting (CbDD) through Interactive Data Visualization

/// html | div[class='tile']
**Authors:** [Thanos Drossos](https://orcid.org/0009-0001-6545-9096), [Robin](https://orcid.org/), [YiMin Cai](https://orcid.org/)  
**Persistent Identifier:** https://nfdi4culture.de/id/CbDD  
**License:** [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)
///

**Abstract:** This data story explores the Corpus of Baroque Ceiling Painting in Germany (CbDD) through interactive visualizations powered by DuckDB WASM. We analyze the geographic distribution, temporal patterns, and thematic content of over 4,500 ceiling paintings across German regions, using client-side SQL queries for responsive data exploration. The study combines data from the NFDI4Culture Knowledge Graph with historical photographs from Bildindex, cross-referenced via GND identifiers.
{: .intro}

---

## Introduction

Baroque ceiling paintings represent one of the most significant artistic achievements of the 17th and 18th centuries in German-speaking regions. The Corpus of Baroque Ceiling Painting in Germany (CbDD) provides a comprehensive database of these works, documenting paintings in churches, palaces, and other buildings across the country.

This data story leverages **DuckDB WASM** to bring the analytical database directly to your browser. All queries execute locally—no server processing required—enabling fast, interactive exploration of the dataset.

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

## Analysis 01: Geographic Distribution

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

## Analysis 02: Temporal Distribution

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

## Analysis 03: Top Painters

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

## Analysis 04: Geographic Map of Buildings

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

## Analysis 05: ICONCLASS Subject Categories

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

## Analysis 06: Cross-Dataset Comparison

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

## Summary

This data story demonstrates how DuckDB WASM enables interactive, client-side data exploration for cultural heritage research. Key findings include:

1. **Geographic concentration** in Bavaria and Baden-Württemberg reflects Catholic patronage patterns
2. **Temporal peak** between 1700-1760 aligns with the height of Baroque and Rococo architectural styles
3. **Biblical themes** (ICONCLASS category 7) dominate ceiling iconography
4. **Cross-dataset linking** via GND identifiers connects primary documentation with historical photography

The combination of structured analytical data with interactive visualizations enables researchers to explore hypotheses and patterns that would be difficult to perceive in tabular data alone.
