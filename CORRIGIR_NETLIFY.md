# 🚨 URGENTE: Corrigir variável no Netlify

## Problema Detectado:

A variável `NEXT_PUBLIC_MELHORENVIO_SANDBOX` está configurada como `"true"` mas deveria ser `"false"` pois você está usando o ambiente de PRODUÇÃO do Melhor Envio.

## Como Corrigir:

1. **Acesse:** https://app.netlify.com/sites/c4franquiaas/configuration/env
2. **Procure:** `NEXT_PUBLIC_MELHORENVIO_SANDBOX`
3. **Altere de:** `true`
4. **Para:** `false`
5. **Clique em:** Save
6. **Depois clique em:** Trigger deploy → Deploy site

## Por que isso é importante?

Com `sandbox=true`, o sistema tenta acessar:

- ❌ `https://sandbox.melhorenvio.com.br/api/v2` (ambiente de testes)

Com `sandbox=false`, o sistema acessa corretamente:

- ✅ `https://melhorenvio.com.br/api/v2` (ambiente de produção)

Seu token é de PRODUÇÃO, por isso está dando "Unauthenticated" no sandbox!
