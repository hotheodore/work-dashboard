"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  CalendarDays,
  FileText,
  LayoutDashboard,
  NotebookPen,
  PencilLine,
  Settings,
} from "lucide-react";
import { motion } from "motion/react";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/assignments", label: "Assignments", Icon: PencilLine },
  { href: "/internships", label: "Internships", Icon: Briefcase },
  { href: "/resume", label: "Resume", Icon: FileText },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays },
  { href: "/notes", label: "Notes", Icon: NotebookPen },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  // Login is the one page reachable without a session — no nav to offer there.
  if (pathname === "/login") return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col gap-1 border-r border-border bg-surface px-2 py-4 transition-all lg:w-56 lg:px-3">
      <div className="mb-5 flex items-center gap-2.5 px-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-accent text-sm font-bold text-accent-text shadow-sm">
          W
        </span>
        <span className="hidden text-sm font-semibold tracking-tight lg:block">
          Work Dashboard
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {LINKS.map((l) => {
          const active = isActive(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              title={l.label}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition-colors ${
                active ? "font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-[var(--radius-sm)] bg-accent-soft"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <l.Icon size={16} strokeWidth={2} className="relative shrink-0" aria-hidden />
              <span className="relative hidden lg:block">{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <ThemeToggle />
    </aside>
  );
}
