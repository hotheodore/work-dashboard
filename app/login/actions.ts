"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, authRequired, tokenFor } from "@/lib/auth";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  if (!authRequired()) redirect("/");

  const password = String(formData.get("password") ?? "");
  const token = await tokenFor(password);
  if (!token) return "Wrong password.";

  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });

  const next = String(formData.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}
