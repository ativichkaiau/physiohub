import type { Metadata } from "next";
import Link from "next/link";
import { PrimaryNav } from "@/components/PrimaryNav";
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
          <header className="ph-app-header">
            <div className="ph-app-header-inner mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
              <Link href="/" className="focus-ring flex min-w-0 items-center gap-2.5 rounded-ph no-underline">
                <span className="ph-brand-mark grid h-10 w-10 shrink-0 place-items-center rounded-[13px] text-sm font-black">PH</span>
                <span className="text-lg font-black tracking-tight sm:text-xl">PhysioHub</span>
              </Link>
              <nav className="flex items-center gap-2 text-sm font-medium text-ph-muted" aria-label="Primary">
                <PrimaryNav />
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <footer className="ph-app-footer px-4 py-6 text-sm text-ph-muted sm:px-6">
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
