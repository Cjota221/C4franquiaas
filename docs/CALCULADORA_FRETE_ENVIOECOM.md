# 🚚 Calculadora de Frete com EnvioEcom - INTEGRAÇÃO REAL

## 📋 O que foi implementado

A calculadora de frete agora está **integrada com a EnvioEcom** para buscar **valores e prazos REAIS** das transportadoras, em vez de usar valores fixos do banco de dados.

---

## ✅ Funcionalidades

### 1. **Integração Real com EnvioEcom**

- Busca opções de frete **em tempo real** via API EnvioEcom
- Retorna **múltiplas transportadoras** (PAC, SEDEX, etc) com valores reais
- Calcula prazo de entrega baseado no CEP de origem e destino

### 2. **Fallback Inteligente**

- Se EnvioEcom não estiver configurada: usa valores fixos da tabela `lojas`
- Se houver erro na API: retorna valores padrão automaticamente
- Sistema **nunca quebra** - sempre retorna alguma opção de frete

### 3. **Frete Grátis Automático**

- Se o valor do carrinho >= `frete_gratis_valor`: adiciona opção "Frete Grátis"
- Funciona tanto com EnvioEcom quanto com valores fixos

---

## 🔧 Configuração

### Passo 1: Aplicar Migration

Execute a migration 028 no Supabase SQL Editor:

```bash
# Copiar conteúdo de: migrations/028_add_cep_origem_lojas.sql
```

Ou via terminal:

```sql
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS cep_origem VARCHAR(8);
UPDATE lojas SET cep_origem = '01310100' WHERE cep_origem IS NULL;
```

### Passo 2: Configurar EnvioEcom (se ainda não tiver)

Adicione no arquivo `.env.local`:

```bash
NEXT_PUBLIC_ENVIOECOM_SLUG=seu_slug_aqui
NEXT_PUBLIC_ENVIOECOM_ETOKEN=seu_token_aqui
```

**Onde encontrar essas credenciais:**

1. Acesse: https://painel.envioecom.com.br/
2. Vá em **Configurações → API**
3. Copie o **SLUG** e o **E_TOKEN**

### Passo 3: Atualizar CEP de Origem (opcional)

Por padrão, todas as lojas usam CEP `01310100` (São Paulo). Para alterar:

```sql
UPDATE lojas
SET cep_origem = '12345678'
WHERE dominio = 'seudominio.com';
```

---

## 📡 Como Funciona

### Fluxo da API `/api/calcular-frete`

```
1. Cliente digita CEP no site
   ↓
2. ShippingCalculator envia POST para /api/calcular-frete
   Body: { cep, dominio, valorCarrinho?, peso?, altura?, largura?, comprimento? }
   ↓
3. API busca dados da loja (cep_origem, frete_gratis_valor)
   ↓
4. API verifica se EnvioEcom está configurada

   ┌─ SIM → Chama API EnvioEcom
   │   ├─ Sucesso → Retorna opções reais (PAC, SEDEX, etc)
   │   └─ Erro → Fallback para valores fixos
   │
   └─ NÃO → Retorna valores fixos da tabela lojas

5. Retorna JSON com opções de frete
```

### Request da API

```typescript
POST /api/calcular-frete
Content-Type: application/json

{
  "cep": "12345678",              // Obrigatório
  "dominio": "minhaloja.com.br",  // Obrigatório
  "valorCarrinho": 199.90,        // Opcional (para frete grátis)
  "peso": 500,                    // Opcional (gramas) - padrão: 500g
  "altura": 10,                   // Opcional (cm) - padrão: 10cm
  "largura": 15,                  // Opcional (cm) - padrão: 15cm
  "comprimento": 20               // Opcional (cm) - padrão: 20cm
}
```

### Response da API

**Com EnvioEcom configurada:**

```json
{
  "success": true,
  "cep": "12345678",
  "usando_envioecom": true,
  "opcoes": [
    {
      "nome": "PAC",
      "valor": 18.5,
      "prazo": "7 dias úteis",
      "codigo": "pac_correios",
      "transportadora": "Correios",
      "servico_id": "pac_correios"
    },
    {
      "nome": "SEDEX",
      "valor": 35.9,
      "prazo": "3 dias úteis",
      "codigo": "sedex_correios",
      "transportadora": "Correios",
      "servico_id": "sedex_correios"
    },
    {
      "nome": "Frete Grátis",
      "valor": 0,
      "prazo": "10-15 dias úteis",
      "codigo": "GRATIS",
      "transportadora": "Loja",
      "servico_id": "GRATIS"
    }
  ],
  "configuracao": {
    "freteGratisValor": 150.0,
    "cepOrigem": "01310100"
  }
}
```

**Sem EnvioEcom (fallback):**

```json
{
  "success": true,
  "cep": "12345678",
  "usando_envioecom": false,
  "opcoes": [
    {
      "nome": "Correios - PAC",
      "valor": 15.9,
      "prazo": "7-10 dias úteis",
      "codigo": "PAC",
      "transportadora": "Correios"
    }
  ],
  "configuracao": {
    "valorFrete": 15.9,
    "freteGratisValor": 150.0
  }
}
```

---

## 🧪 Como Testar

### Teste 1: Com EnvioEcom Configurada

1. Configure `.env.local` com credenciais EnvioEcom
2. Reinicie o servidor: `npm run dev`
3. Acesse uma página de produto
4. Digite um CEP
5. Clique em "Calcular Frete"
6. **Resultado esperado**: Você verá opções reais de PAC, SEDEX, etc com valores e prazos da EnvioEcom

### Teste 2: Sem EnvioEcom (Fallback)

1. Remova ou comente as credenciais em `.env.local`
2. Reinicie o servidor
3. Acesse uma página de produto
4. Digite um CEP
5. Clique em "Calcular Frete"
6. **Resultado esperado**: Você verá valor fixo do banco (R$ 15,90 padrão)

### Teste 3: Frete Grátis

1. Configure `frete_gratis_valor` na tabela `lojas`:
   ```sql
   UPDATE lojas SET frete_gratis_valor = 150.00 WHERE dominio = 'seudominio.com';
   ```
2. Acesse produto com carrinho >= R$ 150
3. Calcule frete
4. **Resultado esperado**: Opção "Frete Grátis" aparece na lista

---

## 🔍 Debug

### Ver logs da API

Abra o console do servidor (`npm run dev`). Procure por:

```
[Calcular Frete] EnvioEcom não configurado, usando valores padrão
[Calcular Frete] Erro na EnvioEcom: ...
```

### Testar endpoint diretamente

Use Postman/Insomnia:

```bash
POST http://localhost:3000/api/calcular-frete
Content-Type: application/json

{
  "cep": "01310100",
  "dominio": "seudominio.com.br"
}
```

---

## 📊 Diferenças: Antes vs Depois

### ANTES (Fake)

- ❌ Valores fixos no banco de dados
- ❌ Sempre retorna R$ 15,90
- ❌ Prazo genérico "7-10 dias"
- ❌ Não considera CEP de destino

### DEPOIS (Real)

- ✅ Integração com EnvioEcom
- ✅ Valores reais calculados por transportadora
- ✅ Múltiplas opções (PAC, SEDEX, etc)
- ✅ Prazo calculado para CEP específico
- ✅ Fallback inteligente se houver erro

---

## 🚀 Próximos Passos

1. **Adicionar peso/dimensões dos produtos**: Atualmente usa valores padrão (500g, 10x15x20cm). Idealmente, cada produto deve ter essas informações.

2. **Salvar opção escolhida**: Quando cliente escolher uma opção de frete, salvar `servico_id` no pedido para gerar etiqueta depois.

3. **Exibir múltiplas opções**: Atualmente o ShippingCalculator só mostra um resultado. Atualizar para mostrar todas as opções (PAC, SEDEX, etc).

---

## ❓ FAQ

**P: E se a EnvioEcom estiver fora do ar?**  
R: O sistema usa fallback automático. Retorna valores fixos da tabela `lojas`.

**P: Como atualizar o CEP de origem?**  
R: Via SQL: `UPDATE lojas SET cep_origem = 'XXXXXXXX' WHERE id = 'loja_id';`

**P: Os valores são cobrados?**  
R: A cotação é **gratuita**. Só é cobrado quando você gerar a etiqueta de envio.

**P: Preciso ter conta na EnvioEcom?**  
R: Não é obrigatório. Sem conta, o sistema usa valores fixos (modo fallback).

---

## 📝 Commits

```bash
git add .
git commit -m "feat: integra calculadora de frete com EnvioEcom - valores reais"
git push
```

---

**Autor**: Ayar  
**Data**: 01/11/2025  
**Status**: ✅ Pronto para produção
