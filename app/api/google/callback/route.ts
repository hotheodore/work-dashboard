import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { exchangeCode } from "@/lib/google";

/** Where Google sends the browser back. Must match GOOGLE_REDIRECT_URI exactly. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const back = (query: string) => NextResponse.redirect(new URL(`/settings?${query}`, request.url));

  const denied = params.get("error");
  if (denied) return back(`google=error&reason=${encodeURIComponent(denied)}`);

  const code = params.get("code");
  if (!code) return back("google=error&reason=no+code+returned");

  try {
    await exchangeCode(code);
  } catch (e) {
    const reason = e instanceof Error ? e.message : "token exchange failed";
    return back(`google=error&reason=${encodeURIComponent(reason)}`);
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return back("google=connected");
}
