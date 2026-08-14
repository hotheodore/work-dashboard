import { NextResponse } from "next/server";
import { authUrl, configured } from "@/lib/google";

/** Kicks off the OAuth consent flow. Linked from Settings. */
export async function GET(request: Request) {
  const cfg = configured();
  if (!cfg.ok)
    return NextResponse.redirect(
      new URL(`/settings?google=error&reason=${encodeURIComponent(cfg.reason ?? "")}`, request.url),
    );
  return NextResponse.redirect(authUrl());
}
