import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabaseClient() {
  return createBrowserClient("https://mteefiyczqjdvbdypill.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZWVmaXljenFqZHZiZHlwaWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MjEwMzMsImV4cCI6MjEwNjM5NzAzM30.iL3ZNll1hCybwfgHFKk5Y84uXrr5oNor91udb1wPSVU");
}
