## ConectaFrete — Fase 1 (Auth mock + 3 painéis + dados mock)

App de mensagens hub-and-spoke, totalmente client-side nesta fase. Sem Lovable Cloud, sem Supabase. Tudo em memória com persistência em `localStorage`. Fase 2 (tags) e Fase 3 (broadcast) virão em planos separados.

### Arquitetura desacoplada (para trocar por backend depois)

Camada de serviço isolada da UI, para que trocar `localStorage` por Supabase (ou qualquer outro backend) no futuro seja uma mudança pontual.

```text
src/
  lib/
    data/
      types.ts              // User, Message, Conversation, Tag, Broadcast
      seed.ts               // dados fake iniciais (5 empresas, 5 motoristas, 1 admin, histórico)
      storage.ts            // wrapper get/set/subscribe em localStorage + BroadcastChannel
      repository.ts         // interface Repository (findUser, listConversations, sendMessage, subscribe...)
      localRepository.ts    // implementação atual (localStorage + pub/sub)
      index.ts              // export const repo: Repository = new LocalRepository()
    auth/
      session.ts            // login/logout/currentUser (mock, salva no localStorage)
```

Toda a UI importa só de `lib/data` e `lib/auth` — nunca acessa `localStorage` direto.

### Autenticação mock

- Tela `/auth` com abas Login e Cadastro.
- Login: "Número de Usuário" (ex: `EMP-0001`) + senha. Senha aceita qualquer valor não vazio (mock).
- Cadastro: nome, tipo (Empresa / Motorista / Admin), dados específicos do tipo (CNPJ para empresa, placa para motorista). Número de usuário é gerado automaticamente (`EMP-0006`, `MOT-0006`, `ADM-0002`, ...).
- Sessão persistida em `localStorage`; ao abrir o app, redireciona para o painel do tipo logado.
- Rotas protegidas por tipo usando o layout gate `_authenticated` gerenciado pela integração — como estamos sem Supabase, criamos uma versão mock equivalente em `src/routes/_app/route.tsx` (pathless, `ssr: false`, checa `session.currentUser()` e redireciona para `/auth`). Dentro dela, cada painel checa o tipo e redireciona se errado.

### Rotas

```text
src/routes/
  __root.tsx                // já existe — só ajustar head (título/description ConectaFrete)
  index.tsx                 // redireciona para /auth ou painel conforme sessão
  auth.tsx                  // login + cadastro
  _app/route.tsx            // gate: exige sessão
  _app/empresa.tsx          // painel Empresa
  _app/motorista.tsx        // painel Motorista
  _app/admin.tsx            // painel Admin
```

### Painéis (Fase 1)

**Empresa e Motorista** (mesma estrutura, cores diferentes no header):
- Layout duas colunas: sidebar com a única conversa (com Admin) + área de chat.
- Chat com histórico, envio de mensagem, timestamp por mensagem, indicador "Admin está digitando..." e status online/offline do admin (mock — admin considerado online se houver sessão admin ativa em outra aba, detectado via `BroadcastChannel`).
- Cabeçalho com nome, número de usuário, botão logout.
- Página de perfil embutida (drawer) com dados fake.

**Admin**:
- Sidebar com lista de todas as conversas (empresas + motoristas), busca por nome/número, abas "Todos / Empresas / Motoristas".
- Cores diferenciadas na lista: azul para empresa, verde para motorista.
- Área de chat abre a conversa selecionada; admin envia/recebe mensagens.
- Cabeçalho com dashboard resumido (total empresas, total motoristas, conversas ativas, não lidas).
- Placeholders visuais reservados para tags (Fase 2) e botão "Nova Mensagem em Massa" desabilitado com tooltip "Em breve" (Fase 3).

### Tempo real (mock, mas funcional entre abas)

- `storage.ts` publica mudanças via `BroadcastChannel('conectafrete')` + escuta evento `storage` do `localStorage`.
- `repository.subscribe(conversationId, cb)` reage a esses eventos.
- Resultado: abrir Empresa `EMP-0001` numa aba e Admin em outra faz mensagens aparecerem instantaneamente nos dois lados, sem servidor. Indicador "digitando" e presença online também trafegam pelo `BroadcastChannel`.

### Dados mock (seed inicial)

Populados no primeiro carregamento se `localStorage` estiver vazio:
- 5 empresas `EMP-0001..0005` (nome, CNPJ fake).
- 5 motoristas `MOT-0001..0005` (nome, placa fake).
- 1 admin `ADM-0001`.
- Histórico de 4–8 mensagens por conversa entre cada usuário e o admin.
- Tags fake já definidas nos dados (usadas visualmente só na Fase 2).

Senha mock: qualquer coisa. Documentado na tela de login com dica dos números disponíveis.

### Design

- Referência WhatsApp Web / Telegram Web: sidebar esquerda, chat direita, bolhas de mensagem alinhadas por autor, barra superior compacta.
- Paleta semântica em `src/styles.css` (tokens HSL/oklch já existentes reaproveitados):
  - `--primary` (marca ConectaFrete): azul-petróleo.
  - `--company` e `--driver`: tokens novos para azul (empresa) e verde (motorista), usados em avatares/badges na lista do admin.
  - Fundo do chat com leve textura/padrão sutil.
- Totalmente responsivo: em mobile, sidebar vira lista em tela cheia e o chat abre em tela cheia com botão voltar.
- Componentes shadcn já disponíveis (Button, Input, ScrollArea, Tabs, Avatar, Badge, Sheet para mobile).

### Fora de escopo desta fase

- Sistema de tags (Fase 2).
- Broadcast de mensagens em massa (Fase 3).
- Backend real / Supabase / Realtime de servidor.
- Upload de arquivos, áudio, leitura confirmada, notificações push.

### Entregáveis desta fase

1. Camada `lib/data` + `lib/auth` com interface Repository e implementação local.
2. Seed com 5 empresas, 5 motoristas, 1 admin e histórico.
3. Telas: `/auth`, painéis Empresa, Motorista, Admin, com chat funcional entre abas.
4. Head/SEO do app atualizados (título "ConectaFrete", description).
