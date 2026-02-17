/**
 * Baroque Ceiling Paintings - Interactive Query Components
 * 
 * This module provides pre-built interactive visualization components
 * for the CbDD (Baroque Ceiling Paintings) data story.
 * 
 * Components:
 * - Painter biography cards with timeline
 * - Geographic distribution map
 * - Temporal distribution chart
 * - Subject analysis (ICONCLASS hierarchy)
 * - Cross-dataset comparison (CbDD vs Bildindex)
 */

window.BaroqueViz = (function() {
    'use strict';

    // Color schemes
    const COLORS = {
        primary: '#3498db',
        secondary: '#e67e22',
        success: '#27ae60',
        info: '#9b59b6',
        states: [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#e67e22', '#34495e', '#95a5a6', '#d35400'
        ]
    };

    // SQL Query Templates
    const QUERIES = {
        paintingsByState: `
            SELECT 
                location_state,
                COUNT(*) as painting_count,
                COUNT(DISTINCT building_id) as building_count
            FROM paintings
            WHERE location_state IS NOT NULL
            GROUP BY location_state
            ORDER BY painting_count DESC
        `,
        
        temporalDistribution: `
            SELECT 
                CAST(FLOOR(year_start / 10) * 10 AS INTEGER) as decade,
                COUNT(*) as count
            FROM paintings
            WHERE year_start IS NOT NULL
              AND year_start >= 1500 AND year_start <= 1900
            GROUP BY FLOOR(year_start / 10) * 10
            ORDER BY decade
        `,
        
        topPainters: `
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
        `,
        
        iconclassCategories: `
            -- Extract ICONCLASS code from subject_uri (e.g. https://iconclass.org/11D121 -> 11D121)
            SELECT
                SUBSTRING(regexp_replace(s.subject_uri, '.*/', ''), 1, 1) as category,
                COUNT(DISTINCT ps.nfdi_uri) as painting_count
            FROM painting_subjects ps
            JOIN subjects s ON ps.subject_uri = s.subject_uri
            WHERE s.subject_source = 'ICONCLASS' AND s.subject_uri IS NOT NULL
            GROUP BY SUBSTRING(regexp_replace(s.subject_uri, '.*/', ''), 1, 1)
            ORDER BY painting_count DESC
        `,
        
        buildingsWithCoords: `
            SELECT 
                b.label as building_name,
                b.latitude,
                b.longitude,
                b.location_city,
                b.location_state,
                COUNT(DISTINCT p.nfdi_uri) as painting_count
            FROM buildings b
            JOIN paintings p ON b.building_id = p.building_id
            WHERE b.latitude IS NOT NULL AND b.longitude IS NOT NULL
            GROUP BY b.building_id, b.label, b.latitude, b.longitude, 
                     b.location_city, b.location_state
            ORDER BY painting_count DESC
        `,
        
        crossDatasetOverlap: `
            SELECT 
                'CbDD Paintings' as source,
                COUNT(DISTINCT nfdi_uri) as count
            FROM paintings
            UNION ALL
            SELECT 
                'Bildindex Items' as source,
                COUNT(DISTINCT bildindex_uri) as count
            FROM bi_items
        `,
        
        painterWithBildindex: `
            WITH painter_gnds AS (
                SELECT DISTINCT
                    pp.person_name,
                    TRIM(gnd.value) as gnd
                FROM paintings p
                CROSS JOIN UNNEST(STRING_SPLIT(p.creatorGnds, '|')) as t(value)
                JOIN painting_persons pp ON p.nfdi_uri = pp.nfdi_uri
                WHERE pp.role = 'PAINTER' AND p.creatorGnds IS NOT NULL
                LATERAL JOIN (SELECT TRIM(t.value) as value) as gnd ON TRUE
            )
            SELECT 
                pg.person_name,
                COUNT(DISTINCT bi.bildindex_uri) as bildindex_count
            FROM painter_gnds pg
            JOIN bi_painters bi ON pg.gnd = bi.painter_gnd
            GROUP BY pg.person_name
            ORDER BY bildindex_count DESC
            LIMIT 15
        `, 

        coPainterPairs: `
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
        `
    };

    // ICONCLASS category labels
    const ICONCLASS_LABELS = {
        '0': 'Abstract Art',
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

    /**
     * Render geographic distribution of paintings by state as a bar chart
     */
    async function renderStateDistribution(container) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading geographic distribution...</div>';

        try {
            const data = await BaroqueDB.query(QUERIES.paintingsByState);
            
            const trace = {
                x: data.map(d => d.painting_count),
                y: data.map(d => d.location_state),
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: data.map((_, i) => COLORS.states[i % COLORS.states.length])
                },
                text: data.map(d => `${d.painting_count} paintings, ${d.building_count} buildings`),
                hoverinfo: 'text+y'
            };

            const layout = {
                title: 'Baroque Ceiling Paintings by German State',
                xaxis: { title: 'Number of Paintings' },
                yaxis: { automargin: true },
                margin: { l: 150, r: 30, t: 50, b: 50 },
                height: 500
            };

            Plotly.newPlot(el, [trace], layout, { responsive: true });
            return data;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render temporal distribution by decade
     */
    async function renderTemporalDistribution(container) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading temporal distribution...</div>';

        try {
            const data = await BaroqueDB.query(QUERIES.temporalDistribution);
            
            const trace = {
                x: data.map(d => d.decade),
                y: data.map(d => d.count),
                type: 'bar',
                marker: {
                    color: COLORS.primary,
                    line: { color: '#2980b9', width: 1 }
                }
            };

            const layout = {
                title: 'Baroque Ceiling Paintings by Decade',
                xaxis: { 
                    title: 'Decade',
                    tickangle: -45
                },
                yaxis: { title: 'Number of Paintings' },
                margin: { l: 60, r: 30, t: 50, b: 80 },
                height: 400
            };

            Plotly.newPlot(el, [trace], layout, { responsive: true });
            return data;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render top painters by number of paintings
     */
    async function renderTopPainters(container, limit = 20) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading top painters...</div>';

        try {
            const data = await BaroqueDB.query(QUERIES.topPainters);
            
            const trace = {
                x: data.map(d => d.painting_count),
                y: data.map(d => d.person_name),
                type: 'bar',
                orientation: 'h',
                marker: { color: COLORS.secondary },
                text: data.map(d => `${d.earliest || '?'} - ${d.latest || '?'}`),
                hovertemplate: '<b>%{y}</b><br>Paintings: %{x}<br>Active: %{text}<extra></extra>'
            };

            const layout = {
                title: 'Top 20 Baroque Ceiling Painters',
                xaxis: { title: 'Number of Paintings' },
                yaxis: { automargin: true },
                margin: { l: 200, r: 30, t: 50, b: 50 },
                height: 600
            };

            Plotly.newPlot(el, [trace], layout, { responsive: true });
            return data;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render top co-painter relationships (pairs)
     */
    async function renderCoPainterPairs(container) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading co-painter network…</div>';

        try {
            /* ── 1. Query: top-50 collaborative painters & their mutual edges ── */
            const sql = `
              WITH painters AS (
                SELECT nfdi_uri, person_name AS painter
                FROM painting_persons
                WHERE role='PAINTER' AND person_name IS NOT NULL
              ),
              pairs AS (
                SELECT a.painter AS p1, b.painter AS p2, COUNT(*) AS n_co
                FROM painters a
                JOIN painters b ON a.nfdi_uri = b.nfdi_uri AND a.painter < b.painter
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
            `;
            const edges = await BaroqueDB.query(sql);

            if (!edges.length) {
                el.innerHTML = '<div class="error">No co-painter data found.</div>';
                return;
            }

            /* ── 2. Build node list with total collaboration weight ── */
            const nodeWeight = {};
            for (const e of edges) {
                nodeWeight[e.p1] = (nodeWeight[e.p1] || 0) + e.n_co;
                nodeWeight[e.p2] = (nodeWeight[e.p2] || 0) + e.n_co;
            }
            const nodes = Object.keys(nodeWeight);
            const nodeIndex = {};
            nodes.forEach((n, i) => { nodeIndex[n] = i; });

            /* ── 3. Simple force-directed layout (iterative spring model) ── */
            const N = nodes.length;
            const pos = nodes.map((_, i) => ({
                x: Math.cos(2 * Math.PI * i / N) * 8,
                y: Math.sin(2 * Math.PI * i / N) * 8
            }));

            const ITERATIONS = 500;
            const K_REPULSE = 4.0;
            const K_ATTRACT = 0.008;
            const DAMPING   = 0.90;
            const vel = nodes.map(() => ({ x: 0, y: 0 }));

            for (let iter = 0; iter < ITERATIONS; iter++) {
                // Repulsion between all pairs
                for (let i = 0; i < N; i++) {
                    for (let j = i + 1; j < N; j++) {
                        let dx = pos[i].x - pos[j].x;
                        let dy = pos[i].y - pos[j].y;
                        let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                        let force = K_REPULSE / (dist * dist);
                        let fx = (dx / dist) * force;
                        let fy = (dy / dist) * force;
                        vel[i].x += fx;  vel[i].y += fy;
                        vel[j].x -= fx;  vel[j].y -= fy;
                    }
                }
                // Attraction along edges
                for (const e of edges) {
                    const i = nodeIndex[e.p1], j = nodeIndex[e.p2];
                    let dx = pos[j].x - pos[i].x;
                    let dy = pos[j].y - pos[i].y;
                    let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                    // Stronger attraction for heavier edges
                    let force = K_ATTRACT * Math.log(1 + e.n_co) * dist;
                    let fx = (dx / dist) * force;
                    let fy = (dy / dist) * force;
                    vel[i].x += fx;  vel[i].y += fy;
                    vel[j].x -= fx;  vel[j].y -= fy;
                }
                // Apply velocity + damping
                for (let i = 0; i < N; i++) {
                    vel[i].x *= DAMPING;
                    vel[i].y *= DAMPING;
                    pos[i].x += vel[i].x;
                    pos[i].y += vel[i].y;
                }
            }

            /* ── 4. Build Plotly traces ── */
            const maxCo = Math.max(...edges.map(e => e.n_co));
            const minCo = Math.min(...edges.map(e => e.n_co));

            // Build edge lines as Plotly shapes (these always render reliably)
            const edgeShapes = edges.map(e => {
                const i = nodeIndex[e.p1], j = nodeIndex[e.p2];
                const w = minCo === maxCo
                    ? 8
                    : 3 + (e.n_co - minCo) / (maxCo - minCo) * 21;
                const op = minCo === maxCo
                    ? 0.7
                    : 0.3 + (e.n_co - minCo) / (maxCo - minCo) * 0.5;
                return {
                    type: 'line',
                    x0: pos[i].x, y0: pos[i].y,
                    x1: pos[j].x, y1: pos[j].y,
                    line: { width: w, color: `rgba(52, 73, 94, ${op})` },
                    layer: 'below'
                };
            });

            // Invisible scatter trace at midpoints for edge hover tooltips
            const edgeHoverTrace = {
                type: 'scatter',
                x: edges.map(e => (pos[nodeIndex[e.p1]].x + pos[nodeIndex[e.p2]].x) / 2),
                y: edges.map(e => (pos[nodeIndex[e.p1]].y + pos[nodeIndex[e.p2]].y) / 2),
                text: edges.map(e => `${e.p1} ↔ ${e.p2}: ${e.n_co} co-painted works`),
                mode: 'markers+text',
                texttemplate: edges.map(e => `${e.n_co}`),
                textfont: { size: 10, color: '#888' },
                textposition: 'middle center',
                marker: { size: 8, color: 'rgba(0,0,0,0)' },
                hoverinfo: 'text',
                showlegend: false
            };

            // Node trace
            const maxWeight = Math.max(...nodes.map(n => nodeWeight[n]));
            const minWeight = Math.min(...nodes.map(n => nodeWeight[n]));
            const nodeSizes = nodes.map(n => {
                const w = nodeWeight[n];
                return minWeight === maxWeight
                    ? 22
                    : 12 + (w - minWeight) / (maxWeight - minWeight) * 26;
            });

            const nodeTrace = {
                type: 'scatter',
                x: pos.map(p => p.x),
                y: pos.map(p => p.y),
                text: nodes.map(n => {
                    const shortName = n.length > 20 ? n.slice(0, 18) + '…' : n;
                    return shortName;
                }),
                customdata: nodes.map(n => `<b>${n}</b><br>Total co-painted: ${nodeWeight[n]}`),
                hovertemplate: '%{customdata}<extra></extra>',
                mode: 'markers+text',
                textposition: 'top center',
                textfont: { size: 9, color: '#2c3e50', family: 'sans-serif' },
                marker: {
                    size: nodeSizes,
                    color: nodes.map((_, i) => COLORS.states[i % COLORS.states.length]),
                    line: { width: 2, color: '#fff' },
                    opacity: 0.92
                },
                showlegend: false
            };

            /* ── 5. Layout & render ── */
            Plotly.purge(el);
            el.innerHTML = '';

            const layout = {
                title: {
                    text: 'Co-painter Network (top 50 collaborative painters)',
                    font: { size: 16 }
                },
                hovermode: 'closest',
                xaxis: { visible: false, zeroline: false },
                yaxis: { visible: false, zeroline: false, scaleanchor: 'x' },
                margin: { l: 20, r: 20, t: 50, b: 20 },
                height: 900,
                shapes: edgeShapes,
                plot_bgcolor: 'rgba(0,0,0,0)',
                paper_bgcolor: 'rgba(0,0,0,0)',
                annotations: [{
                    text: 'Node size = total collaborative works · Edge thickness = co-painted works between pair',
                    xref: 'paper', yref: 'paper',
                    x: 0.5, y: -0.01,
                    showarrow: false,
                    font: { size: 11, color: '#888' }
                }]
            };

            await Plotly.newPlot(el, [edgeHoverTrace, nodeTrace], layout, {
                responsive: true,
                displayModeBar: false
            });
            return edges;

        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }
      
    /**
     * Render ICONCLASS category distribution
     */
    async function renderIconclassCategories(container) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading subject categories...</div>';

        try {
            const data = await BaroqueDB.query(QUERIES.iconclassCategories);
            
            // Add labels
            const labeled = data.map(d => ({
                ...d,
                label: ICONCLASS_LABELS[d.category] || `Category ${d.category}`
            }));

            const trace = {
                values: labeled.map(d => d.painting_count),
                labels: labeled.map(d => d.label),
                type: 'pie',
                hole: 0.4,
                textinfo: 'label+percent',
                textposition: 'outside',
                marker: {
                    colors: COLORS.states
                }
            };

            const layout = {
                title: 'ICONCLASS Subject Categories in Baroque Ceiling Paintings',
                height: 500,
                showlegend: true,
                legend: { orientation: 'h', y: -0.1 }
            };

            Plotly.newPlot(el, [trace], layout, { responsive: true });
            return labeled;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render interactive map of building locations
     */
    async function renderBuildingsMap(container) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading buildings map...</div>';
        el.style.height = '600px';

        try {
            // Inspect schema to find available coordinate columns
            const bCols = await BaroqueDB.query("PRAGMA table_info('buildings')");
            const buildingCols = bCols.map(c => c.name ? c.name.toLowerCase() : c.name);

            const pCols = await BaroqueDB.query("PRAGMA table_info('paintings')");
            const paintingCols = pCols.map(c => c.name ? c.name.toLowerCase() : c.name);

            // Candidate coordinate column name sets to look for
            const latCandidates = ['latitude', 'lat', 'location_latitude', 'y'];
            const lonCandidates = ['longitude', 'lon', 'location_longitude', 'x'];

            function findColumn(cols, candidates) {
                for (const c of candidates) {
                    if (cols.indexOf(c) !== -1) return c;
                }
                return null;
            }

            const bLat = findColumn(buildingCols, latCandidates);
            const bLon = findColumn(buildingCols, lonCandidates);

            // Determine building name column (label vs name etc.)
            const nameCandidates = ['label', 'name', 'building_name', 'title'];
            const nameCol = findColumn(buildingCols, nameCandidates) || 'name';
            // Determine city column if present
            const cityCandidates = ['location_city', 'city', 'town'];
            const cityCol = findColumn(buildingCols, cityCandidates);

            let sql;
            if (bLat && bLon) {
                // Buildings table has coordinates
                sql = `
                    SELECT 
                        b.${nameCol} as building_name,
                        b.${bLat} as latitude,
                        b.${bLon} as longitude,
                        ${cityCol ? `b.${cityCol},` : ''}
                        b.location_state,
                        COUNT(DISTINCT p.nfdi_uri) as painting_count
                    FROM buildings b
                    JOIN paintings p ON b.building_id = p.building_id
                    WHERE b.${bLat} IS NOT NULL AND b.${bLon} IS NOT NULL
                    GROUP BY b.building_id, b.${nameCol}, b.${bLat}, b.${bLon}, 
                             ${cityCol ? `b.${cityCol},` : ''} b.location_state
                    ORDER BY painting_count DESC
                `;
            } else {
                // Try to find coordinates in paintings table and average per building
                const pLat = findColumn(paintingCols, latCandidates);
                const pLon = findColumn(paintingCols, lonCandidates);

                if (pLat && pLon) {
                    sql = `
                        SELECT
                            b.${nameCol} as building_name,
                            AVG(CAST(p.${pLat} AS DOUBLE)) as latitude,
                            AVG(CAST(p.${pLon} AS DOUBLE)) as longitude,
                            ${cityCol ? `b.${cityCol},` : ''}
                            b.location_state,
                            COUNT(DISTINCT p.nfdi_uri) as painting_count
                        FROM buildings b
                        JOIN paintings p ON b.building_id = p.building_id
                        WHERE p.${pLat} IS NOT NULL AND p.${pLon} IS NOT NULL
                        GROUP BY b.building_id, b.${nameCol}, ${cityCol ? `b.${cityCol},` : ''} b.location_state
                        ORDER BY painting_count DESC
                    `;
                } else {
                    throw new Error('No coordinate columns found in `buildings` or `paintings` tables.');
                }
            }

            const data = await BaroqueDB.query(sql);
            
            // Clear loading message
            el.innerHTML = '';

            // Create map
            const map = L.map(el).setView([51.0, 10.0], 6);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            // Use marker cluster if available
            const markers = typeof L.markerClusterGroup === 'function' 
                ? L.markerClusterGroup() 
                : L.layerGroup();

            for (const building of data) {
                const lat = parseFloat(building.latitude);
                const lng = parseFloat(building.longitude);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    const marker = L.marker([lat, lng]);
                    marker.bindPopup(`
                        <strong>${building.building_name}</strong><br>
                        ${building.location_city || ''}, ${building.location_state || ''}<br>
                        <em>${building.painting_count} ceiling paintings</em>
                    `);
                    markers.addLayer(marker);
                }
            }

            markers.addTo(map);

            // Fit to bounds
            const bounds = data
                .filter(b => !isNaN(parseFloat(b.latitude)) && !isNaN(parseFloat(b.longitude)))
                .map(b => [parseFloat(b.latitude), parseFloat(b.longitude)]);
            
            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [20, 20] });
            }

            return { map, data };
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render cross-dataset comparison chart
     */
    async function renderCrossDatasetComparison(container) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading dataset comparison...</div>';

        try {
            const data = await BaroqueDB.query(QUERIES.crossDatasetOverlap);
            
            const trace = {
                values: data.map(d => d.count),
                labels: data.map(d => d.source),
                type: 'pie',
                marker: {
                    colors: [COLORS.primary, COLORS.secondary]
                },
                textinfo: 'label+value+percent'
            };

            const layout = {
                title: 'CbDD vs Bildindex: Total Items',
                height: 400
            };

            Plotly.newPlot(el, [trace], layout, { responsive: true });
            return data;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render painter biography card
     */
    async function renderPainterBiography(container, painterName) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading painter biography...</div>';

        try {
            const sql = `
                WITH painter_data AS (
                    SELECT 
                        pp.person_name,
                        pp.person_id,
                        COUNT(DISTINCT pp.nfdi_uri) as painting_count,
                        COUNT(DISTINCT p.building_id) as building_count,
                        MIN(p.year_start) as earliest,
                        MAX(p.year_end) as latest,
                        STRING_AGG(DISTINCT p.location_state, ', ') as states
                    FROM painting_persons pp
                    JOIN paintings p ON pp.nfdi_uri = p.nfdi_uri
                    WHERE pp.role = 'PAINTER' 
                      AND pp.person_name = '${painterName.replace(/'/g, "''")}'
                    GROUP BY pp.person_name, pp.person_id
                )
                SELECT * FROM painter_data
            `;
            
            const data = await BaroqueDB.query(sql);
            
            if (data.length === 0) {
                el.innerHTML = '<div class="no-data">Painter not found.</div>';
                return null;
            }

            const painter = data[0];
            
            // Get subject preferences
            const subjectsSql = `
                SELECT 
                    s.subject_label,
                    COUNT(*) as count
                FROM painting_persons pp
                JOIN painting_subjects ps ON pp.nfdi_uri = ps.nfdi_uri
                JOIN subjects s ON ps.subject_uri = s.subject_uri
                WHERE pp.person_name = '${painterName.replace(/'/g, "''")}'
                  AND pp.role = 'PAINTER'
                  AND s.subject_source = 'ICONCLASS'
                GROUP BY s.subject_label
                ORDER BY count DESC
                LIMIT 5
            `;
            const subjects = await BaroqueDB.query(subjectsSql);

            el.innerHTML = `
                <div class="painter-card" style="border: 2px solid #333; border-radius: 10px; padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);">
                    <h2 style="margin-top: 0; color: #2c3e50; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
                        🎨 ${painter.person_name}
                    </h2>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <h3 style="color: ${COLORS.primary};">📊 Career Statistics</h3>
                            <table style="width: 100%;">
                                <tr><td><strong>Active Period:</strong></td><td>${painter.earliest || '?'} – ${painter.latest || '?'}</td></tr>
                                <tr><td><strong>Paintings:</strong></td><td>${painter.painting_count}</td></tr>
                                <tr><td><strong>Buildings:</strong></td><td>${painter.building_count}</td></tr>
                                <tr><td><strong>Regions:</strong></td><td>${painter.states || 'Unknown'}</td></tr>
                            </table>
                        </div>
                        
                        <div>
                            <h3 style="color: ${COLORS.success};">📚 Top Subjects</h3>
                            <ul style="margin: 0; padding-left: 20px;">
                                ${subjects.map(s => `<li>${s.subject_label} (${s.count}x)</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;

            return { painter, subjects };
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render a custom SQL query result as interactive table
     */
    async function renderCustomQuery(container, sql, title = 'Query Results') {
        const el = _getElement(container);
        el.innerHTML = `<div class="loading">Running query...</div>`;

        try {
            const data = await BaroqueDB.query(sql);
            
            if (data.length === 0) {
                el.innerHTML = '<div class="no-data">No results found.</div>';
                return [];
            }

            // Create table HTML
            const columns = Object.keys(data[0]);
            const tableId = 'baroque-table-' + Math.random().toString(36).substr(2, 9);
            
            let html = `<h4>${title}</h4>`;
            html += `<table id="${tableId}" class="display compact" style="width:100%">`;
            html += '<thead><tr>' + columns.map(c => `<th>${c}</th>`).join('') + '</tr></thead>';
            html += '<tbody>';
            for (const row of data) {
                html += '<tr>';
                for (const col of columns) {
                    const val = row[col];
                    html += `<td>${val === null ? '' : val}</td>`;
                }
                html += '</tr>';
            }
            html += '</tbody></table>';
            
            el.innerHTML = html;

            // Initialize DataTables
            if (typeof $ !== 'undefined' && $.fn.DataTable) {
                $(`#${tableId}`).DataTable({
                    scrollX: true,
                    pageLength: 10
                });
            }

            return data;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render a painting card with image and metadata from database
     * @param {string} container - CSS selector or DOM element
     * @param {string} paintingId - UUID or full nfdi_uri of the painting
     * @param {object} options - { showImage: true, captionStyle: 'below'|'overlay' }
     */
    async function renderPaintingCard(container, paintingId, options = {}) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading painting...</div>';

        const { showImage = true, captionStyle = 'below' } = options;

        try {
            // Build WHERE clause to match UUID or full URI
            const whereClause = paintingId.includes('http') 
                ? `nfdi_uri = '${paintingId}'`
                : `nfdi_uri LIKE '%${paintingId}%'`;

            const sql = `
                SELECT 
                    p.nfdi_uri,
                    p.label,
                    p.painters,
                    p.commissioners,
                    p.year_start,
                    p.year_end,
                    p.building_name,
                    p.room_name,
                    p.location_state,
                    p.imageUrl,
                    p.method
                FROM paintings p
                WHERE ${whereClause}
                LIMIT 1
            `;
            
            const data = await BaroqueDB.query(sql);
            
            if (data.length === 0) {
                el.innerHTML = '<div class="no-data">Painting not found in database.</div>';
                return null;
            }

            const painting = data[0];
            
            // Get all persons involved
            const personsSql = `
                SELECT person_name, role 
                FROM painting_persons 
                WHERE nfdi_uri = '${painting.nfdi_uri}'
                ORDER BY role
            `;
            const persons = await BaroqueDB.query(personsSql);

            // Build persons by role
            const personsByRole = {};
            for (const p of persons) {
                if (!personsByRole[p.role]) personsByRole[p.role] = [];
                personsByRole[p.role].push(p.person_name);
            }

            const yearStr = painting.year_start === painting.year_end 
                ? painting.year_start 
                : `${painting.year_start}–${painting.year_end}`;

            const cardHtml = `
                <figure class="painting-card" style="margin: 1em 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: #fafafa;">
                    ${showImage && painting.imageUrl ? `
                        <a href="${painting.nfdi_uri}" target="_blank" rel="noopener">
                            <img src="${painting.imageUrl}" alt="${painting.label}" 
                                 style="width: 100%; max-height: 400px; object-fit: contain; background: #000;">
                        </a>
                    ` : ''}
                    <figcaption style="padding: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">
                            <a href="${painting.nfdi_uri}" target="_blank" style="color: inherit; text-decoration: none;">
                                ${painting.label}
                            </a>
                        </h4>
                        <div style="font-size: 0.9em; color: #666; line-height: 1.6;">
                            <div><strong>📅 Year:</strong> ${yearStr || 'Unknown'}</div>
                            <div><strong>📍 Location:</strong> ${painting.building_name || ''}${painting.room_name ? `, ${painting.room_name}` : ''}</div>
                            <div><strong>🗺️ Region:</strong> ${painting.location_state || 'Unknown'}</div>
                            ${personsByRole['PAINTER'] ? `<div><strong>🎨 Painter(s):</strong> ${_makeClickablePainterNames(personsByRole['PAINTER'])}</div>` : ''}
                            ${painting.commissioners ? `<div><strong>👑 Commissioner:</strong> ${painting.commissioners}</div>` : ''}
                            ${painting.method ? `<div><strong>🖌️ Technique:</strong> ${painting.method}</div>` : ''}
                        </div>
                    </figcaption>
                </figure>
            `;

            el.innerHTML = cardHtml;
            return painting;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render a room card with associated paintings, architects, and commissioners
     * @param {string} container - CSS selector or DOM element
     * @param {string} roomId - UUID of the room
     * @param {object} options - { showPaintings: true, paintingLimit: 4 }
     */
    async function renderRoomCard(container, roomId, options = {}) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading room...</div>';

        const { showPaintings = true, paintingLimit = 8 } = options;

        try {
            // Get room details
            const roomSql = `
                SELECT 
                    r.room_id,
                    r.name as room_name,
                    r.function as room_function,
                    b.name as building_name,
                    b.location_state,
                    b.function as building_function,
                    b.construction_date
                FROM rooms r
                JOIN buildings b ON r.building_id = b.building_id
                WHERE r.room_id = '${roomId}'
                LIMIT 1
            `;
            
            const roomData = await BaroqueDB.query(roomSql);
            
            if (roomData.length === 0) {
                el.innerHTML = '<div class="no-data">Room not found in database.</div>';
                return null;
            }

            const room = roomData[0];

            // Get persons associated with this room
            const personsSql = `
                SELECT person_name, role 
                FROM room_persons 
                WHERE room_id = '${roomId}'
                ORDER BY role, person_name
            `;
            const persons = await BaroqueDB.query(personsSql);

            // Group by role
            const personsByRole = {};
            for (const p of persons) {
                if (!personsByRole[p.role]) personsByRole[p.role] = [];
                personsByRole[p.role].push(p.person_name);
            }

            // Get paintings in this room with full details
            let paintingsHtml = '';
            let paintings = [];
            if (showPaintings) {
                const paintingsSql = `
                    SELECT 
                        p.nfdi_uri, 
                        p.label, 
                        p.painters, 
                        p.commissioners,
                        p.year_start, 
                        p.year_end,
                        p.method,
                        p.imageUrl
                    FROM paintings p
                    WHERE p.room_name = '${room.room_name.replace(/'/g, "''")}'
                    AND p.building_name = '${room.building_name.replace(/'/g, "''")}'
                    LIMIT ${paintingLimit}
                `;
                paintings = await BaroqueDB.query(paintingsSql);
                
                if (paintings.length > 0) {
                    // Generate unique ID for this room card instance
                    const roomCardId = 'room-' + Math.random().toString(36).substr(2, 9);
                    
                    const paintingCards = paintings.map((p, idx) => {
                        const paintingId = `${roomCardId}-painting-${idx}`;
                        const yearStr = p.year_start === p.year_end 
                            ? (p.year_start || 'Unknown') 
                            : `${p.year_start || '?'}–${p.year_end || '?'}`;
                        
                        return `
                            <div class="room-painting-item" style="flex: 0 0 calc(25% - 10px); min-width: 140px; margin-bottom: 10px;">
                                <div class="room-painting-thumb" 
                                     data-painting-id="${paintingId}"
                                     style="cursor: pointer; position: relative;">
                                    ${p.imageUrl ? `
                                        <img src="${p.imageUrl}" alt="${p.label}" 
                                             style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px; border: 2px solid transparent; transition: border-color 0.2s;">
                                    ` : `
                                        <div style="width: 100%; height: 100px; background: #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #888;">
                                            No image
                                        </div>
                                    `}
                                    <div style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.6); color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 0.7em;">
                                        ℹ️
                                    </div>
                                </div>
                                <div style="font-size: 0.75em; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #444;">
                                    ${p.label}
                                </div>
                                
                                <!-- Expandable painting details -->
                                <div id="${paintingId}" class="painting-details-dropdown" 
                                     style="display: none; margin-top: 8px; padding: 12px; background: #fff; border: 1px solid #ccc; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-size: 0.85em;">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                        <strong style="color: #2c3e50; font-size: 1em; line-height: 1.3;">${p.label}</strong>
                                        <button class="close-painting-details" data-target="${paintingId}" 
                                                style="background: none; border: none; cursor: pointer; font-size: 1.2em; color: #888; padding: 0 4px;">×</button>
                                    </div>
                                    <div style="color: #555; line-height: 1.6;">
                                        <div><strong>📅 Year:</strong> ${yearStr}</div>
                                        ${p.painters ? `<div><strong>🎨 Painter(s):</strong> ${_makeClickablePainterNames(p.painters)}</div>` : ''}
                                        ${p.commissioners ? `<div><strong>👑 Commissioner:</strong> ${p.commissioners}</div>` : ''}
                                        ${p.method ? `<div><strong>🖌️ Technique:</strong> ${p.method}</div>` : ''}
                                        <div style="margin-top: 8px;">
                                            <a href="${p.nfdi_uri}" target="_blank" rel="noopener" 
                                               style="color: #3498db; text-decoration: none; font-size: 0.9em;">
                                                View in CbDD →
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                    
                    paintingsHtml = `
                        <div class="room-paintings-section" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ccc;">
                            <strong style="font-size: 0.9em; color: #555;">🖼️ Paintings in this room (${paintings.length}):</strong>
                            <p style="font-size: 0.8em; color: #888; margin: 5px 0 10px 0;">Click on a painting to see details</p>
                            <div class="room-paintings-grid" style="display: flex; gap: 10px; flex-wrap: wrap;">
                                ${paintingCards}
                            </div>
                        </div>
                    `;
                }
            }

            const cardHtml = `
                <div class="room-card" style="margin: 1em 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);">
                    <div style="padding: 20px;">
                        <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 1.3em;">
                            🏛️ ${room.room_name}
                        </h4>
                        <div style="color: #666; font-size: 0.95em; margin-bottom: 15px;">
                            ${room.building_name}
                        </div>
                        <div style="font-size: 0.9em; color: #555; line-height: 1.7;">
                            ${room.room_function ? `<div><strong>Function:</strong> ${room.room_function}</div>` : ''}
                            <div><strong>🗺️ Region:</strong> ${room.location_state || 'Unknown'}</div>
                            ${room.building_function ? `<div><strong>Building Type:</strong> ${room.building_function}</div>` : ''}
                            ${room.construction_date ? `<div><strong>📅 Construction:</strong> ${room.construction_date}</div>` : ''}
                            ${personsByRole['ARCHITECT'] ? `<div><strong>🏗️ Architect(s):</strong> ${personsByRole['ARCHITECT'].join(', ')}</div>` : ''}
                            ${personsByRole['COMMISSIONER'] ? `<div><strong>👑 Commissioner(s):</strong> ${personsByRole['COMMISSIONER'].slice(0, 3).join(', ')}${personsByRole['COMMISSIONER'].length > 3 ? ` (+${personsByRole['COMMISSIONER'].length - 3} more)` : ''}</div>` : ''}
                        </div>
                        ${paintingsHtml}
                    </div>
                </div>
            `;

            el.innerHTML = cardHtml;

            // Add click handlers for painting thumbnails
            el.querySelectorAll('.room-painting-thumb').forEach(thumb => {
                thumb.addEventListener('click', (e) => {
                    e.preventDefault();
                    const paintingId = thumb.dataset.paintingId;
                    const detailsEl = document.getElementById(paintingId);
                    
                    if (detailsEl) {
                        // Close all other open details in this room card
                        el.querySelectorAll('.painting-details-dropdown').forEach(dd => {
                            if (dd.id !== paintingId) {
                                dd.style.display = 'none';
                                // Reset border on corresponding thumbnail
                                const otherThumb = el.querySelector(`[data-painting-id="${dd.id}"] img`);
                                if (otherThumb) otherThumb.style.borderColor = 'transparent';
                            }
                        });
                        
                        // Toggle this one
                        const isHidden = detailsEl.style.display === 'none';
                        detailsEl.style.display = isHidden ? 'block' : 'none';
                        
                        // Highlight thumbnail border
                        const img = thumb.querySelector('img');
                        if (img) {
                            img.style.borderColor = isHidden ? '#3498db' : 'transparent';
                        }
                    }
                });
            });

            // Add click handlers for close buttons
            el.querySelectorAll('.close-painting-details').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetId = btn.dataset.target;
                    const detailsEl = document.getElementById(targetId);
                    if (detailsEl) {
                        detailsEl.style.display = 'none';
                        // Reset border on thumbnail
                        const thumb = el.querySelector(`[data-painting-id="${targetId}"] img`);
                        if (thumb) thumb.style.borderColor = 'transparent';
                    }
                });
            });

            return room;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render a building card with associated rooms, architects, and commissioners
     * Rooms are expandable to show paintings, paintings are expandable to show details
     * @param {string} container - CSS selector or DOM element
     * @param {string} buildingId - UUID of the building
     * @param {object} options - { showRooms: true, roomLimit: 12, showMap: false }
     */
    async function renderBuildingCard(container, buildingId, options = {}) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading building...</div>';

        const { showRooms = true, roomLimit = 12, showMap = false } = options;

        try {
            // Get building details
            const buildingSql = `
                SELECT 
                    b.building_id,
                    b.name as building_name,
                    b.function as building_function,
                    b.location_state,
                    b.construction_date,
                    COUNT(DISTINCT p.nfdi_uri) as painting_count
                FROM buildings b
                LEFT JOIN paintings p ON b.building_id = p.building_id
                WHERE b.building_id = '${buildingId}'
                GROUP BY b.building_id, b.name, b.function, b.location_state, b.construction_date
                LIMIT 1
            `;
            
            const buildingData = await BaroqueDB.query(buildingSql);
            
            if (buildingData.length === 0) {
                el.innerHTML = '<div class="no-data">Building not found in database.</div>';
                return null;
            }

            const building = buildingData[0];

            // Get persons associated with this building
            const personsSql = `
                SELECT person_name, role 
                FROM building_persons 
                WHERE building_id = '${buildingId}'
                ORDER BY role, person_name
            `;
            const persons = await BaroqueDB.query(personsSql);

            // Group by role
            const personsByRole = {};
            for (const p of persons) {
                if (!personsByRole[p.role]) personsByRole[p.role] = [];
                personsByRole[p.role].push(p.person_name);
            }

            // Generate unique ID for this building card
            const buildingCardId = 'building-' + Math.random().toString(36).substr(2, 9);

            // Get rooms in this building with painting counts
            let roomsHtml = '';
            let rooms = [];
            if (showRooms) {
                const roomsSql = `
                    SELECT 
                        r.room_id,
                        r.name as room_name,
                        r.function as room_function,
                        COUNT(DISTINCT p.nfdi_uri) as painting_count
                    FROM rooms r
                    LEFT JOIN paintings p ON p.room_name = r.name AND p.building_id = '${buildingId}'
                    WHERE r.building_id = '${buildingId}'
                    GROUP BY r.room_id, r.name, r.function
                    ORDER BY painting_count DESC
                    LIMIT ${roomLimit}
                `;
                rooms = await BaroqueDB.query(roomsSql);
                
                if (rooms.length > 0) {
                    const roomItems = rooms.map((r, idx) => {
                        const roomItemId = `${buildingCardId}-room-${idx}`;
                        return `
                            <div class="building-room-item" data-room-id="${roomItemId}" data-room-name="${r.room_name.replace(/"/g, '&quot;')}" 
                                 style="padding: 10px 14px; background: #fff; border-radius: 6px; margin: 6px 0; cursor: pointer; border: 1px solid #ddd; transition: all 0.2s;">
                                <div class="room-header" style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <span class="room-expand-icon" style="display: inline-block; width: 20px; transition: transform 0.2s;">▶</span>
                                        <span style="font-weight: 500;">${r.room_name}</span>
                                        ${r.room_function ? `<span style="color: #888; font-size: 0.85em;"> · ${r.room_function}</span>` : ''}
                                    </div>
                                    <span style="color: #666; font-size: 0.85em; background: #f0f0f0; padding: 2px 8px; border-radius: 10px;">
                                        🖼️ ${r.painting_count}
                                    </span>
                                </div>
                                
                                <!-- Expandable room content (paintings) -->
                                <div id="${roomItemId}" class="room-paintings-content" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;">
                                    <div class="room-paintings-loading" style="color: #888; font-size: 0.85em;">Loading paintings...</div>
                                </div>
                            </div>
                        `;
                    }).join('');
                    
                    roomsHtml = `
                        <div class="building-rooms-section" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ccc;">
                            <strong style="font-size: 0.9em; color: #555;">🚪 Rooms (${rooms.length}):</strong>
                            <p style="font-size: 0.8em; color: #888; margin: 5px 0 10px 0;">Click on a room to explore its paintings</p>
                            <div class="building-rooms-list" style="margin-top: 8px;">
                                ${roomItems}
                            </div>
                        </div>
                    `;
                }
            }

            // Get a sample painting image for the header
            const sampleImageSql = `
                SELECT imageUrl FROM paintings 
                WHERE building_id = '${buildingId}' AND imageUrl IS NOT NULL
                LIMIT 1
            `;
            const sampleImage = await BaroqueDB.query(sampleImageSql);
            const headerImage = sampleImage.length > 0 ? sampleImage[0].imageUrl : null;

            const cardHtml = `
                <div class="building-card" data-building-id="${buildingCardId}" data-building-name="${building.building_name.replace(/"/g, '&quot;')}"
                     style="margin: 1em 0; border: 1px solid #bbb; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    ${headerImage ? `
                        <div style="height: 150px; background: url('${headerImage}') center/cover; position: relative;">
                            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 20px 15px 10px;">
                                <h4 style="margin: 0; color: #fff; font-size: 1.2em; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
                                    🏰 ${building.building_name}
                                </h4>
                            </div>
                        </div>
                    ` : `
                        <div style="padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <h4 style="margin: 0; color: #fff; font-size: 1.2em;">
                                🏰 ${building.building_name}
                            </h4>
                        </div>
                    `}
                    <div style="padding: 15px;">
                        <div style="font-size: 0.9em; color: #555; line-height: 1.7;">
                            ${building.building_function ? `<div><strong>Type:</strong> ${building.building_function}</div>` : ''}
                            <div><strong>🗺️ Region:</strong> ${building.location_state || 'Unknown'}</div>
                            ${building.construction_date ? `<div><strong>📅 Construction:</strong> ${building.construction_date}</div>` : ''}
                            <div><strong>🖼️ Total Paintings:</strong> ${building.painting_count}</div>
                            ${personsByRole['ARCHITECT'] ? `<div><strong>🏗️ Architect(s):</strong> ${personsByRole['ARCHITECT'].slice(0, 3).join(', ')}${personsByRole['ARCHITECT'].length > 3 ? ` (+${personsByRole['ARCHITECT'].length - 3} more)` : ''}</div>` : ''}
                            ${personsByRole['COMMISSIONER'] ? `<div><strong>👑 Commissioner(s):</strong> ${personsByRole['COMMISSIONER'].slice(0, 3).join(', ')}${personsByRole['COMMISSIONER'].length > 3 ? ` (+${personsByRole['COMMISSIONER'].length - 3} more)` : ''}</div>` : ''}
                        </div>
                        ${roomsHtml}
                    </div>
                </div>
            `;

            el.innerHTML = cardHtml;

            // Add click handlers for room expansion
            el.querySelectorAll('.building-room-item').forEach(roomItem => {
                const roomHeader = roomItem.querySelector('.room-header');
                const roomId = roomItem.dataset.roomId;
                const roomName = roomItem.dataset.roomName;
                const contentEl = document.getElementById(roomId);
                const expandIcon = roomItem.querySelector('.room-expand-icon');
                let loaded = false;

                roomHeader.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    
                    const isExpanded = contentEl.style.display !== 'none';
                    
                    if (isExpanded) {
                        // Collapse
                        contentEl.style.display = 'none';
                        expandIcon.style.transform = 'rotate(0deg)';
                        roomItem.style.borderColor = '#ddd';
                        roomItem.style.background = '#fff';
                    } else {
                        // Expand
                        contentEl.style.display = 'block';
                        expandIcon.style.transform = 'rotate(90deg)';
                        roomItem.style.borderColor = '#3498db';
                        roomItem.style.background = '#f8fafc';
                        
                        // Load paintings if not already loaded
                        if (!loaded) {
                            loaded = true;
                            try {
                                const paintingsSql = `
                                    SELECT 
                                        p.nfdi_uri, 
                                        p.label, 
                                        p.painters, 
                                        p.commissioners,
                                        p.year_start, 
                                        p.year_end,
                                        p.method,
                                        p.imageUrl
                                    FROM paintings p
                                    WHERE p.room_name = '${roomName.replace(/'/g, "''")}'
                                    AND p.building_id = '${buildingId}'
                                    ORDER BY p.year_start, p.label
                                `;
                                const paintings = await BaroqueDB.query(paintingsSql);
                                
                                if (paintings.length === 0) {
                                    contentEl.innerHTML = '<div style="color: #888; font-size: 0.85em;">No paintings found in this room.</div>';
                                } else {
                                    const paintingsGrid = paintings.map((p, pIdx) => {
                                        const paintingItemId = `${roomId}-painting-${pIdx}`;
                                        const yearStr = p.year_start === p.year_end 
                                            ? (p.year_start || 'Unknown') 
                                            : `${p.year_start || '?'}–${p.year_end || '?'}`;
                                        
                                        return `
                                            <div class="room-painting-item" style="margin-bottom: 8px;">
                                                <div class="painting-thumb-row" data-painting-id="${paintingItemId}"
                                                     style="display: flex; align-items: center; gap: 10px; padding: 8px; background: #fff; border-radius: 4px; cursor: pointer; border: 1px solid #eee; transition: all 0.2s;">
                                                    ${p.imageUrl ? `
                                                        <img src="${p.imageUrl}" alt="${p.label}" 
                                                             style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">
                                                    ` : `
                                                        <div style="width: 100px; height: 100px; background: #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #888; font-size: 0.7em; flex-shrink: 0;">
                                                            No img
                                                        </div>
                                                    `}
                                                    <div style="flex: 1; min-width: 0;">
                                                        <div style="font-size: 0.85em; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                                            ${p.label}
                                                        </div>
                                                        <div style="font-size: 0.75em; color: #888;">
                                                            ${yearStr}${p.painters ? ` · ` + _makeClickablePainterNames(p.painters.split('|')[0]) : ''}
                                                        </div>
                                                    </div>
                                                    <div style="color: #3498db; font-size: 0.8em;">ℹ️</div>
                                                </div>
                                                
                                                <!-- Expandable painting details -->
                                                <div id="${paintingItemId}" class="painting-details-panel" 
                                                     style="display: none; margin: 8px 0 8px 112px; padding: 12px; background: #fff; border: 1px solid #3498db; border-radius: 6px; box-shadow: 0 2px 8px rgba(52,152,219,0.2);">
                                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                                        <strong style="color: #2c3e50; font-size: 0.95em; line-height: 1.3;">${p.label}</strong>
                                                        <button class="close-painting-panel" data-target="${paintingItemId}" 
                                                                style="background: none; border: none; cursor: pointer; font-size: 1.2em; color: #888; padding: 0 4px;">×</button>
                                                    </div>
                                                    ${p.imageUrl ? `
                                                        <a href="${p.nfdi_uri}" target="_blank" rel="noopener">
                                                            <img src="${p.imageUrl}" alt="${p.label}" 
                                                                 style="width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px; background: #000; margin-bottom: 10px;">
                                                        </a>
                                                    ` : ''}
                                                    <div style="font-size: 0.85em; color: #555; line-height: 1.6;">
                                                        <div><strong>📅 Year:</strong> ${yearStr}</div>
                                                        ${p.painters ? `<div><strong>🎨 Painter(s):</strong> ${_makeClickablePainterNames(p.painters)}</div>` : ''}
                                                        ${p.commissioners ? `<div><strong>👑 Commissioner:</strong> ${p.commissioners}</div>` : ''}
                                                        ${p.method ? `<div><strong>🖌️ Technique:</strong> ${p.method}</div>` : ''}
                                                        <div style="margin-top: 8px;">
                                                            <a href="${p.nfdi_uri}" target="_blank" rel="noopener" 
                                                               style="color: #3498db; text-decoration: none; font-size: 0.9em;">
                                                                View in CbDD →
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    }).join('');
                                    
                                    contentEl.innerHTML = `
                                        <div style="font-size: 0.8em; color: #666; margin-bottom: 8px;">
                                            ${paintings.length} painting${paintings.length > 1 ? 's' : ''} · Click to see details
                                        </div>
                                        <div class="room-paintings-list">
                                            ${paintingsGrid}
                                        </div>
                                    `;
                                    
                                    // Add click handlers for paintings in this room
                                    contentEl.querySelectorAll('.painting-thumb-row').forEach(thumbRow => {
                                        thumbRow.addEventListener('click', (pe) => {
                                            pe.stopPropagation();
                                            const paintingId = thumbRow.dataset.paintingId;
                                            const detailsEl = document.getElementById(paintingId);
                                            
                                            if (detailsEl) {
                                                // Close all other open painting panels in this room
                                                contentEl.querySelectorAll('.painting-details-panel').forEach(panel => {
                                                    if (panel.id !== paintingId) {
                                                        panel.style.display = 'none';
                                                        const otherRow = contentEl.querySelector(`[data-painting-id="${panel.id}"]`);
                                                        if (otherRow) {
                                                            otherRow.style.borderColor = '#eee';
                                                            otherRow.style.background = '#fff';
                                                        }
                                                    }
                                                });
                                                
                                                // Toggle this one
                                                const isHidden = detailsEl.style.display === 'none';
                                                detailsEl.style.display = isHidden ? 'block' : 'none';
                                                thumbRow.style.borderColor = isHidden ? '#3498db' : '#eee';
                                                thumbRow.style.background = isHidden ? '#f0f7ff' : '#fff';
                                            }
                                        });
                                    });
                                    
                                    // Add close button handlers
                                    contentEl.querySelectorAll('.close-painting-panel').forEach(btn => {
                                        btn.addEventListener('click', (ce) => {
                                            ce.stopPropagation();
                                            const targetId = btn.dataset.target;
                                            const detailsEl = document.getElementById(targetId);
                                            if (detailsEl) {
                                                detailsEl.style.display = 'none';
                                                const thumbRow = contentEl.querySelector(`[data-painting-id="${targetId}"]`);
                                                if (thumbRow) {
                                                    thumbRow.style.borderColor = '#eee';
                                                    thumbRow.style.background = '#fff';
                                                }
                                            }
                                        });
                                    });
                                }
                            } catch (err) {
                                contentEl.innerHTML = `<div style="color: #c00; font-size: 0.85em;">Error loading paintings: ${err.message}</div>`;
                            }
                        }
                    }
                });
            });

            return building;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render a gallery of paintings from specific painter(s)
     * @param {string} container - CSS selector or DOM element
     * @param {string|string[]} painterNames - Painter name(s) to search for
     * @param {object} options - { limit: 6, showMythologyOnly: false }
     */
    async function renderPainterGallery(container, painterNames, options = {}) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading painter gallery...</div>';

        const { limit = 6, showMythologyOnly = false } = options;
        const names = Array.isArray(painterNames) ? painterNames : [painterNames];

        try {
            // Use painting_persons table for accurate matching instead of the display string
            const nameConditions = names.map(n => `pp.person_name = '${n.replace(/'/g, "''")}'`).join(' OR ');

            let sql = `
                SELECT DISTINCT
                    p.nfdi_uri,
                    p.label,
                    p.painters,
                    p.commissioners,
                    p.year_start,
                    p.year_end,
                    p.building_name,
                    p.room_name,
                    p.location_state,
                    p.imageUrl,
                    p.method
                FROM paintings p
                JOIN painting_persons pp ON p.nfdi_uri = pp.nfdi_uri
                ${showMythologyOnly ? `
                    JOIN painting_subjects ps ON p.nfdi_uri = ps.nfdi_uri
                    JOIN subjects s ON ps.subject_uri = s.subject_uri
                ` : ''}
                WHERE pp.role = 'PAINTER'
                  AND (${nameConditions})
                  AND p.imageUrl IS NOT NULL AND p.imageUrl != ''
                ${showMythologyOnly ? `AND s.subject_source = 'ICONCLASS' AND s.subject_uri LIKE '%iconclass.org/9%'` : ''}
                ORDER BY p.year_start
                LIMIT ${limit}
            `;

            const data = await BaroqueDB.query(sql);

            if (data.length === 0) {
                el.innerHTML = '<div class="no-data">No paintings found for this painter.</div>';
                return [];
            }

            // ── Fetch detailed person roles for a painting ──────────────────
            async function fetchPersons(nfdiUri) {
                const pSql = `
                    SELECT person_name, role
                    FROM painting_persons
                    WHERE nfdi_uri = '${nfdiUri}'
                    ORDER BY role
                `;
                return await BaroqueDB.query(pSql);
            }

            el.innerHTML = `
                <div class="pg-gallery">
                    <div class="pg-gallery__grid">
                        ${data.map((painting, i) => {
                            const yearStr = painting.year_start === painting.year_end
                                ? painting.year_start
                                : `${painting.year_start || '?'}–${painting.year_end || '?'}`;
                            return `
                                <div class="pg-gallery__card" data-idx="${i}">
                                    <div class="pg-gallery__img-wrap">
                                        <img src="${painting.imageUrl}" alt="${painting.label}" loading="lazy">
                                        <div class="pg-gallery__overlay"><span>Click for details</span></div>
                                    </div>
                                    <div class="pg-gallery__caption">
                                        <strong>${painting.label}</strong><br>
                                        <span class="pg-gallery__meta">${yearStr} · ${painting.building_name || 'Unknown'}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="pg-gallery__detail" style="display:none"></div>
                </div>
            `;

            // ── Click-to-detail ─────────────────────────────────────────────
            el.querySelectorAll('.pg-gallery__card').forEach((card, idx) => {
                card.addEventListener('click', async (e) => {
                    if (e.target.closest('.painter-jump-link')) return;

                    const painting = data[idx];
                    const detailEl = el.querySelector('.pg-gallery__detail');

                    // toggle off if same card clicked again
                    if (detailEl.style.display !== 'none' && detailEl.dataset.activeIdx === String(idx)) {
                        detailEl.style.display = 'none';
                        detailEl.innerHTML = '';
                        detailEl.dataset.activeIdx = '';
                        return;
                    }

                    detailEl.style.display = 'block';
                    detailEl.dataset.activeIdx = String(idx);
                    detailEl.innerHTML = '<div class="loading">Loading painting details…</div>';
                    detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                    try {
                        const persons = await fetchPersons(painting.nfdi_uri);
                        const byRole = {};
                        for (const p of persons) {
                            if (!byRole[p.role]) byRole[p.role] = [];
                            byRole[p.role].push(p.person_name);
                        }

                        const yrStr = painting.year_start === painting.year_end
                            ? painting.year_start
                            : `${painting.year_start || '?'}–${painting.year_end || '?'}`;

                        detailEl.innerHTML = `
                            <figure class="pg-gallery__detail-card">
                                <button class="pg-gallery__detail-close" title="Close">✕</button>
                                <div class="pg-gallery__detail-body">
                                    <div class="pg-gallery__detail-img">
                                        <a href="${painting.nfdi_uri}" target="_blank" rel="noopener">
                                            <img src="${painting.imageUrl}" alt="${painting.label}">
                                        </a>
                                    </div>
                                    <figcaption class="pg-gallery__detail-info">
                                        <h4 style="margin:0 0 10px">
                                            <a href="${painting.nfdi_uri}" target="_blank" style="color:inherit;text-decoration:none">
                                                ${painting.label}
                                            </a>
                                        </h4>
                                        <div class="pg-gallery__detail-meta">
                                            <div><strong>📅 Year:</strong> ${yrStr || 'Unknown'}</div>
                                            <div><strong>📍 Location:</strong> ${painting.building_name || ''}${painting.room_name ? `, ${painting.room_name}` : ''}</div>
                                            <div><strong>🗺️ Region:</strong> ${painting.location_state || 'Unknown'}</div>
                                            ${byRole['PAINTER'] ? `<div><strong>🎨 Painter(s):</strong> ${_makeClickablePainterNames(byRole['PAINTER'])}</div>` : ''}
                                            ${painting.commissioners ? `<div><strong>👑 Commissioner:</strong> ${painting.commissioners}</div>` : ''}
                                            ${painting.method ? `<div><strong>🖌️ Technique:</strong> ${painting.method}</div>` : ''}
                                        </div>
                                        <a href="${painting.nfdi_uri}" target="_blank" rel="noopener"
                                           class="pg-gallery__detail-link">View in CbDD ↗</a>
                                    </figcaption>
                                </div>
                            </figure>
                        `;

                        detailEl.querySelector('.pg-gallery__detail-close').addEventListener('click', () => {
                            detailEl.style.display = 'none';
                            detailEl.innerHTML = '';
                            detailEl.dataset.activeIdx = '';
                        });
                    } catch (err) {
                        detailEl.innerHTML = `<div class="error">Error loading details: ${err.message}</div>`;
                    }
                });
            });

            return data;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render a timeline of commissions during baroque period
     * Shows yearly painting counts as an area chart
     */
    async function renderCommissionsTimeline(container, options = {}) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading commissions timeline...</div>';

        const { startYear = 1600, endYear = 1800 } = options;

        try {
            const sql = `
                SELECT 
                    year_start as year,
                    COUNT(*) as count
                FROM paintings
                WHERE year_start IS NOT NULL
                  AND year_start >= ${startYear} AND year_start <= ${endYear}
                GROUP BY year_start
                ORDER BY year_start
            `;
            
            const data = await BaroqueDB.query(sql);

            const trace = {
                x: data.map(d => d.year),
                y: data.map(d => d.count),
                type: 'scatter',
                mode: 'lines',
                fill: 'tozeroy',
                fillcolor: 'rgba(52, 152, 219, 0.3)',
                line: {
                    color: COLORS.primary,
                    width: 2
                },
                hovertemplate: '<b>%{x}</b><br>%{y} paintings commissioned<extra></extra>'
            };

            // Add annotations for key events
            const annotations = [
                { x: 1618, text: 'Start of 30 Years War', ay: -40 },
                { x: 1648, text: 'Peace of Westphalia', ay: -60 },
                { x: 1700, text: 'Baroque Peak', ay: -40 },
                { x: 1756, text: 'Seven Years War', ay: -60 }
            ].map(a => ({
                x: a.x,
                y: data.find(d => d.year === a.x)?.count || 0,
                xref: 'x',
                yref: 'y',
                text: a.text,
                showarrow: true,
                arrowhead: 2,
                ax: 0,
                ay: a.ay,
                font: { size: 10 }
            }));

            const layout = {
                title: 'Ceiling Painting Commissions Over Time (1600–1800)',
                xaxis: { 
                    title: 'Year',
                    tickangle: 0
                },
                yaxis: { title: 'Number of Commissions' },
                margin: { l: 60, r: 30, t: 50, b: 60 },
                height: 400,
                annotations: annotations
            };

            Plotly.newPlot(el, [trace], layout, { responsive: true });
            return data;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render mythology intro gallery: 3 random mythology paintings with refresh & click-to-detail
     */
    async function renderMythologyIntroGallery(container, options = {}) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading mythology paintings...</div>';

        const { count = 3 } = options;

        // ── Fetch random paintings ──────────────────────────────────────────
        async function fetchRandom() {
            const sql = `
                SELECT DISTINCT
                    p.nfdi_uri,
                    p.label,
                    p.painters,
                    p.commissioners,
                    p.year_start,
                    p.year_end,
                    p.building_name,
                    p.room_name,
                    p.location_state,
                    p.imageUrl,
                    p.method
                FROM paintings p
                JOIN painting_subjects ps ON p.nfdi_uri = ps.nfdi_uri
                JOIN subjects s ON ps.subject_uri = s.subject_uri
                WHERE s.subject_source = 'ICONCLASS'
                  AND s.subject_uri LIKE '%iconclass.org/9%'
                  AND p.imageUrl IS NOT NULL AND p.imageUrl != ''
                ORDER BY RANDOM()
                LIMIT ${count}
            `;
            return await BaroqueDB.query(sql);
        }

        // ── Fetch detailed person roles for a painting ──────────────────────
        async function fetchPersons(nfdiUri) {
            const sql = `
                SELECT person_name, role
                FROM painting_persons
                WHERE nfdi_uri = '${nfdiUri}'
                ORDER BY role
            `;
            return await BaroqueDB.query(sql);
        }

        // ── Render the gallery grid ─────────────────────────────────────────
        async function render() {
            const data = await fetchRandom();
            if (data.length === 0) {
                el.innerHTML = '<div class="no-data">No mythology paintings found.</div>';
                return;
            }

            el.innerHTML = `
                <div class="myth-intro">
                    <div class="myth-intro__toolbar">
                        <button class="myth-intro__refresh" title="Show different paintings">
                            <span class="myth-intro__refresh-icon">⟳</span> Shuffle
                        </button>
                    </div>
                    <div class="myth-intro__grid">
                        ${data.map((p, i) => {
                            const year = p.year_start || '?';
                            return `
                                <div class="myth-intro__card" data-idx="${i}">
                                    <div class="myth-intro__img-wrap">
                                        <img src="${p.imageUrl}" alt="${p.label}" loading="lazy">
                                        <div class="myth-intro__overlay">
                                            <span>Click for details</span>
                                        </div>
                                    </div>
                                    <div class="myth-intro__caption">
                                        <strong>${p.label}</strong><br>
                                        <span class="myth-intro__meta">
                                            ${p.painters ? _makeClickablePainterNames(p.painters) : 'Unknown'} · ${year}
                                        </span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="myth-intro__detail" style="display:none"></div>
                </div>
            `;

            // ── Refresh button ──────────────────────────────────────────────
            el.querySelector('.myth-intro__refresh').addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                btn.disabled = true;
                btn.querySelector('.myth-intro__refresh-icon').style.animation = 'mythSpin .5s ease';
                // collapse any open detail
                const detailEl = el.querySelector('.myth-intro__detail');
                detailEl.style.display = 'none';
                detailEl.innerHTML = '';
                await render();
            });

            // ── Click-to-detail ─────────────────────────────────────────────
            el.querySelectorAll('.myth-intro__card').forEach((card, idx) => {
                card.addEventListener('click', async (e) => {
                    // don't trigger if clicking a painter link inside caption
                    if (e.target.closest('.painter-jump-link')) return;

                    const painting = data[idx];
                    const detailEl = el.querySelector('.myth-intro__detail');

                    // toggle off if same card clicked again
                    if (detailEl.style.display !== 'none' && detailEl.dataset.activeIdx === String(idx)) {
                        detailEl.style.display = 'none';
                        detailEl.innerHTML = '';
                        detailEl.dataset.activeIdx = '';
                        return;
                    }

                    detailEl.style.display = 'block';
                    detailEl.dataset.activeIdx = String(idx);
                    detailEl.innerHTML = '<div class="loading">Loading painting details…</div>';
                    detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                    try {
                        const persons = await fetchPersons(painting.nfdi_uri);
                        const byRole = {};
                        for (const p of persons) {
                            if (!byRole[p.role]) byRole[p.role] = [];
                            byRole[p.role].push(p.person_name);
                        }

                        const yearStr = painting.year_start === painting.year_end
                            ? painting.year_start
                            : `${painting.year_start || '?'}–${painting.year_end || '?'}`;

                        detailEl.innerHTML = `
                            <figure class="myth-intro__detail-card">
                                <button class="myth-intro__detail-close" title="Close">✕</button>
                                <div class="myth-intro__detail-body">
                                    <div class="myth-intro__detail-img">
                                        <a href="${painting.nfdi_uri}" target="_blank" rel="noopener">
                                            <img src="${painting.imageUrl}" alt="${painting.label}">
                                        </a>
                                    </div>
                                    <figcaption class="myth-intro__detail-info">
                                        <h4 style="margin:0 0 10px">
                                            <a href="${painting.nfdi_uri}" target="_blank" style="color:inherit;text-decoration:none">
                                                ${painting.label}
                                            </a>
                                        </h4>
                                        <div class="myth-intro__detail-meta">
                                            <div><strong>📅 Year:</strong> ${yearStr || 'Unknown'}</div>
                                            <div><strong>📍 Location:</strong> ${painting.building_name || ''}${painting.room_name ? `, ${painting.room_name}` : ''}</div>
                                            <div><strong>🗺️ Region:</strong> ${painting.location_state || 'Unknown'}</div>
                                            ${byRole['PAINTER'] ? `<div><strong>🎨 Painter(s):</strong> ${_makeClickablePainterNames(byRole['PAINTER'])}</div>` : ''}
                                            ${painting.commissioners ? `<div><strong>👑 Commissioner:</strong> ${painting.commissioners}</div>` : ''}
                                            ${painting.method ? `<div><strong>🖌️ Technique:</strong> ${painting.method}</div>` : ''}
                                        </div>
                                        <a href="${painting.nfdi_uri}" target="_blank" rel="noopener"
                                           class="myth-intro__detail-link">View in CbDD ↗</a>
                                    </figcaption>
                                </div>
                            </figure>
                        `;

                        detailEl.querySelector('.myth-intro__detail-close').addEventListener('click', () => {
                            detailEl.style.display = 'none';
                            detailEl.innerHTML = '';
                            detailEl.dataset.activeIdx = '';
                        });
                    } catch (err) {
                        detailEl.innerHTML = `<div class="error">Error loading details: ${err.message}</div>`;
                    }
                });
            });
        }

        try {
            await render();
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render mythology-themed paintings gallery (ICONCLASS category 9)
     */
    async function renderMythologyGallery(container, options = {}) {
        const el = _getElement(container);
        el.innerHTML = '<div class="loading">Loading mythology paintings...</div>';

        const { limit = 8, subject = null } = options;

        try {
            const subjectFilter = subject 
                ? `AND (s.subject_label LIKE '%${subject}%' OR p.label LIKE '%${subject}%')`
                : '';

            const sql = `
                SELECT DISTINCT
                    p.nfdi_uri,
                    p.label,
                    p.painters,
                    p.commissioners,
                    p.year_start,
                    p.year_end,
                    p.building_name,
                    p.location_state,
                    p.imageUrl,
                    s.subject_label
                FROM paintings p
                JOIN painting_subjects ps ON p.nfdi_uri = ps.nfdi_uri
                JOIN subjects s ON ps.subject_uri = s.subject_uri
                WHERE s.subject_source = 'ICONCLASS'
                AND s.subject_uri LIKE '%iconclass.org/9%'
                AND p.imageUrl IS NOT NULL AND p.imageUrl != ''
                ${subjectFilter}
                ORDER BY p.year_start
                LIMIT ${limit}
            `;
            
            const data = await BaroqueDB.query(sql);
            
            if (data.length === 0) {
                el.innerHTML = '<div class="no-data">No mythology paintings found.</div>';
                return [];
            }

            const galleryHtml = `
                <div class="mythology-gallery" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
                    ${data.map(painting => {
                        const yearStr = painting.year_start || '?';
                        return `
                            <figure style="margin: 0; border: 1px solid #c9a227; border-radius: 8px; overflow: hidden; background: linear-gradient(135deg, #fefcea 0%, #f1da36 100%); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <a href="${painting.nfdi_uri}" target="_blank">
                                    <img src="${painting.imageUrl}" alt="${painting.label}" 
                                         style="width: 100%; height: 160px; object-fit: cover;">
                                </a>
                                <figcaption style="padding: 10px; font-size: 0.85em; background: rgba(255,255,255,0.8);">
                                    <strong style="display: block; margin-bottom: 3px; color: #333;">${painting.label}</strong>
                                    <span style="color: #666; font-size: 0.9em;">
                                        ${painting.painters ? _makeClickablePainterNames(painting.painters) : 'Unknown'} · ${yearStr}<br>
                                        ${painting.building_name || ''}
                                    </span>
                                </figcaption>
                            </figure>
                        `;
                    }).join('')}
                </div>
            `;

            el.innerHTML = galleryHtml;
            return data;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render paintings featuring a specific mythological figure (Hercules, Apollo, Venus, etc.)
     */
    async function renderMythFigureGallery(container, figureName, options = {}) {
        const el = _getElement(container);
        el.innerHTML = `<div class="loading">Loading ${figureName} paintings...</div>`;

        const { limit = 6 } = options;

        try {
            const sql = `
                SELECT DISTINCT
                    p.nfdi_uri,
                    p.label,
                    p.painters,
                    p.commissioners,
                    p.year_start,
                    p.year_end,
                    p.building_name,
                    p.room_name,
                    p.location_state,
                    p.imageUrl
                FROM paintings p
                WHERE (p.label LIKE '%${figureName}%' OR p.label LIKE '%${_getGermanVariant(figureName)}%')
                AND p.imageUrl IS NOT NULL AND p.imageUrl != ''
                ORDER BY p.year_start
                LIMIT ${limit}
            `;
            
            const data = await BaroqueDB.query(sql);
            
            if (data.length === 0) {
                el.innerHTML = `<div class="no-data">No ${figureName} paintings found.</div>`;
                return [];
            }

            const figureColor = {
                'Hercules': '#e74c3c',
                'Herkules': '#e74c3c', 
                'Apollo': '#f39c12',
                'Apoll': '#f39c12',
                'Venus': '#e91e63',
                'Mars': '#c0392b',
                'Minerva': '#3498db',
                'Jupiter': '#9b59b6',
                'Diana': '#1abc9c'
            }[figureName] || COLORS.primary;

            const galleryHtml = `
                <div class="myth-figure-gallery">
                    <h4 style="color: ${figureColor}; border-bottom: 2px solid ${figureColor}; padding-bottom: 5px;">
                        🏛️ ${figureName} in Baroque Ceiling Paintings
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; margin-top: 15px;">
                        ${data.map(painting => {
                            const yearStr = painting.year_start === painting.year_end 
                                ? painting.year_start 
                                : `${painting.year_start}–${painting.year_end || '?'}`;
                            return `
                                <figure style="margin: 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: #fff;">
                                    <a href="${painting.nfdi_uri}" target="_blank">
                                        <img src="${painting.imageUrl}" alt="${painting.label}" 
                                             style="width: 100%; height: 180px; object-fit: cover;">
                                    </a>
                                    <figcaption style="padding: 12px; font-size: 0.85em;">
                                        <strong style="display: block; margin-bottom: 5px;">${painting.label}</strong>
                                        <div style="color: #666; line-height: 1.5;">
                                            ${painting.painters ? `🎨 ${_makeClickablePainterNames(painting.painters)}<br>` : ''}
                                            📅 ${yearStr || 'Unknown'}<br>
                                            📍 ${painting.building_name || 'Unknown location'}
                                            ${painting.commissioners ? `<br>👑 ${painting.commissioners}` : ''}
                                        </div>
                                    </figcaption>
                                </figure>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            el.innerHTML = galleryHtml;
            return data;
        } catch (error) {
            el.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Render an interactive painter biography explorer with map and chronological painting list
     * @param {string} container - CSS selector or DOM element
     * @param {string} initialPainter - Optional initial painter name to display
     */
    async function renderPainterExplorer(container, initialPainter = null) {
        const el = _getElement(container);
        const explorerId = 'painter-explorer-' + Math.random().toString(36).substr(2, 9);
        
        el.innerHTML = '<div class="loading">Initializing Painter Explorer...</div>';

        try {
            // Get list of all painters for the dropdown
            const painterListSql = `
                SELECT 
                    pp.person_name,
                    COUNT(DISTINCT pp.nfdi_uri) as painting_count,
                    MIN(p.year_start) as earliest,
                    MAX(p.year_end) as latest
                FROM painting_persons pp
                JOIN paintings p ON pp.nfdi_uri = p.nfdi_uri
                WHERE pp.role = 'PAINTER' AND pp.person_name IS NOT NULL
                GROUP BY pp.person_name
                HAVING COUNT(DISTINCT pp.nfdi_uri) >= 2
                ORDER BY painting_count DESC
            `;
            const allPainters = await BaroqueDB.query(painterListSql);

            // Build the explorer HTML structure
            el.innerHTML = `
                <div id="${explorerId}" class="painter-explorer" style="border: 1px solid #ddd; border-radius: 12px; overflow: hidden; background: #f9fafb;">
                    <!-- Header with painter selector -->
                    <div class="explorer-header" style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <h3 style="margin: 0 0 15px 0; font-size: 1.4em;">🎨 Painter Biography Explorer</h3>
                        <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                            <label style="font-weight: 500;">Select a painter:</label>
                            <div style="position: relative; flex: 1; min-width: 250px; max-width: 400px;">
                                <input type="text" id="${explorerId}-search" placeholder="Search painters..." 
                                       style="width: 100%; padding: 10px 15px; border: none; border-radius: 6px; font-size: 1em; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #333; background: white;">
                                <div id="${explorerId}-dropdown" class="painter-dropdown" 
                                     style="display: none; position: absolute; top: 100%; left: 0; right: 0; max-height: 300px; overflow-y: auto; background: white; border-radius: 0 0 6px 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1000;">
                                </div>
                            </div>
                            <div id="${explorerId}-stats" style="font-size: 0.9em; opacity: 0.9;"></div>
                        </div>
                    </div>
                    
                    <!-- Main content area -->
                    <div class="explorer-content" style="display: grid; grid-template-columns: 1fr 1fr; min-height: 600px;">
                        <!-- Left: Map -->
                        <div class="explorer-map-container" style="border-right: 1px solid #ddd; position: relative;">
                            <div id="${explorerId}-map" style="height: 100%; min-height: 600px;"></div>
                            <!-- Navigation arrows -->
                            <div class="map-navigation" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 1000;">
                                <button id="${explorerId}-prev" class="nav-btn" style="padding: 10px 20px; background: white; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 1.1em; box-shadow: 0 2px 6px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 5px;" disabled>
                                    ◀ Previous
                                </button>
                                <span id="${explorerId}-nav-info" style="padding: 10px 15px; background: rgba(255,255,255,0.95); border-radius: 6px; font-size: 0.9em; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                                    Select a painter
                                </span>
                                <button id="${explorerId}-next" class="nav-btn" style="padding: 10px 20px; background: white; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 1.1em; box-shadow: 0 2px 6px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 5px;" disabled>
                                    Next ▶
                                </button>
                            </div>
                        </div>
                        
                        <!-- Right: Chronological painting list -->
                        <div class="explorer-paintings-container" style="overflow-y: auto; max-height: 700px; padding: 15px; background: #fff;">
                            <div id="${explorerId}-paintings" style="min-height: 400px;">
                                <div class="placeholder" style="text-align: center; color: #888; padding: 40px;">
                                    <div style="font-size: 3em; margin-bottom: 15px;">🖼️</div>
                                    <p>Select a painter from the dropdown to explore their works chronologically across buildings.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Building card modal -->
                    <div id="${explorerId}-building-modal" class="building-modal" 
                         style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 2000; justify-content: center; align-items: center;">
                        <div class="modal-content" style="background: white; border-radius: 12px; max-width: 700px; max-height: 80vh; overflow-y: auto; margin: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #eee;">
                                <h4 style="margin: 0;">Building Details</h4>
                                <button class="close-modal" style="background: none; border: none; font-size: 1.5em; cursor: pointer; color: #888;">&times;</button>
                            </div>
                            <div id="${explorerId}-building-content" style="padding: 20px;"></div>
                        </div>
                    </div>
                    
                    <!-- Painting card modal -->
                    <div id="${explorerId}-painting-modal" class="painting-modal" 
                         style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 2000; justify-content: center; align-items: center;">
                        <div class="modal-content" style="background: white; border-radius: 12px; max-width: 600px; max-height: 85vh; overflow-y: auto; margin: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #eee;">
                                <h4 style="margin: 0;">Painting Details</h4>
                                <button class="close-modal" style="background: none; border: none; font-size: 1.5em; cursor: pointer; color: #888;">&times;</button>
                            </div>
                            <div id="${explorerId}-painting-content" style="padding: 20px;"></div>
                        </div>
                    </div>
                </div>
            `;

            // Initialize Leaflet map
            const mapEl = document.getElementById(`${explorerId}-map`);
            const map = L.map(mapEl).setView([51.0, 10.0], 6);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            // State management
            let currentPainter = null;
            let buildings = [];
            let currentBuildingIndex = 0;
            let markers = {};

            // Populate dropdown
            const searchInput = document.getElementById(`${explorerId}-search`);
            const dropdown = document.getElementById(`${explorerId}-dropdown`);
            
            function renderDropdown(filter = '') {
                const filtered = allPainters.filter(p => 
                    p.person_name.toLowerCase().includes(filter.toLowerCase())
                ).slice(0, 50);
                
                dropdown.innerHTML = filtered.map(p => `
                    <div class="painter-option" data-name="${p.person_name.replace(/"/g, '&quot;')}"
                         style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s;">
                        <div style="font-weight: 500; color: #333;">${p.person_name}</div>
                        <div style="font-size: 0.85em; color: #888;">${p.painting_count} paintings · ${p.earliest || '?'}–${p.latest || '?'}</div>
                    </div>
                `).join('');
                
                dropdown.style.display = filtered.length > 0 ? 'block' : 'none';
                
                // Add hover effects
                dropdown.querySelectorAll('.painter-option').forEach(opt => {
                    opt.addEventListener('mouseenter', () => opt.style.background = '#f0f4ff');
                    opt.addEventListener('mouseleave', () => opt.style.background = 'white');
                    opt.addEventListener('click', () => {
                        loadPainter(opt.dataset.name);
                        dropdown.style.display = 'none';
                        searchInput.value = opt.dataset.name;
                    });
                });
            }

            searchInput.addEventListener('focus', () => renderDropdown(searchInput.value));
            searchInput.addEventListener('input', () => renderDropdown(searchInput.value));
            document.addEventListener('click', (e) => {
                if (!e.target.closest(`#${explorerId}-search`) && !e.target.closest(`#${explorerId}-dropdown`)) {
                    dropdown.style.display = 'none';
                }
            });

            // Load painter data
            async function loadPainter(painterName) {
                currentPainter = painterName;
                
                // Update the search input to show the selected painter name
                searchInput.value = painterName;
                dropdown.style.display = 'none';
                
                const paintingsContainer = document.getElementById(`${explorerId}-paintings`);
                const statsEl = document.getElementById(`${explorerId}-stats`);
                
                paintingsContainer.innerHTML = '<div class="loading" style="padding: 20px; text-align: center;">Loading painter data...</div>';

                try {
                    // First, detect coordinate columns in the buildings table
                    const bCols = await BaroqueDB.query("PRAGMA table_info('buildings')");
                    const buildingCols = bCols.map(c => c.name ? c.name.toLowerCase() : c.name);
                    
                    // Also check paintings table for coordinates
                    const pCols = await BaroqueDB.query("PRAGMA table_info('paintings')");
                    const paintingCols = pCols.map(c => c.name ? c.name.toLowerCase() : c.name);
                    
                    console.log('PainterExplorer: Building columns:', buildingCols);
                    console.log('PainterExplorer: Painting columns:', paintingCols);
                    
                    const latCandidates = ['latitude', 'lat', 'location_latitude', 'y'];
                    const lonCandidates = ['longitude', 'lon', 'location_longitude', 'x'];
                    
                    function findColumn(cols, candidates) {
                        for (const c of candidates) {
                            if (cols.indexOf(c) !== -1) return c;
                        }
                        return null;
                    }
                    
                    const bLat = findColumn(buildingCols, latCandidates);
                    const bLon = findColumn(buildingCols, lonCandidates);
                    const pLat = findColumn(paintingCols, latCandidates);
                    const pLon = findColumn(paintingCols, lonCandidates);
                    const cityCol = findColumn(buildingCols, ['location_city', 'city', 'town']);
                    
                    console.log('PainterExplorer: Detected coords - bLat:', bLat, 'bLon:', bLon, 'pLat:', pLat, 'pLon:', pLon);
                    
                    // Build the SELECT clause for coordinates - prefer buildings, fallback to paintings
                    let coordSelect;
                    if (bLat && bLon) {
                        coordSelect = `b.${bLat} as latitude, b.${bLon} as longitude`;
                        console.log('PainterExplorer: Using building coordinates');
                    } else if (pLat && pLon) {
                        coordSelect = `p.${pLat} as latitude, p.${pLon} as longitude`;
                        console.log('PainterExplorer: Using painting coordinates');
                    } else {
                        coordSelect = 'NULL as latitude, NULL as longitude';
                        console.log('PainterExplorer: No coordinate columns found!');
                    }
                    const citySelect = cityCol ? `b.${cityCol} as location_city` : 'NULL as location_city';

                    // Get all paintings by this painter with building coordinates
                    const paintingsSql = `
                        SELECT 
                            p.nfdi_uri,
                            p.label,
                            p.painters,
                            p.commissioners,
                            p.year_start,
                            p.year_end,
                            p.building_id,
                            p.building_name,
                            p.room_name,
                            p.location_state,
                            p.imageUrl,
                            p.method,
                            ${coordSelect},
                            ${citySelect}
                        FROM paintings p
                        JOIN painting_persons pp ON p.nfdi_uri = pp.nfdi_uri
                        LEFT JOIN buildings b ON p.building_id = b.building_id
                        WHERE pp.role = 'PAINTER' 
                          AND pp.person_name = '${painterName.replace(/'/g, "''")}'
                        ORDER BY p.year_start ASC, p.building_name ASC
                    `;
                    const paintings = await BaroqueDB.query(paintingsSql);
                    
                    console.log('PainterExplorer: Paintings found:', paintings.length);
                    if (paintings.length > 0) {
                        console.log('PainterExplorer: Sample painting:', paintings[0]);
                        console.log('PainterExplorer: Sample coords:', paintings[0].latitude, paintings[0].longitude);
                    }

                    // Get subject labels for each painting
                    const subjectsSql = `
                        SELECT 
                            ps.nfdi_uri,
                            STRING_AGG(s.subject_label, ', ') as subjects
                        FROM painting_subjects ps
                        JOIN subjects s ON ps.subject_uri = s.subject_uri
                        JOIN painting_persons pp ON ps.nfdi_uri = pp.nfdi_uri
                        WHERE pp.role = 'PAINTER' 
                          AND pp.person_name = '${painterName.replace(/'/g, "''")}'
                          AND s.subject_source = 'ICONCLASS'
                        GROUP BY ps.nfdi_uri
                    `;
                    const subjectsData = await BaroqueDB.query(subjectsSql);
                    const subjectsMap = {};
                    subjectsData.forEach(s => { subjectsMap[s.nfdi_uri] = s.subjects; });

                    // Group paintings by building
                    const buildingMap = {};
                    paintings.forEach(p => {
                        const key = p.building_id || p.building_name || 'Unknown';
                        if (!buildingMap[key]) {
                            buildingMap[key] = {
                                building_id: p.building_id,
                                building_name: p.building_name || 'Unknown Building',
                                location_city: p.location_city,
                                location_state: p.location_state,
                                latitude: p.latitude,
                                longitude: p.longitude,
                                paintings: [],
                                earliest: null,
                                latest: null
                            };
                        }
                        const subjects = subjectsMap[p.nfdi_uri] || '';
                        buildingMap[key].paintings.push({ ...p, subjects });
                        
                        // Track earliest year for this building
                        if (p.year_start && (!buildingMap[key].earliest || p.year_start < buildingMap[key].earliest)) {
                            buildingMap[key].earliest = p.year_start;
                        }
                        if (p.year_end && (!buildingMap[key].latest || p.year_end > buildingMap[key].latest)) {
                            buildingMap[key].latest = p.year_end;
                        }
                    });

                    // Sort buildings chronologically
                    buildings = Object.values(buildingMap).sort((a, b) => 
                        (a.earliest || 9999) - (b.earliest || 9999)
                    );
                    currentBuildingIndex = 0;
                    
                    console.log('PainterExplorer: Buildings:', buildings.length);
                    if (buildings.length > 0) {
                        console.log('PainterExplorer: First building coords:', buildings[0].latitude, buildings[0].longitude);
                    }

                    // Update stats
                    const painterInfo = allPainters.find(p => p.person_name === painterName);
                    statsEl.innerHTML = `${paintings.length} paintings · ${buildings.length} buildings · ${painterInfo?.earliest || '?'}–${painterInfo?.latest || '?'}`;

                    // Clear and update map
                    Object.values(markers).forEach(m => map.removeLayer(m));
                    markers = {};
                    
                    // Also clear any existing polylines
                    map.eachLayer(layer => {
                        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                            map.removeLayer(layer);
                        }
                    });
                    
                    const validBuildings = buildings.filter(b => b.latitude && b.longitude);
                    console.log('PainterExplorer: Valid buildings with coords:', validBuildings.length);
                    
                    // Create polylines (travel path) between buildings chronologically
                    if (validBuildings.length > 1) {
                        const pathCoords = validBuildings.map(b => [parseFloat(b.latitude), parseFloat(b.longitude)]);
                        
                        // Draw the path with arrows
                        for (let i = 0; i < pathCoords.length - 1; i++) {
                            const start = pathCoords[i];
                            const end = pathCoords[i + 1];
                            
                            // Main line
                            const polyline = L.polyline([start, end], {
                                color: '#9b59b6',
                                weight: 3,
                                opacity: 0.7,
                                dashArray: '10, 10'
                            }).addTo(map);
                            
                            // Add arrow head at the end
                            const angle = Math.atan2(end[0] - start[0], end[1] - start[1]);
                            const arrowLength = 0.15; // degrees
                            const arrowAngle = Math.PI / 6; // 30 degrees
                            
                            // Calculate arrow head points
                            const arrowPoint1 = [
                                end[0] - arrowLength * Math.sin(angle - arrowAngle),
                                end[1] - arrowLength * Math.cos(angle - arrowAngle)
                            ];
                            const arrowPoint2 = [
                                end[0] - arrowLength * Math.sin(angle + arrowAngle),
                                end[1] - arrowLength * Math.cos(angle + arrowAngle)
                            ];
                            
                            L.polyline([arrowPoint1, end, arrowPoint2], {
                                color: '#9b59b6',
                                weight: 3,
                                opacity: 0.7
                            }).addTo(map);
                        }
                    }
                    
                    // Add numbered markers for each building
                    validBuildings.forEach((b, idx) => {
                        const lat = parseFloat(b.latitude);
                        const lng = parseFloat(b.longitude);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            const isActive = idx === currentBuildingIndex;
                            const markerIcon = L.divIcon({
                                className: 'custom-marker',
                                html: `<div style="
                                    background: ${isActive ? '#e74c3c' : '#3498db'}; 
                                    color: white; 
                                    width: 36px; 
                                    height: 36px; 
                                    border-radius: 50%; 
                                    display: flex; 
                                    align-items: center; 
                                    justify-content: center; 
                                    font-weight: bold; 
                                    font-size: 1em;
                                    border: 3px solid ${isActive ? '#c0392b' : '#2980b9'};
                                    box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                                    position: relative;
                                    z-index: ${isActive ? 1000 : 100};
                                ">${idx + 1}</div>`,
                                iconSize: [36, 36],
                                iconAnchor: [18, 18]
                            });
                            
                            const marker = L.marker([lat, lng], { icon: markerIcon, zIndexOffset: isActive ? 1000 : 0 });
                            marker.bindPopup(`
                                <strong>${b.building_name}</strong><br>
                                ${b.location_city || ''}, ${b.location_state || ''}<br>
                                <em>${b.paintings.length} painting${b.paintings.length > 1 ? 's' : ''} by ${painterName}</em><br>
                                <em>${b.earliest || '?'}${b.latest && b.latest !== b.earliest ? '–' + b.latest : ''}</em>
                            `);
                            marker.on('click', () => {
                                currentBuildingIndex = idx;
                                updateNavigation();
                                highlightBuilding(idx);
                                scrollToBuildingInList(b.building_id || b.building_name);
                            });
                            marker.addTo(map);
                            markers[b.building_id || b.building_name] = marker;
                        }
                    });

                    // Fit map to bounds
                    if (validBuildings.length > 0) {
                        const bounds = validBuildings.map(b => [parseFloat(b.latitude), parseFloat(b.longitude)]);
                        map.fitBounds(bounds, { padding: [50, 50] });
                    } else {
                        // No coordinates found - show message
                        console.warn('No valid building coordinates found for painter:', painterName);
                    }

                    // Render paintings list grouped by building
                    renderPaintingsList();
                    updateNavigation();

                } catch (error) {
                    paintingsContainer.innerHTML = `<div class="error" style="color: #c00; padding: 20px;">Error: ${error.message}</div>`;
                }
            }

            function renderPaintingsList() {
                const paintingsContainer = document.getElementById(`${explorerId}-paintings`);
                
                const html = buildings.map((building, bIdx) => {
                    const paintingsHtml = building.paintings.map(p => {
                        const yearStr = p.year_start === p.year_end 
                            ? (p.year_start || 'Unknown') 
                            : `${p.year_start || '?'}–${p.year_end || '?'}`;
                        
                        return `
                            <div class="painting-item" data-uri="${p.nfdi_uri}" 
                                 style="display: flex; gap: 12px; padding: 12px; background: #fff; border-radius: 6px; cursor: pointer; border: 1px solid #eee; margin-bottom: 8px; transition: all 0.2s;">
                                ${p.imageUrl ? `
                                    <img src="${p.imageUrl}" alt="${p.label}" 
                                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">
                                ` : `
                                    <div style="width: 80px; height: 80px; background: #ddd; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #888; font-size: 0.75em; flex-shrink: 0;">
                                        No image
                                    </div>
                                `}
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-weight: 500; color: #333; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        ${p.label}
                                    </div>
                                    <div style="font-size: 0.85em; color: #666; line-height: 1.5;">
                                        <div>📅 ${yearStr}</div>
                                        ${p.commissioners ? `<div>👑 ${p.commissioners}</div>` : ''}
                                        ${p.subjects ? `<div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">🏷️ ${p.subjects}</div>` : ''}
                                    </div>
                                </div>
                                <div style="color: #3498db; font-size: 1.2em; align-self: center;">›</div>
                            </div>
                        `;
                    }).join('');

                    const isActive = bIdx === currentBuildingIndex;
                    
                    return `
                        <div class="building-group" data-building="${building.building_id || building.building_name}" 
                             style="margin-bottom: 20px; border: 2px solid ${isActive ? '#3498db' : '#e0e0e0'}; border-radius: 10px; overflow: hidden; transition: border-color 0.3s;">
                            <div class="building-header" data-building-id="${building.building_id}" 
                                 style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: ${isActive ? 'linear-gradient(135deg, #3498db, #2980b9)' : '#f5f5f5'}; cursor: pointer;">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="background: ${isActive ? 'white' : '#3498db'}; color: ${isActive ? '#3498db' : 'white'}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8em; font-weight: bold;">${bIdx + 1}</span>
                                        <strong style="color: ${isActive ? 'white' : '#333'};">${building.building_name}</strong>
                                    </div>
                                    <div style="font-size: 0.85em; color: ${isActive ? 'rgba(255,255,255,0.9)' : '#666'}; margin-top: 2px; margin-left: 32px;">
                                        ${building.location_city || ''}${building.location_state ? ', ' + building.location_state : ''} · ${building.earliest || '?'}${building.latest && building.latest !== building.earliest ? '–' + building.latest : ''}
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="background: ${isActive ? 'rgba(255,255,255,0.2)' : '#e0e0e0'}; color: ${isActive ? 'white' : '#666'}; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">
                                        ${building.paintings.length} 🖼️
                                    </span>
                                    <button class="view-building-btn" data-building-id="${building.building_id}" 
                                            style="background: ${isActive ? 'white' : '#3498db'}; color: ${isActive ? '#3498db' : 'white'}; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                                        Info
                                    </button>
                                </div>
                            </div>
                            <div class="building-paintings" style="padding: 12px;">
                                ${paintingsHtml}
                            </div>
                        </div>
                    `;
                }).join('');

                paintingsContainer.innerHTML = html || '<div style="text-align: center; color: #888; padding: 40px;">No paintings found for this painter.</div>';

                // Add click handlers for paintings
                paintingsContainer.querySelectorAll('.painting-item').forEach(item => {
                    item.addEventListener('mouseenter', () => {
                        item.style.borderColor = '#3498db';
                        item.style.background = '#f8faff';
                    });
                    item.addEventListener('mouseleave', () => {
                        item.style.borderColor = '#eee';
                        item.style.background = '#fff';
                    });
                    item.addEventListener('click', () => showPaintingModal(item.dataset.uri));
                });

                // Add click handlers for building headers (pan to location)
                paintingsContainer.querySelectorAll('.building-header').forEach(header => {
                    header.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('view-building-btn')) {
                            const buildingKey = header.closest('.building-group').dataset.building;
                            const idx = buildings.findIndex(b => (b.building_id || b.building_name) === buildingKey);
                            if (idx >= 0) {
                                currentBuildingIndex = idx;
                                updateNavigation();
                                highlightBuilding(idx);
                                panToBuilding(idx);
                            }
                        }
                    });
                });

                // Add click handlers for building info buttons
                paintingsContainer.querySelectorAll('.view-building-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showBuildingModal(btn.dataset.buildingId);
                    });
                });
            }

            function updateNavigation() {
                const prevBtn = document.getElementById(`${explorerId}-prev`);
                const nextBtn = document.getElementById(`${explorerId}-next`);
                const navInfo = document.getElementById(`${explorerId}-nav-info`);
                
                prevBtn.disabled = currentBuildingIndex <= 0;
                nextBtn.disabled = currentBuildingIndex >= buildings.length - 1;
                
                if (buildings.length > 0) {
                    const b = buildings[currentBuildingIndex];
                    navInfo.innerHTML = `${currentBuildingIndex + 1}/${buildings.length}: ${b.building_name}`;
                } else {
                    navInfo.innerHTML = 'Select a painter';
                }
            }

            function highlightBuilding(idx) {
                // Update marker styles
                buildings.forEach((b, i) => {
                    const key = b.building_id || b.building_name;
                    const marker = markers[key];
                    if (marker) {
                        const isActive = i === idx;
                        const newIcon = L.divIcon({
                            className: 'custom-marker',
                            html: `<div style="
                                background: ${isActive ? '#e74c3c' : '#3498db'}; 
                                color: white; 
                                width: 30px; 
                                height: 30px; 
                                border-radius: 50%; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                font-weight: bold; 
                                font-size: 0.85em;
                                border: 3px solid ${isActive ? '#c0392b' : '#2980b9'};
                                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                            ">${i + 1}</div>`,
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        });
                        marker.setIcon(newIcon);
                    }
                });
                
                // Update list styling
                renderPaintingsList();
            }

            function panToBuilding(idx) {
                const b = buildings[idx];
                if (b && b.latitude && b.longitude) {
                    map.setView([parseFloat(b.latitude), parseFloat(b.longitude)], 10, { animate: true });
                    const key = b.building_id || b.building_name;
                    if (markers[key]) {
                        markers[key].openPopup();
                    }
                }
            }

            function scrollToBuildingInList(buildingKey) {
                const buildingGroup = document.querySelector(`[data-building="${buildingKey}"]`);
                if (buildingGroup) {
                    buildingGroup.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }

            async function showPaintingModal(uri) {
                const modal = document.getElementById(`${explorerId}-painting-modal`);
                const content = document.getElementById(`${explorerId}-painting-content`);
                
                modal.style.display = 'flex';
                content.innerHTML = '<div class="loading" style="padding: 20px; text-align: center;">Loading painting details...</div>';

                try {
                    const sql = `
                        SELECT 
                            p.nfdi_uri,
                            p.label,
                            p.painters,
                            p.commissioners,
                            p.year_start,
                            p.year_end,
                            p.building_name,
                            p.room_name,
                            p.location_state,
                            p.imageUrl,
                            p.method
                        FROM paintings p
                        WHERE p.nfdi_uri = '${uri}'
                    `;
                    const data = await BaroqueDB.query(sql);
                    
                    if (data.length === 0) {
                        content.innerHTML = '<div class="error">Painting not found.</div>';
                        return;
                    }

                    const p = data[0];
                    const yearStr = p.year_start === p.year_end 
                        ? (p.year_start || 'Unknown') 
                        : `${p.year_start || '?'}–${p.year_end || '?'}`;

                    // Get subjects
                    const subjectsSql = `
                        SELECT s.subject_label
                        FROM painting_subjects ps
                        JOIN subjects s ON ps.subject_uri = s.subject_uri
                        WHERE ps.nfdi_uri = '${uri}' AND s.subject_source = 'ICONCLASS'
                    `;
                    const subjects = await BaroqueDB.query(subjectsSql);

                    content.innerHTML = `
                        ${p.imageUrl ? `
                            <a href="${p.nfdi_uri}" target="_blank" rel="noopener">
                                <img src="${p.imageUrl}" alt="${p.label}" 
                                     style="width: 100%; max-height: 350px; object-fit: contain; border-radius: 8px; background: #000; margin-bottom: 15px;">
                            </a>
                        ` : ''}
                        <h4 style="margin: 0 0 15px 0; color: #2c3e50;">${p.label}</h4>
                        <div style="font-size: 0.95em; color: #555; line-height: 1.8;">
                            <div><strong>📅 Year:</strong> ${yearStr}</div>
                            <div><strong>📍 Location:</strong> ${p.building_name || 'Unknown'}${p.room_name ? ', ' + p.room_name : ''}</div>
                            <div><strong>🗺️ Region:</strong> ${p.location_state || 'Unknown'}</div>
                            ${p.painters ? `<div><strong>🎨 Painter(s):</strong> ${_makeClickablePainterNames(p.painters)}</div>` : ''}
                            ${p.commissioners ? `<div><strong>👑 Commissioner:</strong> ${p.commissioners}</div>` : ''}
                            ${p.method ? `<div><strong>🖌️ Technique:</strong> ${p.method}</div>` : ''}
                            ${subjects.length > 0 ? `<div><strong>🏷️ Subjects:</strong> ${subjects.map(s => s.subject_label).join(', ')}</div>` : ''}
                        </div>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                            <a href="${p.nfdi_uri}" target="_blank" rel="noopener" 
                               style="color: #3498db; text-decoration: none; font-size: 0.95em;">
                                View in CbDD →
                            </a>
                        </div>
                    `;
                } catch (error) {
                    content.innerHTML = `<div class="error" style="color: #c00;">Error: ${error.message}</div>`;
                }
            }

            async function showBuildingModal(buildingId) {
                const modal = document.getElementById(`${explorerId}-building-modal`);
                const content = document.getElementById(`${explorerId}-building-content`);
                
                modal.style.display = 'flex';
                content.innerHTML = '<div class="loading" style="padding: 20px; text-align: center;">Loading building details...</div>';

                try {
                    // First detect available columns in buildings table
                    const bCols = await BaroqueDB.query("PRAGMA table_info('buildings')");
                    const buildingCols = bCols.map(c => c.name ? c.name.toLowerCase() : c.name);
                    const hasLocationCity = buildingCols.includes('location_city');
                    
                    const sql = `
                        SELECT 
                            b.building_id,
                            b.name as building_name,
                            b.function as building_function,
                            b.location_state,
                            ${hasLocationCity ? 'b.location_city,' : ''}
                            b.construction_date,
                            COUNT(DISTINCT p.nfdi_uri) as total_paintings
                        FROM buildings b
                        LEFT JOIN paintings p ON b.building_id = p.building_id
                        WHERE b.building_id = '${buildingId}'
                        GROUP BY b.building_id, b.name, b.function, b.location_state, ${hasLocationCity ? 'b.location_city,' : ''} b.construction_date
                    `;
                    const data = await BaroqueDB.query(sql);
                    
                    if (data.length === 0) {
                        content.innerHTML = '<div class="error">Building not found.</div>';
                        return;
                    }

                    const b = data[0];

                    // Get associated persons
                    const personsSql = `
                        SELECT person_name, role 
                        FROM building_persons 
                        WHERE building_id = '${buildingId}'
                        ORDER BY role, person_name
                    `;
                    const persons = await BaroqueDB.query(personsSql);
                    const personsByRole = {};
                    persons.forEach(p => {
                        if (!personsByRole[p.role]) personsByRole[p.role] = [];
                        personsByRole[p.role].push(p.person_name);
                    });

                    content.innerHTML = `
                        <h4 style="margin: 0 0 15px 0; color: #2c3e50;">🏰 ${b.building_name}</h4>
                        <div style="font-size: 0.95em; color: #555; line-height: 1.8;">
                            ${b.building_function ? `<div><strong>Type:</strong> ${b.building_function}</div>` : ''}
                            <div><strong>📍 Location:</strong> ${b.location_city || ''}${b.location_state ? ', ' + b.location_state : ''}</div>
                            ${b.construction_date ? `<div><strong>📅 Construction:</strong> ${b.construction_date}</div>` : ''}
                            <div><strong>🖼️ Total Paintings:</strong> ${b.total_paintings}</div>
                            ${personsByRole['ARCHITECT'] ? `<div><strong>🏗️ Architect(s):</strong> ${personsByRole['ARCHITECT'].join(', ')}</div>` : ''}
                            ${personsByRole['COMMISSIONER'] ? `<div><strong>👑 Commissioner(s):</strong> ${personsByRole['COMMISSIONER'].join(', ')}</div>` : ''}
                        </div>
                    `;
                } catch (error) {
                    content.innerHTML = `<div class="error" style="color: #c00;">Error: ${error.message}</div>`;
                }
            }

            // Modal close handlers
            document.querySelectorAll(`#${explorerId} .close-modal`).forEach(btn => {
                btn.addEventListener('click', () => {
                    document.getElementById(`${explorerId}-building-modal`).style.display = 'none';
                    document.getElementById(`${explorerId}-painting-modal`).style.display = 'none';
                });
            });

            // Close modals on backdrop click
            [document.getElementById(`${explorerId}-building-modal`), document.getElementById(`${explorerId}-painting-modal`)].forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.style.display = 'none';
                });
            });

            // Navigation button handlers
            document.getElementById(`${explorerId}-prev`).addEventListener('click', () => {
                if (currentBuildingIndex > 0) {
                    currentBuildingIndex--;
                    updateNavigation();
                    highlightBuilding(currentBuildingIndex);
                    panToBuilding(currentBuildingIndex);
                    scrollToBuildingInList(buildings[currentBuildingIndex].building_id || buildings[currentBuildingIndex].building_name);
                }
            });

            document.getElementById(`${explorerId}-next`).addEventListener('click', () => {
                if (currentBuildingIndex < buildings.length - 1) {
                    currentBuildingIndex++;
                    updateNavigation();
                    highlightBuilding(currentBuildingIndex);
                    panToBuilding(currentBuildingIndex);
                    scrollToBuildingInList(buildings[currentBuildingIndex].building_id || buildings[currentBuildingIndex].building_name);
                }
            });

            // Load initial painter if provided
            if (initialPainter) {
                searchInput.value = initialPainter;
                loadPainter(initialPainter);
            }

            // Expose loadPainter globally for external links
            window.loadPainterInExplorer = async function(painterName) {
                // Update the search input
                searchInput.value = painterName;
                dropdown.style.display = 'none';
                // Load the painter data
                await loadPainter(painterName);
            };
            window.scrollToPainterExplorer = () => {
                el.scrollIntoView({ behavior: 'smooth' });
            };

            return { map, loadPainter };
        } catch (error) {
            el.innerHTML = `<div class="error">Error initializing explorer: ${error.message}</div>`;
            throw error;
        }
    }

    /**
     * Helper: Make painter name(s) clickable with jump-to-biography functionality
     * Uses data attributes and event delegation for robust handling
     * @param {string|string[]} names - Single painter name or array of names
     *        - If array: each element is a full painter name
     *        - If string: pipe-separated (|) or semicolon-separated (;) full names
     *        - NOTE: Do NOT split on comma as names are often "Last, First" format
     * @param {string} separator - Separator between names in output (default: ', ')
     * @returns {string} HTML string with clickable painter links
     */
    function _makeClickablePainterNames(names, separator = ', ') {
        if (!names) return '';
        
        let nameArray;
        if (Array.isArray(names)) {
            // Already an array of names - use directly
            nameArray = names.map(n => typeof n === 'string' ? n.trim() : '').filter(n => n);
        } else if (typeof names === 'string') {
            // String input - split by pipe or semicolon ONLY (not comma, as names are "Last, First")
            // First check if it contains pipes (common format: "Name1|Name2|Name3")
            if (names.includes('|')) {
                nameArray = names.split('|').map(n => n.trim()).filter(n => n);
            } else if (names.includes(';')) {
                nameArray = names.split(';').map(n => n.trim()).filter(n => n);
            } else {
                // Single name or comma-separated "Last, First" format - treat as single name
                nameArray = [names.trim()].filter(n => n);
            }
        } else {
            nameArray = [];
        }
        
        return nameArray.map(name => {
            // Encode the name for safe use in data attribute
            const encodedName = name.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<a href="#painter-explorer" 
               class="painter-jump-link" 
               data-painter-name="${encodedName}"
               title="Jump to biography"
               style="color: #3498db; text-decoration: none; cursor: pointer; border-bottom: 1px dotted #3498db;">${name}</a>`;
        }).join(separator);
    }
    
    // Global event delegation for painter links - only set up once
    if (!window._painterLinkHandlerInitialized) {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('.painter-jump-link');
            if (link) {
                e.preventDefault();
                const painterName = link.getAttribute('data-painter-name');
                if (painterName && window.loadPainterInExplorer) {
                    if (window.scrollToPainterExplorer) {
                        window.scrollToPainterExplorer();
                    }
                    window.loadPainterInExplorer(painterName);
                } else {
                    console.warn('Painter Explorer not yet initialized. Please scroll to the Painter Explorer section first.');
                }
            }
        });
        window._painterLinkHandlerInitialized = true;
    }

    /**
     * Helper: Get German variant of mythological name
     */
    function _getGermanVariant(name) {
        const variants = {
            'Hercules': 'Herkules',
            'Apollo': 'Apoll',
            'Jupiter': 'Zeus',
            'Mercury': 'Merkur',
            'Minerva': 'Athena'
        };
        return variants[name] || name;
    }

    /**
     * Helper: Get DOM element
     */
    function _getElement(container) {
        if (typeof container === 'string') {
            return document.querySelector(container);
        }
        return container;
    }

    /**
     * Helper: Wait for BaroqueDB to be ready
     */
    async function _waitForDB() {
        while (typeof BaroqueDB === 'undefined' || !BaroqueDB.isReady || !BaroqueDB.isReady()) {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    /**
     * Helper: HTML-escape a string
     */
    function _esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, (c) => ({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
        }[c]));
    }

    /**
     * Render dataset statistics cards (DB init + overview counts)
     * @param {string} container - CSS selector for the stats container
     * @param {string} dbPath - Path to the DuckDB file
     */
    async function renderDatasetStats(container, dbPath) {
        const el = _getElement(container);
        try {
            el.innerHTML = `
                <div class="db-progress">
                    <div class="db-progress-bar" style="width: 0%"></div>
                </div>
                <div class="db-progress-text">Initializing DuckDB WASM...</div>
            `;

            await BaroqueDB.init(dbPath, (progress) => {
                el.querySelector('.db-progress-bar').style.width = progress.percent + '%';
                el.querySelector('.db-progress-text').textContent = progress.message;
            });

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
            const items = [
                { value: s.paintings, label: 'Ceiling Paintings', color: '#3498db' },
                { value: s.persons,   label: 'Artists & Architects', color: '#27ae60' },
                { value: s.buildings, label: 'Buildings', color: '#9b59b6' },
                { value: s.rooms,     label: 'Rooms', color: '#e67e22' },
                { value: s.subjects,  label: 'Subject Classifications', color: '#e74c3c' },
                { value: s.bildindex_items, label: 'Bildindex Photos', color: '#1abc9c' }
            ];

            el.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
                    ${items.map(i => `
                        <div style="padding: 20px; background: ${i.color}22; border-radius: 8px;">
                            <div style="font-size: 2rem; font-weight: bold; color: ${i.color};">${i.value.toLocaleString()}</div>
                            <div>${i.label}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            el.innerHTML = `<div class="error">Failed to load database: ${error.message}</div>`;
        }
    }

    /**
     * Initialize the custom SQL query explorer
     * @param {string} textareaId - ID of the textarea element
     * @param {string} buttonId - ID of the run button
     * @param {string} resultContainer - CSS selector for the result container
     */
    function initQueryExplorer(textareaId, buttonId, resultContainer) {
        const btn = document.getElementById(buttonId);
        if (!btn) return;
        btn.addEventListener('click', async () => {
            const sql = document.getElementById(textareaId).value;
            const resultEl = document.querySelector(resultContainer);
            btn.disabled = true;
            btn.textContent = 'Running...';
            try {
                await BaroqueViz.renderCustomQuery(resultContainer, sql, 'Query Results');
            } catch (error) {
                resultEl.innerHTML = `<div class="error">Query Error: ${error.message}</div>`;
            }
            btn.disabled = false;
            btn.textContent = '▶ Run Query';
        });
    }

    /**
     * Initialize the topic selector (open/back navigation)
     */
    function initTopicSelector() {
        window.openMicroTopic = function(id) {
            document.getElementById('topic-selector').style.display = 'none';
            document.querySelectorAll('.micro-topic').forEach(el => el.style.display = 'none');
            const target = document.getElementById('topic-' + id);
            if (target) {
                target.style.display = 'block';
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => window.dispatchEvent(new Event('resize')), 400);
            }
        };
        window.backToTopics = function() {
            document.querySelectorAll('.micro-topic').forEach(el => el.style.display = 'none');
            const sel = document.getElementById('topic-selector');
            sel.style.display = 'grid';
            sel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
    }

    /**
     * Render the Religion micro-dashboard (ICONCLASS 10–14 tabs)
     * @param {string} container - CSS selector for the dashboard wrapper (e.g. '.rel-wrap')
     */
    async function renderReligionDashboard(container) {
        await _waitForDB();

        const $ = (id) => document.getElementById(id);

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
            <div class="rel-tab ${p === currentPrefix ? 'is-active' : ''}" data-prefix="${p}">
                ${p} · ${REL_LABELS[p]}
            </div>
        `).join('');

        function setActiveTab() {
            for (const el of tabsEl.querySelectorAll('.rel-tab')) {
                el.classList.toggle('is-active', el.dataset.prefix === currentPrefix);
            }
            $('rel-title-main').textContent = REL_LABELS[currentPrefix] || 'ICONCLASS';
            $('rel-prefix').textContent = currentPrefix;
        }

        function iconclassPrefixCTE() {
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

        async function refresh() {
            setActiveTab();
            const galleryN = parseInt($('rel-gallery-n').value, 10);

            // 1) Core counts
            const core = await BaroqueDB.query(`
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
            const c = core?.[0] || { paintings: 0, painters: 0, states: 0, buildings: 0 };
            $('rel-core-body').innerHTML = `
                <tr><td>Paintings (ICONCLASS ${currentPrefix}…)</td><td style="text-align:right"><b>${c.paintings ?? 0}</b></td></tr>
                <tr><td>Painters (role=PAINTER)</td><td style="text-align:right"><b>${c.painters ?? 0}</b></td></tr>
                <tr><td>States</td><td style="text-align:right"><b>${c.states ?? 0}</b></td></tr>
                <tr><td>Buildings</td><td style="text-align:right"><b>${c.buildings ?? 0}</b></td></tr>
            `;

            // 2) State distribution (top 12)
            const byState = await BaroqueDB.query(`
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
                margin: { l: 140, r: 20, t: 20, b: 40 },
                height: 360,
                xaxis: { title: 'Paintings' },
                yaxis: { automargin: true }
            }, { responsive: true });

            // 3) Timeline by decade (1600–1800)
            const byDecade = await BaroqueDB.query(`
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
                margin: { l: 60, r: 20, t: 20, b: 60 },
                height: 360,
                xaxis: { title: 'Decade', tickangle: -45 },
                yaxis: { title: 'Paintings' }
            }, { responsive: true });

            // 4) Gallery (clickable cards with detail panel + shuffle)
            const gallery = await BaroqueDB.query(`
                ${iconclassPrefixCTE()}
                SELECT DISTINCT
                    p.nfdi_uri,
                    p.label,
                    p.painters,
                    p.commissioners,
                    p.year_start,
                    p.year_end,
                    p.building_name,
                    p.room_name,
                    p.location_state,
                    p.imageUrl,
                    p.method
                FROM paintings p
                JOIN rel_paintings rp ON rp.nfdi_uri = p.nfdi_uri
                WHERE p.imageUrl IS NOT NULL AND p.imageUrl <> ''
                ORDER BY RANDOM()
                LIMIT ${galleryN}
            `);

            // Helper to fetch person roles for detail card
            async function fetchRelPersons(nfdiUri) {
                return await BaroqueDB.query(`
                    SELECT person_name, role
                    FROM painting_persons
                    WHERE nfdi_uri = '${nfdiUri}'
                    ORDER BY role
                `);
            }

            const galleryContainer = $('rel-gallery');
            galleryContainer.innerHTML = `
                <div class="rel-gallery__toolbar">
                    <button class="rel-gallery__shuffle" title="Show different paintings">
                        <span class="rel-gallery__shuffle-icon">⟳</span> Shuffle
                    </button>
                </div>
                <div class="rel-gallery__grid">
                    ${gallery.map((g, i) => `
                        <div class="rel-gallery__card" data-idx="${i}">
                            <div class="rel-gallery__img-wrap">
                                <img src="${g.imageUrl}" alt="${_esc(g.label)}" loading="lazy">
                                <div class="rel-gallery__overlay">
                                    <span>Click for details</span>
                                </div>
                            </div>
                            <div class="rel-gallery__caption">
                                <strong>${_esc(g.label)}</strong><br>
                                <span class="rel-gallery__meta">
                                    ${g.painters ? _makeClickablePainterNames(g.painters) : 'Unknown'} · ${g.year_start || '?'}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="rel-gallery__detail" style="display:none"></div>
            `;

            // ── Shuffle button ──────────────────────────────────────────────
            galleryContainer.querySelector('.rel-gallery__shuffle').addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                btn.disabled = true;
                btn.querySelector('.rel-gallery__shuffle-icon').style.animation = 'relSpin .5s ease';
                // collapse any open detail
                const detailEl = galleryContainer.querySelector('.rel-gallery__detail');
                detailEl.style.display = 'none';
                detailEl.innerHTML = '';
                await refresh();
            });

            // ── Click-to-detail ─────────────────────────────────────────────
            galleryContainer.querySelectorAll('.rel-gallery__card').forEach((card, idx) => {
                card.addEventListener('click', async (e) => {
                    if (e.target.closest('.painter-jump-link')) return;

                    const painting = gallery[idx];
                    const detailEl = galleryContainer.querySelector('.rel-gallery__detail');

                    // toggle off if same card clicked again
                    if (detailEl.style.display !== 'none' && detailEl.dataset.activeIdx === String(idx)) {
                        detailEl.style.display = 'none';
                        detailEl.innerHTML = '';
                        detailEl.dataset.activeIdx = '';
                        return;
                    }

                    detailEl.style.display = 'block';
                    detailEl.dataset.activeIdx = String(idx);
                    detailEl.innerHTML = '<div class="loading">Loading painting details…</div>';
                    detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                    try {
                        const persons = await fetchRelPersons(painting.nfdi_uri);
                        const byRole = {};
                        for (const p of persons) {
                            if (!byRole[p.role]) byRole[p.role] = [];
                            byRole[p.role].push(p.person_name);
                        }

                        const yearStr = painting.year_start === painting.year_end
                            ? painting.year_start
                            : `${painting.year_start || '?'}–${painting.year_end || '?'}`;

                        detailEl.innerHTML = `
                            <figure class="rel-gallery__detail-card">
                                <button class="rel-gallery__detail-close" title="Close">✕</button>
                                <div class="rel-gallery__detail-body">
                                    <div class="rel-gallery__detail-img">
                                        <a href="${painting.nfdi_uri}" target="_blank" rel="noopener">
                                            <img src="${painting.imageUrl}" alt="${_esc(painting.label)}">
                                        </a>
                                    </div>
                                    <figcaption class="rel-gallery__detail-info">
                                        <h4 style="margin:0 0 10px">
                                            <a href="${painting.nfdi_uri}" target="_blank" style="color:inherit;text-decoration:none">
                                                ${_esc(painting.label)}
                                            </a>
                                        </h4>
                                        <div class="rel-gallery__detail-meta">
                                            <div><strong>📅 Year:</strong> ${yearStr || 'Unknown'}</div>
                                            <div><strong>📍 Location:</strong> ${_esc(painting.building_name || '')}${painting.room_name ? `, ${_esc(painting.room_name)}` : ''}</div>
                                            <div><strong>🗺️ Region:</strong> ${_esc(painting.location_state || 'Unknown')}</div>
                                            ${byRole['PAINTER'] ? `<div><strong>🎨 Painter(s):</strong> ${_makeClickablePainterNames(byRole['PAINTER'])}</div>` : ''}
                                            ${painting.commissioners ? `<div><strong>👑 Commissioner:</strong> ${_esc(painting.commissioners)}</div>` : ''}
                                            ${painting.method ? `<div><strong>🖌️ Technique:</strong> ${_esc(painting.method)}</div>` : ''}
                                        </div>
                                        <a href="${painting.nfdi_uri}" target="_blank" rel="noopener"
                                           class="rel-gallery__detail-link">View in CbDD ↗</a>
                                    </figcaption>
                                </div>
                            </figure>
                        `;

                        detailEl.querySelector('.rel-gallery__detail-close').addEventListener('click', () => {
                            detailEl.style.display = 'none';
                            detailEl.innerHTML = '';
                            detailEl.dataset.activeIdx = '';
                        });
                    } catch (err) {
                        detailEl.innerHTML = `<div class="error">Error loading details: ${err.message}</div>`;
                    }
                });
            });

            // 5) Representative painter (most frequent)
            const topPainter = await BaroqueDB.query(`
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
            if (!painterName) {
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
    }

    /**
     * Initialize the Rittersaal interactive viewer (hotspot popups + image navigation)
     */
    function initRittersaal() {
        // Popup handlers
        document.querySelectorAll('.hotspot').forEach(el => {
            el.addEventListener('click', e => {
                e.stopPropagation();
                document.getElementById('popup').style.display = 'flex';
                document.getElementById('popup-img').src = el.dataset.img;
                document.getElementById('popup-title').innerText = el.dataset.title;
                document.getElementById('popup-desc').innerHTML = el.dataset.text;
            });
        });

        window.closePopup = function() {
            document.getElementById('popup').style.display = 'none';
        };

        // Image navigation
        const images = [
            "Rittersaal1.jpg",  // West / fireplace side
            "Rittersaal2.jpg",  // central section
            "Rittersaal3.jpg"   // East / towards Tafelstube
        ];

        let current = 0;

        function updateHotspots() {
            document.querySelectorAll('.hotspot').forEach(h => {
                h.style.display = (h.dataset.room == current) ? "block" : "none";
            });
        }

        function showImg() {
            document.getElementById("ceilingImg").src = images[current];
            updateHotspots();
        }

        window.nextImg = function() {
            current = (current + 1) % images.length;
            showImg();
        };

        window.prevImg = function() {
            current = (current - 1 + images.length) % images.length;
            showImg();
        };

        window.jumpToRoom = function(idx) {
            current = idx;
            showImg();
            const target = document.getElementById("rittersaalInteractive");
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        };

        // Initial state
        updateHotspots();
    }

    /**
     * Initialize the Battle Hall lightbox for Leutenberg cards
     */
    function initBattleHallLightbox() {
        const lb = document.getElementById('cbdd-lightbox');
        const lbImg = document.getElementById('cbdd-lightbox-img');
        const lbCap = document.getElementById('cbdd-lightbox-cap');
        const lbClose = document.getElementById('cbdd-lightbox-close');

        if (!lb || !lbImg || !lbCap || !lbClose) return;

        function openLightbox(src, caption, alt) {
            lbImg.src = src;
            lbImg.alt = alt || '';
            lbCap.textContent = caption || '';
            lb.classList.add('is-open');
            lb.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lb.classList.remove('is-open');
            lb.setAttribute('aria-hidden', 'true');
            lbImg.src = '';
            document.body.style.overflow = '';
        }

        document.querySelectorAll('.cbdd-imgbtn').forEach(btn => {
            btn.addEventListener('click', () => {
                openLightbox(btn.dataset.full, btn.dataset.caption, btn.querySelector('img')?.alt);
            });
        });

        lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
        lbClose.addEventListener('click', closeLightbox);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lb.classList.contains('is-open')) closeLightbox();
        });
    }

    /* =========================================================================
       initAsamCarousel — simple image carousel for Turkish War frescoes
       ========================================================================= */
    function initAsamCarousel(containerId, images) {
        const container = _getElement(containerId);
        if (!container) return;

        let idx = 0;
        const imgEl = container.querySelector('#turk-image');
        if (!imgEl) return;

        function turkChange(step) {
            idx = (idx + step + images.length) % images.length;
            imgEl.src = images[idx];
        }

        // Expose for onclick attributes
        window.turkChange = turkChange;
    }

    /* =========================================================================
       initSiegeGallery — Weikersheim 12 siege scenes click-through gallery
       ========================================================================= */
    function initSiegeGallery(rootId, slides) {
        const root = document.getElementById(rootId);
        if (!root) return;

        const imgEl   = document.getElementById('wk-img');
        const linkEl  = document.getElementById('wk-link');
        const counterEl = document.getElementById('wk-counter');
        const capTitle  = document.getElementById('wk-capTitle');
        const capMeta   = document.getElementById('wk-capMeta');
        const capText   = document.getElementById('wk-capText');
        const dotsWrap  = document.getElementById('wk-dots');
        const thumbsWrap = document.getElementById('wk-thumbs');

        let idx = 0;

        function render() {
            const s = slides[idx];
            imgEl.src = s.img;
            imgEl.alt = s.title;
            linkEl.href = s.href;
            capTitle.textContent = s.title;
            capMeta.textContent  = s.meta;
            capText.textContent  = s.text;
            counterEl.textContent = `${idx + 1} / ${slides.length}`;

            [...dotsWrap.children].forEach((b, i) => {
                b.setAttribute('aria-current', i === idx ? 'true' : 'false');
            });
            [...thumbsWrap.children].forEach((t, i) => {
                t.setAttribute('aria-current', i === idx ? 'true' : 'false');
            });
        }

        function go(n) {
            idx = (n + slides.length) % slides.length;
            render();
        }

        // Build dots
        slides.forEach((s, i) => {
            const b = document.createElement('button');
            b.className = 'wk-dot';
            b.type = 'button';
            b.setAttribute('aria-label', `Go to ${i + 1}`);
            b.addEventListener('click', () => go(i));
            dotsWrap.appendChild(b);
        });

        // Build thumbnails
        slides.forEach((s, i) => {
            const t = document.createElement('button');
            t.className = 'wk-thumb';
            t.type = 'button';
            t.setAttribute('aria-label', `Open ${i + 1}`);
            t.addEventListener('click', () => go(i));

            const im = document.createElement('img');
            im.src = s.img;
            im.alt = s.title;
            im.loading = 'lazy';
            im.referrerPolicy = 'no-referrer';

            t.appendChild(im);
            thumbsWrap.appendChild(t);
        });

        // Prev / Next buttons
        document.getElementById('wk-prev').addEventListener('click', () => go(idx - 1));
        document.getElementById('wk-next').addEventListener('click', () => go(idx + 1));

        // Keyboard navigation
        root.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft')  go(idx - 1);
            if (e.key === 'ArrowRight') go(idx + 1);
        });
        root.tabIndex = 0;

        // Swipe support
        const stage = document.getElementById('wk-stage');
        let x0 = null;

        stage.addEventListener('touchstart', (e) => {
            x0 = e.touches[0].clientX;
        }, { passive: true });

        stage.addEventListener('touchend', (e) => {
            if (x0 === null) return;
            const x1 = e.changedTouches[0].clientX;
            const dx = x1 - x0;
            if (Math.abs(dx) > 45) {
                if (dx > 0) go(idx - 1);
                else go(idx + 1);
            }
            x0 = null;
        }, { passive: true });

        // Initial render
        render();
    }

    // Public API
    return {
        renderStateDistribution,
        renderTemporalDistribution,
        renderTopPainters,
        renderIconclassCategories,
        renderBuildingsMap,
        renderCrossDatasetComparison,
        renderPainterBiography,
        renderCustomQuery,
        renderCoPainterPairs,
        renderPaintingCard,
        renderRoomCard,
        renderBuildingCard,
        renderPainterGallery,
        renderCommissionsTimeline,
        renderMythologyGallery,
        renderMythologyIntroGallery,
        renderMythFigureGallery,
        renderPainterExplorer,
        renderDatasetStats,
        renderReligionDashboard,
        initQueryExplorer,
        initTopicSelector,
        initRittersaal,
        initBattleHallLightbox,
        initAsamCarousel,
        initSiegeGallery,
        QUERIES,
        COLORS,
        ICONCLASS_LABELS
    };

})();
