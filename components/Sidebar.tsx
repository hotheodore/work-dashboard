"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Menu,
  NotebookPen,
  PencilLine,
  Settings,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";

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
  const [open, setOpen] = useState(false);

  // Navigating closes the drawer. Keyed on pathname rather than an onClick per
  // link so a back/forward gesture closes it too, and adjusted during render
  // rather than in an effect — an effect would paint the new page with the
  // drawer still over it for a frame.
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }

  // While the drawer is over the page, the page behind it must not scroll —
  // on iOS a scrolling backdrop is what makes an overlay feel broken.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Login is the one page reachable without a session — no nav to offer there.
  if (pathname === "/login") return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // The drawer and the desktop rail are both mounted while the drawer is open,
  // so the active-link highlight is keyed per instance — one layoutId shared
  // across two live navs makes the pill fly between them.
  const navFor = (scope: string) => (
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
                layoutId={`nav-active-${scope}`}
                className="absolute inset-0 rounded-[var(--radius-sm)] bg-accent-soft before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-[linear-gradient(180deg,var(--accent-2),var(--accent-3))]"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            <l.Icon size={16} strokeWidth={2} className="relative shrink-0" aria-hidden />
            <span className="relative">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile: a bar, not a rail. The 16px of icon rail this replaces was the
          most expensive column on a phone. Padded for the iOS notch so the
          standalone home-screen window doesn't tuck the logo under it. */}
      <header className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-border bg-bg px-4 pt-[env(safe-area-inset-top)] lg:hidden">
        <div className="flex h-14 flex-1 items-center gap-2.5">
          <Logo size={28} />
          <span className="text-sm font-semibold tracking-tight">Workbench</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-expanded={open}
          className="-mr-2 rounded-[var(--radius-sm)] p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <Menu size={20} strokeWidth={2} aria-hidden />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-1 border-r border-border bg-bg px-3 py-4 pt-[max(1rem,env(safe-area-inset-top))] lg:hidden"
            >
              <div className="mb-5 flex items-center gap-2.5 px-2">
                <Logo size={32} />
                <span className="flex-1 text-sm font-semibold tracking-tight">Workbench</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="-mr-2 rounded-[var(--radius-sm)] p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
                >
                  <X size={18} strokeWidth={2} aria-hidden />
                </button>
              </div>
              {navFor("drawer")}
              <ThemeToggle scope="-drawer" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: --bg, not --surface, so the rail recedes and the cards read
          as floating above it. */}
      <aside className="sticky top-0 z-20 hidden h-screen w-56 shrink-0 flex-col gap-1 border-r border-border bg-bg px-3 py-4 lg:flex">
        <div className="mb-5 flex items-center gap-2.5 px-2">
          <Logo size={32} />
          <span className="text-sm font-semibold tracking-tight">Workbench</span>
        </div>
        {navFor("rail")}
        <ThemeToggle scope="-rail" />
      </aside>
    </>
  );
}
