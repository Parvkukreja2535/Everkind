import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNext } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

// Landing point for links in Supabase emails (confirm sign-up, reset password).
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"), "/account");
  const supabase = await supabaseServer();
  const fail = NextResponse.redirect(new URL("/login?next=" + encodeURIComponent(next), url));
  if (!supabase) return fail;

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing code") };
  return error ? fail : NextResponse.redirect(new URL(next, url));
}
