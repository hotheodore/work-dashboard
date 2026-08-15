"use client";

import { useId } from "react";

/** The app mark: a bench with three uprights standing on it — the workbench.
 *  Same geometry as app/icon.svg — edit both together or the tab and the rail
 *  drift apart. Dark plate in both themes: it is the home-screen icon first,
 *  and a home screen full of dark icons is where it has to sit.
 *
 *  The colors are fixed hexes, not --accent: the touch icon rasterizes to PNG,
 *  so a theme-reactive mark would disagree with the icon on the home screen.
 *
 *  The gradient ids come from useId, not constants and not a module-level
 *  counter. The counter increments at different points on the server and the
 *  client and produced a hydration mismatch; the constants were fine only
 *  while one Logo was ever mounted. Several are now — the mobile top bar, the
 *  drawer, the desktop rail — and a duplicate id resolves to whichever comes
 *  first in the document, which is the copy inside the lg:hidden bar. A paint
 *  server in a display:none subtree does not resolve, so the visible logo lost
 *  its fill entirely.
 */
export default function Logo({ size = 32 }: { size?: number }) {
  const uid = useId();
  const PLATE_ID = `logo-plate-${uid}`;
  const MARK_ID = `logo-mark-${uid}`;

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
      {/* The mark's bounding box runs y 8.6–26.6, so its center sits at 17.6 in
          a 32 box — 1.6 low. The translate pulls it back onto the true center
          rather than rewriting every rect's y. */}
      <g fill={`url(#${MARK_ID})`} transform="translate(0 -1.6)">
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
