/* =====================================================================
   PhysioHub front-end logic.

   Two distinct page types share this file:
   - Hub home  (body[data-page="hub"])     — only does theme + nav glue
   - System    (body[data-page="system"]) — inlines an SVG, fetches data,
                                              wires hover/click handlers,
                                              renders the detail panel.

   Public surface used from HTML:
     window.PhysioHub.bootHub()                 — call from index.html
     window.PhysioHub.bootSystem("cv")          — call from systems/cv.html
   ===================================================================== */

(function () {
  "use strict";

  const THEME_KEY = "physiohub-theme";
  const DATA_URL  = "../data/physiohub.json";   // system pages live in /systems/
  const HUB_DATA_URL = "data/physiohub.json";   // hub home lives at /

  // ------------------------------ Theme ------------------------------
  function applyTheme(light) {
    document.documentElement.classList.toggle("light", light);
    document.documentElement.classList.toggle("dark", !light);
    const btn = document.getElementById("theme-btn");
    if (btn) {
      btn.querySelector(".ico").textContent = light ? "☾" : "☀";
      btn.querySelector(".lbl").textContent = light ? "Night"   : "Day";
    }
    try { localStorage.setItem(THEME_KEY, light ? "light" : "dark"); } catch (e) {}
  }
  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    applyTheme(saved === "light");
    const btn = document.getElementById("theme-btn");
    if (btn) {
      btn.addEventListener("click", () =>
        applyTheme(!document.documentElement.classList.contains("light"))
      );
    }
  }

  // ------------------------------ Hub --------------------------------
  function bootHub() {
    initTheme();
    // Coming-soon cards should not navigate.
    document.querySelectorAll('.system-card[data-state="coming-soon"]').forEach(card => {
      card.addEventListener("click", e => { e.preventDefault(); });
    });
  }

  // ----------------------------- System ------------------------------
  // State for the currently rendered system page.
  const sys = {
    id: null,         // "cv"
    data: null,       // full physiohub.json
    svgRoot: null,    // the <svg> element after injection
    tooltipEl: null,
    activeId: null,   // currently locked structure id ("cv_aortic_valve")
  };

  async function bootSystem(systemId) {
    initTheme();
    sys.id = systemId;

    const [svgText, data] = await Promise.all([
      fetchText(`../assets/svg/${systemId}.svg`),
      fetchJSON(DATA_URL),
    ]);
    sys.data = data;

    injectSVG(svgText);
    wireStructureHandlers();
    setupTooltip();
    setupBackgroundDismiss();
    setupKeyboardShortcuts();

    // If we landed with #cv_xxx in the URL, open that structure.
    const fromHash = location.hash.replace("#", "");
    if (fromHash && document.getElementById(fromHash)) {
      activateStructure(fromHash, { scroll: true });
    }
  }

  async function fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.text();
  }
  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.json();
  }

  function injectSVG(svgText) {
    const host = document.getElementById("svg-host");
    host.innerHTML = svgText;
    sys.svgRoot = host.querySelector("svg");
    if (!sys.svgRoot) throw new Error("Inlined SVG had no <svg> root");
  }

  function wireStructureHandlers() {
    const nodes = sys.svgRoot.querySelectorAll('g.structure[id^="' + sys.id + '_"]');
    nodes.forEach(node => {
      node.addEventListener("mouseenter", onHoverEnter);
      node.addEventListener("mouseleave", onHoverLeave);
      node.addEventListener("mousemove",  onHoverMove);
      node.addEventListener("click",      onStructureClick);
      node.addEventListener("keydown",    onStructureKey);
      node.addEventListener("focus",      onHoverEnter);
      node.addEventListener("blur",       onHoverLeave);
    });
  }

  function setupTooltip() {
    const tip = document.createElement("div");
    tip.className = "svg-tooltip";
    tip.setAttribute("role", "tooltip");
    document.getElementById("svg-host").appendChild(tip);
    sys.tooltipEl = tip;
  }

  function setupBackgroundDismiss() {
    // Click on empty SVG area dismisses the active structure.
    sys.svgRoot.addEventListener("click", e => {
      if (!e.target.closest("g.structure")) clearActive();
    });
  }

  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && sys.activeId) {
        e.preventDefault();
        clearActive();
      }
    });
  }

  function onStructureClick(e) {
    e.stopPropagation();
    const id = e.currentTarget.id;
    activateStructure(id, { scroll: false });
  }

  function onStructureKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activateStructure(e.currentTarget.id, { scroll: false });
    }
  }

  function onHoverEnter(e) {
    const node = e.currentTarget;
    const titleEl = node.querySelector("title");
    const name = titleEl ? titleEl.textContent.trim() : node.getAttribute("aria-label") || "";
    if (!name || !sys.tooltipEl) return;
    sys.tooltipEl.textContent = name;
    sys.tooltipEl.classList.add("show");
    positionTooltipFromEvent(e);
  }
  function onHoverMove(e) { positionTooltipFromEvent(e); }
  function onHoverLeave() {
    if (sys.tooltipEl) sys.tooltipEl.classList.remove("show");
  }
  function positionTooltipFromEvent(e) {
    if (!sys.tooltipEl) return;
    const host = document.getElementById("svg-host");
    const rect = host.getBoundingClientRect();
    sys.tooltipEl.style.left = (e.clientX - rect.left) + "px";
    sys.tooltipEl.style.top  = (e.clientY - rect.top)  + "px";
  }

  // ---------------------- Detail panel rendering --------------------
  function activateStructure(fullId, opts) {
    opts = opts || {};
    const node = document.getElementById(fullId);
    if (!node) return;

    if (sys.activeId) {
      const prev = document.getElementById(sys.activeId);
      if (prev) prev.classList.remove("is-active");
    }
    node.classList.add("is-active");
    sys.activeId = fullId;

    if (opts.scroll) node.scrollIntoView({ behavior: "smooth", block: "center" });

    const structureKey = node.dataset.structure;
    const systemKey    = node.dataset.system || sys.id;
    const detail = (sys.data[systemKey] || {})[structureKey];
    renderDetail(detail, { systemKey, structureKey, node });

    if (history.replaceState) {
      history.replaceState(null, "", "#" + fullId);
    }
  }

  function clearActive() {
    if (sys.activeId) {
      const prev = document.getElementById(sys.activeId);
      if (prev) prev.classList.remove("is-active");
      sys.activeId = null;
    }
    renderDetail(null, {});
    if (history.replaceState) {
      history.replaceState(null, "", location.pathname);
    }
  }

  function renderDetail(detail, ctx) {
    const panel = document.getElementById("detail-panel");
    if (!panel) return;

    if (!detail) {
      panel.dataset.empty = "true";
      panel.innerHTML = `
        <div class="eyebrow">Detail</div>
        <h2>Select a structure</h2>
        <p class="empty">Hover any labelled structure to preview it. Click or press Enter to lock its full detail open.</p>
      `;
      return;
    }

    panel.dataset.empty = "false";
    panel.innerHTML = `
      <button class="detail-close" type="button" aria-label="Close detail panel">×</button>
      <div class="eyebrow">${escapeHTML(systemLabel(ctx.systemKey))}</div>
      <h2>${escapeHTML(detail.name)}</h2>
      <div class="detail-section">
        <h3>Function</h3>
        <p>${escapeHTML(detail.function)}</p>
      </div>
      <div class="detail-section">
        <h3>Clinical</h3>
        <p>${escapeHTML(detail.clinical)}</p>
      </div>
      ${renderRelated(detail.related, ctx.systemKey)}
    `;
    panel.querySelector(".detail-close").addEventListener("click", clearActive);
    panel.querySelectorAll(".related-list a").forEach(a => {
      a.addEventListener("click", onRelatedClick);
    });
  }

  function renderRelated(related, currentSystem) {
    if (!related || !related.length) return "";
    const items = related.map(ref => {
      const [systemKey, structureKey] = ref.includes("/")
        ? ref.split("/")
        : [currentSystem, ref];
      const target = (sys.data[systemKey] || {})[structureKey];
      const label  = target ? target.name : structureKey.replace(/_/g, " ");
      const crossLabel = systemKey !== currentSystem
        ? `<span class="cross">→ ${escapeHTML(systemLabel(systemKey))}</span>`
        : "";
      return `<li><a href="#" data-system="${escapeAttr(systemKey)}" data-structure="${escapeAttr(structureKey)}">${escapeHTML(label)}${crossLabel}</a></li>`;
    }).join("");
    return `
      <div class="detail-section">
        <h3>Related</h3>
        <ul class="related-list">${items}</ul>
      </div>
    `;
  }

  function onRelatedClick(e) {
    e.preventDefault();
    const systemKey    = e.currentTarget.dataset.system;
    const structureKey = e.currentTarget.dataset.structure;
    if (systemKey === sys.id) {
      activateStructure(`${systemKey}_${structureKey}`, { scroll: true });
    } else {
      // Cross-system: hand off to the other page.
      location.href = `./${systemKey}.html#${systemKey}_${structureKey}`;
    }
  }

  // ---------------------- Helpers -----------------------------------
  const SYSTEM_LABELS = {
    cv: "Cardiovascular",
    resp: "Respiratory",
    nerv: "Nervous",
    msk: "Musculoskeletal",
    gi: "Digestive",
    endo: "Endocrine",
    renal: "Renal",
    repro: "Reproductive",
  };
  function systemLabel(id) { return SYSTEM_LABELS[id] || id; }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[c]));
  }
  function escapeAttr(s) { return escapeHTML(s); }

  // ---------------------- Export ------------------------------------
  window.PhysioHub = { bootHub, bootSystem };
})();
