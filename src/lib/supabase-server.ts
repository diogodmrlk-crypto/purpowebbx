import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient("https://mteefiyczqjdvbdypill.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZWVmaXljenFqZHZiZHlwaWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MjEwMzMsImV4cCI6MjEwNjM5NzAzM30.iL3ZNll1hCybwfgHFKk5Y84uXrr5oNor91udb1wPSVU", {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* read-only server component */ }
      },
    },
  });
}
