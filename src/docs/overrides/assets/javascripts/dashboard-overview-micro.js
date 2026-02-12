console.log("🔥 dashboard-overview-micro.js LOADED");

// ICONCLASS QUICK STATS DASHBOARD (0–9)
(function () {
    "use strict";
  
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const $ = (id) => document.getElementById(id);
  
    function escapeHtml(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[c]));
    }
  
    async function ensureDbReady() {
      while (typeof BaroqueDB === "undefined" || !BaroqueDB.isReady || !BaroqueDB.isReady()) {
        await wait(100);
      }
    }
  
    // Main init (call this from index.md)
    async function initIconclassDashboard(options = {}) {
      const {
        defaultCat = "4",
        rootId = null, // not used here, but kept for future
      } = options;
  
      await ensureDbReady();

      console.log("[IconclassDashboard] init start", { defaultCat });

console.log("[IconclassDashboard] elements", {
  tabs: !!document.getElementById("ic-tabs"),
  topn: !!document.getElementById("ic-topn"),
  core: !!document.getElementById("ic-core-body"),
  painters: !!document.getElementById("ic-top-painters"),
});
  
      // --- Category labels (0..9) ---
      const CAT_LABELS = {
        "0": "Abstract",
        "1": "Religion & Magic",
        "2": "Nature",
        "3": "Human Being",
        "4": "Society & Culture",
        "5": "Abstract Ideas",
        "6": "History",
        "7": "Bible",
        "8": "Literature",
        "9": "Classical Mythology",
      };
  
      // --- UI state ---
      let currentCat = String(defaultCat);
  
      // Render tabs
      const tabsEl = $("ic-tabs");
      if (!tabsEl) {
        console.warn("[IconclassDashboard] Missing #ic-tabs. Did you paste the HTML block into index.md?");
        return;
      }
  
      tabsEl.innerHTML = Object.keys(CAT_LABELS)
        .map(
          (d) => `
        <div class="ic-tab ${d === currentCat ? "is-active" : ""}" data-cat="${d}">
          ${d} · ${CAT_LABELS[d]}
        </div>
      `
        )
        .join("");
  
      function setActiveTab() {
        for (const el of tabsEl.querySelectorAll(".ic-tab")) {
          el.classList.toggle("is-active", el.dataset.cat === currentCat);
        }
        const titleEl = $("ic-title-main");
        const digitEl = $("ic-cat-digit");
        if (titleEl) titleEl.textContent = CAT_LABELS[currentCat] || "ICONCLASS";
        if (digitEl) digitEl.textContent = currentCat;
      }
  
      function renderList(containerId, rows, keyName, valueName) {
        const el = $(containerId);
        if (!el) return;
  
        if (!rows || !rows.length) {
          el.innerHTML = `<div class="ic-empty">No data returned.</div>`;
          return;
        }
        el.innerHTML = rows
          .map((r) => {
            const k = r[keyName] ?? "(unknown)";
            const v = r[valueName] ?? 0;
            return `<div class="ic-row"><div class="k">${escapeHtml(k)}</div><div class="v">${v}</div></div>`;
          })
          .join("");
      }
  
      async function query(sql) {
        return await BaroqueDB.query(sql);
      }
  
      // Robust iconclass_code extraction (no regex)
      // -> split on iconclass.org/ then take first path segment
      function iconclassCTE() {
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
  
      async function refresh() {
        const topN = parseInt($("ic-topn")?.value ?? "10", 10);
        for (const x of document.querySelectorAll(".ic-topn-label")) x.textContent = String(topN);
  
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
  
        const c = core && core[0] ? core[0] : { paintings: 0, painters: 0, states: 0, buildings: 0, rooms: 0 };
  
        const coreBody = $("ic-core-body");
        if (coreBody) {
          coreBody.innerHTML = `
            <tr><td>Paintings (ICONCLASS ${currentCat}…)</td><td style="text-align:right"><b>${c.paintings ?? 0}</b></td></tr>
            <tr><td>Painters (role=PAINTER)</td><td style="text-align:right"><b>${c.painters ?? 0}</b></td></tr>
            <tr><td>States</td><td style="text-align:right"><b>${c.states ?? 0}</b></td></tr>
            <tr><td>Buildings</td><td style="text-align:right"><b>${c.buildings ?? 0}</b></td></tr>
            <tr><td>Rooms</td><td style="text-align:right"><b>${c.rooms ?? 0}</b></td></tr>
          `;
        }
  
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
        renderList("ic-top-painters", topPainters, "painter", "painting_count");
  
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
        renderList("ic-top-states", topStates, "state", "painting_count");
  
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
        renderList("ic-top-buildings", topBuildings, "building", "painting_count");
  
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
        renderList("ic-top-commissioners", topCommissioners, "commissioner", "painting_count");
      }
  
      // Tab clicks
      tabsEl.addEventListener("click", (e) => {
        const t = e.target.closest(".ic-tab");
        if (!t) return;
        currentCat = t.dataset.cat;
        refresh();
      });
  
      // N selector
      const topnEl = $("ic-topn");
      if (topnEl) topnEl.addEventListener("change", refresh);
  
      // initial
      setActiveTab();
      refresh();
    }
  
    

    window.BaroqueDashboards = window.BaroqueDashboards || {};
window.BaroqueDashboards.renderIconclassDashboard = initIconclassDashboard;
console.log("✅ Dashboard function registered: BaroqueDashboards.renderIconclassDashboard");

  })();