/** The app mark: a check whose tail keeps rising. Same geometry as
 *  app/icon.svg — edit both together or the tab and the rail drift apart.
 *  No background plate — flat, transparent, Gmail/Tasks-style. The stroke
 *  carries its own gradient (accent-derived) since there's no solid fill
 *  left to tint. */
let gradId = 0;

export default function Logo({ size = 32 }: { size?: number }) {
  const id = `logo-g-${gradId++}`;
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden
      role="presentation"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={id} x1="6" y1="8" x2="26" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="color-mix(in oklab, #fff 30%, var(--accent))" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <path
        d="M6.5 17.5 12.5 24 25.5 8"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={4.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
