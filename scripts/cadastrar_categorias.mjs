/**
 * Script para cadastrar as categorias padrão do site
 * 
 * Categorias:
 * 1. Rasteirinhas
 * 2. Salto Flat
 * 3. Papete
 * 4. Bolsa
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
const envPath = join(__dirname, '..', '.env.local');
let supabaseUrl, supabaseKey;

try {
  const envFile = readFileSync(envPath, 'utf8');
  const lines = envFile.split('\n');
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    
    if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') {
      supabaseUrl = value;
    } else if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') {
      supabaseKey = value;
    }
  });
} catch (error) {
  console.error('❌ Erro ao ler .env.local:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const categorias = [
  {
    nome: 'Rasteirinhas',
    slug: 'rasteirinhas',
    descricao: 'Rasteirinhas confortáveis e estilosas para o dia a dia'
  },
  {
    nome: 'Salto Flat',
    slug: 'salto-flat',
    descricao: 'Saltos baixos e flats elegantes'
  },
  {
    nome: 'Papete',
    slug: 'papete',
    descricao: 'Papetes modernas e confortáveis'
  },
  {
    nome: 'Bolsa',
    slug: 'bolsa',
    descricao: 'Bolsas e acessórios femininos'
  }
];

async function cadastrarCategorias() {
  console.log('\n🔄 Cadastrando categorias...\n');

  for (const cat of categorias) {
    try {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('categorias')
        .select('id, nome')
        .eq('slug', cat.slug)
        .single();

      if (existing) {
        console.log(`⚠️  Categoria "${cat.nome}" já existe (ID: ${existing.id})`);
        
        // Atualizar descrição se necessário
        const { error: updateError } = await supabase
          .from('categorias')
          .update({ 
            descricao: cat.descricao
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`   ❌ Erro ao atualizar: ${updateError.message}`);
        } else {
          console.log(`   ✅ Atualizada com sucesso`);
        }
      } else {
        // Criar nova categoria
        const { data, error } = await supabase
          .from('categorias')
          .insert([{
            nome: cat.nome,
            slug: cat.slug,
            descricao: cat.descricao
          }])
          .select()
          .single();

        if (error) {
          console.error(`❌ Erro ao criar "${cat.nome}":`, error.message);
        } else {
          console.log(`✅ Categoria "${cat.nome}" criada com sucesso (ID: ${data.id})`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao processar "${cat.nome}":`, error.message);
    }
  }

  console.log('\n✅ Processo concluído!\n');
  
  // Listar todas as categorias
  const { data: allCategorias } = await supabase
    .from('categorias')
    .select('*')
    .order('nome');

  if (allCategorias && allCategorias.length > 0) {
    console.log('📋 Categorias cadastradas no banco:\n');
    allCategorias.forEach((cat, idx) => {
      console.log(`${idx + 1}. ${cat.nome} (slug: ${cat.slug}, ID: ${cat.id})`);
    });
  }
}

cadastrarCategorias();
