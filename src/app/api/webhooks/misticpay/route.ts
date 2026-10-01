import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const payload = await request.json();
  const transactionId = String(payload?.data?.transactionId ?? payload?.transactionId ?? "");
  const state = String(payload?.data?.transactionState ?? payload?.transactionState ?? payload?.status ?? "").toUpperCase();
  if (!transactionId) return NextResponse.json({ error: "transactionId ausente" }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const eventKey = `${transactionId}:${state}`;
  const { error: eventError } = await supabase.from("webhook_events").insert({ event_key: eventKey, payload, processed_at: new Date().toISOString() });
  if (eventError?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
  if (eventError) return NextResponse.json({ error: "Não foi possível registrar evento" }, { status: 500 });
  if (!["APROVADO", "PAGO", "COMPLETED", "SUCCESS", "CONCLUIDO"].includes(state)) return NextResponse.json({ ok: true, ignored: true });
  const { data: order } = await supabase.from("orders").select("id,buyer_email,buyer_name,product_id,status,products!inner(name,delivery_content)").eq("mistic_transaction_id", transactionId).single();
  if (!order || order.status === "paid" || order.status === "delivered") return NextResponse.json({ ok: true });
  await supabase.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id);
  const product = Array.isArray(order.products) ? order.products[0] : order.products;
  await supabase.from("deliveries").upsert({ order_id: order.id, recipient_email: order.buyer_email, delivery_content: product.delivery_content }, { onConflict: "order_id" });
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    await resend.emails.send({ from: process.env.DELIVERY_FROM_EMAIL ?? "onboarding@resend.dev", to: order.buyer_email, subject: `Sua compra: ${product.name}`, html: `<h2>Pagamento confirmado</h2><p>Olá, ${order.buyer_name ?? ""}! Seu produto está pronto:</p><pre style="white-space:pre-wrap">${product.delivery_content}</pre>` });
  }
  await supabase.from("orders").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", order.id);
  return NextResponse.json({ ok: true });
}
