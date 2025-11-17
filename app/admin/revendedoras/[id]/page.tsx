"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Package } from "lucide-react";
import Image from "next/image";

export default function AdminProdutosPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id as string;
  const [revendedora, setRevendedora] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [vinculados, setVinculados] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregarDados(); }, [id]);

  async function carregarDados() {
    const { data: r } = await supabase.from("resellers").select("*").eq("id", id).single();
    setRevendedora(r);
    const { data: p } = await supabase.from("produtos").select("*").eq("ativo", true).order("nome");
    setProdutos(p || []);
    const { data: v } = await supabase.from("reseller_products").select("*").eq("reseller_id", id);
    const map = new Map();
    v?.forEach(x => map.set(x.produto_id, x));
    setVinculados(map);
    setLoading(false);
  }

  async function toggle(produtoId: string) {
    const v = vinculados.get(produtoId);
    if (v) {
      await supabase.from("reseller_products").update({ ativo: !v.ativo }).eq("reseller_id", id).eq("produto_id", produtoId);
      const m = new Map(vinculados);
      m.set(produtoId, { ...v, ativo: !v.ativo });
      setVinculados(m);
    } else {
      await supabase.from("reseller_products").insert({ reseller_id: id, produto_id: produtoId, margem_lucro: 20, ativo: true });
      const m = new Map(vinculados);
      m.set(produtoId, { produto_id: produtoId, margem_lucro: 20, ativo: true });
      setVinculados(m);
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full"></div></div>;

  return <div className="p-6"><button onClick={() => router.push("/admin/revendedoras")} className="flex items-center gap-2 mb-4"><ArrowLeft size={20} />Voltar</button><h1 className="text-2xl font-bold mb-4">Produtos - {revendedora?.store_name}</h1><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{produtos.map(p => { const v = vinculados.get(p.id); const ativo = v?.ativo || false; return <div key={p.id} className={`bg-white rounded-lg shadow border-2 ${ativo ? "border-green-500" : "border-gray-200"}`}><div className="relative h-48 bg-gray-100"><Image src={p.imagem_principal || ""} alt={p.nome} fill className="object-cover" sizes="33vw" /></div><div className="p-4"><h3 className="font-semibold mb-2">{p.nome}</h3><p className="text-sm mb-2">R$ {p.preco.toFixed(2)}</p><button onClick={() => toggle(p.id)} className={`w-full py-2 rounded-lg ${ativo ? "bg-red-500" : "bg-green-500"} text-white`}>{ativo ? "Desativar" : v ? "Ativar" : "Vincular"}</button></div></div>; })}</div></div>;
}