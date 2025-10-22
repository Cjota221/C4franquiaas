# 🧪 TESTE RÁPIDO - Loja da Franqueada

## ✅ O QUE FAZER AGORA

### **1. Inicie o Servidor**
```powershell
npm run dev
```

### **2. Faça Login como Franqueada**
```
URL: http://localhost:3001/franqueada/login

Credenciais:
- Email: (use o email da franqueada aprovada)
- Senha: (senha definida no cadastro)
```

### **3. Acesse a Página da Loja**
```
URL: http://localhost:3001/franqueada/loja
```

### **4. Crie sua Loja**
```
1. Digite o nome: "CJ Rasteninhas"
   → Domínio gerado automaticamente: "cjrasteninhas"

2. (Opcional) Faça upload de uma logo

3. Escolha cores:
   - Primária: #DB1472 (rosa)
   - Secundária: #F8B81F (amarelo)

4. Deixe "Loja Ativa" marcado

5. Clique em "Salvar Alterações"
```

### **5. Copie o Link da Loja**
```
Após salvar, aparecerá:

🔗 Link da sua loja:
https://c4franquiaas.netlify.app/loja/cjrasteninhas

[Copiar Link] [Abrir Loja]
```

### **6. Abra sua Loja**
```
1. Clique em "Abrir Loja"
   OU
2. Acesse manualmente:
   http://localhost:3001/loja/cjrasteninhas
```

### **7. Verifique**
```
✅ Sua loja deve abrir
✅ Com o nome "CJ Rasteninhas"
✅ Com as cores escolhidas
✅ Com a logo (se fez upload)
✅ Com produtos da franqueada (se tiver)
```

---

## ❌ SE DER ERRO "NÃO AUTENTICADO"

### **Solução Rápida:**

1. **Logout e Login novamente:**
   ```javascript
   // No console do navegador (F12):
   localStorage.clear()
   // Depois faça login novamente
   ```

2. **Verificar se está logado:**
   ```javascript
   // No console:
   await supabase.auth.getSession()
   // Deve retornar: { session: {...} }
   ```

3. **Forçar atualização:**
   ```
   Ctrl + Shift + R (limpa cache e recarrega)
   ```

---

## 🎯 RESULTADO ESPERADO

```
┌─────────────────────────────────────┐
│  Página: /franqueada/loja           │
│                                     │
│  [✓] Carrega sem erro               │
│  [✓] Formulário aparece             │
│  [✓] Domínio gera automaticamente   │
│  [✓] Salva com sucesso              │
│  [✓] Link da loja aparece           │
│  [✓] Loja pública funciona          │
│                                     │
└─────────────────────────────────────┘
```

---

## 📝 CHECKLIST

- [ ] Servidor rodando (`npm run dev`)
- [ ] Login feito com sucesso
- [ ] Acessa `/franqueada/loja` sem erro
- [ ] Digita nome da loja
- [ ] Domínio aparece automaticamente
- [ ] Clica em "Salvar Alterações"
- [ ] Mensagem de sucesso aparece
- [ ] Link da loja aparece
- [ ] Clica em "Abrir Loja"
- [ ] Loja pública abre corretamente

---

## 🚀 PRÓXIMOS PASSOS

Depois de testar localmente:

1. **Commit e Push** (já feito! ✅)
2. **Netlify faz deploy automaticamente**
3. **Aguardar ~2 minutos**
4. **Testar no ambiente de produção:**
   ```
   https://c4franquiaas.netlify.app/franqueada/login
   ```

---

## 📞 SE TIVER DÚVIDAS

Cole no chat:
- Screenshot do erro
- Console do navegador (F12 > Console)
- URL que você está tentando acessar

**Me avise quando testar!** 🎉
