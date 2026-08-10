"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/assignments", label: "Assignments", icon: "✎" },
  { href: "/internships", label: "Internships", icon: "◎" },
  { href: "/resume", label: "Resume", icon: "❑" },
  { href: "/calendar", label: "Calendar", icon: "▤" },
  { href: "/notes", label: "Notes", icon: "✐" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col gap-1 border-r border-border bg-surface px-2 py-4 transition-all lg:w-56 lg:px-3">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-text">
          W
        </span>
        <span className="hidden text-sm font-semibold tracking-tight lg:block">
          Work Dashboard
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            title={l.label}
            className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
              isActive(l.href)
                ? "bg-accent-soft font-medium text-accent"
                : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            <span className="w-4 text-center">{l.icon}</span>
            <span className="hidden lg:block">{l.label}</span>
          </Link>
        ))}
      </nav>

      <ThemeToggle />
    </aside>
  );
}
