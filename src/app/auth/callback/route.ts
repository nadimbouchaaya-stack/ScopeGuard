import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignored in server context
            }
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      // Ensure user_profiles has the user's email
      const user = sessionData.user;
      await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          email: user.email ?? "",
          full_name: user.user_metadata?.full_name ?? "",
        },
        { onConflict: "user_id", ignoreDuplicates: false }
      );

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // If no code or exchange failed, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
