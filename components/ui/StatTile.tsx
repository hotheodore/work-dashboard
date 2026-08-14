"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate } from "motion/react";

const TONES = {
  default: "text-text",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
} as const;

/** Tinted square behind the icon. The tone carries the meaning; the tile just
 *  gives the number something to sit next to.
 *  `icon` is a ReactNode, not a component: a Lucide component reference cannot
 *  cross the server/client boundary, and every caller here is a server page. */
export const ICON_TILE_TONES = {
  default: "bg-accent-soft text-accent",
  ok: "bg-ok/12 text-ok",
  warn: "bg-warn/12 text-warn",
  danger: "bg-danger/12 text-danger",
} as const;

type Tone = keyof typeof TONES;

/** Splits "87%" into 87 and "%" so the number can count up and keep its unit. */
function splitNumeric(value: ReactNode): { n: number; suffix: string } | null {
  if (typeof value === "number") return Number.isFinite(value) ? { n: value, suffix: "" } : null;
  if (typeof value !== "string") return null;
  const m = /^(-?\d+(?:\.\d+)?)(.*)$/.exec(value.trim());
  return m ? { n: Number(m[1]), suffix: m[2] } : null;
}

function CountUp({ n, suffix }: { n: number; suffix: string }) {
  const decimals = String(n).split(".")[1]?.length ?? 0;
  const [shown, setShown] = useState(n);
  const prev = useRef(n);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(n);
      prev.current = n;
      return;
    }
    const controls = animate(prev.current, n, {
      duration: 0.5,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: (v) => setShown(v),
    });
    prev.current = n;
    return () => controls.stop();
  }, [n]);

  return (
    <>
      {shown.toFixed(decimals)}
      {suffix}
    </>
  );
}

function Value({ value }: { value: ReactNode }) {
  const numeric = splitNumeric(value);
  return numeric ? <CountUp n={numeric.n} suffix={numeric.suffix} /> : <>{value}</>;
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-faint">{label}</p>
        {icon && (
          <span
            aria-hidden
            className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] [&_svg]:size-[17px] ${ICON_TILE_TONES[tone]}`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className={`tabular mt-2.5 font-mono text-[2rem] leading-none font-semibold ${TONES[tone]}`}>
        <Value value={value} />
      </p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Header-row variant: same information, one line, no card. Used where the page
 *  needs the numbers present but not competing with the content below. */
export function StatChip({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {icon && (
        <span
          aria-hidden
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] [&_svg]:size-[15px] ${ICON_TILE_TONES[tone]}`}
        >
          {icon}
        </span>
      )}
      <div className="leading-tight">
        <p className={`tabular font-mono text-lg font-semibold ${TONES[tone]}`}>
          <Value value={value} />
        </p>
        <p className="text-[11px] text-faint">{label}</p>
      </div>
    </div>
  );
}
