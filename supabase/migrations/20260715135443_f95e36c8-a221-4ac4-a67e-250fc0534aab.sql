
-- profiles: remove broad exposure of admin/colaborador rows to all authenticated users
DROP POLICY IF EXISTS profiles_select_access ON public.profiles;
CREATE POLICY profiles_select_access ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR private.is_staff(auth.uid()));

-- broadcast_messages: staff-only read; the existing FOR ALL staff policy already covers SELECT for staff
DROP POLICY IF EXISTS broadcast_messages_select_access ON public.broadcast_messages;

-- conversation_tags: staff-only read; the existing FOR ALL staff policy already covers SELECT for staff
DROP POLICY IF EXISTS conversation_tags_select_access ON public.conversation_tags;
