"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  archetypeMeta,
  getAllDiagrams,
  getSystemEmoji,
  getSystemPath,
  getSystems
} from "@/lib/registry";

type Entry = {
  id: string;
  title: string;
  path: string;
  systemId: string;
  systemName: string;
  systemShort: string;
  archetype: string;
  emoji: string;
  archetypeLabel: string;
  haystack: string;
};

// Curated drug / alias terms so a search for a specific agent lands on the model
// it acts on, even when the concept text only names the drug class.
const EXTRA_KEYWORDS: Record<string, string> = {
  "renal/diuretic-sites":
    "furosemide bumetanide torsemide loop diuretic thiazide hydrochlorothiazide hctz chlorthalidone spironolactone eplerenone potassium-sparing amiloride triamterene acetazolamide carbonic anhydrase mannitol osmotic tolvaptan vaptan",
  "renal/glucose-titration": "sglt2 sglt2 inhibitor empagliflozin dapagliflozin canagliflozin gliflozin glucosuria glycosuria",
  "renal/raas": "ace inhibitor lisinopril ramipril arb losartan valsartan aldosterone renin angiotensin aliskiren",
  "nerv/autonomic-nervous-system": "atropine muscarinic nicotinic propranolol beta blocker adrenergic cholinergic pilocarpine phenylephrine sympathetic parasympathetic",
  "endo/insulin-glucagon": "insulin metformin sulfonylurea glp-1 diabetes dka",
  "endo/hormone-dose-response": "agonist antagonist partial agonist competitive noncompetitive potency efficacy ec50 hill",
  "endo/hpt-axis": "levothyroxine methimazole ppu ptu hypothyroid hyperthyroid graves hashimoto tsh",
  "endo/hpa-axis": "dexamethasone prednisone cortisol cushing addison acth suppression test",
  "endo/calcium-homeostasis": "pth vitamin d calcitriol bisphosphonate calcitonin hyperparathyroid",
  "repro/gnrh-pulsatility": "leuprolide gnrh agonist goserelin buserelin degarelix downregulation",
  "repro/contraception-methods": "ocp oral contraceptive iud levonorgestrel implant depot condom sterilization emergency",
  "cv/cardiac-action-potentials": "class i class ii class iii class iv antiarrhythmic sodium channel blocker amiodarone",
  "cv/coronary-perfusion": "nitrate nitroglycerin angina ischemia rate pressure product",
  "resp/hypoxic-pulmonary-vasoconstriction": "altitude cor pulmonale pulmonary hypertension nitric oxide calcium channel blocker sildenafil",
  "gi/gastric-acid": "ppi omeprazole h2 blocker ranitidine famotidine gastrin histamine somatostatin"
};

// Flat, static index built once from the registry.
const ENTRIES: Entry[] = getAllDiagrams().map((d) => ({
  id: d.id,
  title: d.title,
  path: `/${d.systemId}/${d.slug}`,
  systemId: d.systemId,
  systemName: d.systemName,
  systemShort: d.systemShortName,
  archetype: d.archetype,
  emoji: getSystemEmoji(d.systemId),
  archetypeLabel: archetypeMeta[d.archetype].shortLabel,
  haystack: `${d.title} ${d.systemName} ${d.systemShortName} ${d.teaser} ${d.concept} ${EXTRA_KEYWORDS[d.id] ?? ""}`.toLowerCase()
}));

const SYSTEMS = getSystems().map((s) => ({
  id: s.id,
  name: s.name,
  short: s.shortName,
  path: getSystemPath(s.id),
  emoji: getSystemEmoji(s.id),
  count: s.diagrams.length
}));

function tokenScore(token: string, entry: Entry): number {
  const t = entry.title.toLowerCase();
  const sys = `${entry.systemName} ${entry.systemShort}`.toLowerCase();
  if (t.startsWith(token)) return 120;
  if (new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(t)) return 90;
  if (t.includes(token)) return 65;
  if (sys.includes(token)) return 45;
  if (entry.archetypeLabel.toLowerCase().includes(token)) return 30;
  if (entry.haystack.includes(token)) return 22;
  return 0;
}

function scoreEntry(query: string, entry: Entry): number {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return 0;
  let total = 0;
  for (const tk of tokens) {
    const s = tokenScore(tk, entry);
    if (s === 0) return 0; // every token must match somewhere (AND search)
    total += s;
  }
  return total;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return ENTRIES.map((e) => ({ e, s: scoreEntry(query, e) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.e.title.localeCompare(b.e.title))
      .slice(0, 40)
      .map((r) => r.e);
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (path: string) => {
      close();
      router.push(path);
    },
    [close, router]
  );

  // Global ⌘K / Ctrl+K to open, and a custom event so the header button can open it too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("ph:open-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ph:open-command", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setActive(0);
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const onListKey = (e: React.KeyboardEvent) => {
    const items = query.trim() ? results.length : SYSTEMS.length;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim() && results[active]) go(results[active].path);
      else if (!query.trim() && SYSTEMS[active]) go(SYSTEMS[active].path);
    }
  };

  // Keep the active row scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search diagrams"
        className="focus-ring ph-clay-button inline-flex items-center gap-2 rounded-ph px-2.5 py-2 text-sm text-ph-muted sm:px-3"
      >
        <span aria-hidden="true" className="text-base leading-none">⌕</span>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-[var(--ph-border-strong)] px-1.5 py-0.5 text-[10px] font-bold text-ph-muted-2 md:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Search diagrams"
          onKeyDown={onListKey}
        >
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 cursor-default bg-[color-mix(in_srgb,var(--ph-bg),transparent_25%)] backdrop-blur-sm"
            onClick={close}
          />
          <div className="ph-panel relative z-10 flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden p-0">
            <div className="flex items-center gap-3 border-b border-[var(--ph-border)] px-4 py-3">
              <span aria-hidden="true" className="text-lg text-ph-muted">⌕</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 103 diagrams — try “shock”, “SGLT2”, “acid-base”, “furosemide”…"
                className="w-full bg-transparent text-base text-ph-text outline-none placeholder:text-ph-muted-2"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="rounded border border-[var(--ph-border-strong)] px-1.5 py-0.5 text-[10px] font-bold text-ph-muted-2">
                Esc
              </kbd>
            </div>

            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-2">
              {query.trim() ? (
                results.length ? (
                  results.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      data-idx={i}
                      onClick={() => go(r.path)}
                      onMouseMove={() => setActive(i)}
                      className={`flex w-full items-center gap-3 rounded-ph px-3 py-2.5 text-left transition ${
                        i === active ? "bg-[color-mix(in_srgb,var(--ph-accent),transparent_86%)]" : ""
                      }`}
                    >
                      <span aria-hidden="true" className="text-lg leading-none">{r.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ph-text">{r.title}</span>
                        <span className="block truncate text-xs text-ph-muted">{r.systemName}</span>
                      </span>
                      <span className="shrink-0 rounded-full border border-[var(--ph-border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ph-muted-2">
                        {r.archetypeLabel}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-ph-muted">
                    No diagram matches “{query}”.
                  </p>
                )
              ) : (
                <>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ph-muted-2">
                    Jump to a system
                  </p>
                  {SYSTEMS.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      data-idx={i}
                      onClick={() => go(s.path)}
                      onMouseMove={() => setActive(i)}
                      className={`flex w-full items-center gap-3 rounded-ph px-3 py-2.5 text-left transition ${
                        i === active ? "bg-[color-mix(in_srgb,var(--ph-accent),transparent_86%)]" : ""
                      }`}
                    >
                      <span aria-hidden="true" className="text-lg leading-none">{s.emoji}</span>
                      <span className="flex-1 text-sm font-bold text-ph-text">{s.name}</span>
                      <span className="text-xs text-ph-muted tabular-nums">{s.count} diagrams</span>
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-[var(--ph-border)] px-4 py-2 text-[11px] text-ph-muted-2">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
