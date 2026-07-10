# Plano de melhorias

Vou dividir em blocos independentes para você aprovar de uma vez. Se quiser eu tiro algum item, é só avisar.

## 1. Admin edita perfil de clientes
- Botão "Editar perfil" no `Sheet` de detalhes do usuário (aberto pelo header do chat e pela tabela de `/usuarios`).
- Reaproveita o mesmo formulário de `/perfil` (todos campos exceto email — email fica somente leitura).
- Salva via `repo.updateUser` como admin (RLS já permite via `has_role admin`).

## 2. Filtros e exportação de relatórios
- Em `/metricas`, adicionar filtros: **Estado (UF)**, **Tags** (multi-seleção).
- Exportações adicionais além de PDF/CSV: **Word (.docx)** e **TXT (bloco de notas)**.
  - `.docx` via `docx` (npm).
  - `.txt` gerado inline.

## 3. Ordenação da lista de usuários
- Em `/usuarios`, ordenar por: online → offline (recentes primeiro por `lastSeen`).

## 4. Cadastro — CPF esconde Nome Fantasia
- No `SignupWizard`, o campo "Nome fantasia" só aparece quando `tipoDoc === 'cnpj'`.

## 5. Erros em português
- Mapear mensagens do Supabase Auth (Invalid login credentials, User already registered, etc.) para PT-BR no `login`, `signup` e `resetPassword`.

## 6. Esqueci a senha
- Link "Esqueci a senha" em `/auth`.
- Dialog pedindo email → `supabase.auth.resetPasswordForEmail` com `redirectTo=/reset-password`.
- Nova rota `/reset-password` para digitar nova senha (`updateUser({ password })`).

## 7. Motorista — estado antes da cidade + dropdown
- Reordenar etapa 3 do wizard: **Estado** primeiro, depois **Cidade** (Select filtrado pelas cidades do estado usando `src/lib/br-locations.ts`).
- Aplicar mesmo padrão no `/perfil`.

## 8. Ajustes de campos do motorista
- RNTRC → opcional (remover asterisco/validação).
- Tipo de carroceria → obrigatório.
- Novo campo **Peso (kg)** entre "Tipo de carroceria" e "Observações", com máscara `1.234 kg` — obrigatório.
- Adicionar `peso` em `MotoristaUser` e nas migrations/perfil.

## 9. Foto de perfil — upload/câmera
- Em `/perfil`, substituir input de URL por botão "Alterar foto" com opções: **Escolher do dispositivo** e **Tirar foto** (mobile — usa `capture="user"`).
- Converte para data URL (padrão já usado no chat) e salva em `fotoUrl`.

## 10. Link do grupo após cadastro
- Ao finalizar `SignupWizard`, exibir tela final com botão CTA "Entrar no grupo do WhatsApp" — link diferente por tipo (motorista / empresa-transportadora-agência).
- Reaproveita URLs de `src/routes/index.tsx`.

## 11. Respostas automáticas (admin/colaborador)
- Nova página `/respostas-automaticas` (link na sidebar apenas para admin/colaborador).
- Tabela `auto_replies` (id, trigger, response, active, created_by).
- Ao receber mensagem no chat, se `trigger` bater (contains, case-insensitive) e não houver admin online respondendo, dispara resposta automática do "Admin" para o usuário.

## 12. Métricas — visitantes e acessos hoje
- Em `/metricas`, cards no topo: **Visitantes hoje** e **Acessos hoje**.
- Contagem: registrar em tabela `page_views` (user_id nullable, created_at) na `_app/route.tsx` (uma vez por sessão) + endpoint público para visitantes anônimos na landing.

---

### Impacto em banco (migrations)
- `profiles`: adicionar coluna `peso_kg int`.
- Nova tabela `auto_replies`.
- Nova tabela `page_views` (com grants + RLS).

### Dependências novas
- `docx` (geração Word).

Confirma que posso implementar tudo? Ou quer que eu comece por algum bloco específico primeiro?
