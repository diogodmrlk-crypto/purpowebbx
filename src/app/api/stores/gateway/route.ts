import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { encryptSecret } from "@/lib/secrets";

const schema = z.object({ storeId: z.string().uuid(), clientId: z.string().min(3), clientSecret: z.string().min(3), customDomain: z.string().trim().optional() });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Faça login para configurar sua loja" }, { status: 401 });
    const { data: store } = await supabase.from("stores").select("id").eq("id", input.storeId).eq("owner_id", user.id).single();
    if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    const { error } = await supabase.from("stores").update({ mistic_client_id: input.clientId, mistic_client_secret_encrypted: encryptSecret(input.clientSecret), custom_domain: input.customDomain || null, gateway_enabled: true }).eq("id", store.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, message: "MisticPay conectada. A chave secreta foi armazenada criptografada." });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Dados inválidos" }, { status: 400 }); }
}
