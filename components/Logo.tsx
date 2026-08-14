/** The app mark: a check whose tail keeps rising. Same geometry as
 *  app/icon.svg — edit both together or the tab and the rail drift apart.
 *  Colors come from the accent token so it re-tints with the theme, unlike
 *  the favicon, which has to carry its own gradient. */
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[10px] bg-accent bg-[linear-gradient(145deg,color-mix(in_oklab,#fff_22%,var(--accent)),var(--accent))] shadow-[var(--shadow-sm),inset_0_1px_0_rgb(255_255_255/0.25)]"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 32 32"
        width={size * 0.66}
        height={size * 0.66}
        aria-hidden
        role="presentation"
      >
        <path
          d="M8.5 16.8 13.2 21.5 23.5 9.8"
          fill="none"
          stroke="var(--accent-text)"
          strokeWidth={3.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
