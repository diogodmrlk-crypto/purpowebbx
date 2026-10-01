import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createPixWithdrawal } from "@/lib/misticpay";

const schema = z.object({ amountCents: z.number().int().positive(), pixKey: z.string().min(3), pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "TELEFONE", "CHAVE_ALEATORIA"]) });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Faça login para sacar" }, { status: 401 });
    const { data: withdrawal, error } = await supabase.from("withdrawals").insert({ seller_id: user.id, amount_cents: input.amountCents, pix_key: input.pixKey, pix_key_type: input.pixKeyType }).select("id").single();
    if (error || !withdrawal) return NextResponse.json({ error: "Não foi possível registrar o saque" }, { status: 400 });
    const job = await createPixWithdrawal({ amount: input.amountCents / 100, pixKey: input.pixKey, pixKeyType: input.pixKeyType, description: `Saque purpowebbx ${withdrawal.id}`, projectWebhook: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/misticpay` });
    await supabase.from("withdrawals").update({ status: "processing", mistic_job_id: job.jobId }).eq("id", withdrawal.id);
    return NextResponse.json({ withdrawalId: withdrawal.id, status: job.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao solicitar saque" }, { status: 400 });
  }
}
