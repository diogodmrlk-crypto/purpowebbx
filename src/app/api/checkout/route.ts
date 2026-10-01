import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createPixTransaction } from "@/lib/misticpay";

const schema = z.object({ productId: z.string().uuid(), buyerName: z.string().min(2), buyerEmail: z.string().email(), buyerDocument: z.string().min(11).max(14) });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const supabase = await createServerSupabaseClient();
    const { data: product, error: productError } = await supabase.from("products").select("id,name,price_cents,owner_id,store_id,stores!inner(name)").eq("id", input.productId).eq("status", "published").single();
    if (productError || !product) return NextResponse.json({ error: "Produto indisponível" }, { status: 404 });
    const feeRate = Number(process.env.PLATFORM_FEE_PERCENT ?? "3") / 100;
    const platformFee = Math.round(product.price_cents * feeRate);
    const orderId = crypto.randomUUID();
    const { data: order, error: orderError } = await supabase.from("orders").insert({ id: orderId, product_id: product.id, store_id: product.store_id, seller_id: product.owner_id, buyer_email: input.buyerEmail, buyer_name: input.buyerName, amount_cents: product.price_cents, platform_fee_cents: platformFee, seller_amount_cents: product.price_cents - platformFee }).select("id").single();
    if (orderError || !order) return NextResponse.json({ error: "Não foi possível iniciar o pedido" }, { status: 500 });
    const transaction = await createPixTransaction({ amount: product.price_cents / 100, payerName: input.buyerName, payerDocument: input.buyerDocument.replace(/\\D/g, ""), transactionId: order.id, description: `Compra ${product.name}`, projectWebhook: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/misticpay` });
    await supabase.from("orders").update({ mistic_transaction_id: transaction.transactionId, pix_copy_paste: transaction.copyPaste, pix_qr_code: transaction.qrCodeBase64 ?? transaction.qrcodeUrl }).eq("id", order.id);
    return NextResponse.json({ orderId: order.id, copyPaste: transaction.copyPaste, qrCode: transaction.qrCodeBase64 ?? transaction.qrcodeUrl, amountCents: product.price_cents });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao criar checkout" }, { status: 400 });
  }
}
