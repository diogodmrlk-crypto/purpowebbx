export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  sales_count: number;
  store_name?: string;
  store_slug?: string;
  accent_color?: string;
};

export type CheckoutPayload = {
  productId: string;
  buyerName: string;
  buyerEmail: string;
  buyerDocument: string;
};

export const formatBRL = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
