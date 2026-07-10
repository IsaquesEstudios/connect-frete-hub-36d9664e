# Pendências restantes do lote solicitado

Este batch entregou:
- [x] Nome fantasia oculto quando CPF (aparece **Nome completo**).
- [x] Estado antes de cidade no cadastro de motorista (dropdown por UF).
- [x] RNTRC opcional.
- [x] Peso (kg) obrigatório e formatado na etapa de carroceria.
- [x] Mensagens de erro de auth em português (`translate-error.ts`).
- [x] Fluxo "Esqueci a senha" com dialog + rota `/reset-password`.
- [x] Ordem: online primeiro em `/usuarios`.
- [x] Tela de sucesso pós-cadastro com botão "Entrar no grupo" (WhatsApp).

**A implementar em próximos turnos** (evita edits massivos num só ciclo):

1. **Admin edita perfil do cliente** — botão "Editar" no Sheet de detalhes do usuário e/ou em `/usuarios`; reaproveita `updateUser` do `repo`.
2. **Filtros por UF/Tag + export Word/TXT** em `/metricas`. Pacote `docx` já instalado; usar `Packer.toBlob(doc)`.
3. **Foto de perfil**: input file + captura via `<input type="file" accept="image/*" capture="user" />` em `/perfil`, convertendo para dataURL.
4. **Respostas automáticas** (admin/colaborador): precisa tabela `auto_replies (id, keyword, response, active)` no banco externo (blyx).
5. **Visitantes/acessos hoje**: precisa tabela `page_views (id, path, session_id, created_at)` + endpoint para gravar no root layout.

Os itens 4 e 5 dependem de novas tabelas no blyx — como o projeto usa banco externo, execute os migrations manualmente no dashboard do Supabase de vocês. SQL sugerido:

```sql
create table public.auto_replies (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  response text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.auto_replies to authenticated;

create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  session_id text,
  user_id uuid,
  created_at timestamptz not null default now()
);
create index page_views_created_idx on public.page_views(created_at);
grant insert on public.page_views to anon, authenticated;
grant select on public.page_views to authenticated;
```
