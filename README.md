# purpowebbx

Marketplace de produtos digitais em Next.js + TypeScript, Supabase e MisticPay.

## Incluído

- Landing page responsiva com identidade própria, inspirada no modelo funcional da referência sem copiar conteúdo proprietário.
- Supabase: usuários, lojas, produtos, pedidos, entregas, saques Pix e idempotência de webhooks com RLS.
- OAuth com Google e Discord via Supabase Auth.
- Checkout Pix MisticPay server-side em `/api/checkout`.
- Webhook de aprovação em `/api/webhooks/misticpay` que marca o pedido como pago e envia o conteúdo por e-mail via Resend.
- Comissão configurável por `PLATFORM_FEE_PERCENT` (padrão 3%).
- Saque somente Pix via `/api/withdrawals` para vendedores e `/api/admin/withdrawals` para o administrador, limitado ao saldo acumulado das comissões.
- Segredos nunca expostos ao navegador ou commitados.

## Rodar localmente

```bash
pnpm install
cp .env.example .env.local
# preencha as credenciais em .env.local
pnpm dev
```

## OAuth

No Supabase Dashboard, habilite Google e Discord em Authentication > Providers e configure o callback:

`https://SEU-PROJETO.supabase.co/auth/v1/callback`

No app, use também `http://localhost:3000/auth/callback` e a URL de produção da Vercel.

## MisticPay

Use uma Access Key atual (`pk_` + `sk_`) com escopos de cash-in, cash-out e consulta. A integração utiliza Basic Auth no backend e nunca expõe `sk_` no frontend. Cadastre o webhook de produção para:

`https://SEU-DOMINIO.vercel.app/api/webhooks/misticpay`

## Vercel

Importe o repositório, selecione Next.js e cadastre as variáveis de `.env.example` em Production/Preview. Atualize `NEXT_PUBLIC_SITE_URL` e as URLs de callback OAuth após publicar.

## Segurança

O webhook é idempotente, a entrega só acontece após estado pago e o conteúdo não é enviado ao browser antes da confirmação. Em produção, configure domínio de e-mail autenticado no Resend e valide a assinatura do webhook conforme o recurso de assinatura disponível na sua conta MisticPay.
