Configuração de variáveis de ambiente

Este documento descreve as variáveis de ambiente necessárias para rodar o projeto localmente e em produção (Netlify).

1) Arquivo local (.env.local)

- Copie o arquivo de exemplo e preencha as chaves reais (Windows PowerShell):

```powershell
copy .env.example .env.local
```

2) Variáveis principais

- NEXT_PUBLIC_SUPABASE_URL — URL do projeto Supabase (ex.: https://xyz.supabase.co)
- NEXT_PUBLIC_SUPABASE_ANON_KEY — Chave pública (anon) do Supabase usada no frontend
- FACILZAP_TOKEN — (opcional) Token Bearer para acessar a API da FácilZap (usado pelas funções de sincronização)
- DEBUG_SYNC — (opcional) `true` para logs adicionais durante sincronização
- NEXT_PUBLIC_IMAGE_PROXY_HOST — (opcional) host público do proxy de imagens (ex.: https://seusite.netlify.app)

3) Configurar no Netlify (produção)

- No painel do Netlify do seu site → Site settings → Build & deploy → Environment → Environment variables
- Adicione as mesmas variáveis do `.env.example` com os valores de produção
- Após adicionar, vá em Deploys → Trigger deploy → Clear cache and deploy site (recomendado)

4) Dicas de troubleshooting

- Se as páginas estiverem sem dados em produção, verifique primeiro as env vars no painel do Netlify e depois os logs das Netlify Functions.
- Verifique se `FACILZAP_TOKEN` foi adicionado caso esteja usando sincronização com FácilZap.
- Para depuração local, use `DEBUG_SYNC=true` no `.env.local` e observe logs durante os scripts de sincronização.

5) Segurança

- Nunca comite chaves reais no repositório.
- Use `.env.example` apenas como template.
