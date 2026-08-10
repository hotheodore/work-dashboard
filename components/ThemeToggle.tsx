"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";
const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "☀" },
  { value: "dark", label: "☾" },
  { value: "system", label: "◐" },
];

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme((localStorage.getItem("theme") as Theme) || "system");
  }, []);

  function pick(next: Theme) {
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  return (
    <div className="flex gap-1 rounded-lg border border-border p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => pick(o.value)}
          aria-label={`${o.value} theme`}
          aria-pressed={theme === o.value}
          className={`flex-1 rounded-md py-1 text-sm transition-colors ${
            theme === o.value ? "bg-accent-soft text-accent" : "text-faint hover:text-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
