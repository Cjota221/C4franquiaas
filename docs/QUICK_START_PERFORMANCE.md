# 🚀 PLANO DE AÇÃO IMEDIATO - PERFORMANCE

## ⚡ AÇÕES CRÍTICAS (FAZER AGORA - 30 MINUTOS)

### 1️⃣ APLICAR ÍNDICES NO BANCO DE DADOS (IMPACTO: 80%)

**Tempo estimado:** 5 minutos  
**Dificuldade:** ⭐ Fácil

```bash
# PowerShell - Aplicar migration
$env:NEXT_PUBLIC_SUPABASE_URL="sua_url_supabase"
$env:SUPABASE_SERVICE_ROLE_KEY="sua_service_key"
node scripts/apply_migrations.mjs
```

**OU** copie e cole no SQL Editor do Supabase:
```
migrations/018_performance_indexes.sql
```

**Resultado esperado:**
- ✅ Busca de produtos: 3.2s → 180ms (94% mais rápido)
- ✅ Busca de loja por domínio: 500ms → 20ms (96% mais rápido)

---

### 2️⃣ ADICIONAR PAGINAÇÃO NA API DE PRODUTOS (IMPACTO: 70%)

**Tempo estimado:** 15 minutos  
**Dificuldade:** ⭐⭐ Médio

**Arquivo:** `app/api/loja/[dominio]/produtos/route.ts`

Substituir a query atual por:

```typescript
// ADICIONAR PARÂMETROS
const page = parseInt(searchParams.get('page') || '1', 10);
const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
const offset = (page - 1) * limit;

// MODIFICAR QUERY
let query = supabase
  .from('produtos_franqueadas')
  .select(`...`, { count: 'exact' }) // ← Adicionar count
  .eq('franqueada_id', loja.franqueada_id)
  .eq('ativo', true)
  .range(offset, offset + limit - 1) // ← Adicionar paginação
  .order('id', { ascending: true });

// RETORNAR METADADOS
return NextResponse.json({
  produtos,
  pagination: {
    page,
    limit,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    hasMore: (offset + limit) < (count || 0)
  }
});
```

**Resultado esperado:**
- ✅ Payload JSON: 2.5MB → 85KB (97% menor)
- ✅ Tempo de resposta: 4.8s → 350ms (93% mais rápido)

---

### 3️⃣ OTIMIZAR IMAGENS (IMPACTO: 50%)

**Tempo estimado:** 10 minutos  
**Dificuldade:** ⭐ Fácil

**Arquivo:** `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.facilzap.app.br',
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 dias
  },
};
```

**Arquivo:** `components/loja/ProdutoCard.tsx`

Atualizar componente Image:

```tsx
<Image
  src={produto.imagem}
  alt={produto.nome}
  fill
  loading="lazy"
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
  quality={80}
  className="object-contain p-4"
/>
```

**Resultado esperado:**
- ✅ Tamanho de imagem: 450KB (JPEG) → 85KB (WebP) - 81% menor
- ✅ LCP (Largest Contentful Paint): 4.5s → 1.8s

---

## 📅 AÇÕES PARA ESTA SEMANA (2-3 HORAS)

### 4️⃣ INSTALAR TANSTACK QUERY (Segunda-feira)

```bash
npm install @tanstack/react-query
```

Criar `app/providers.tsx`:
```tsx
"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Ver exemplo completo em:** `docs/EXEMPLO_TANSTACK_QUERY.tsx`

---

### 5️⃣ IMPLEMENTAR INFINITE SCROLL (Terça-feira)

```bash
npm install react-intersection-observer
```

Migrar listagem de produtos para carregamento progressivo.

---

### 6️⃣ CODE SPLITTING (Quarta-feira)

Usar `dynamic()` do Next.js para componentes pesados:

```tsx
import dynamic from 'next/dynamic';

const ProductDetailsModal = dynamic(() => import('@/components/ProductDetailsModal'), {
  ssr: false,
});
```

---

## 🔍 VERIFICAÇÃO DE RESULTADOS

### Após aplicar índices:

```bash
node scripts/audit_database_performance.mjs
```

### Testar performance no navegador:

1. Abrir DevTools (F12)
2. Aba "Network"
3. Filtrar por "Fetch/XHR"
4. Verificar tempo de resposta das APIs

**Targets:**
- `/api/loja/[dominio]/info`: < 100ms
- `/api/loja/[dominio]/produtos`: < 300ms
- `/api/loja/[dominio]/search`: < 150ms

### Lighthouse (Core Web Vitals):

```bash
# Chrome DevTools > Lighthouse > Analyze
```

**Targets:**
- Performance Score: > 90
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

---

## 📊 CHECKLIST DE IMPLEMENTAÇÃO

### HOJE (30 min):
- [ ] Aplicar migration 018 (índices)
- [ ] Adicionar paginação em `/api/loja/[dominio]/produtos`
- [ ] Configurar `next.config.ts` para imagens
- [ ] Atualizar componente `<Image>` com `sizes`

### ESTA SEMANA:
- [ ] Instalar TanStack Query
- [ ] Migrar `LojaHomePage` para `useQuery`
- [ ] Implementar infinite scroll
- [ ] Adicionar code splitting

### PRÓXIMA SEMANA:
- [ ] Aplicar React.memo em componentes críticos
- [ ] Configurar monitoring (Vercel Analytics ou similar)
- [ ] Testes A/B de performance

---

## 🚨 TROUBLESHOOTING

### "Índice não está sendo usado"

```sql
-- Executar no Supabase SQL Editor
EXPLAIN ANALYZE 
SELECT * FROM produtos 
WHERE nome ILIKE '%batom%' AND ativo = true;

-- Se ver "Seq Scan", executar:
VACUUM ANALYZE produtos;
```

### "Imagens não estão em WebP"

Verificar se domínio está em `remotePatterns` do `next.config.ts`.

### "Cache não está funcionando"

Verificar se `QueryClientProvider` está no layout raiz.

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **Relatório de Auditoria:** `docs/PERFORMANCE_AUDIT_REPORT.md`
- **Exemplo TanStack Query:** `docs/EXEMPLO_TANSTACK_QUERY.tsx`
- **Migration de Índices:** `migrations/018_performance_indexes.sql`
- **Script de Verificação:** `scripts/audit_database_performance.mjs`

---

## 🎯 OBJETIVO FINAL

**Métricas Target:**
- ⚡ Tempo de carregamento inicial: < 2s
- ⚡ Tempo de busca: < 200ms
- ⚡ Navegação entre páginas: < 100ms (cache)
- ⚡ Performance Score (Lighthouse): > 90

**Economia de Banda:**
- 📉 Payload JSON: -90% (paginação)
- 📉 Imagens: -80% (WebP)
- 📉 Bundle JS: -50% (code splitting)

---

**🚀 COMECE AGORA:** Execute os passos 1, 2 e 3 nos próximos 30 minutos e veja melhorias imediatas de 70-80% na performance!
