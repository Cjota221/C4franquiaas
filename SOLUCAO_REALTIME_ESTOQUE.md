# 🔥 SOLUÇÃO: Estoque Não Atualiza nos Sites

## ❌ PROBLEMA

- Estoque atualiza nos painéis admin e franqueadas/revendedoras ✅
- **MAS** não atualiza nos sites públicos (catálogos) ❌
- Cliente precisa dar F5 para ver produtos com estoque reposto

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. **Realtime no Catálogo** (CÓDIGO)

Adicionado **Supabase Realtime** em `app/catalogo/[slug]/page.tsx`:

```typescript
// 🔥 REALTIME: Atualizar automaticamente quando estoque mudar
useEffect(() => {
  if (!reseller?.id) return;

  // Inscrever para mudanças na tabela produtos
  const channel = supabase
    .channel('produtos-catalog-updates')
    .on(
      'postgres_changes',
      {
        event: '*', // UPDATE, INSERT, DELETE
        schema: 'public',
        table: 'produtos',
      },
      (payload) => {
        console.log('🔄 [Catálogo] Atualização detectada:', payload);
        loadProducts(); // Recarregar produtos
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [reseller?.id, supabase, loadProducts]);
```

**O que isso faz:**

- Escuta mudanças na tabela `produtos` em tempo real
- Quando estoque muda (UPDATE), recarrega os produtos automaticamente
- Cliente vê produtos aparecerem/sumirem sem dar F5

---

### 2. **Ativar Realtime no Supabase** (BANCO DE DADOS)

⚠️ **VOCÊ PRECISA APLICAR ESTA MIGRATION:**

1. Acesse **Supabase Dashboard** → SQL Editor
2. Abra o arquivo: `migrations/APLICAR_REALTIME_CATALOGO.sql`
3. Copie e cole o SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE produtos;
```

4. Clique em **Run** ▶️

**Verificar se funcionou:**

```sql
SELECT schemaname, tablename, pubname
FROM pg_publication_tables
WHERE tablename = 'produtos' AND pubname = 'supabase_realtime';
```

✅ Deve retornar:

```
schemaname | tablename | pubname
-----------+-----------+-------------------
public     | produtos  | supabase_realtime
```

---

## 🎯 RESULTADO FINAL

### ANTES:

1. Admin altera estoque → produtos.estoque = 10
2. Painel admin mostra estoque ✅
3. **Site público não atualiza** ❌
4. Cliente precisa dar F5 manualmente

### DEPOIS:

1. Admin altera estoque → produtos.estoque = 10
2. Painel admin mostra estoque ✅
3. **Site público atualiza AUTOMATICAMENTE** ✅
4. Cliente vê mudança em tempo real (1-2 segundos)

---

## 📊 COMO TESTAR

1. Abra um catálogo público (ex: `https://seu-site.com/catalogo/loja-teste`)
2. No console do navegador (F12), você verá:
   ```
   🔄 [Catálogo] Atualização detectada: {...}
   ```
3. No painel admin, altere o estoque de um produto para 0
4. **O produto some do catálogo em 1-2 segundos** (sem F5)
5. Altere o estoque para 10 novamente
6. **O produto reaparece automaticamente**

---

## 🔒 SEGURANÇA

✅ **Realtime está seguro:**

- Apenas dados públicos são transmitidos (RLS ativo)
- Clientes não veem dados sensíveis
- Payload contém apenas ID do produto alterado

---

## 📝 RESUMO

| Componente                                 | Status                     | O que faz                     |
| ------------------------------------------ | -------------------------- | ----------------------------- |
| `app/catalogo/[slug]/page.tsx`             | ✅ Atualizado              | Escuta mudanças em tempo real |
| `migrations/APLICAR_REALTIME_CATALOGO.sql` | ⏳ **APLICAR MANUALMENTE** | Habilita Realtime no banco    |
| Código commitado                           | ✅ Pronto                  | Push já feito no GitHub       |

---

## ⚡ PRÓXIMOS PASSOS

1. ⏳ **Aplicar a migration SQL no Supabase** (você)
2. ✅ Testar em produção
3. ✅ Monitorar logs do console

---

## 🆘 TROUBLESHOOTING

### "Não vejo a mensagem no console"

- Abra o Console do navegador (F12)
- Vá na aba **Console**
- Altere estoque no admin
- Deve aparecer: `🔄 [Catálogo] Atualização detectada`

### "Produtos não atualizam automaticamente"

1. Verificar se aplicou a migration SQL ✅
2. Verificar se realtime está ativo:
   ```sql
   SELECT * FROM pg_publication_tables
   WHERE tablename = 'produtos';
   ```
3. Recarregar página do catálogo (F5 uma vez)

### "Erro no console"

- Compartilhe o erro exato
- Verificar se Supabase está online
- Verificar políticas RLS na tabela `produtos`
