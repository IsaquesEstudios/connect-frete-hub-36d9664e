-- ============================================================
--  COLABORADORES — rode este SQL uma única vez no banco
--  (Supabase → SQL Editor do projeto blyxvehtkkhmuqylashi)
-- ============================================================

-- 1) Coluna "active" para poder desativar login sem excluir a conta
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- 2) Se a coluna "type" tiver um CHECK antigo restringindo a
--    ('empresa','motorista','admin'), remova e recrie incluindo 'colaborador'.
DO $$
DECLARE con record;
BEGIN
  FOR con IN
    SELECT conname
    FROM   pg_constraint
    WHERE  conrelid = 'public.profiles'::regclass
      AND  contype  = 'c'
      AND  pg_get_constraintdef(oid) ILIKE '%type%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_type_check
  CHECK (type IN ('empresa','motorista','admin','colaborador'));

-- 3) (Opcional) Se "type" for um ENUM em vez de texto, rode isto no lugar do bloco acima:
-- ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'colaborador';
