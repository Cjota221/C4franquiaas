# 📋 SNIPPETS PRONTOS - COPY & PASTE

## 🔧 CONFIGURAÇÕES

### 1. Package.json - Adicionar dependências

```bash
npm install @tanstack/react-query react-intersection-observer
npm install --save-dev @next/bundle-analyzer
```

---

### 2. next.config.ts - Configuração completa

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ✅ OTIMIZAÇÃO DE IMAGENS
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**.facilzap.app.br',
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 dias
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ✅ COMPRESSÃO (automático em produção)
  compress: true,

  // ✅ PERFORMANCE
  swcMinify: true,
  
  // ✅ HEADERS DE SEGURANÇA E CACHE
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=120, stale-while-revalidate=300'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## 🗄️ BANCO DE DADOS

### 3. Verificar se índices existem (SQL)

```sql
-- Executar no Supabase SQL Editor
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  pg_size_pretty(pg_relation_size(indexrelid)) AS size,
  idx_scan AS "Vezes Usado",
  idx_tup_read AS "Linhas Lidas"
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;
```

### 4. Verificar queries lentas (SQL)

```sql
-- Ativar pg_stat_statements (fazer UMA VEZ)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Ver queries mais lentas
SELECT 
  substring(query, 1, 100) AS query_resumida,
  calls AS "Chamadas",
  round(mean_exec_time::numeric, 2) AS "Tempo Médio (ms)",
  round(total_exec_time::numeric, 2) AS "Tempo Total (ms)"
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 5. Atualizar estatísticas do PostgreSQL

```sql
-- Executar após aplicar índices
VACUUM ANALYZE produtos;
VACUUM ANALYZE lojas;
VACUUM ANALYZE produtos_franqueadas;
VACUUM ANALYZE categorias;
```

---

## ⚛️ REACT / NEXT.JS

### 6. app/providers.tsx - Provider Global

```tsx
"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

### 7. app/layout.tsx - Adicionar Provider

```tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 8. Hook personalizado com useQuery

```tsx
// hooks/useLoja.ts
import { useQuery } from '@tanstack/react-query';

async function fetchLojaInfo(dominio: string) {
  const res = await fetch(`/api/loja/${dominio}/info`);
  if (!res.ok) throw new Error('Erro ao carregar loja');
  return res.json();
}

export function useLoja(dominio: string) {
  return useQuery({
    queryKey: ['loja', dominio],
    queryFn: () => fetchLojaInfo(dominio),
    staleTime: 10 * 60 * 1000,
    enabled: !!dominio,
  });
}

// USO:
// const { data, isLoading, error } = useLoja(dominio);
```

### 9. Infinite Scroll Component

```tsx
"use client";
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

async function fetchProdutos({ pageParam = 1, dominio }: any) {
  const res = await fetch(`/api/loja/${dominio}/produtos?page=${pageParam}&limit=20`);
  return res.json();
}

export default function ProdutosInfiniteScroll({ dominio }: { dominio: string }) {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['produtos', dominio],
    queryFn: ({ pageParam }) => fetchProdutos({ pageParam, dominio }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore 
        ? lastPage.pagination.page + 1 
        : undefined;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div>
      {data?.pages.map((page) =>
        page.produtos.map((produto: any) => (
          <ProdutoCard key={produto.id} produto={produto} />
        ))
      )}

      {/* Trigger para carregar mais */}
      <div ref={ref} className="py-8 text-center">
        {isFetchingNextPage && <p>Carregando mais...</p>}
      </div>
    </div>
  );
}
```

### 10. Image Component Otimizado

```tsx
import Image from 'next/image';

// ✅ PLACEHOLDER SVG (inline para performance)
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f3f4f6" offset="20%" />
      <stop stop-color="#e5e7eb" offset="50%" />
      <stop stop-color="#f3f4f6" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f3f4f6" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

// ✅ COMPONENTE REUTILIZÁVEL
export function OptimizedImage({ 
  src, 
  alt, 
  ...props 
}: React.ComponentProps<typeof Image>) {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      quality={80}
      placeholder="blur"
      blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(400, 400))}`}
      {...props}
    />
  );
}

// USO:
// <OptimizedImage src={produto.imagem} alt={produto.nome} fill sizes="..." />
```

### 11. React.memo com comparação customizada

```tsx
import { memo } from 'react';

interface Props {
  produto: {
    id: string;
    nome: string;
    preco: number;
  };
  onClick: () => void;
}

const ProdutoCard = memo(function ProdutoCard({ produto, onClick }: Props) {
  return (
    <div onClick={onClick}>
      <h3>{produto.nome}</h3>
      <p>R$ {produto.preco.toFixed(2)}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  // Retornar TRUE se não deve re-renderizar
  return (
    prevProps.produto.id === nextProps.produto.id &&
    prevProps.produto.preco === nextProps.produto.preco
  );
});

export default ProdutoCard;
```

### 12. Dynamic Import com Loading

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <div>Carregando...</div>,
  ssr: false, // Desabilitar SSR se não for necessário
});

export default function Page() {
  return (
    <div>
      <h1>Minha Página</h1>
      <HeavyComponent />
    </div>
  );
}
```

---

## 🔌 API ROUTES

### 13. API com Paginação (Template)

```typescript
// app/api/loja/[dominio]/produtos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PRODUTOS_POR_PAGINA = 20;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dominio: string }> }
) {
  try {
    const { dominio } = await params;
    const searchParams = req.nextUrl.searchParams;
    
    // ✅ PAGINAÇÃO
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(PRODUTOS_POR_PAGINA), 10),
      50
    );
    const offset = (page - 1) * limit;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ✅ QUERY COM CONTAGEM
    const { data, error, count } = await supabase
      .from('produtos')
      .select('*', { count: 'exact' })
      .eq('ativo', true)
      .range(offset, offset + limit - 1)
      .order('nome', { ascending: true });

    if (error) throw error;

    // ✅ RESPOSTA COM METADADOS
    return NextResponse.json({
      produtos: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (offset + limit) < (count || 0),
      },
    });
  } catch (error) {
    console.error('[API Error]:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}
```

---

## 🧪 TESTES

### 14. Script de Teste de Performance (PowerShell)

```powershell
# test_api_performance.ps1

$urls = @(
    "http://localhost:3000/api/loja/demo/info",
    "http://localhost:3000/api/loja/demo/produtos?page=1&limit=20",
    "http://localhost:3000/api/loja/demo/search?q=batom"
)

foreach ($url in $urls) {
    Write-Host "`n🔍 Testando: $url" -ForegroundColor Cyan
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    $stopwatch.Stop()
    
    $tempo = $stopwatch.ElapsedMilliseconds
    $tamanho = [math]::Round($response.RawContentLength / 1024, 2)
    
    Write-Host "   ⏱️  Tempo: $tempo ms" -ForegroundColor Green
    Write-Host "   📦 Tamanho: $tamanho KB" -ForegroundColor Green
    
    if ($tempo -lt 200) {
        Write-Host "   ✅ EXCELENTE" -ForegroundColor Green
    } elseif ($tempo -lt 500) {
        Write-Host "   ⚠️  ACEITÁVEL" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ LENTO" -ForegroundColor Red
    }
}
```

### 15. Lighthouse CI Config

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: ['http://localhost:3000', 'http://localhost:3000/loja/demo'],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
  },
};
```

---

## 📊 MONITORAMENTO

### 16. Vercel Analytics (se usar Vercel)

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

## ✅ CHECKLIST RÁPIDO

```markdown
### Banco de Dados
- [ ] Extensão pg_trgm instalada
- [ ] Índices aplicados (migration 018)
- [ ] VACUUM ANALYZE executado
- [ ] Queries testadas com EXPLAIN ANALYZE

### Backend
- [ ] Paginação implementada em todos os endpoints
- [ ] Headers de cache configurados
- [ ] Logs de performance adicionados

### Frontend
- [ ] TanStack Query instalado e configurado
- [ ] Componentes memoizados (React.memo)
- [ ] Dynamic imports para componentes pesados
- [ ] Infinite scroll implementado

### Imagens
- [ ] next.config.ts configurado
- [ ] Componentes Image com sizes corretos
- [ ] Placeholder blur adicionado
- [ ] Formatos WebP/AVIF habilitados

### Testes
- [ ] Lighthouse score > 90
- [ ] API response time < 500ms
- [ ] Bundle size < 200KB (initial)
```

---

**🎯 DICA FINAL:** Comece pelos índices (item 3) e paginação (item 13). São as mudanças com maior ROI (retorno sobre investimento de tempo)!
