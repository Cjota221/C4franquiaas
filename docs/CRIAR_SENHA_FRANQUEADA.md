# 🔑 Como Criar Senha para Franqueada

## 📋 Problema
Quando você aprova uma franqueada no admin, o sistema NÃO cria automaticamente o usuário e senha no Supabase Auth.

## ✅ Solução 1: Criar Usuário Manualmente no Supabase

### Passo a Passo:

1. **Abra o Supabase Dashboard**
   - Acesse: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Vá em Authentication > Users**
   - Menu lateral: Authentication
   - Aba: Users

3. **Clique em "Add User" / "Invite User"**
   - Botão verde no canto superior direito

4. **Preencha os dados**:
   ```
   Email: maria@exemplo.com (o mesmo email da franqueada)
   Password: SenhaTemporaria123 (defina uma senha temporária)
   Auto Confirm User: ✅ Marque esta opção (importante!)
   ```

5. **Clique em "Create User"**

6. **Copie o User ID** que aparece na lista

7. **Vincule o user_id à franqueada**:
   - Vá em: **SQL Editor**
   - Execute:
   ```sql
   UPDATE franqueadas 
   SET user_id = 'cole-o-user-id-aqui'
   WHERE email = 'maria@exemplo.com';
   ```

8. **Agora a franqueada pode fazer login**:
   ```
   Email: maria@exemplo.com
   Senha: SenhaTemporaria123
   ```

---

## ✅ Solução 2: Sistema Automático (Implementar)

Vou criar um sistema que cria o usuário automaticamente quando o admin aprova.

### O que fazer:

Quando o admin clicar em "Aprovar", o sistema deve:
1. Criar usuário no Supabase Auth com senha temporária
2. Enviar email com link para definir senha
3. Atualizar `user_id` na tabela `franqueadas`

---

## 🚀 Solução 3: Link de Definição de Senha

Criar uma página `/franqueada/definir-senha/[token]` onde a franqueada define sua própria senha.

---

## 📝 Qual solução você prefere?

**Opção A**: Usar solução manual por enquanto (mais rápido)  
**Opção B**: Implementar sistema automático agora  
**Opção C**: Implementar link de definição de senha  

Me diga qual prefere e eu implemento! 😊

---

## 🧪 Teste Rápido com Solução Manual

1. Crie usuário no Supabase:
   ```
   Email: teste@exemplo.com
   Senha: Senha123!
   Auto Confirm: ✅
   ```

2. Execute SQL:
   ```sql
   -- Primeiro, cadastre a franqueada se ainda não fez
   INSERT INTO franqueadas (nome, email, telefone, cpf, cidade, estado, status)
   VALUES ('Maria Teste', 'teste@exemplo.com', '11999999999', '12345678900', 'São Paulo', 'SP', 'aprovada');
   
   -- Depois, atualize com o user_id do Supabase
   UPDATE franqueadas 
   SET user_id = 'cole-o-user-id-do-supabase-aqui'
   WHERE email = 'teste@exemplo.com';
   ```

3. Teste login:
   ```
   http://localhost:3001/franqueada/login
   Email: teste@exemplo.com
   Senha: Senha123!
   ```

---

## 📅 Última atualização
21 de outubro de 2025
