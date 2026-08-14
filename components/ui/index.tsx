import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { classVar } from "@/lib/classColors";

// Modal and StatTile need hooks; keeping them in their own client modules means
// Card/Badge/EmptyState/Field stay server components.
export { Modal } from "./Modal";
export { StatTile, StatChip, ICON_TILE_TONES } from "./StatTile";
export { Button } from "./Button";

export function Card({
  title,
  action,
  className = "",
  bodyClass = "p-5",
  interactive = false,
  spine,
  accented = false,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClass?: string;
  /** Adds hover lift. Only for cards that are themselves a link or button. */
  interactive?: boolean;
  /** A class id. Paints that class's identity color down the left edge. */
  spine?: string;
  /** Gradient rule on the top edge. One per screen — it means "start here". */
  accented?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`card ${interactive ? "card-interactive" : ""} ${spine ? "card-spine" : ""} ${
        accented ? "card-accented" : ""
      } ${className}`}
      style={spine ? classVar(spine) : undefined}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <h2 className="text-sm font-semibold tracking-tight text-text">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/** The 4-up stat row was copy-pasted on four pages. This is that row. */
export function StatGrid({
  cols = 4,
  className = "",
  children,
}: {
  cols?: 3 | 4;
  className?: string;
  children: ReactNode;
}) {
  const colClass = cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  return <div className={`grid gap-4 ${colClass} ${className}`}>{children}</div>;
}

const BADGE_TONES: Record<string, string> = {
  default: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent",
  ok: "bg-ok/12 text-ok",
  warn: "bg-warn/12 text-warn",
  danger: "bg-danger/12 text-danger",
  // Reads whatever --class-color is in scope (set by Card spine or classVar).
  class: "bg-class/12 text-class",
};

export function Badge({
  children,
  tone = "default",
  dot = false,
}: {
  children: ReactNode;
  tone?: keyof typeof BADGE_TONES;
  /** Leading dot in the tone's color — for legends and class labels. */
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone] ?? BADGE_TONES.default}`}
    >
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
  icon: Icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-border px-6 py-10 text-center">
      {Icon && (
        <span className="mb-1 grid h-10 w-10 place-items-center rounded-[12px] bg-accent-soft text-accent">
          <Icon size={18} strokeWidth={2} aria-hidden />
        </span>
      )}
      <p className="text-sm font-medium text-text">{title}</p>
      {hint && <p className="max-w-sm text-xs text-muted">{hint}</p>}
      {action}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-sm text-text shadow-[var(--shadow-sm)] outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring";
