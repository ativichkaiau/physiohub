import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PhysioHub",
    template: "%s · PhysioHub"
  },
  description: "Interactive physiology diagrams for medical students — scrubbable timelines, perturbable curves, feedback loops, click-to-mechanism walks, and multi-variable interactions."
};

// Runs synchronously before React hydrates, to set the theme from
// localStorage and avoid a flash of light → dark on first paint.
const themeBootstrap = `(function(){
  try {
    var saved = localStorage.getItem('physiohub-theme');
    var theme = saved === 'dark' ? 'dark' : (saved === 'light' ? 'light' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="font-sans">
        <div className="min-h-screen text-ph-text">
          <header className="sticky top-0 z-40 border-b border-[var(--ph-border)] bg-[color-mix(in_srgb,var(--ph-bg),transparent_6%)] backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
              <Link href="/" className="focus-ring flex min-w-0 items-center gap-2.5 rounded-ph no-underline">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ph-accent text-sm font-bold text-white">PH</span>
                <span className="text-base font-bold tracking-tight">PhysioHub</span>
              </Link>
              <nav className="flex items-center gap-1.5 text-sm font-medium text-ph-muted" aria-label="Primary">
                <Link className="focus-ring rounded-ph px-3 py-2 hover:bg-ph-surface2 hover:text-ph-text" href="/">
                  Systems
                </Link>
                <Link className="focus-ring hidden rounded-ph px-3 py-2 hover:bg-ph-surface2 hover:text-ph-text sm:inline-flex" href="/docs">
                  Docs
                </Link>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <footer className="border-t border-[var(--ph-border)] px-4 py-6 text-sm text-ph-muted sm:px-6">
            <div className="mx-auto flex max-w-[1500px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-bold text-ph-text">PhysioHub</span>
              <span>Interactive physiology · URL-synced state · No backend</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
