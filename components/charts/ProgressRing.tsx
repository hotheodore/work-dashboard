/** Single-value donut. Plain SVG on purpose — a chart library buys nothing for
 *  one arc, and this stays a server component with no theme subscription. */
export default function ProgressRing({
  value,
  label,
  hint,
  size = 84,
  tone = "accent",
}: {
  /** 0–100. Clamped. */
  value: number;
  label: string;
  hint?: string;
  size?: number;
  tone?: "accent" | "ok" | "warn";
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const color = tone === "ok" ? "var(--ok)" : tone === "warn" ? "var(--warn)" : "var(--accent)";

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          {/* Rotated so the arc starts at 12 o'clock rather than 3. */}
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--surface-2)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 0.5s var(--ease-out)" }}
            />
          </g>
        </svg>
        <span
          className="tabular absolute inset-0 grid place-items-center font-mono text-lg font-semibold"
          style={{ color }}
        >
          {pct}
          <span className="sr-only"> percent</span>
        </span>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-faint">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
      </div>
    </div>
  );
}
