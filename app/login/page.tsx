import LoginForm from "@/components/LoginForm";
import { authRequired } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // No password configured (local dev) means no gate to pass.
  if (!authRequired()) redirect("/");

  const next = (await searchParams).next;
  return <LoginForm next={typeof next === "string" ? next : "/"} />;
}
