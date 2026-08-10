"use client";

import { useActionState } from "react";
import { login } from "@/app/login/actions";
import { Button, Card, Field, inputClass } from "@/components/ui";

export default function LoginForm({ next }: { next: string }) {
  const [error, action, pending] = useActionState(login, null);

  return (
    <div className="mx-auto mt-[15vh] w-full max-w-sm">
      <Card title="Work Dashboard">
        <form action={action} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <Field label="Password">
            <input
              className={inputClass}
              type="password"
              name="password"
              autoFocus
              autoComplete="current-password"
            />
          </Field>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            {pending ? "Checking…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
