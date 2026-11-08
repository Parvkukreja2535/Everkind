import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// POST only, so a link or image on another site can't log people out.
export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
