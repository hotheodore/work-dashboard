"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate } from "motion/react";

const TONES = {
  default: "text-text",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
} as const;

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

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: keyof typeof TONES;
}) {
  const numeric = splitNumeric(value);
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-faint">{label}</p>
      <p className={`tabular mt-2.5 text-3xl font-semibold ${TONES[tone]}`}>
        {numeric ? <CountUp n={numeric.n} suffix={numeric.suffix} /> : value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
