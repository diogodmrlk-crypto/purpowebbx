"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, PackagePlus } from "lucide-react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function NewProductPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    const supabase = createBrowserSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus("error"); setMessage("Sua sessão expirou. Faça login novamente."); return; }
    const { data: existingStore } = await supabase.from("stores").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
    let storeId = existingStore?.id;
    if (!storeId) {
      const { data: store, error: storeError } = await supabase.from("stores").insert({ owner_id: user.id, name: `${user.user_metadata?.name ?? "Minha"} Store`, slug: `${slugify(user.email?.split("@")[0] ?? "minha-loja")}-${user.id.slice(0, 6)}` }).select("id").single();
      if (storeError || !store) { setStatus("error"); setMessage(storeError?.message ?? "Não foi possível criar a loja."); return; }
      storeId = store.id;
    }
    const { error } = await supabase.from("products").insert({ store_id: storeId, owner_id: user.id, name, slug: `${slugify(name)}-${Date.now().toString().slice(-5)}`, description, price_cents: Math.round(Number(price.replace(",", ".")) * 100), delivery_content: content, status: "published" });
    if (error) { setStatus("error"); setMessage(error.message); return; }
    setStatus("done"); setMessage("Produto publicado. Seu checkout já pode receber pedidos.");
  }

  return <main className="min-h-screen bg-[#080a0c] px-5 py-8 text-white"><div className="mx-auto max-w-2xl"><Link href="/dashboard" className="mb-10 inline-flex items-center gap-2 text-sm text-[#8b949e] hover:text-white"><ArrowLeft size={16}/> Voltar ao painel</Link><div className="mb-8"><p className="mb-3 text-xs uppercase tracking-[.2em] text-[#b7f34a]">Novo produto</p><h1 className="text-4xl font-semibold tracking-[-.04em]">Publique o que você criou.</h1><p className="mt-3 text-sm text-[#8b949e]">Depois do Pix aprovado, este conteúdo será enviado automaticamente ao comprador.</p></div><form onSubmit={save} className="space-y-5 rounded-3xl border border-white/10 bg-[#101317] p-6 sm:p-8"><label className="block"><span className="mb-2 block text-sm text-[#cdd2d6]">Nome do produto</span><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Pack de templates para Notion" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-[#59626b] focus:border-[#b7f34a]/60" /></label><label className="block"><span className="mb-2 block text-sm text-[#cdd2d6]">Descrição</span><textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explique o que o cliente recebe..." rows={4} className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-[#59626b] focus:border-[#b7f34a]/60" /></label><label className="block"><span className="mb-2 block text-sm text-[#cdd2d6]">Preço em reais</span><div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-4"><span className="text-[#7d8790]">R$</span><input required type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="29,90" className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-[#59626b]" /></div></label><label className="block"><span className="mb-2 block text-sm text-[#cdd2d6]">Conteúdo para entrega</span><textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Link, licença, acesso ou instruções que serão enviadas por e-mail..." rows={6} className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-[#59626b] focus:border-[#b7f34a]/60" /></label>{message && <p className={`rounded-xl px-4 py-3 text-sm ${status === "error" ? "bg-red-500/10 text-red-300" : "bg-[#b7f34a]/10 text-[#b7f34a]"}`}>{message}</p>}<button disabled={status === "saving" || status === "done"} className="w-full rounded-xl bg-[#b7f34a] px-5 py-3.5 text-sm font-semibold text-[#11150d] transition hover:bg-[#d2ff76] disabled:cursor-not-allowed disabled:opacity-60">{status === "saving" ? <><Loader2 className="mr-2 inline animate-spin" size={16}/> Publicando...</> : status === "done" ? "Produto publicado" : <><PackagePlus className="mr-2 inline" size={17}/> Publicar produto</>}</button></form></div></main>;
}
