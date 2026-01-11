"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import Link from "next/link";

interface AlertaMargemProps {
  revendedoraId?: string; // Agora é opcional - busca automaticamente se não passado
  showCloseButton?: boolean;
  compacto?: boolean;
}

/**
 * Componente de alerta que aparece quando a revendedora tem produtos sem margem de lucro
 * Usado na home do painel e na página de produtos
 */
export default function AlertaProdutosSemMargem({ 
  revendedoraId: revendedoraIdProp, 
  showCloseButton = false,
  compacto = false 
}: AlertaMargemProps) {
  const [revendedoraId, setRevendedoraId] = useState<string | null>(revendedoraIdProp || null);
  const [quantidade, setQuantidade] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const supabase = createClient();

  // Buscar ID da revendedora se não foi passado
  useEffect(() => {
    if (revendedoraIdProp) {
      setRevendedoraId(revendedoraIdProp);
      return;
    }

    async function buscarRevendedoraId() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: reseller } = await supabase
          .from("resellers")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (reseller) {
          setRevendedoraId(reseller.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro ao buscar revendedora:", err);
        setLoading(false);
      }
    }

    buscarRevendedoraId();
  }, [revendedoraIdProp, supabase]);

  // Buscar produtos sem margem
  useEffect(() => {
    if (!revendedoraId) return;
    
    async function verificarProdutosSemMargem() {
      try {
        // Buscar produtos sem margem
        const { data, error } = await supabase
          .from("reseller_products")
          .select("id, margin_percent, custom_price")
          .eq("reseller_id", revendedoraId)
          .or("margin_percent.is.null,margin_percent.eq.0");

        if (error) throw error;

        // Filtrar onde custom_price também é null/0
        const semMargem = (data || []).filter(p => {
          if (p.custom_price && p.custom_price > 0) return false;
          return true;
        });

        setQuantidade(semMargem.length);
      } catch (err) {
        console.error("Erro ao verificar produtos sem margem:", err);
      } finally {
        setLoading(false);
      }
    }

    verificarProdutosSemMargem();
  }, [revendedoraId, supabase]);

  // Não mostrar se carregando, sem produtos, ou foi fechado
  if (loading || quantidade === 0 || dismissed) {
    return null;
  }

  // Versão compacta (para sidebar ou header)
  if (compacto) {
    return (
      <Link 
        href="/revendedora/produtos?filtro=sem-margem"
        className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm hover:bg-amber-200 transition-colors"
      >
        <AlertTriangle className="w-4 h-4" />
        <span className="font-medium">{quantidade} produto(s) sem margem</span>
      </Link>
    );
  }

  // Versão completa (banner)
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-amber-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800">
              Atualização importante nos seus produtos
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Estamos passando por uma atualização no sistema.{" "}
              <strong>{quantidade} produto(s)</strong> foram desativados por estarem sem margem de lucro configurada.
              Para que seus produtos voltem a aparecer na sua loja, revise e ajuste a margem de lucro.
            </p>
            <div className="mt-3">
              <Link
                href="/revendedora/produtos?filtro=sem-margem"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                Atualizar margens de lucro
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        
        {showCloseButton && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-amber-600 hover:text-amber-800 transition-colors"
            title="Fechar alerta"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
