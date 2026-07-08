CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
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

REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated;

DROP POLICY IF EXISTS "profiles_select_access" ON public.profiles;
CREATE POLICY "profiles_select_access"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR type IN ('admin', 'colaborador') OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "profiles_insert_access" ON public.profiles;
CREATE POLICY "profiles_insert_access"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid() OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "profiles_update_access" ON public.profiles;
CREATE POLICY "profiles_update_access"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR private.is_staff(auth.uid()))
WITH CHECK (id = auth.uid() OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "profiles_delete_access" ON public.profiles;
CREATE POLICY "profiles_delete_access"
ON public.profiles
FOR DELETE
TO authenticated
USING (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "messages_select_access" ON public.messages;
CREATE POLICY "messages_select_access"
ON public.messages
FOR SELECT
TO authenticated
USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "messages_insert_access" ON public.messages;
CREATE POLICY "messages_insert_access"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (from_user_id = auth.uid() OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "messages_update_access" ON public.messages;
CREATE POLICY "messages_update_access"
ON public.messages
FOR UPDATE
TO authenticated
USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR private.is_staff(auth.uid()))
WITH CHECK (from_user_id = auth.uid() OR to_user_id = auth.uid() OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "messages_delete_access" ON public.messages;
CREATE POLICY "messages_delete_access"
ON public.messages
FOR DELETE
TO authenticated
USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "tags_staff_manage" ON public.tags;
CREATE POLICY "tags_staff_manage"
ON public.tags
FOR ALL
TO authenticated
USING (private.is_staff(auth.uid()))
WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "conversation_tags_staff_manage" ON public.conversation_tags;
CREATE POLICY "conversation_tags_staff_manage"
ON public.conversation_tags
FOR ALL
TO authenticated
USING (private.is_staff(auth.uid()))
WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "broadcast_messages_staff_manage" ON public.broadcast_messages;
CREATE POLICY "broadcast_messages_staff_manage"
ON public.broadcast_messages
FOR ALL
TO authenticated
USING (private.is_staff(auth.uid()))
WITH CHECK (private.is_staff(auth.uid()));

DROP FUNCTION IF EXISTS public.is_staff(uuid);