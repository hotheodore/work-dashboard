/** The app mark: a bench with three uprights standing on it — the workbench.
 *  Same geometry as app/icon.svg — edit both together or the tab and the rail
 *  drift apart. Dark plate in both themes: it is the home-screen icon first,
 *  and a home screen full of dark icons is where it has to sit.
 *
 *  The colors are fixed hexes, not --accent: the touch icon rasterizes to PNG,
 *  so a theme-reactive mark would disagree with the icon on the home screen.
 *
 *  The gradient ids are constants, not a counter: a module-level counter
 *  increments at different points on the server and the client and produced a
 *  hydration mismatch. Duplicate ids are harmless here — every Logo wants the
 *  same gradients anyway.
 */
const PLATE_ID = "logo-plate";
const MARK_ID = "logo-mark";

export default function Logo({ size = 32 }: { size?: number }) {
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
        <linearGradient id={PLATE_ID} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2b2926" />
          <stop offset="1" stopColor="#171614" />
        </linearGradient>
        <linearGradient id={MARK_ID} x1="5" y1="8" x2="27" y2="27" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#a8d8f5" />
          <stop offset="1" stopColor="#4f8fd0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7.5" fill={`url(#${PLATE_ID})`} />
      <g fill={`url(#${MARK_ID})`}>
        <rect x="8.4" y="12.4" width="2.9" height="6.6" rx="1.45" opacity="0.62" />
        <rect x="14.55" y="8.6" width="2.9" height="10.4" rx="1.45" />
        <rect x="20.7" y="10.9" width="2.9" height="8.1" rx="1.45" opacity="0.8" />
        <rect x="5" y="19" width="22" height="2.8" rx="1.4" />
        <rect x="7.4" y="21.8" width="2.9" height="4.8" rx="1.45" opacity="0.62" />
        <rect x="21.7" y="21.8" width="2.9" height="4.8" rx="1.45" opacity="0.62" />
      </g>
    </svg>
  );
}
