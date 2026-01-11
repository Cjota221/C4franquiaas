"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
 * NÃO aparece na página de produtos (lá já tem o card roxo com a mesma info)
 */
export default function AlertaProdutosSemMargem({ 
  revendedoraId: revendedoraIdProp, 
  showCloseButton = false,
  compacto = false 
}: AlertaMargemProps) {
  const pathname = usePathname();
  const [revendedoraId, setRevendedoraId] = useState<string | null>(revendedoraIdProp || null);
  const [quantidade, setQuantidade] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const supabase = createClient();

  // 🆕 NÃO mostrar na página de produtos (já tem o card roxo lá)
  const isNaPaginaProdutos = pathname?.includes('/revendedora/produtos');

  // Buscar ID da revendedora se não foi passado
  useEffect(() => {
    // Se estiver na página de produtos, não precisa buscar nada
    if (isNaPaginaProdutos) {
      setLoading(false);
      return;
    }

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
  }, [revendedoraIdProp, supabase, isNaPaginaProdutos]);

  // Buscar produtos sem margem (que REALMENTE precisam de atenção)
  useEffect(() => {
    // Se estiver na página de produtos, não buscar (já tem card roxo lá)
    if (isNaPaginaProdutos) {
      setLoading(false);
      return;
    }
    
    if (!revendedoraId) return;
    
    async function verificarProdutosSemMargem() {
      setLoading(true);
      try {
        // ✅ Buscar produtos da revendedora
        const { data: resellerProducts, error: rpError } = await supabase
          .from("reseller_products")
          .select("id, product_id, margin_percent, custom_price, is_active")
          .eq("reseller_id", revendedoraId);

        if (rpError) throw rpError;

        // Buscar IDs dos produtos ativos na franqueadora
        const { data: produtosAtivos, error: pError } = await supabase
          .from("produtos")
          .select("id")
          .eq("ativo", true);

        if (pError) throw pError;

        // Criar set de IDs válidos para lookup rápido
        const idsAtivos = new Set((produtosAtivos || []).map(p => p.id));

        // Filtrar: produto existe, está ativo na franqueadora, e não tem margem
        const semMargem = (resellerProducts || []).filter(p => {
          // Produto não existe ou está inativo na franqueadora? Ignora
          if (!idsAtivos.has(p.product_id)) return false;
          // Tem margem percentual > 0? OK, não precisa de atenção
          if (p.margin_percent && p.margin_percent > 0) return false;
          // Tem preço customizado > 0? OK, não precisa de atenção
          if (p.custom_price && p.custom_price > 0) return false;
          // Não tem nem margem nem preço = precisa de atenção!
          return true;
        });

        // Contar também quantos produtos válidos existem
        const produtosValidos = (resellerProducts || []).filter(p => idsAtivos.has(p.product_id));
        
        console.log(`[AlertaProdutosSemMargem] Válidos: ${produtosValidos.length}, Sem margem: ${semMargem.length}`);
        setQuantidade(semMargem.length);
      } catch (err) {
        console.error("Erro ao verificar produtos sem margem:", err);
        setQuantidade(0); // Em caso de erro, não mostra alerta
      } finally {
        setLoading(false);
      }
    }

    // ✅ Executar imediatamente
    verificarProdutosSemMargem();
    
    // ✅ Revalidar quando a página voltar a ter foco (usuário voltou de outra aba)
    const handleFocus = () => {
      console.log('[AlertaProdutosSemMargem] Página focou - revalidando...');
      verificarProdutosSemMargem();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [revendedoraId, supabase, isNaPaginaProdutos, pathname]); // ✅ pathname dispara revalidação quando navega

  // Não mostrar se carregando, sem produtos, foi fechado, ou na página de produtos
  if (loading || quantidade === 0 || dismissed || isNaPaginaProdutos) {
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
              Configure a margem de lucro dos seus produtos
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Você tem <strong>{quantidade} produto(s)</strong> sem margem de lucro configurada.
              Para que eles apareçam na sua loja com o preço correto, defina a margem de lucro desejada.
            </p>
            <div className="mt-3">
              <Link
                href="/revendedora/produtos?filtro=sem-margem"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                Configurar margem de lucro
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
