# Correções Aplicadas - 15/11/2025

##  Problemas Corrigidos

### 1. Múltiplas Instâncias do GoTrueClient
**Problema**: Aviso no console sobre múltiplas instâncias do GoTrueClient  
**Causa**: Imports duplicados de supabaseClient.ts e supabase/client.ts  
**Solução**: Padronizado todos os imports para usar '@/lib/supabase/client'

### 2. Erro na Vinculação de Produtos  
**Problema**: POST 400 - "Nenhum produto ativo encontrado"  
**Causa**: Query usava .eq('status', 'aprovada') mas produtos usam campo 'ativo' (boolean)  
**Solução**: Corrigido para .eq('ativo', true)

### 3. Logs e Debug
**Problema**: Mensagens de erro genéricas sem orientação  
**Solução**: Logs detalhados + exemplos de produtos + orientação clara

##  Como Testar

1. Abra http://localhost:3000/admin/produtos
2. Clique em "Sincronizar FacilZap" (se não houver produtos)
3. Clique em "Vincular a Todas as Franqueadas"
4. Verifique logs no terminal do servidor

##  Logs Esperados

### Se não houver produtos:
```
 Produtos encontrados: 0
 DEBUG - Total de produtos no banco: 0
 Nenhum produto ativo encontrado
```
 Clique em "Sincronizar FacilZap"

### Se houver produtos ativos:
```
 Produtos encontrados: 147
 147 produtos ativos encontrados
 Criando 294 vinculações (147 produtos  2 franqueadas)
 294 vinculações criadas com sucesso!
```

##  Arquivos Modificados

- app/api/admin/produtos/vincular-todas-franqueadas/route.ts
- app/login/page.tsx
- app/franqueada/**/*.tsx
- app/api/franqueada/**/*.ts
- app/admin/produtos/page.tsx

##  Padrão Correto de Import

```typescript
//  Use sempre este:
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

//  Não use mais:
import { supabase } from '@/lib/supabaseClient';
```