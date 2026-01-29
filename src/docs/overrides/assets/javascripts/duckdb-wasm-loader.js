/**
 * DuckDB WASM Loader - Initializes DuckDB WASM for client-side SQL queries
 * 
 * This module handles:
 * - Loading DuckDB WASM from CDN (jsDelivr)
 * - Fetching and attaching the baroque.duckdb database
 * - Providing a simple query interface
 * 
 * Usage:
 *   const db = await BaroqueDB.init('/story/CbDD/baroque.duckdb');
 *   const result = await db.query('SELECT * FROM paintings LIMIT 10');
 */

// Global namespace for the Baroque Database
window.BaroqueDB = (function() {
    'use strict';

    // State
    let db = null;
    let conn = null;
    let isInitialized = false;
    let initPromise = null;

    // DuckDB WASM CDN URLs - must match database version
    // Database was created with DuckDB v1.4.3, try WASM v1.32.0 (latest stable after 1.31.0)
    const DUCKDB_VERSION = '1.32.0';
    const DUCKDB_BUNDLES = {
        mvp: {
            mainModule: `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/dist/duckdb-mvp.wasm`,
            mainWorker: `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/dist/duckdb-browser-mvp.worker.js`,
        },
        eh: {
            mainModule: `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/dist/duckdb-eh.wasm`,
            mainWorker: `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/dist/duckdb-browser-eh.worker.js`,
        }
    };

    /**
     * Select the best bundle based on browser capabilities
     */
    function selectBundle() {
        // Check for exception handling support (faster but not universally supported)
        const hasEH = typeof WebAssembly.Exception !== 'undefined';
        return hasEH ? DUCKDB_BUNDLES.eh : DUCKDB_BUNDLES.mvp;
    }

    /**
     * Create a worker from a cross-origin URL using blob URL workaround
     * This is needed because Web Workers have same-origin restrictions
     */
    async function createWorkerFromURL(workerURL) {
        // Fetch the worker script
        const response = await fetch(workerURL);
        const workerScript = await response.text();
        
        // Create a blob URL from the script content
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        const blobURL = URL.createObjectURL(blob);
        
        // Create worker from blob URL (same-origin)
        const worker = new Worker(blobURL);
        
        // Clean up blob URL after worker is created
        // Note: We don't revoke immediately as the worker needs time to load
        setTimeout(() => URL.revokeObjectURL(blobURL), 10000);
        
        return worker;
    }

    /**
     * Initialize DuckDB WASM and load the baroque database
     * @param {string} dbPath - Path to the .duckdb file
     * @param {function} onProgress - Optional callback for progress updates
     * @returns {Promise<object>} - The BaroqueDB interface
     */
    async function init(dbPath, onProgress = null) {
        // Return existing promise if already initializing
        if (initPromise) {
            return initPromise;
        }

        // Return immediately if already initialized
        if (isInitialized) {
            return {
                query: query,
                queryToTable: queryToTable,
                queryToChart: queryToChart,
                queryToMap: queryToMap,
                getConnection: () => conn,
                getDB: () => db,
                isReady: () => isInitialized
            };
        }

        initPromise = _doInit(dbPath, onProgress);
        return initPromise;
    }

    /**
     * Internal initialization logic
     */
    async function _doInit(dbPath, onProgress) {
        try {
            _reportProgress(onProgress, 'Loading DuckDB WASM...', 0);

            // Dynamically import DuckDB WASM
            const duckdb = await import(`https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/+esm`);
            
            _reportProgress(onProgress, 'Selecting optimal bundle...', 10);
            const bundle = selectBundle();

            _reportProgress(onProgress, 'Creating worker...', 20);
            // Use blob URL workaround to avoid CORS issues with cross-origin workers
            const worker = await createWorkerFromURL(bundle.mainWorker);
            const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
            
            db = new duckdb.AsyncDuckDB(logger, worker);
            
            _reportProgress(onProgress, 'Instantiating DuckDB...', 30);
            await db.instantiate(bundle.mainModule);

            _reportProgress(onProgress, 'Fetching baroque database...', 50);
            const response = await fetch(dbPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`);
            }
            
            const buffer = await response.arrayBuffer();
            _reportProgress(onProgress, 'Registering database file...', 70);
            
            await db.registerFileBuffer('baroque.duckdb', new Uint8Array(buffer));
            
            _reportProgress(onProgress, 'Connecting to database...', 85);
            conn = await db.connect();
            
            // Attach the database
            await conn.query("ATTACH 'baroque.duckdb' AS baroque (READ_ONLY)");
            await conn.query("USE baroque");
            
            _reportProgress(onProgress, 'Database ready!', 100);
            isInitialized = true;

            console.log('✅ BaroqueDB initialized successfully');

            return {
                query: query,
                queryToTable: queryToTable,
                queryToChart: queryToChart,
                queryToMap: queryToMap,
                getConnection: () => conn,
                getDB: () => db,
                isReady: () => isInitialized
            };

        } catch (error) {
            console.error('❌ Failed to initialize BaroqueDB:', error);
            initPromise = null;
            throw error;
        }
    }

    /**
     * Report progress to callback
     */
    function _reportProgress(callback, message, percent) {
        console.log(`[BaroqueDB] ${percent}% - ${message}`);
        if (callback && typeof callback === 'function') {
            callback({ message, percent });
        }
    }

    /**
     * Execute a SQL query and return results as array of objects
     * @param {string} sql - SQL query string
     * @returns {Promise<Array<object>>} - Query results
     */
    async function query(sql) {
        if (!isInitialized || !conn) {
            throw new Error('Database not initialized. Call BaroqueDB.init() first.');
        }

        try {
            const result = await conn.query(sql);
            return arrowToObjects(result);
        } catch (error) {
            console.error('Query error:', error);
            throw error;
        }
    }

    /**
     * Convert Arrow table to array of plain objects
     */
    function arrowToObjects(arrowTable) {
        const columns = arrowTable.schema.fields.map(f => f.name);
        const rows = [];
        
        for (let i = 0; i < arrowTable.numRows; i++) {
            const row = {};
            for (const col of columns) {
                const value = arrowTable.getChild(col).get(i);
                // Handle BigInt conversion for JavaScript compatibility
                row[col] = typeof value === 'bigint' ? Number(value) : value;
            }
            rows.push(row);
        }
        
        return rows;
    }

    /**
     * Execute query and render results as an interactive DataTable
     * @param {string} sql - SQL query
     * @param {string|HTMLElement} container - Container selector or element
     * @param {object} options - DataTables options
     */
    async function queryToTable(sql, container, options = {}) {
        const data = await query(sql);
        
        if (data.length === 0) {
            _getElement(container).innerHTML = '<p class="no-data">No results found.</p>';
            return;
        }

        const columns = Object.keys(data[0]);
        const tableId = 'duckdb-table-' + Math.random().toString(36).substr(2, 9);
        
        // Build HTML table
        let html = `<table id="${tableId}" class="display compact" style="width:100%">`;
        html += '<thead><tr>' + columns.map(c => `<th>${c}</th>`).join('') + '</tr></thead>';
        html += '<tbody>';
        for (const row of data) {
            html += '<tr>' + columns.map(c => `<td>${formatValue(row[c])}</td>`).join('') + '</tr>';
        }
        html += '</tbody></table>';
        
        _getElement(container).innerHTML = html;

        // Initialize DataTables if available
        if (typeof $ !== 'undefined' && $.fn.DataTable) {
            $(`#${tableId}`).DataTable({
                scrollX: true,
                pageLength: options.pageLength || 10,
                order: options.order || [],
                ...options
            });
        }

        return data;
    }

    /**
     * Execute query and render results as a Plotly chart
     * @param {string} sql - SQL query
     * @param {string|HTMLElement} container - Container selector or element
     * @param {object} chartConfig - Plotly chart configuration
     */
    async function queryToChart(sql, container, chartConfig) {
        const data = await query(sql);
        
        if (data.length === 0) {
            _getElement(container).innerHTML = '<p class="no-data">No data for chart.</p>';
            return;
        }

        if (typeof Plotly === 'undefined') {
            console.error('Plotly.js not loaded');
            return;
        }

        const el = _getElement(container);
        const columns = Object.keys(data[0]);
        
        // Default chart config based on data structure
        const defaultConfig = {
            type: 'bar',
            x: columns[0],
            y: columns[1],
            title: ''
        };
        
        const config = { ...defaultConfig, ...chartConfig };
        
        const trace = {
            x: data.map(row => row[config.x]),
            y: data.map(row => row[config.y]),
            type: config.type,
            marker: config.marker || { color: '#3498db' },
            name: config.name || config.y
        };

        const layout = {
            title: config.title,
            xaxis: { title: config.xLabel || config.x },
            yaxis: { title: config.yLabel || config.y },
            margin: { t: 50, b: 80, l: 60, r: 30 },
            ...config.layout
        };

        Plotly.newPlot(el, [trace], layout, { responsive: true });

        return data;
    }

    /**
     * Execute query and render results as a Leaflet map
     * @param {string} sql - SQL query (must include lat/lng columns)
     * @param {string|HTMLElement} container - Container selector or element
     * @param {object} mapConfig - Map configuration
     */
    async function queryToMap(sql, container, mapConfig = {}) {
        const data = await query(sql);
        
        if (data.length === 0) {
            _getElement(container).innerHTML = '<p class="no-data">No data for map.</p>';
            return;
        }

        if (typeof L === 'undefined') {
            console.error('Leaflet not loaded');
            return;
        }

        const el = _getElement(container);
        el.style.height = mapConfig.height || '500px';
        
        // Find lat/lng columns
        const latCol = mapConfig.latColumn || findColumn(data[0], ['lat', 'latitude', 'y']);
        const lngCol = mapConfig.lngColumn || findColumn(data[0], ['lng', 'lon', 'longitude', 'x']);
        const labelCol = mapConfig.labelColumn || findColumn(data[0], ['label', 'name', 'title']);
        
        if (!latCol || !lngCol) {
            el.innerHTML = '<p class="error">Could not find latitude/longitude columns in data.</p>';
            return;
        }

        // Create map
        const map = L.map(el).setView(
            mapConfig.center || [51.0, 10.0], // Default: Germany center
            mapConfig.zoom || 6
        );

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Add markers
        const markers = L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup();
        
        for (const row of data) {
            const lat = parseFloat(row[latCol]);
            const lng = parseFloat(row[lngCol]);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                const marker = L.marker([lat, lng]);
                
                // Build popup content
                let popup = labelCol ? `<strong>${row[labelCol]}</strong><br>` : '';
                for (const [key, value] of Object.entries(row)) {
                    if (key !== latCol && key !== lngCol && value != null) {
                        popup += `<small>${key}: ${formatValue(value)}</small><br>`;
                    }
                }
                marker.bindPopup(popup);
                markers.addLayer(marker);
            }
        }

        markers.addTo(map);

        // Fit bounds if markers exist
        if (data.length > 0) {
            const bounds = [];
            for (const row of data) {
                const lat = parseFloat(row[latCol]);
                const lng = parseFloat(row[lngCol]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    bounds.push([lat, lng]);
                }
            }
            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [20, 20] });
            }
        }

        return { map, data };
    }

    /**
     * Helper: Find column by possible names
     */
    function findColumn(row, possibleNames) {
        const cols = Object.keys(row).map(c => c.toLowerCase());
        for (const name of possibleNames) {
            const idx = cols.indexOf(name.toLowerCase());
            if (idx !== -1) {
                return Object.keys(row)[idx];
            }
        }
        return null;
    }

    /**
     * Helper: Format values for display
     */
    function formatValue(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        if (value instanceof Date) {
            return value.toLocaleDateString();
        }
        return String(value);
    }

    /**
     * Helper: Get DOM element from selector or element
     */
    function _getElement(container) {
        if (typeof container === 'string') {
            return document.querySelector(container);
        }
        return container;
    }

    // Public API
    return {
        init: init,
        query: query,
        queryToTable: queryToTable,
        queryToChart: queryToChart,
        queryToMap: queryToMap,
        isReady: () => isInitialized
    };

})();
