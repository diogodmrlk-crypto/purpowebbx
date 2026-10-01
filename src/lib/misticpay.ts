const BASE_URL = "https://api.misticpay.com/api";

export type MisticCredentials = { clientId: string; clientSecret: string };
function headers(credentials: MisticCredentials) {
  return { Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64")}`, "Content-Type": "application/json" };
}
export type MisticTransaction = { transactionId: string; transactionState: string; qrCodeBase64?: string; qrcodeUrl?: string; copyPaste?: string; transactionAmount?: number };

export async function createPixTransaction(credentials: MisticCredentials, input: { amount: number; payerName: string; payerDocument: string; transactionId: string; description: string; projectWebhook: string; splitUser?: string; splitTax?: number }) {
  const response = await fetch(`${BASE_URL}/transactions/create`, { method: "POST", headers: headers(credentials), body: JSON.stringify(input), cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.message ?? "MisticPay could not create transaction");
  return body.data as MisticTransaction;
}

export async function createPixWithdrawal(credentials: MisticCredentials, input: { amount: number; pixKey: string; pixKeyType: string; description: string; projectWebhook: string }) {
  const response = await fetch(`${BASE_URL}/transactions/withdraw`, { method: "POST", headers: headers(credentials), body: JSON.stringify(input), cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.message ?? "MisticPay could not queue withdrawal");
  return body.data as { jobId: string; transactionId: string; status: string };
}
