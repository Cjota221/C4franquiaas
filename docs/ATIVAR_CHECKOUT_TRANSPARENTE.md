# 🔄 Como Ativar o Checkout Transparente

## Método 1: Renomear Arquivos (RECOMENDADO)

```powershell
# 1. Backup da versão antiga
Rename-Item components/loja/CheckoutForm.tsx CheckoutForm.OLD.tsx

# 2. Ativar a nova versão
Rename-Item components/loja/CheckoutFormTransparente.tsx CheckoutForm.tsx
```

**Pronto!** O checkout transparente está ativo.

---

## Método 2: Editar Importação

Encontre onde o CheckoutForm é importado (provavelmente em `app/loja/[dominio]/checkout/page.tsx`):

**ANTES:**

```tsx
import CheckoutForm from '@/components/loja/CheckoutForm';
```

**DEPOIS:**

```tsx
import CheckoutForm from '@/components/loja/CheckoutFormTransparente';
```

---

## Método 3: Substituir Conteúdo (mais trabalhoso)

Copiar todo o conteúdo de `CheckoutFormTransparente.tsx` e colar em `CheckoutForm.tsx`, substituindo tudo.

---

## ✅ Verificar se Funcionou

1. Acesse o checkout: `http://localhost:3000/loja/[dominio]/checkout`
2. Preencha o formulário
3. Clique em "Continuar para Pagamento"
4. **Deve aparecer:** Seletor entre PIX e Cartão de Crédito

Se aparecer o seletor, está funcionando! 🎉

---

## 🔙 Voltar para Versão Antiga (se necessário)

```powershell
# Desativar transparente
Rename-Item components/loja/CheckoutForm.tsx CheckoutFormTransparente.tsx

# Restaurar antiga
Rename-Item components/loja/CheckoutForm.OLD.tsx CheckoutForm.tsx
```

---

## 📋 Checklist Pré-Deploy

- [ ] Testado localmente com PIX
- [ ] Testado localmente com Cartão
- [ ] Verificado logs do navegador
- [ ] Confirmado que webhook funciona
- [ ] Public Key configurada no Netlify
- [ ] Access Token configurado no Netlify
- [ ] Banco de dados: `mp_ativado=true`
- [ ] Banco de dados: `mp_modo_producao=true` (ou false para teste)

---

Está pronto para testar! 🚀
