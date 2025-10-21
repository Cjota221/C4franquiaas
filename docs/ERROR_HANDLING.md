# 🚨 Sistema de Tratamento de Erros Melhorado

**Data:** 21 de outubro de 2025  
**Arquivos Modificados:**
- `components/ClientErrorLogger.tsx`
- `components/ErrorBoundary.tsx`
- `app/layout.tsx`
- `next.config.ts`

---

## 🎯 Problema Original

Erro genérico no console:
```
ClientErrorLogger: window.onerror Object
```

**Causa:** O logger estava capturando erros, mas não conseguia serializar objetos complexos corretamente, exibindo apenas `Object` sem detalhes úteis.

---

## ✅ Soluções Implementadas

### 1. **ClientErrorLogger Aprimorado**

#### Melhorias:
- ✅ **Função `serializeError()`** - Extrai informações de qualquer tipo de erro
- ✅ **Suporte para múltiplos tipos de erro:**
  - `Error` padrão (com stack trace)
  - Objetos personalizados
  - Strings
  - Valores primitivos
  - Objetos não serializáveis
- ✅ **Extração de propriedades customizadas:**
  - `statusCode`, `code`, `response`, `request`, `config`, `data`
- ✅ **Logging estruturado com `console.group()`**
- ✅ **Fallback seguro** caso o próprio logging falhe
- ✅ **Captura de erros do React** no console.error

#### Exemplo de Output Melhorado:

**Antes:**
```
ClientErrorLogger: window.onerror Object
```

**Agora:**
```
❌ ClientErrorLogger: window.onerror
  📋 Error Details: {
    message: "Cannot read property 'map' of undefined",
    filename: "page.tsx",
    line: 45,
    column: 12,
    timestamp: "2025-10-21T10:30:00.000Z"
  }
  🔍 Error Object: {
    type: "Error",
    name: "TypeError",
    message: "Cannot read property 'map' of undefined",
    stack: "TypeError: Cannot read property 'map' of undefined\n    at ProductList (page.tsx:45:12)\n    at ...",
    statusCode: undefined,
    code: undefined
  }
```

---

### 2. **ErrorBoundary React Component**

#### Características:
- ✅ Captura erros de renderização de componentes React
- ✅ Exibe UI de fallback amigável
- ✅ Mostra detalhes em modo desenvolvimento
- ✅ Botão "Tentar novamente" para recuperação
- ✅ Logging detalhado com component stack
- ✅ Preparado para integração com Sentry/LogRocket

#### Estrutura:
```tsx
<ErrorBoundary>
  {children}
</ErrorBoundary>
```

#### UI de Erro:
```
⚠️ Algo deu errado
Ocorreu um erro ao renderizar este componente.

[Ver detalhes do erro (modo desenvolvimento)]
  Erro: TypeError: Cannot read property 'map' of undefined
  Stack: ...
  Component Stack: ...

[🔄 Tentar novamente]
```

---

### 3. **Source Maps em Produção**

Adicionado no `next.config.ts`:
```typescript
productionBrowserSourceMaps: true
```

**Benefícios:**
- ✅ Stack traces legíveis em produção
- ✅ Mapeamento de erros para código fonte original
- ✅ Debugging mais fácil em ambiente de produção
- ⚠️ **Nota:** Source maps aumentam o tamanho do build, mas melhoram significativamente o debugging

---

## 📊 Tipos de Erros Capturados

### 1. **window.onerror** (JavaScript global)
```javascript
// Captura erros como:
- ReferenceError: variavel is not defined
- TypeError: undefined is not a function
- SyntaxError (em scripts dinâmicos)
```

### 2. **unhandledrejection** (Promises)
```javascript
// Captura rejeições não tratadas:
fetch('/api/data').then(res => res.json())
// Se a promise for rejeitada e não houver .catch()
```

### 3. **React Error Boundary** (Renderização)
```javascript
// Captura erros dentro de componentes:
- Erros em render()
- Erros em lifecycle methods
- Erros em hooks (useEffect, etc)
```

### 4. **console.error** (React warnings)
```javascript
// Captura avisos do React:
- Warning: Can't perform a React state update on unmounted component
- Warning: Each child in a list should have a unique "key" prop
```

---

## 🔧 Como Usar

### Modo Desenvolvimento

Todos os erros são exibidos com detalhes completos:
```bash
npm run dev
```

Os logs incluem:
- Mensagem do erro
- Stack trace completo
- Component stack (quando aplicável)
- Linha e coluna do erro
- Timestamp

### Modo Produção

Com source maps habilitados:
```bash
npm run build
npm start
```

Os erros são capturados e enviados para o console com:
- Mensagem sanitizada
- Stack trace mapeado para código fonte
- Informações de contexto

---

## 🐛 Exemplos de Erros Capturados

### Exemplo 1: Erro de API
```typescript
// Código
const data = await fetch('/api/produtos/invalid-id').then(r => r.json());

// Log capturado
❌ ClientErrorLogger: unhandledrejection
  📋 Rejection Details: {
    timestamp: "2025-10-21T10:30:00.000Z",
    promise: "[object Promise]"
  }
  🔍 Rejection Reason: {
    type: "object",
    constructor: "Response",
    message: undefined,
    code: undefined,
    statusCode: 500,
    json: "{\n  \"error\": \"Internal Server Error\"\n}"
  }
```

### Exemplo 2: Erro de Renderização
```typescript
// Código
function ProductList({ produtos }) {
  return produtos.map(p => <div key={p.id}>{p.nome}</div>);
  // produtos é undefined!
}

// Log capturado
❌ ErrorBoundary: Erro capturado
  ❌ Erro: TypeError: Cannot read property 'map' of undefined
  📍 Onde: at ProductList (page.tsx:45:12)
  🔍 Component Stack:
    in ProductList (at page.tsx:45:12)
    in ProductsPage (at page.tsx:20:5)
```

### Exemplo 3: Erro de Objeto Complexo
```typescript
// Código
throw { statusCode: 400, message: 'Invalid request', data: { field: 'email' } };

// Log capturado
🔍 Error Object: {
  type: "object",
  constructor: "Object",
  message: "Invalid request",
  code: undefined,
  statusCode: 400,
  details: { field: "email" },
  json: "{\n  \"statusCode\": 400,\n  \"message\": \"Invalid request\",\n  \"data\": {\n    \"field\": \"email\"\n  }\n}",
  keys: [ "statusCode", "message", "data" ]
}
```

---

## 🚀 Integração com Serviços de Monitoramento

### Preparado para Sentry

No `ErrorBoundary.tsx`, adicione:
```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  // ... logging existente ...
  
  // Enviar para Sentry
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    });
  }
}
```

### Preparado para LogRocket

No `ClientErrorLogger.tsx`, adicione:
```typescript
function onError(event: ErrorEvent) {
  // ... logging existente ...
  
  // Enviar para LogRocket
  if (typeof window !== 'undefined' && window.LogRocket) {
    window.LogRocket.captureException(event.error, {
      tags: {
        filename: event.filename,
        line: event.lineno,
        column: event.colno
      }
    });
  }
}
```

---

## 📋 Checklist de Debugging

Quando um erro ocorrer em produção:

1. **Verificar Console do Navegador**
   - [ ] Abrir DevTools (F12)
   - [ ] Procurar por grupos de erro (❌ ClientErrorLogger, 🚨 ErrorBoundary)
   - [ ] Expandir detalhes do erro

2. **Analisar Stack Trace**
   - [ ] Identificar arquivo e linha do erro
   - [ ] Verificar se source maps estão funcionando
   - [ ] Traçar caminho de execução

3. **Verificar Context**
   - [ ] Timestamp do erro
   - [ ] Component stack (para erros React)
   - [ ] Request/response (para erros de API)

4. **Reproduzir Localmente**
   - [ ] Copiar dados relevantes
   - [ ] Executar em modo desenvolvimento
   - [ ] Adicionar breakpoints

5. **Aplicar Correção**
   - [ ] Implementar fix
   - [ ] Adicionar testes
   - [ ] Verificar error handling adequado

---

## 🔍 Troubleshooting

### Source Maps não funcionam

**Problema:** Stack traces ainda mostram código minificado

**Solução:**
```typescript
// next.config.ts
productionBrowserSourceMaps: true
```

Rebuild e redeploy:
```bash
npm run build
```

### ErrorBoundary não captura erro

**Problema:** Alguns erros não são capturados pelo Error Boundary

**Causa:** Error Boundaries não capturam:
- Erros em event handlers (use try/catch)
- Erros assíncronos (use .catch() ou try/catch)
- Erros no próprio Error Boundary

**Solução:**
```typescript
// Para event handlers
async function handleClick() {
  try {
    await fetchData();
  } catch (error) {
    console.error('Error in event handler:', error);
  }
}

// Para código assíncrono
useEffect(() => {
  fetchData().catch(error => {
    console.error('Error in async effect:', error);
  });
}, []);
```

### Muitos logs no console

**Problema:** Console poluído com logs de erro

**Solução:** Use `console.group()` para colapsar logs:
```typescript
// Já implementado no ClientErrorLogger
console.group('❌ Error');
// ... logs ...
console.groupEnd();
```

---

## 📊 Métricas de Erro

Para monitorar a saúde da aplicação, considere rastrear:

1. **Taxa de Erro:** Erros / Total de pageviews
2. **Erros Únicos:** Diferentes stack traces
3. **Erros por Página:** Onde os erros ocorrem mais
4. **Erros por Browser:** Compatibilidade
5. **Taxa de Recuperação:** Uso do botão "Tentar novamente"

---

## 📞 Suporte

Em caso de erros em produção:

1. **Capturar logs completos do console**
2. **Incluir timestamp e contexto**
3. **Verificar Network tab** para erros de API
4. **Reproduzir localmente** se possível
5. **Reportar com detalhes completos**

---

**Documentação criada em:** 21/10/2025  
**Última atualização:** Sistema de error handling completo implementado
