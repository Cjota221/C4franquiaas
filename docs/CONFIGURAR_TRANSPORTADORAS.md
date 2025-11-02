# 🚚 GUIA: Configurar Transportadoras e Taxas

## 🎯 O QUE FOI CRIADO

Agora você tem um **painel completo** para configurar o frete do seu jeito!

---

## 📍 ONDE ACESSAR

1. Vá em: **Admin** → **Configurações** → **Melhor Envio**
2. URL direta: https://c4franquiaas.netlify.app/admin/configuracoes/melhorenvio

---

## ⚙️ O QUE VOCÊ PODE CONFIGURAR

### 1️⃣ **TAXA DE EMBALAGEM** (R$)

💡 **O que é**: Valor que será adicionado em **TODOS** os fretes

**Exemplo:**

- Frete original: R$ 18,50
- Taxa de embalagem: R$ 5,00
- Cliente paga: **R$ 23,50**

**Quando usar**: Para cobrir custo de caixa, plástico bolha, fita, mão de obra

---

### 2️⃣ **FRETE GRÁTIS ACIMA DE** (R$)

💡 **O que é**: Se a compra for maior ou igual a este valor, o frete fica GRÁTIS

**Exemplo:**

- Frete grátis acima de: R$ 100,00
- Cliente compra R$ 120,00 → Frete GRÁTIS! ✨
- Cliente compra R$ 80,00 → Paga o frete normal

**Quando usar**: Para incentivar clientes a comprarem mais

---

### 3️⃣ **PRAZO ADICIONAL** (dias)

💡 **O que é**: Dias extras que você precisa para processar/embalar

**Exemplo:**

- Prazo da transportadora: 8 dias
- Prazo adicional: 2 dias
- Prazo mostrado ao cliente: **10 dias**

**Quando usar**: Se você demora 1-2 dias para separar/embalar

---

### 4️⃣ **ATIVAR/DESATIVAR TRANSPORTADORAS**

💡 **O que é**: Escolher quais transportadoras aparecem no seu site

**Como funciona:**

- ✅ **VERDE (Ativo)** = Cliente VÊ essa opção no site
- ❌ **CINZA (Desativado)** = Cliente NÃO VÊ essa opção

**Exemplo:**

```
✅ Correios PAC      → Cliente vê
✅ Correios SEDEX    → Cliente vê
❌ Jadlog Econômico  → Cliente NÃO vê
✅ Azul Cargo        → Cliente vê
```

**Quando desativar uma transportadora:**

- Preço muito caro
- Demora muito
- Problemas de entrega na região
- Você não quer trabalhar com ela

---

### 5️⃣ **TAXA ADICIONAL POR TRANSPORTADORA** (R$)

💡 **O que é**: Taxa específica para UMA transportadora

**Exemplo:**

- Correios PAC: Taxa adicional R$ 0,00
- Correios SEDEX: Taxa adicional R$ 3,00 (embalagem premium)
- Azul Cargo: Taxa adicional R$ 10,00 (seguro extra)

**Diferença para Taxa de Embalagem Global:**

- **Taxa Global**: Aplica em TODAS as transportadoras
- **Taxa por Transportadora**: Aplica só naquela específica

---

## 📋 PASSO A PASSO (Primeira Configuração)

### **PASSO 1**: Aplicar Migration no Banco de Dados

1. Abra o Supabase: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Copie o conteúdo do arquivo: `migrations/031_config_transportadoras.sql`
4. Cole e execute (Run)
5. ✅ Deve aparecer "Success" (2 tabelas criadas)

### **PASSO 2**: Configurar no Painel

1. Vá em: https://c4franquiaas.netlify.app/admin/configuracoes/melhorenvio
2. Configure:
   - **Taxa de Embalagem**: R$ 5,00 (exemplo)
   - **Frete Grátis**: R$ 150,00 (exemplo, ou deixe vazio)
   - **Prazo Adicional**: 2 dias (exemplo)

### **PASSO 3**: Escolher Transportadoras

1. Role até a seção **"Transportadoras"**
2. Você verá as 7 transportadoras disponíveis
3. Clique em **"Ativo"** para ativar/desativar
4. Se quiser, adicione **Taxa Adicional** específica

**Sugestão inicial:**

```
✅ Correios PAC (R$ 0,00 taxa)
✅ Correios SEDEX (R$ 0,00 taxa)
✅ Jadlog Econômico (R$ 0,00 taxa)
❌ Desativar as outras (por enquanto)
```

### **PASSO 4**: Salvar

1. Clique em **"Salvar Configurações"**
2. ✅ Deve aparecer mensagem verde: "Configurações salvas com sucesso!"

---

## 🧮 EXEMPLO PRÁTICO

### Configuração:

```
Taxa de Embalagem Global: R$ 5,00
Frete Grátis Acima de: R$ 200,00
Prazo Adicional: 2 dias

Transportadoras Ativas:
✅ PAC (Taxa: R$ 0,00)
✅ SEDEX (Taxa: R$ 3,00)
❌ Jadlog (desativado)
```

### Cliente compra R$ 150,00:

```
Opções mostradas:
📦 PAC - R$ 18,50 + R$ 5,00 = R$ 23,50 (8+2 = 10 dias)
📦 SEDEX - R$ 32,00 + R$ 5,00 + R$ 3,00 = R$ 40,00 (2+2 = 4 dias)
```

### Cliente compra R$ 250,00:

```
Opções mostradas:
✅ FRETE GRÁTIS! (compra ≥ R$ 200,00)
```

---

## ⚠️ IMPORTANTE

1. **Todas as transportadoras começam ATIVAS** por padrão
2. **Taxa Global** se soma com **Taxa por Transportadora**
3. **Frete grátis** ignora todas as taxas
4. Clientes **SÓ VEEM** transportadoras ativas (verde)

---

## 🔮 PRÓXIMOS PASSOS (ainda não implementado)

1. Cliente escolher qual frete quer no checkout
2. API aplicar as configurações automaticamente
3. Salvar frete escolhido no pedido

---

## 🆘 PROBLEMAS COMUNS

### "Não aparece nenhuma transportadora"

➜ Aplique a migration 031 no Supabase

### "Não consigo salvar"

➜ Verifique se está logado como admin

### "Transportadoras não carregam"

➜ Verifique se o Melhor Envio está autorizado (verde)

---

## 📊 CHECKLIST

- [ ] Aplicar migration 031 no Supabase
- [ ] Configurar taxa de embalagem
- [ ] Configurar frete grátis (opcional)
- [ ] Ativar/desativar transportadoras
- [ ] Salvar configurações
- [ ] Testar no site (calcular frete)

---

**🎉 PRONTO! Agora você controla totalmente as transportadoras e taxas!**
