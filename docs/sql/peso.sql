-- ============================================================
--  PESO (motorista) — rode este SQL uma única vez no banco
--  (Supabase → SQL Editor do projeto blyxvehtkkhmuqylashi)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS peso text;
