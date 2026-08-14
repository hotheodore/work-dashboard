export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-ring disabled:opacity-50 disabled:pointer-events-none active:translate-y-px";
  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };
  const variants = {
    // Gradient + inset highlight so the primary action reads as a raised key.
    primary:
      "bg-accent bg-[linear-gradient(180deg,color-mix(in_oklab,#fff_14%,var(--accent)),var(--accent))] text-accent-text shadow-[var(--shadow-sm),inset_0_1px_0_rgb(255_255_255/0.18)] hover:brightness-108",
    secondary:
      "border border-border bg-surface text-text shadow-[var(--shadow-sm)] hover:bg-surface-2",
    ghost: "text-muted hover:bg-surface-2 hover:text-text",
    danger: "border border-border text-danger hover:bg-danger/10",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
  );
}
