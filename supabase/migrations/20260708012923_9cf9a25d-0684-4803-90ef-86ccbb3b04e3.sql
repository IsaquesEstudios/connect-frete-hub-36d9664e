CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.user_type AS ENUM ('empresa', 'motorista', 'admin', 'colaborador');
  ELSE
    ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'empresa';
    ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'motorista';
    ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'admin';
    ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'colaborador';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  user_number text NOT NULL UNIQUE,
  type public.user_type NOT NULL,
  name text NOT NULL,
  cnpj text,
  cpf text,
  whatsapp text,
  foto_url text,
  cidade text,
  estado text,
  placa text,
  veiculo text,
  tipo_veiculo text,
  rntrc text,
  carroceria text,
  nome_fantasia text,
  perfil_empresa text,
  site_rede_social text,
  active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id text NOT NULL,
  from_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_by_admin boolean NOT NULL DEFAULT false,
  read_by_user boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  color text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.conversation_tags (
  conversation_id text NOT NULL,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_tags TO authenticated;
GRANT ALL ON public.conversation_tags TO service_role;
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body text NOT NULL,
  audience text NOT NULL,
  tag_id uuid REFERENCES public.tags(id) ON DELETE SET NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broadcast_messages TO authenticated;
GRANT ALL ON public.broadcast_messages TO service_role;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tags_updated_at ON public.tags;
CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND type IN ('admin', 'colaborador')
      AND active = true
  );
$$;

DROP POLICY IF EXISTS "profiles_select_access" ON public.profiles;
CREATE POLICY "profiles_select_access"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR type IN ('admin', 'colaborador') OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "profiles_insert_access" ON public.profiles;
CREATE POLICY "profiles_insert_access"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "profiles_update_access" ON public.profiles;
CREATE POLICY "profiles_update_access"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_staff(auth.uid()))
WITH CHECK (id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "profiles_delete_access" ON public.profiles;
CREATE POLICY "profiles_delete_access"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "messages_select_access" ON public.messages;
CREATE POLICY "messages_select_access"
ON public.messages
FOR SELECT
TO authenticated
USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "messages_insert_access" ON public.messages;
CREATE POLICY "messages_insert_access"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (from_user_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "messages_update_access" ON public.messages;
CREATE POLICY "messages_update_access"
ON public.messages
FOR UPDATE
TO authenticated
USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR public.is_staff(auth.uid()))
WITH CHECK (from_user_id = auth.uid() OR to_user_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "messages_delete_access" ON public.messages;
CREATE POLICY "messages_delete_access"
ON public.messages
FOR DELETE
TO authenticated
USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "tags_select_access" ON public.tags;
CREATE POLICY "tags_select_access"
ON public.tags
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "tags_staff_manage" ON public.tags;
CREATE POLICY "tags_staff_manage"
ON public.tags
FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "conversation_tags_select_access" ON public.conversation_tags;
CREATE POLICY "conversation_tags_select_access"
ON public.conversation_tags
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "conversation_tags_staff_manage" ON public.conversation_tags;
CREATE POLICY "conversation_tags_staff_manage"
ON public.conversation_tags
FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "broadcast_messages_select_access" ON public.broadcast_messages;
CREATE POLICY "broadcast_messages_select_access"
ON public.broadcast_messages
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "broadcast_messages_staff_manage" ON public.broadcast_messages;
CREATE POLICY "broadcast_messages_staff_manage"
ON public.broadcast_messages
FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));