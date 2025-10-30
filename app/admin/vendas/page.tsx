"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { DollarSign, Package, Check, X, Clock, Store } from "lucide-react";

export default function VendasAdminPage() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient();
      const { data } = await supabase.from("vendas").select("*, lojas:loja_id(nome)").order("created_at", { ascending: false });
      setVendas(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const total = vendas.reduce((acc, v) => acc + v.valor_total, 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Vendas</h1>
      {loading ? <p>Carregando...</p> : (
        <>
          <p className="mb-4">Total: R$ {total.toFixed(2)}</p>
          <div className="space-y-2">
            {vendas.map(v => (
              <div key={v.id} className="p-4 border rounded">
                <p className="font-bold">{v.cliente_nome}</p>
                <p>R$ {v.valor_total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
