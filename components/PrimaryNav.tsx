"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Systems" },
  { href: "/docs", label: "Docs" }
];

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <div className="ph-nav-shell" aria-label="Workspace tabs">
      {items.map((item) => {
        const isActive = item.href === "/docs" ? pathname.startsWith("/docs") : !pathname.startsWith("/docs");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`focus-ring ph-nav-tab ${item.href === "/docs" ? "hidden sm:inline-flex" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
