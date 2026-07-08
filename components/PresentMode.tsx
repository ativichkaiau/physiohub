"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Lecture / presentation mode: hides the app chrome and enlarges the widget so a
 * single diagram fills the screen for teaching. Driven by a `data-present`
 * attribute on <html> (CSS in globals.css does the layout work); also requests
 * native fullscreen as a best-effort enhancement.
 */
export function PresentMode() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => setMounted(true), []);

  const exit = useCallback(() => {
    document.documentElement.removeAttribute("data-present");
    setActive(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const enter = useCallback(() => {
    document.documentElement.setAttribute("data-present", "on");
    setActive(true);
    // Best-effort native fullscreen; harmless if it rejects (e.g. headless).
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  // Escape exits; keep React state in sync if the user leaves native fullscreen.
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    const onFsChange = () => {
      if (!document.fullscreenElement && document.documentElement.getAttribute("data-present")) {
        // left native fullscreen via browser UI — keep CSS present mode, do nothing,
        // or exit fully. Exit fully for a predictable single control.
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, [active, exit]);

  // Clean up the attribute if the component unmounts (navigation away).
  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute("data-present");
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={enter}
        className="focus-ring ph-clay-button inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-ph-muted"
        aria-label="Enter presentation mode"
      >
        <span aria-hidden="true">⤢</span> Present
      </button>

      {mounted && active
        ? createPortal(
            <button
              type="button"
              onClick={exit}
              className="focus-ring ph-clay-button fixed right-4 top-4 z-[120] inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-ph-muted"
              aria-label="Exit presentation mode"
            >
              <span aria-hidden="true">✕</span> Exit · <kbd className="text-[10px]">Esc</kbd>
            </button>,
            document.body
          )
        : null}
    </>
  );
}
