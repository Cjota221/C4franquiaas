#  Forçar Sincronização Completa

## Problema Resolvido

Quando produtos novos não aparecem no sistema após sincronização normal, pode ser porque:

1. **IDs externos mudaram** no FácilZap
2. **Produtos antigos** permanecem ativos mesmo deletados no FácilZap  
3. **Conflitos de dados** impedem upsert correto
4. **Cache ou estado inconsistente** no banco de dados

## Solução: Force Sync

### Como Funciona

A **Sincronização Forçada** realiza um processo completo em 3 etapas:

```
1. DESATIVA todos os produtos existentes (ativo = false)
   
2. BUSCA todos os produtos do FácilZap
   
3. IMPORTA e marca como ativos (ativo = true)
```

**Resultado**: 
-  Produtos que existem no FácilZap = **ATIVOS**
-  Produtos que não existem mais = **INATIVOS**

### Como Usar

#### 1. Via Interface Admin

1. Acesse `/admin/produtos`
2. Localize o botão laranja **"Forçar Sincronização Completa"**
3. Clique e confirme o diálogo de aviso
4. Aguarde a sincronização (pode demorar alguns minutos)
5. Produtos serão recarregados automaticamente

#### 2. Via API Direta

```bash
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/sync-produtos" `
  -Method POST `
  -ContentType "application/json" `
  -Body ''{"force": true}''
```

### Diferenças entre Sync Normal e Force Sync

| Característica | Sync Normal | Force Sync |
|----------------|-------------|------------|
| **Velocidade** | Rápida (upsert) | Mais lenta (reimport) |
| **Produtos removidos** | Permanecem ativos | Ficam inativos  |
| **Conflitos de ID** | Pode falhar | Resolve  |
| **Produtos novos** | Pode não detectar | Sempre detecta  |
| **Uso recomendado** | Diário | Semanal ou sob demanda |

## Quando Usar

###  Use Force Sync quando:

- Produtos novos não aparecem após sync normal
- Suspeita de dados inconsistentes
- Após mudanças massivas no FácilZap
- Produtos deletados no FácilZap ainda aparecem ativos
- Primeira sincronização após reinstalar sistema

###  Não use Force Sync quando:

- Sincronização normal funciona corretamente
- Precisa de velocidade (use sync normal)
- Durante horário de pico de vendas
- Se tem processos de pedidos em andamento

## Troubleshooting

### Problema: Force Sync demora muito

**Causa**: Muitos produtos no FácilZap (> 1000)

**Solução**: Aguarde ou execute em horário de baixo uso

### Problema: Produtos ainda não aparecem

**Verificar**:
1. Token FácilZap está válido?
2. Produtos estão ativos no FácilZap?
3. Console do navegador mostra erros?
4. Terminal do servidor mostra erros 401?

---

**Documentação atualizada em**: 2024-01-XX  
**Versão**: 1.0