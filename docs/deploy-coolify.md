# Deploy no Coolify (VPS)

O projeto foi preparado para rodar como um servidor Node standalone
(Nitro preset `node-server`) — pronto para Coolify, Docker, Railway ou
qualquer VPS com Node 20+.

## Build local

```bash
bun install
bun run build      # gera .output/
bun run start      # roda node .output/server/index.mjs em PORT=3000
```

## Erro comum: "Não foi possível encontrar a página" (HTTP 404)

Se ao abrir seu domínio (ex.: `app.svlogisticatransportes.com.br`)
aparecer a página branca com "HTTP ERROR 404", isso é o **proxy do Coolify
(Traefik) dizendo que nenhum app está associado a esse domínio**. Não é
erro do código.

Corrigir no Coolify:

1. Abra a Application → aba **Configuration** → seção **Domains**.
2. Cole a URL completa **com https://**, ex.: `https://app.svlogisticatransportes.com.br`
3. Aponte o DNS do domínio (registro A) para o IP público da sua VPS.
4. Clique **Save** e depois **Redeploy**.
5. O Coolify emite o certificado Let's Encrypt automaticamente.

## Coolify — opção 1: Dockerfile (RECOMENDADO)

1. No Coolify, crie um novo recurso **Application**.
2. Source: seu repositório Git.
3. **Build Pack: Dockerfile** (o `Dockerfile` na raiz é usado automaticamente).
4. **Ports Exposes: 3000**
5. **Domains**: `https://seu-dominio.com` (ver seção acima).
6. Variáveis de ambiente: copie de `.env.example`.
7. Deploy.

## Coolify — opção 2: Nixpacks

O arquivo `nixpacks.toml` na raiz configura install/build/start
automaticamente. Basta:

1. **Build Pack: Nixpacks**
2. **Ports Exposes: 3000**
3. **Domains**: `https://seu-dominio.com`
4. Deploy.

Não é necessário preencher Install/Build/Start Commands — o `nixpacks.toml`
já define.

## Notas importantes

- O app usa Supabase EXTERNO (`blyxvehtkkhmuqylashi.supabase.co`), já
  embutido no bundle em `vite.config.ts`. Não é preciso configurar Supabase
  no Coolify.
- SSR está ligado — o servidor Node precisa ficar sempre online.
- Se `Running` no Coolify mas o domínio dá 404 → **o domínio não está
  configurado na aba Domains** (ver acima).
- Se `Running` mas o domínio dá 502/503 → a porta exposta está errada.
  Deve ser **3000**.
- Logs em tempo real: aba **Logs** do Coolify.
