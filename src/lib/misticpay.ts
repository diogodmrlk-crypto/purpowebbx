const BASE_URL = "https://api.misticpay.com/api";

function headers() {
  const id = process.env.MISTICPAY_CLIENT_ID;
  const secret = process.env.MISTICPAY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("MisticPay credentials are not configured");
  return { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/json" };
}

export type MisticTransaction = { transactionId: string; transactionState: string; qrCodeBase64?: string; qrcodeUrl?: string; copyPaste?: string; transactionAmount?: number };

export async function createPixTransaction(input: { amount: number; payerName: string; payerDocument: string; transactionId: string; description: string; projectWebhook: string; }) {
  const response = await fetch(`${BASE_URL}/transactions/create`, { method: "POST", headers: headers(), body: JSON.stringify(input), cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.message ?? "MisticPay could not create transaction");
  return body.data as MisticTransaction;
}

export async function createPixWithdrawal(input: { amount: number; pixKey: string; pixKeyType: string; description: string; projectWebhook: string; }) {
  const response = await fetch(`${BASE_URL}/transactions/withdraw`, { method: "POST", headers: headers(), body: JSON.stringify(input), cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.message ?? "MisticPay could not queue withdrawal");
  return body.data as { jobId: string; transactionId: string; status: string };
}
