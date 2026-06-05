import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PhysioHub TR-VII",
    template: "%s | PhysioHub TR-VII"
  },
  description: "A Williams Rothmans themed physiology diagram hub for medical students."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="min-h-screen text-ph-text">
          <header className="sticky top-0 z-40 border-b border-[var(--ph-border)] bg-[color-mix(in_srgb,var(--ph-bg),transparent_12%)] backdrop-blur-xl">
            <div className="mx-auto flex min-h-[72px] w-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
              <Link href="/" className="focus-ring flex min-w-0 items-center gap-3 rounded-ph no-underline">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-ph bg-[color-mix(in_srgb,var(--ph-text),transparent_4%)] text-sm font-black text-ph-bg shadow-sm">
                  PH
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-base font-black tracking-tight">PhysioHub</span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-ph-muted">TR-VII</span>
                </span>
              </Link>
              <nav className="flex items-center gap-2 text-sm font-semibold text-ph-muted" aria-label="Primary">
                <Link className="focus-ring rounded-ph px-3 py-2 hover:bg-ph-surface2 hover:text-ph-text" href="/">
                  Systems
                </Link>
                <Link className="focus-ring hidden rounded-ph px-3 py-2 hover:bg-ph-surface2 hover:text-ph-text sm:inline-flex" href="/docs">
                  Wireframes
                </Link>
                <span className="hidden rounded-ph border border-[var(--ph-border)] bg-ph-surface px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-ph-muted md:inline-flex">
                  Williams
                </span>
                <span className="rounded-ph border border-[var(--ph-border)] bg-ph-surface2 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-ph-accent">
                  Livery Day
                </span>
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <footer className="border-t border-[var(--ph-border)] px-4 py-6 text-sm text-ph-muted sm:px-6">
            <div className="mx-auto flex max-w-[1500px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-ph-text">PhysioHub TR-VII</span>
              <span>URL-synced diagrams, no backend required</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
