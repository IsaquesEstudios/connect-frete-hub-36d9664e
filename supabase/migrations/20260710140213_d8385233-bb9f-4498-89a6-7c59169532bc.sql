-- Backfill email and whatsapp on profiles from auth.users when missing
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id
  AND (p.email IS NULL OR p.email = '')
  AND u.email IS NOT NULL;

UPDATE public.profiles p
SET whatsapp = u.phone
FROM auth.users u
WHERE u.id = p.id
  AND (p.whatsapp IS NULL OR p.whatsapp = '')
  AND u.phone IS NOT NULL
  AND u.phone <> '';