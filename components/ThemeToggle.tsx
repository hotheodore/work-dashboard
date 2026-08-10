"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

type Theme = "system" | "light" | "dark";
const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
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
    <div className="flex gap-1 rounded-[var(--radius-sm)] border border-border p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => pick(o.value)}
          title={`${o.label} theme`}
          aria-label={`${o.label} theme`}
          aria-pressed={theme === o.value}
          className={`relative flex flex-1 items-center justify-center rounded-md py-1.5 transition-colors ${
            theme === o.value ? "text-accent" : "text-faint hover:text-text"
          }`}
        >
          {theme === o.value && (
            <motion.span
              layoutId="theme-pill"
              className="absolute inset-0 rounded-md bg-accent-soft"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <o.Icon size={14} strokeWidth={2} className="relative" aria-hidden />
        </button>
      ))}
    </div>
  );
}
