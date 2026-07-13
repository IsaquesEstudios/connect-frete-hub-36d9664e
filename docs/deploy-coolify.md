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

## Coolify — opção 1: Dockerfile (recomendado)

1. No Coolify, crie um novo recurso **Application**.
2. Source: seu repositório Git.
3. Build Pack: **Dockerfile** (o `Dockerfile` na raiz é usado automaticamente).
4. Porta exposta: **3000**.
5. Variáveis de ambiente (Environment Variables): copie de `.env.example`.
   - `SUPABASE_SERVICE_ROLE_KEY` é opcional — apenas se você quiser que a
     tela de Relatórios consiga puxar o email dos usuários via Admin API.
6. Domínio: aponte seu DNS para o IP da VPS e configure em **Domains**.
7. Deploy.

## Coolify — opção 2: Nixpacks / Node

1. Build Pack: **Nixpacks**.
2. Install command: `bun install`
3. Build command: `bun run build`
4. Start command: `bun run start`
5. Porta: **3000**.

## Notas importantes

- O app usa Supabase EXTERNO (`blyxvehtkkhmuqylashi.supabase.co`), já
  embutido no bundle em `vite.config.ts`. Não é preciso configurar Supabase
  no Coolify.
- SSR está ligado — o servidor Node precisa ficar sempre online (não é
  static hosting).
- Se estiver atrás de um proxy reverso do Coolify (Traefik), ele já faz
  HTTPS automaticamente com Let's Encrypt.
- Para logs em tempo real, use a aba **Logs** do Coolify.
