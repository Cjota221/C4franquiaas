# 🔧 Troubleshooting - Erros 500 e 400

## 📋 Erros Corrigidos

### ❌ **Erro 500: Internal Server Error**
```
POST /api/franqueada/loja 500 (Internal Server Error)
```

### ❌ **Erro 400: Bad Request (Imagens)**
```
/_next/image?url=http….webp&w=1920&q=75 400 (Bad Request)
```

---

## ✅ Correções Implementadas

### **1. Domínio do Supabase Storage Adicionado**

**Problema:** Next.js não conseguia otimizar imagens do Supabase Storage porque o domínio não estava na lista de permitidos.

**Solução:** Adicionado ao `next.config.ts`:

```typescript
images: {
  domains: [
    'cjotarasteirinhas.com.br', 
    'arquivos.facilzap.app.br', 
    'placehold.co', 
    'c4franquiaas.netlify.app',
    'rprucmoavblepodvanga.supabase.co' // ← Supabase Storage
  ],
  remotePatterns: [
    // ... outros padrões
    { 
      protocol: 'https', 
      hostname: 'rprucmoavblepodvanga.supabase.co', 
      pathname: '/storage/**' 
    },
  ],
}
```

### **2. Logs de Debug Adicionados**

**Problema:** Quando ocorria erro 500, não sabíamos onde estava falhando.

**Solução:** Adicionados logs detalhados na API `/api/franqueada/loja`:

```typescript
console.log('[POST /api/franqueada/loja] Dados recebidos:', {...});
console.log('[POST /api/franqueada/loja] Franqueada autenticada:', franqueada.id);
console.log('[POST /api/franqueada/loja] Domínio validado:', dominio);
console.log('[POST /api/franqueada/loja] Criando loja...');
console.log('[POST /api/franqueada/loja] Loja criada com sucesso:', loja.id);
```

**Onde ver os logs:**
- **Local:** Terminal onde rodou `npm run dev`
- **Netlify:** Deploy logs → Function logs

---

## 🔍 Como Debugar Erros 500

### **Passo 1: Verificar Logs no Terminal Local**

```powershell
# Rode o servidor em modo desenvolvimento
npm run dev

# Faça a ação que gera o erro
# Veja os logs no terminal
```

### **Passo 2: Verificar Logs no Netlify**

```
1. Acesse: https://app.netlify.com/sites/c4franquiaas/logs
2. Procure por "Function logs"
3. Veja os logs da função que falhou
```

### **Passo 3: Verificar Payload no DevTools**

```
1. Abra DevTools (F12)
2. Vá na aba "Network"
3. Faça a requisição
4. Clique na requisição POST
5. Veja "Payload" e "Response"
```

Exemplo de payload esperado:
```json
{
  "nome": "CJ Rasteninhas",
  "dominio": "cjrasteninhas",
  "logo": "https://rprucmoavblepodvanga.supabase.co/storage/v1/object/public/logos/...",
  "cor_primaria": "#DB1472",
  "cor_secundaria": "#F8B81F",
  "ativo": true
}
```

---

## 🔍 Como Debugar Erros 400 (Imagens)

### **Sintomas:**
- Imagem não carrega
- Console mostra: `400 (Bad Request)`
- URL está truncada: `url=htt...`

### **Causas Comuns:**

1. **URL da imagem incompleta**
   ```typescript
   // ❌ Errado
   <img src="htt..." />
   
   // ✅ Correto
   <img src="https://rprucmoavblepodvanga.supabase.co/storage/..." />
   ```

2. **Domínio não permitido no next.config.ts**
   ```typescript
   // Certifique-se de que o domínio está aqui:
   images: {
     domains: ['rprucmoavblepodvanga.supabase.co']
   }
   ```

3. **URL com caracteres especiais**
   ```typescript
   // Use encodeURIComponent
   const url = encodeURIComponent(imageUrl);
   ```

---

## 🧪 Testes após Correção

### **Teste 1: Criar Loja**

```
1. Login: http://localhost:3001/franqueada/login
2. Acesse: http://localhost:3001/franqueada/loja
3. Preencha:
   - Nome: "CJ Rasteninhas"
   - Upload de logo (opcional)
   - Cores: #DB1472 e #F8B81F
4. Clique em "Salvar"
5. ✅ Deve salvar sem erro 500
```

### **Teste 2: Carregar Imagens**

```
1. Após criar loja com logo
2. Abra: http://localhost:3001/loja/cjrasteninhas
3. ✅ Logo deve aparecer sem erro 400
```

### **Teste 3: Verificar Logs**

```
1. Rode: npm run dev
2. Faça a ação (criar loja)
3. Veja no terminal:
   [POST /api/franqueada/loja] Dados recebidos: ...
   [POST /api/franqueada/loja] Franqueada autenticada: ...
   [POST /api/franqueada/loja] Loja criada com sucesso: ...
4. ✅ Deve mostrar todos os logs
```

---

## 🚨 Se o Erro Persistir

### **Erro 500 continua?**

1. **Verifique se a migration 010 foi aplicada:**
   ```sql
   -- No Supabase SQL Editor
   SELECT * FROM lojas LIMIT 1;
   ```
   Se retornar erro "table does not exist", aplique a migration.

2. **Verifique variáveis de ambiente:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://rprucmoavblepodvanga.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

3. **Verifique se a franqueada está aprovada:**
   ```sql
   SELECT id, nome, status, user_id 
   FROM franqueadas 
   WHERE email = 'seu@email.com';
   ```

### **Erro 400 de imagem continua?**

1. **Teste a URL diretamente:**
   ```
   Cole a URL da imagem no navegador
   Se não abrir, a URL está incorreta
   ```

2. **Verifique o bucket no Supabase:**
   ```
   Storage → logos → Veja se o arquivo existe
   ```

3. **Teste sem otimização:**
   ```typescript
   // Use <img> normal temporariamente
   <img src={logo} alt="Logo" />
   // Em vez de <Image>
   ```

---

## 📊 Status das Correções

### **Commit:** `7a59e5e`

**Arquivos modificados:**
- ✅ `next.config.ts` - Domínio Supabase adicionado
- ✅ `app/api/franqueada/loja/route.ts` - Logs de debug adicionados

**Deploy:**
- ✅ Enviado para GitHub
- ✅ Netlify fará deploy automático (~2 min)

---

## 🎯 Próximos Passos

1. **Aguarde o deploy do Netlify** (~2 minutos)
2. **Teste criar loja em produção:**
   ```
   https://c4franquiaas.netlify.app/franqueada/login
   ```
3. **Se der erro, veja os logs:**
   ```
   https://app.netlify.com/sites/c4franquiaas/logs
   ```
4. **Cole os logs aqui para análise**

---

## 📚 Documentação Relacionada

- **Autenticação:** `docs/AUTH_FIX.md`
- **Domínio Automático:** `docs/DOMINIO_AUTOMATICO.md`
- **Teste da Loja:** `docs/TESTE_LOJA.md`
- **Bucket Logos:** `docs/BUCKET_LOGOS.md`

---

## 📅 Última Atualização
22 de outubro de 2025

## 🎉 Status
✅ Correções implementadas  
✅ Logs de debug adicionados  
✅ Build local bem-sucedido  
🚀 Deploy em andamento
