import axios from 'axios';
import { supabase } from './supabaseClient'; // Importa nossa conexão com o Supabase

// Esta função será chamada por uma API Route do Next.js
export async function syncProdutos() {
  try {
    // Busca os produtos da API FácilZap
    const response = await axios.get("https://api.facilzap.app.br/produtos", {
      headers: { 
        // Usa o Token da API que estará nas variáveis de ambiente
        Authorization: `Bearer ${process.env.FACILZAP_TOKEN}` 
      },
    });

    const produtosDaAPI = response.data;

    if (!produtosDaAPI || produtosDaAPI.length === 0) {
      return { sucesso: true, total: 0, message: "Nenhum produto encontrado na API." };
    }

    // Mapeia os dados da API para o formato da nossa tabela no Supabase
    const produtosParaSalvar = produtosDaAPI.map((produto: any) => ({
      id_externo: produto.id,
      nome: produto.nome,
      preco_base: produto.preco,
      estoque: produto.estoque,
      imagem: produto.imagem,
      ativo: true, // Define como ativo por padrão na sincronização
      atualizado_em: new Date(),
    }));

    // O comando "upsert" é inteligente:
    // - Se o produto (pelo id_externo) já existe, ele ATUALIZA os dados.
    // - Se não existe, ele INSERE um novo.
    const { error } = await supabase
      .from('produtos')
      .upsert(produtosParaSalvar, { onConflict: 'id_externo' });

    if (error) {
      throw error; // Se der erro no Supabase, joga o erro para o catch
    }

    console.log(`${produtosParaSalvar.length} produtos sincronizados com sucesso.`);
    return { sucesso: true, total: produtosParaSalvar.length };
    
  } catch (err: any) {
    console.error("Erro detalhado na sincronização:", err.message);
    return { sucesso: false, erro: err.message };
  }
}
