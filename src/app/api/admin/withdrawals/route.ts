import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createPixWithdrawal } from "@/lib/misticpay";
import { decryptSecret } from "@/lib/secrets";

const schema = z.object({ amountCents: z.number().int().positive(), pixKey: z.string().min(3), pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "TELEFONE", "CHAVE_ALEATORIA"]) });
export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const sessionClient = await createServerSupabaseClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Faça login para sacar" }, { status: 401 });
    const admin = createAdminSupabaseClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Apenas administradores podem sacar as comissões" }, { status: 403 });
    const { data: store } = await admin.from("stores").select("mistic_client_id,mistic_client_secret_encrypted,gateway_enabled").eq("owner_id", user.id).eq("gateway_enabled", true).limit(1).maybeSingle();
    if (!store?.mistic_client_id || !store.mistic_client_secret_encrypted) return NextResponse.json({ error: "Conecte a MisticPay da conta administrativa antes do saque" }, { status: 409 });
    const { data: paidOrders } = await admin.from("orders").select("platform_fee_cents").in("status", ["paid", "delivered"]).limit(10000);
    const { data: existing } = await admin.from("withdrawals").select("amount_cents").eq("seller_id", user.id).in("status", ["pending", "processing", "paid"]).limit(10000);
    const available = (paidOrders ?? []).reduce((sum, order) => sum + order.platform_fee_cents, 0) - (existing ?? []).reduce((sum, withdrawal) => sum + withdrawal.amount_cents, 0);
    if (input.amountCents > available) return NextResponse.json({ error: "O valor excede o saldo de comissão disponível" }, { status: 400 });
    const { data: withdrawal, error } = await admin.from("withdrawals").insert({ seller_id: user.id, amount_cents: input.amountCents, pix_key: input.pixKey, pix_key_type: input.pixKeyType }).select("id").single();
    if (error || !withdrawal) return NextResponse.json({ error: "Não foi possível registrar o saque" }, { status: 400 });
    const job = await createPixWithdrawal({ clientId: store.mistic_client_id, clientSecret: decryptSecret(store.mistic_client_secret_encrypted) }, { amount: input.amountCents / 100, pixKey: input.pixKey, pixKeyType: input.pixKeyType, description: `Comissão purpowebbx ${withdrawal.id}`, projectWebhook: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/misticpay` });
    await admin.from("withdrawals").update({ status: "processing", mistic_job_id: job.jobId }).eq("id", withdrawal.id);
    return NextResponse.json({ withdrawalId: withdrawal.id, availableBeforeCents: available, status: job.status });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao solicitar saque administrativo" }, { status: 400 }); }
}
