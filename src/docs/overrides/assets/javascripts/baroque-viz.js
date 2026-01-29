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
     * Helper: Get DOM element
     */
    function _getElement(container) {
        if (typeof container === 'string') {
            return document.querySelector(container);
        }
        return container;
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
        QUERIES,
        COLORS,
        ICONCLASS_LABELS
    };

})();
