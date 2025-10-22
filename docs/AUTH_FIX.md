# 🔐 Sistema de Autenticação - Correção "Não Autenticado"

## ❌ Problema Original

Ao tentar criar/editar a loja em `/franqueada/loja`, aparecia o erro:
```
"Não autenticado"
```

Mesmo estando logada corretamente.

---

## 🔍 Causa do Problema

### **Por que acontecia:**

As APIs no Next.js App Router (Server Side) **não conseguem acessar automaticamente** os cookies de autenticação do Supabase quando usam apenas `supabase.auth.getUser()`.

**Código que NÃO funcionava:**
```typescript
// ❌ NÃO funciona em API Routes
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
}
```

### **Por que não funcionava:**

1. Cliente faz login → Supabase salva sessão **no navegador** (localStorage/cookies)
2. Cliente chama API → API roda **no servidor** (não tem acesso ao navegador)
3. API tenta pegar usuário → **Não encontra** (sessão está no navegador, não no servidor)
4. Resultado: "Não autenticado" ❌

---

## ✅ Solução Implementada

### **Sistema de Bearer Token**

Agora usamos o padrão **Authorization: Bearer Token** para autenticar:

```
Cliente (Navegador)                 Servidor (API)
     │                                    │
     │  1. Login com Supabase             │
     │     supabase.auth.signIn()         │
     │                                    │
     │  2. Salva access_token             │
     │     localStorage/session           │
     │                                    │
     │  3. Faz requisição com token       │
     ├───────────────────────────────────>│
     │  Authorization: Bearer <token>     │
     │                                    │
     │                                    │  4. Valida token
     │                                    │     getAuthUser(token)
     │                                    │
     │                                    │  5. Busca franqueada
     │                                    │     getAuthFranqueada()
     │                                    │
     │  6. Responde com dados             │
     │<───────────────────────────────────┤
     │  { loja: {...} }                   │
```

---

## 🛠️ Arquivos Criados/Modificados

### **1. `lib/auth.ts` (NOVO)**

Helper de autenticação no servidor:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  supabaseUrl, 
  supabaseServiceKey
);

/**
 * Pega usuário autenticado a partir do token
 */
export async function getAuthUser(authHeader?: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Token não fornecido' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  return { user, error: error ? 'Token inválido' : null };
}

/**
 * Pega franqueada logada
 */
export async function getAuthFranqueada(authHeader?: string | null) {
  const { user, error } = await getAuthUser(authHeader);
  if (error || !user) {
    return { franqueada: null, error };
  }

  const { data: franqueada } = await supabaseAdmin
    .from('franqueadas')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return { franqueada, error: null };
}
```

### **2. `lib/authenticatedFetch.ts` (NOVO)**

Helper para requisições autenticadas no cliente:

```typescript
import { supabase } from './supabaseClient';

/**
 * Faz requisição autenticada para a API
 * Inclui automaticamente o token no header
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  // Pegar token da sessão atual
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Não autenticado');
  }

  // Adicionar token no header
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${session.access_token}`);

  return fetch(url, { ...options, headers });
}
```

### **3. APIs Atualizadas**

**Antes:**
```typescript
// ❌ NÃO funcionava
export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  // ...
}
```

**Depois:**
```typescript
// ✅ Funciona!
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const { franqueada, error } = await getAuthFranqueada(authHeader);
  
  if (error || !franqueada) {
    return NextResponse.json({ error }, { status: 401 });
  }
  // ...
}
```

**APIs modificadas:**
- ✅ `app/api/franqueada/loja/route.ts` (GET e POST)
- ✅ `app/api/franqueada/loja/update/route.ts` (PUT)
- ✅ `app/api/franqueada/loja/upload-logo/route.ts` (POST)

### **4. Frontend Atualizado**

**Antes:**
```typescript
// ❌ Não enviava token
const res = await fetch('/api/franqueada/loja');
```

**Depois:**
```typescript
// ✅ Envia token automaticamente
const res = await authenticatedFetch('/api/franqueada/loja');
```

---

## 🧪 Como Testar

### **Passo 1: Fazer Login**

```
1. Acesse: http://localhost:3001/franqueada/login
2. Faça login com credenciais válidas
3. Será redirecionado para /franqueada/dashboard
```

### **Passo 2: Acessar Página da Loja**

```
1. Acesse: http://localhost:3001/franqueada/loja
2. Agora NÃO deve aparecer erro "Não autenticado"
3. Deve carregar a loja (se existir) ou formulário vazio
```

### **Passo 3: Criar Loja**

```
1. Digite nome: "Minha Loja Teste"
2. Veja domínio sendo gerado: "minhalojatest"
3. Faça upload de logo (opcional)
4. Escolha cores
5. Clique em "Salvar Alterações"
6. ✅ Deve salvar com sucesso!
7. ✅ Deve aparecer link: https://c4franquiaas.netlify.app/loja/minhalojateste
```

### **Passo 4: Verificar Link**

```
1. Copie o link da loja
2. Clique em "Abrir Loja"
3. ✅ Deve abrir a loja pública em nova aba
4. ✅ Deve carregar com as cores escolhidas
```

---

## 🔍 Verificar no Console do Navegador

Abra o DevTools (F12) e veja as requisições:

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (sucesso):**
```json
{
  "loja": {
    "id": "...",
    "nome": "Minha Loja Teste",
    "dominio": "minhalojateste",
    "logo": "https://...",
    "cor_primaria": "#DB1472",
    "cor_secundaria": "#F8B81F",
    "ativo": true
  }
}
```

---

## 🚨 Troubleshooting

### **Erro: "Token não fornecido"**

**Causa:** Sessão expirou ou usuário não está logado

**Solução:**
```
1. Fazer logout: supabase.auth.signOut()
2. Fazer login novamente
3. Tentar novamente
```

### **Erro: "Token inválido"**

**Causa:** Token corrompido ou expirado

**Solução:**
```
1. Limpar localStorage
2. Fazer login novamente
```

### **Erro: "Franqueada não encontrada"**

**Causa:** user_id não está vinculado a nenhuma franqueada

**Solução:**
```
1. Verificar no Supabase se a franqueada foi aprovada
2. Reprovar e aprovar novamente no admin
```

---

## 📊 Fluxo Completo de Autenticação

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LOGIN                                                    │
│                                                             │
│ Cliente                           Servidor                  │
│   │                                  │                      │
│   │  POST /auth/signin               │                      │
│   ├─────────────────────────────────>│                      │
│   │  { email, password }             │                      │
│   │                                  │                      │
│   │  ← { access_token, refresh... }  │                      │
│   │<─────────────────────────────────┤                      │
│   │                                  │                      │
│   │  Salva no localStorage           │                      │
│   │  ✓                               │                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. REQUISIÇÃO AUTENTICADA                                   │
│                                                             │
│ Cliente                           API                       │
│   │                                  │                      │
│   │  GET /api/franqueada/loja        │                      │
│   │  Authorization: Bearer <token>   │                      │
│   ├─────────────────────────────────>│                      │
│   │                                  │                      │
│   │                                  │  ✓ Valida token      │
│   │                                  │  ✓ Busca franqueada  │
│   │                                  │  ✓ Busca loja        │
│   │                                  │                      │
│   │  ← { loja: {...} }               │                      │
│   │<─────────────────────────────────┤                      │
│   │                                  │                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Benefícios da Solução

✅ **Segurança:** Token validado no servidor  
✅ **Padrão REST:** Usa Authorization header (padrão da indústria)  
✅ **Escalável:** Funciona com qualquer API  
✅ **Debugging:** Fácil ver token no DevTools  
✅ **Flexível:** Funciona com Supabase, Auth0, JWT, etc.

---

## 📅 Última Atualização
22 de outubro de 2025

## 🎉 Status
✅ Problema resolvido  
✅ Build local bem-sucedido  
✅ Pronto para deploy  
✅ Pronto para testar
