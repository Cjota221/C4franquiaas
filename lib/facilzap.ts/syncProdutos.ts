import axios from 'axios';
// Usamos o atalho @/ que aponta para a raiz do projeto, é mais seguro
import { supabase } from '@/lib/supabaseClient';

// Define um "molde" para o produto que vem da API
interface ProdutoDaAPI {
  id: string | number;
  nome: string;
  preco: number;
  estoque: number;
  imagem: string;
}

export async function syncProdutos() {
  try {
    const response = await axios.get("https://api.facilzap.app.br/produtos", {
      headers: { 
        Authorization: `Bearer ${process.env.FACILZAP_TOKEN}` 
      },
    });

    const produtosDaAPI: ProdutoDaAPI[] = response.data;

    if (!produtosDaAPI || produtosDaAPI.length === 0) {
      return { sucesso: true, total: 0, message: "Nenhum produto encontrado na API." };
    }

    const produtosParaSalvar = produtosDaAPI.map((produto) => ({
      id_externo: produto.id,
      nome: produto.nome,
      preco_base: produto.preco,
      estoque: produto.estoque,
      imagem: produto.imagem,
      ativo: true,
      atualizado_em: new Date(),
    }));

    const { error } = await supabase
      .from('produtos')
      .upsert(produtosParaSalvar, { onConflict: 'id_externo' });

    if (error) throw error;

    console.log(`${produtosParaSalvar.length} produtos sincronizados com sucesso.`);
    return { sucesso: true, total: produtosParaSalvar.length };
    
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro detalhado na sincronização:", errorMessage);
    return { sucesso: false, erro: errorMessage };
  }
}