import { notFound } from "next/navigation";
import { StorePageContent } from "@/app/store/store-page-content";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function CustomDomainStore({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: store } = await supabase.from("published_stores").select("slug").eq("custom_domain", host).single();
  if (!store) notFound();
  return <StorePageContent slug={store.slug} />;
}
