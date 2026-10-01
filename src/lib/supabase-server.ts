import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient("https://mteefiyczqjdvbdypill.supabase.co", "sb_publishable_teuTwvOVxRMpwpqX1nkQw_mxuhpo4C", {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* read-only server component */ }
      },
    },
  });
}
