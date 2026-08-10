export function Button({
  variant = "secondary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-ring disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-accent text-accent-text hover:brightness-110",
    secondary: "border border-border bg-surface text-text hover:bg-surface-2",
    ghost: "text-muted hover:bg-surface-2 hover:text-text",
    danger: "border border-border text-danger hover:bg-danger/10",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
