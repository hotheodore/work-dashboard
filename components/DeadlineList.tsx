import { Badge } from "@/components/ui";
import type { Deadline } from "@/lib/derive";
import { urgencyTone } from "@/lib/derive";

export default function DeadlineList({ items }: { items: Deadline[] }) {
  if (!items.length)
    return <p className="py-6 text-center text-sm text-muted">Nothing due. Enjoy it.</p>;

  return (
    <ul className="divide-y divide-border">
      {items.map((d) => (
        <li key={`${d.kind}-${d.id}`} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm">{d.label}</p>
            <p className="text-xs text-faint">
              {d.sub} · {d.date}
            </p>
          </div>
          <Badge tone={urgencyTone(d.daysOut)}>
            {d.daysOut === 0 ? "today" : d.daysOut === 1 ? "tomorrow" : `${d.daysOut}d`}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
