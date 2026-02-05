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

### Analysis 1: Select a Category 

You can select a thematic category that interests you. Based on your selection, you can explore Baroque ceiling painting through related artworks, artists, and contextual information.

<div class="iconclass-picker" id="iconclass-picker">
 
 <a class="iconclass-tile"
     href="#analysis-society"
     data-cat="4"
     title="Society & Culture">
    <img src="https://picsum.photos/200?random=23" alt="Society & Culture">
    <span>Society & Culture</span>
  </a>

  <a class="iconclass-tile is-active"
     href="#analysis-nature"
     data-cat="2"
     title="Nature">
    <img src="https://picsum.photos/200?random=21" alt="Nature">
    <span>Nature</span>
  </a>

  <a class="iconclass-tile"
     href="#analysis-mythology"
     data-cat="9"
     title="Classical Mythology">
    <img src="https://picsum.photos/200?random=22" alt="Classical Mythology">
    <span>Classical Mythology</span>
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
<a id="analysis-society"></a>
## Society & Culture


---
<a id="analysis-nature"></a>
## Nature


---
<a id="analysis-mythology"></a>
## Classical Mythology

From the 17th through mid-18th century, European art, and German art in particular, saw a flourishing of paintings depicting scenes from ancient mythology. The Baroque period’s love of drama, grandeur, and dynamic composition made it especially suited to illustrating the exploits of classical gods and heroes. Artists drew on Greco-Roman legends – Venus and Mars, Zeus/Jupiter, Minerva, Apollo, Diana, Hercules, and countless others – transforming palace ceilings and canvases into theaters of divine action. These mythological scenes were far more than mere retellings of ancient stories; they were rich visual allegories loaded with symbolism and contemporary meaning. Baroque ceiling paintings in particular were “often laden with complex symbolism and allegorical meanings,” with common themes including mythological scenes, glorification of patrons or ruling families, and representations of virtues and vices. In other words, painting the old gods was a way to speak in a sophisticated code about power, virtue, love, war, and other human concerns of the Baroque age.

Mythological imagery had immense thematic versatility. On one hand, painters did depict beloved tales from Ovid or Homer for their sheer dramatic appeal – the fall of Phaëthon, the loves of Venus, or the labors of Hercules – reveling in the Baroque taste for movement and emotion. On the other hand, these images almost always carried an extra layer of meaning understood by contemporary viewers. Gods and heroes could personify abstract ideals (for example, Minerva as wisdom or Mars as military valor), or they could serve as direct allegorical stand-ins for real people and events. A Baroque viewer might see, for instance, a depiction of Jupiter (king of gods) descending to bless a mortal hero and understand it as a metaphor for a monarch’s divinely sanctioned authority. Indeed, visual programs in Baroque palaces addressed “a wide range of themes, from pagan gods and Christian saints to emblems and symbols” – conveying messages rooted in cosmology, mythology, ancient history, ethics and politics. An example is a ceiling fresco that shows Venus pleading with Jupiter on behalf of Mars (a rare scene from the Trojan War mythos); in a Baroque palace such a image wasn’t just about Trojan War drama – it could be read as an allegory of peace overriding war, or even a political commentary comparing the Trojan War to contemporary conflicts like the wars against the Ottoman Turks in Europe. In short, ancient myth provided Baroque artists and patrons a rich visual language to communicate values and politics in a “disguised” form.

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

One famous example of Baroque mythological patronage is the Würzburg Residence in Bavaria, where Prince-Bishop Carl Philipp von Greiffenklau hired the Venetian master Giambattista Tiepolo to paint the colossal ceiling fresco Apollo and the Four Continents (1752). Tiepolo and his son lived in Germany for several years commissioned by the prince-bishop to complete this project. The finished work – the largest ceiling painting in the world at 190×30 meters – presents the sun-god Apollo bringing light to Europe, Asia, Africa, and America, an allegory that glorified the prince’s enlightened rule over a global Catholic domain. In France, Louis XIV famously styled himself as Apollo the Sun King; similarly in the German states, many Baroque princes adopted mythic personae or themes to legitimize and exalt their reign. Every space in a Baroque palace was orchestrated around princely image and ceremony: one historian notes that even Versailles was arranged so that “the figure of the King… fashioned himself as the Greek sun-god Apollo.” German rulers followed suit on a smaller scale. For instance, the walls of the 17th-century gallery at Herrenhausen Palace (Hanover) were covered in sprawling scenes of the gods, and Duke Ernst August of Hanover commissioned a ceiling of Apollo in his chariot as a statement of dynastic glory. A visitor to a German Baroque palace would thus be greeted by a kind of Olympian theater in paint – a “radiant fairy world of the nobleman’s dwelling” deliberately designed to overwhelm the viewer and underscore the patron’s prestige.


<div id="herrenhausen-card" class="painting-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPaintingCard('#herrenhausen-card', '563a3917-6c59-4197-be0c-a86a18b37f6b');
})();
</script>

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

// Residezschloss Bad Arolsen

<div id="arolsen-wappen-card" class="painting-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPaintingCard('#arolsen-wappen-card', 'e57a9b42-6eae-4c14-92e9-a7c5f28f94dd');
})();
</script>

Apoll und die Musen Schloss Arolsen

<div id="arolsen-musen-card" class="painting-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPaintingCard('#arolsen-musen-card', 'd1c42fea-214e-4652-b77e-74e9978ccbb8');
})();
</script>


Sondershausen Residenzschloss

<div id="sondershausen-card" class="building-card-container"></div>
<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderBuildingCard('#sondershausen-card', 'c644529c-1edc-4ad4-9b48-c8348b14283b');
})();
</script>

Crucially, the choice of classical mythology also signaled the patron’s education and cultural refinement. In the Baroque and Enlightenment eras, an understanding of ancient history and literature was the mark of a cultivated elite. By commissioning paintings of mythological subjects, patrons aligned themselves with the humanist values of learning and taste. At the same time, these paintings could convey more concrete political messages in a palatable way. As mentioned, a scene of Greeks defeating Trojans might allude to Christian Europe’s recent victory over the “infidel” Turks, casting current events into grand historical perspective. Likewise, an image of Hercules ascending to Mount Olympus – a theme actually painted in 1704 for the Residenzschloss Rastatt – could be meant to flatter a noble patron by analogy, implying that he too would be rewarded for his great deeds with eternal fame. The language of mythology was flexible and eloquent, capable of praising patrons, commemorating dynastic events (weddings, treaties, battles), or imparting moral lessons – all under cover of an entertaining ancient fable. Little wonder that Baroque nobility eagerly paid for such works, and that the mythological genre thrived as a form of high-status visual communication.

The following painting from our dataset illustrates this theme perfectly – the "Aufnahme des Herkules in den Olymp" (Hercules' Reception into Olympus), painted by Giuseppe Maria Roli in 1704 for Rastatt Residence:

<div id="hercules-rastatt-card" class="painting-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPaintingCard('#hercules-rastatt-card', '32229efd-3f75-4a6a-80c4-470b40e7e79d');
})();
</script>

#### Commissions Over Time

The following chart shows the development of ceiling painting commissions throughout the Baroque period, revealing how artistic production responded to historical events like the Thirty Years' War and subsequent periods of reconstruction and prosperity:

<div id="commissions-timeline" class="baroque-chart"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderCommissionsTimeline('#commissions-timeline', { startYear: 1550, endYear: 1800 });
})();
</script>



### Mythological Art in Baroque Germany: Context and Artists, Aenaszyklus

Baroque painting developed somewhat later in the German-speaking lands than in Italy or Flanders – it was slow to arrive in Germany, with very little before 1650, largely due to the upheavals of the Thirty Years’ War. But from the mid-17th century onward, as peace returned and princely courts rebounded, Germany saw a boom in lavish artistic production. Dozens of skilled artists – both native and foreign – were at work decorating the palaces and churches of the Holy Roman Empire. Many leading foreign painters spent time in Germany working for local princes (for example, the Italian Bernardo Bellotto in Dresden, or Tiepolo in Würzburg), while German artists themselves traveled abroad for training. The result was a cosmopolitan Baroque art scene, where Italianate and Flemish influences mixed with German tastes. German Baroque and Rococo painting has often been described as derivative of other countries’ styles, but it produced opulent interiors on par with any in Europe – and it had a particular penchant for ceiling frescoes with elaborate mythological programs. In Southern Germany and Austria, families of painter-decorators like the Asam brothers (Cosmas Damian and Egid Quirin Asam) or the Zick family specialized in creating these total works of art, providing stucco, architecture and painting all together. The Asams, for instance, are best known for church art, but they also executed secular commissions; Cosmas Damian Asam’s ceiling in the Munich Residenz depicts an Olympian banquet of the gods, replete with Jupiter, Juno, Mercury and others in heavenly repose. In the north, courts in Berlin, Dresden, Braunschweig and elsewhere similarly commissioned grand paintings for their palaces and opera houses – Johann Oswald Harms painted a famous Apollo chariot ceiling in 1703 (one of the first of its kind in Germany), and later architects like Johann Friedrich von Götz filled rooms with canvases of mythic scenes for Prussian royals. By the early 18th century, mythological and allegorical scenes had become some of the most preferred subjects for decorative painters in Germany, especially in court art.

#### Works by the Asam Family and Johann Oswald Harms

Below are examples from two of the most prolific painter families mentioned above:

<div id="asam-gallery" class="baroque-gallery"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPainterGallery('#asam-gallery', ['Asam, Cosmas Damian', 'Asam, Hans Georg'], { limit: 4 });
})();
</script>

<div id="harms-gallery" class="baroque-gallery" style="margin-top: 20px;"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPainterGallery('#harms-gallery', 'Harms, Johann Oswald', { limit: 4 });
})();
</script>

Baroque mythological splendor: A ceiling painting of Venus surrounded by nymphs and cherubs, created in 1774 by Johann Christoph Frisch for the Jasper Room in Potsdam’s New Chambers palace. Here the Roman love goddess rides a golden chariot amidst the clouds, attended by her retinue of cupidons. Such works exemplified the late Baroque taste for classical mythology used in service of courtly decoration – in this case under King Frederick the Great of Prussia. The painting’s theme (Venus and attendant Graces) celebrates beauty, love, and abundance, appropriate for a festive banqueting hall. This lavish imagery also flattered the patron’s cultured image, turning the room into a staged “Olympian” realm for the awe and amusement of guests.


<div id="frisch-card" class="painting-card-container"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPaintingCard('#frisch-card', '66e15265-bcd2-4b78-9716-ced2b5d983f0');
})();
</script>


Across the German states, countless mythological paintings adorned palace halls, bedroom suites, garden pavilions, and even official buildings, each with its own context. Some followed popular literary sources – for example scenes of Bacchus, Ceres and Venus illustrating the proverb “Sine Baccho et Cerere friget Venus” (“Without wine and bread, love grows cold”) were surprisingly popular in Baroque Germany. (This theme, originating from the Roman playwright Terence, reminded viewers that love needs the sustenance of food and drink – a playful moral well-suited to dining halls!) Other works took on more martial or political tones: allegories of Mars, Minerva and Hercules were used to stress virtues like courage, wisdom and strength associated with rulers. A significant subset of these paintings were “Apotheosis” images, literally showing mortals (often heroes like Hercules, or personifications of princely virtues) being taken up to Olympus. For instance, a large canvas by Johann Heinrich Ritter in the 1690s depicts Hercules entering Olympus in Jupiter’s presence; this painting, commissioned by a newly ennobled baron, explicitly linked the patron’s own elevation in status to Hercules’s deification. In all these examples, the relevance of mythology to the Baroque viewer is clear: it provided a prestigious historical mirror by which contemporary events and persons could be glorified. Ancient legends became vehicles for Baroque propaganda, celebration, and philosophical reflection.


#### Hercules in Baroque Art

Hercules (German: Herkules) was among the most popular mythological figures in Baroque ceiling painting. His labors symbolized virtuous struggle, and his apotheosis represented the reward of immortal fame for earthly deeds – themes that resonated deeply with noble patrons seeking to glorify their dynasties:

<div id="hercules-gallery" class="baroque-gallery"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderMythFigureGallery('#hercules-gallery', 'Herkules', { limit: 6 });
})();
</script>

### Legacy and Contextual Insights

By weaving classical mythology into the very fabric of Baroque visual culture, the princes of that age not only paid homage to antiquity but also created a lasting record of their own world-view. The 4500+ Baroque artworks in Germany’s collections today (many of them in our dataset) testify to how pervasive and significant mythological painting was during this era. These paintings offer modern viewers a window into the cultural and historical context of the Baroque: a time when learning from the ancients was fashionable, when rulers legitimized themselves through grandiose allegory, and when artists were challenged to satisfy both aesthetic and symbolic demands. Baroque mythological paintings were far from idle decoration – they were conversation pieces and ideological statements. The statistics in our data story (e.g. which gods or heroes were painted most, which artists were most prolific) are grounded in this rich tradition. For example, it is no coincidence that our top-listed painters like Carlo Ludovico Castelli (active 1720s), Cosmas Damian Asam, Johann W. Richter, Johann H. Ritter, and Januarius Zick all created multiple works featuring Olympian deities; they were sought-after precisely because noble patrons demanded these mythic scenes in quantity. Each artist brought their stylistic flair – Castelli’s vibrant Italianate colors, Asam’s dramatic composition, Zick’s late-Baroque elegance – but all were contributing to the same cultural phenomenon.


#### Works by Leading Mythological Painters

Below we showcase works from several of the painters mentioned above, demonstrating the diversity of styles within the mythological genre:

<div id="castelli-gallery" class="baroque-gallery"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPainterGallery('#castelli-gallery', 'Castelli, Carlo Ludovico', { limit: 3 });
})();
</script>

<div id="ritter-gallery" class="baroque-gallery" style="margin-top: 15px;"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPainterGallery('#ritter-gallery', 'Ritter, Johann Heinrich', { limit: 3 });
})();
</script>

<div id="zick-gallery" class="baroque-gallery" style="margin-top: 15px;"></div>

<script type="module">
(async function() {
    while (!BaroqueDB.isReady()) {
        await new Promise(r => setTimeout(r, 100));
    }
    await BaroqueViz.renderPainterGallery('#zick-gallery', 'Zick, Januarius', { limit: 3 });
})();
</script>

In conclusion, mythological painting during the Baroque was a fusion of art, literature, politics, and theater. Its relevance in that period stemmed from its ability to elevate the present by drawing on the past. Whether a ceiling filled with frolicking gods symbolized a bountiful golden age under a wise ruler, or a heroic tableau flattered a military victory, these works gave the Baroque era a visual mythology of its own. They remind us that art can be both decorative and deeply meaningful. In the chapters that follow, as we present infographics about these paintings – their dates, their patrons, their subjects – this historical context will help illuminate why a prince in 1700 would pay handsomely to surround himself with Venus, Jupiter, Apollo, and company, and how those choices reflect the values and aspirations of the Baroque world.




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
    <button onclick="if(window.loadPainterInExplorer){window.loadPainterInExplorer('Zick, Januarius');document.getElementById('painter-explorer-container').scrollIntoView({behavior:'smooth'});}" 
            style="padding: 12px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95em;">
        🎨 Januarius Zick
    </button>
    <button onclick="if(window.loadPainterInExplorer){window.loadPainterInExplorer('Carlone, Carlo Innocenzo');document.getElementById('painter-explorer-container').scrollIntoView({behavior:'smooth'});}" 
            style="padding: 12px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95em;">
        🎨 Carlo Innocenzo Carlone
    </button>
    <button onclick="if(window.loadPainterInExplorer){window.loadPainterInExplorer('Scheffler, Felix Anton');document.getElementById('painter-explorer-container').scrollIntoView({behavior:'smooth'});}" 
            style="padding: 12px; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95em;">
        🎨 Felix Anton Scheffler
    </button>
    <button onclick="if(window.loadPainterInExplorer){window.loadPainterInExplorer('Holzer, Johann Evangelist');document.getElementById('painter-explorer-container').scrollIntoView({behavior:'smooth'});}" 
            style="padding: 12px; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95em;">
        🎨 Johann Evangelist Holzer
    </button>
    <button onclick="if(window.loadPainterInExplorer){window.loadPainterInExplorer('Troger, Paul');document.getElementById('painter-explorer-container').scrollIntoView({behavior:'smooth'});}" 
            style="padding: 12px; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95em;">
        🎨 Paul Troger
    </button>
</div>

