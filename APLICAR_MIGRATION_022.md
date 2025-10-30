# 🎯 Como Aplicar Migration 022 - Módulo Financeiro

## 📋 PRÉ-REQUISITOS

✅ Migration 021 já aplicada  
✅ Sistema de vendas funcionando  
✅ Bibliotecas PIX instaladas (`npm install` já executado)

---

## 🚀 PASSO 1: Aplicar Migration no Supabase

1. **Acesse o Supabase SQL Editor**: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

2. **Copie TODO o conteúdo** do arquivo: `migrations/022_modulo_financeiro.sql`

3. **Cole no SQL Editor** e clique em **RUN**

4. **Resultado esperado**:
   ```
   Success. No rows returned
   ```

---

## ✅ PASSO 2: Verificar Tabelas Criadas

Execute esta query para confirmar:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('franqueadas_dados_pagamento', 'pagamentos_comissao');
```

**Esperado**: 2 linhas retornadas com os nomes das tabelas

---

## ✅ PASSO 3: Verificar Colunas Adicionadas na Tabela `vendas`

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vendas'
  AND column_name IN ('status_comissao', 'data_pagamento_comissao', 'pago_por')
ORDER BY column_name;
```

**Esperado**: 3 linhas mostrando as novas colunas

---

## ✅ PASSO 4: Testar Funções Criadas

```sql
-- Testar função de cálculo de comissão pendente
SELECT calcular_comissao_pendente('ID_DA_FRANQUEADA_AQUI');

-- Testar função de cálculo de comissão paga
SELECT calcular_comissao_paga('ID_DA_FRANQUEADA_AQUI');
```

**Nota**: Substitua `'ID_DA_FRANQUEADA_AQUI'` pelo ID real da franqueada que você descobriu na migration 021.

---

## 🧪 PASSO 5: Testar Biblioteca PIX (Opcional)

Crie um arquivo de teste: `scripts/test-pix.ts`

```typescript
import { gerarPayloadPix, gerarQRCodePix } from '@/lib/pix';

const dadosTeste = {
  chave: '12345678900',
  valor: 150.0,
  nome: 'Maria Silva',
  cidade: 'Sao Paulo',
  descricao: 'Teste de Comissao',
};

const payload = gerarPayloadPix(dadosTeste);
console.log('Payload PIX:', payload);

const qrCode = await gerarQRCodePix(payload);
console.log('QR Code gerado! Tamanho:', qrCode.length);
```

Execute:

```bash
npx ts-node scripts/test-pix.ts
```

---

## 🎯 PRÓXIMOS PASSOS

Após aplicar a migration com sucesso:

1. ✅ Criar formulário de dados PIX para franqueada
2. ✅ Criar página "Minhas Comissões" (franqueada)
3. ✅ Refatorar tabela de vendas (admin)
4. ✅ Criar página "Controle de Comissões" (admin)

---

## 🐛 POSSÍVEIS ERROS

### Erro: "relation already exists"

**Causa**: Tabela já foi criada antes  
**Solução**: A migration usa `IF NOT EXISTS`, então pode ignorar

### Erro: "column already exists"

**Causa**: Coluna já foi adicionada antes  
**Solução**: A migration usa `IF NOT EXISTS`, então pode ignorar

### Erro: "foreign key constraint"

**Causa**: ID de franqueada inválido  
**Solução**: Use apenas IDs que existem na tabela `auth.users`

---

## ✅ CHECKLIST FINAL

- [ ] Tabelas `franqueadas_dados_pagamento` e `pagamentos_comissao` criadas
- [ ] Colunas `status_comissao`, `data_pagamento_comissao`, `pago_por` adicionadas em `vendas`
- [ ] Índices criados (idx_dados_pagamento_franqueada, idx_vendas_status_comissao, etc)
- [ ] Funções criadas (calcular_comissao_pendente, calcular_comissao_paga)
- [ ] Políticas RLS configuradas
- [ ] Bibliotecas PIX instaladas (`qrcode`, `pix-payload`)
- [ ] Arquivo `lib/pix/gerador-payload.ts` criado
- [ ] Arquivo `lib/pix/gerador-qrcode.ts` criado
- [ ] Arquivo `types/financeiro.ts` criado

---

## 📞 SUPORTE

Se encontrar algum erro, me envie:

1. Print do erro do Supabase
2. Query SQL que executou
3. Resultado do SELECT de verificação
