# Migration 068 - Sistema de Notificações de Novidades (Changelog)

## Aplicar no Supabase

Execute o SQL em [migrations/068_system_notifications.sql](migrations/068_system_notifications.sql) no SQL Editor do Supabase.

## Tabelas Criadas

### `system_notifications`

Armazena as notificações de novidades do sistema.

| Coluna          | Tipo         | Descrição                              |
| --------------- | ------------ | -------------------------------------- |
| id              | UUID         | ID único                               |
| title           | VARCHAR(255) | Título da notificação                  |
| description     | TEXT         | Descrição detalhada                    |
| type            | VARCHAR(20)  | Tipo: feature, fix, alert, improvement |
| image_url       | TEXT         | URL de imagem (opcional)               |
| high_priority   | BOOLEAN      | Se true, mostra popup ao logar         |
| is_active       | BOOLEAN      | Se está ativa                          |
| target_audience | VARCHAR(20)  | all, resellers, admin                  |
| created_at      | TIMESTAMP    | Data de criação                        |
| updated_at      | TIMESTAMP    | Data de atualização                    |

### `user_read_notifications`

Registra quais notificações cada usuário já leu.

| Coluna          | Tipo      | Descrição         |
| --------------- | --------- | ----------------- |
| id              | UUID      | ID único          |
| user_id         | UUID      | ID do usuário     |
| notification_id | UUID      | ID da notificação |
| read_at         | TIMESTAMP | Quando leu        |
| dismissed_popup | BOOLEAN   | Se fechou o popup |

## Componentes Criados

1. **ChangelogBell** (`components/ChangelogBell.tsx`) - Sino de notificações com dropdown
2. **WhatsNewModal** (`components/WhatsNewModal.tsx`) - Modal popup para notificações importantes
3. **useNotifications** (`hooks/useNotifications.ts`) - Hook para gerenciar notificações

## Como Usar

### Adicionar uma nova notificação (SQL)

```sql
INSERT INTO system_notifications (title, description, type, high_priority, target_audience)
VALUES (
  '🎉 Nova Funcionalidade!',
  'Descrição detalhada da novidade...',
  'feature',  -- feature, fix, alert, improvement
  true,       -- true = mostra popup
  'resellers' -- all, resellers, admin
);
```

### Tipos de Notificação

- **feature** (roxo) - Nova funcionalidade
- **fix** (verde) - Correção de bug
- **alert** (amarelo) - Alerta importante
- **improvement** (azul) - Melhoria

## Já Integrado

- ✅ Layout da revendedora (`app/revendedora/layout.tsx`)
- ✅ MobileHeader com sino de notificações
- ✅ WhatsNewModal para popups de alta prioridade
