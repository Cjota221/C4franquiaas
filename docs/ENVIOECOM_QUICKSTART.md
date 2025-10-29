# 🚀 Quick Start - Integração Envioecom

## ⚡ Configuração Rápida (5 minutos)

### 1. Obter Credenciais

1. Acesse: https://painel.envioecom.com.br/
2. Vá em **Configurações → API**
3. Copie seu **SLUG** e **E_TOKEN**

### 2. Configurar Projeto

Edite `.env.local`:

```bash
NEXT_PUBLIC_ENVIOECOM_SLUG=seu_slug_aqui
NEXT_PUBLIC_ENVIOECOM_ETOKEN=seu_token_aqui
```

### 3. Reiniciar Servidor

```bash
npm run dev
```

### 4. Usar!

Acesse: `http://localhost:3000/admin/vendas`

---

## 💡 Funcionalidades Disponíveis

### ✅ Na Página de Vendas (`/admin/vendas`)

**Botão "Gerar Etiqueta"**:
- Aparece para todos os pedidos
- **Desabilitado** até o pagamento ser confirmado
- Quando habilitado: gera etiqueta automaticamente via API
- Abre PDF em nova aba
- Salva código de rastreio no banco

**Botão "🔍 Rastrear"**:
- Aparece **apenas** se o pedido tiver código de rastreio
- Abre modal com timeline de movimentações
- Atualiza status em tempo real

---

## 📋 Checklist de Teste

- [ ] Configurei `NEXT_PUBLIC_ENVIOECOM_SLUG`
- [ ] Configurei `NEXT_PUBLIC_ENVIOECOM_ETOKEN`
- [ ] Reiniciei o servidor (`npm run dev`)
- [ ] Acessei `/admin/vendas`
- [ ] Botão "Gerar Etiqueta" está desabilitado para pedidos não pagos ✅
- [ ] Mudei status do pedido para "pago"
- [ ] Botão "Gerar Etiqueta" foi habilitado ✅
- [ ] Cliquei e a etiqueta foi gerada
- [ ] PDF abriu em nova aba ✅
- [ ] Código de rastreio foi salvo no banco ✅
- [ ] Botão "🔍 Rastrear" apareceu ✅
- [ ] Modal de rastreamento mostra eventos ✅

---

## 🐛 Problemas Comuns

### Botão desabilitado?

```
✅ Solução: Confirme o pagamento do pedido
Status deve ser: "pago" ou "separado"
```

### Erro "Credenciais não configuradas"?

```
✅ Solução: Verifique se .env.local existe e contém:
NEXT_PUBLIC_ENVIOECOM_SLUG=...
NEXT_PUBLIC_ENVIOECOM_ETOKEN=...

Reinicie: npm run dev
```

### Erro 401?

```
✅ Solução: SLUG ou TOKEN inválidos
1. Acesse painel Envioecom
2. Regenere o token
3. Atualize .env.local
```

---

## 📚 Documentação Completa

Leia: [`docs/ENVIOECOM.md`](./ENVIOECOM.md)

**Contém**:
- Exemplos de código avançados
- Arquitetura técnica
- Segurança e boas práticas
- Troubleshooting detalhado

---

## 🎯 Próximos Passos

### Para Cotação de Frete (opcional)

Use o componente `EnvioecomIntegrationPanel`:

```tsx
import { EnvioecomIntegrationPanel } from '@/components/admin/EnvioecomIntegrationPanel';

<EnvioecomIntegrationPanel
  onSelectServico={(servico) => {
    console.log('Selecionado:', servico.nome, servico.preco);
  }}
/>
```

### Para Rastreamento Customizado

Use o hook `useRastreamento`:

```tsx
import { useRastreamento } from '@/hooks/useEnvioecom';

const { rastrear, rastreio, isLoading } = useRastreamento();

useEffect(() => {
  rastrear('ABC123456789BR');
}, []);
```

---

**✅ Integração 100% funcional!**

Qualquer dúvida: leia [`docs/ENVIOECOM.md`](./ENVIOECOM.md)
