# 🎯 Aplicar Migration: Banner Submissions

## 📋 O que esta migration faz:

Cria a tabela `banner_submissions` para armazenar os banners personalizados das revendedoras que aguardam aprovação.

## ✅ Recursos incluídos:

- ✅ Tabela `banner_submissions` com todos os campos necessários
- ✅ Políticas RLS (Revendedoras veem só seus banners, Admins veem todos)
- ✅ Trigger para atualizar `updated_at` automaticamente
- ✅ Índices para performance
- ✅ Status: `pending`, `approved`, `rejected`

## 🚀 Como aplicar:

### 1. Abrir Supabase Dashboard

- Acesse: https://supabase.com/dashboard
- Entre no projeto
- Vá em **SQL Editor** (menu lateral)

### 2. Executar SQL

```sql
-- Copie e cole TODO o conteúdo do arquivo:
-- supabase/migrations/20260105_create_banner_submissions.sql
```

### 3. Clicar em **RUN**

### 4. Verificar

```sql
-- Verificar se a tabela foi criada:
SELECT * FROM banner_submissions LIMIT 1;
```

## 📊 Estrutura da tabela:

| Campo                | Tipo      | Descrição                 |
| -------------------- | --------- | ------------------------- |
| `id`                 | UUID      | ID único                  |
| `user_id`            | UUID      | Revendedora que criou     |
| `template_id`        | UUID      | Template base usado       |
| `titulo`             | TEXT      | Título do banner          |
| `subtitulo`          | TEXT      | Subtítulo                 |
| `texto_adicional`    | TEXT      | Texto adicional           |
| `font_family`        | TEXT      | Combinação de fontes      |
| `text_color`         | TEXT      | Cor do texto (hex)        |
| `desktop_position_x` | INT       | Posição X no desktop      |
| `desktop_position_y` | INT       | Posição Y no desktop      |
| `desktop_alignment`  | TEXT      | Alinhamento desktop       |
| `desktop_font_size`  | INT       | Tamanho fonte desktop (%) |
| `mobile_position_x`  | INT       | Posição X no mobile       |
| `mobile_position_y`  | INT       | Posição Y no mobile       |
| `mobile_alignment`   | TEXT      | Alinhamento mobile        |
| `mobile_font_size`   | INT       | Tamanho fonte mobile (%)  |
| `line_spacing`       | INT       | Espaçamento entre linhas  |
| `letter_spacing`     | INT       | Espaçamento entre letras  |
| `status`             | TEXT      | pending/approved/rejected |
| `desktop_final_url`  | TEXT      | URL banner desktop final  |
| `mobile_final_url`   | TEXT      | URL banner mobile final   |
| `rejection_reason`   | TEXT      | Motivo da rejeição        |
| `created_at`         | TIMESTAMP | Data de criação           |
| `updated_at`         | TIMESTAMP | Última atualização        |
| `approved_at`        | TIMESTAMP | Data de aprovação         |
| `approved_by`        | UUID      | Admin que aprovou         |

## 🔒 Políticas RLS:

### Revendedoras:

- ✅ **SELECT**: Podem ver apenas seus próprios banners
- ✅ **INSERT**: Podem criar novos banners
- ✅ **UPDATE**: Podem editar apenas banners `pending`

### Admins:

- ✅ **SELECT**: Veem todos os banners
- ✅ **UPDATE**: Podem aprovar/rejeitar qualquer banner

## 🎨 Fundo do texto (quadrado preto):

### Durante edição:

- **COM fundo semi-transparente** (`bg-black/30`) para facilitar visualização

### Preview final:

- **SEM fundo** - clique no botão **"Ver Resultado Final"** no preview
- O fundo desaparece e fica só o texto puro com sombra
- É assim que aparecerá no site da revendedora

### Toggle no BannerEditor:

```tsx
// Modo Edição (com fundo) - facilita posicionar o texto
showBackground = true;

// Resultado Final (sem fundo) - como ficará no site
showBackground = false;
```

## 🔄 Fluxo completo:

1. **Revendedora** cria banner personalizado
2. Clica em **"Enviar para Aprovação"**
3. Sistema salva em `banner_submissions` com `status: pending`
4. **Admin** vê na página de moderação
5. Admin aprova ou rejeita
6. Se aprovado → gera versões finais (sem fundo) e publica
7. Banner aparece no site da revendedora

## ✅ Após aplicar:

O sistema estará pronto para:

- ✅ Salvar banners no banco (não apenas console.log)
- ✅ Mostrar preview com/sem fundo
- ✅ Permitir aprovação futura pelos admins

## 🔗 Próximos passos:

1. Aplicar esta migration
2. Criar página de moderação para admins (`/admin/moderacao/banners`)
3. Implementar geração de imagens finais (sem fundo)
4. Adicionar notificações para revendedoras
