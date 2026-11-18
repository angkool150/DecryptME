-- database/supabase_bio.sql
-- Profile bio rules for the Supabase (PostgreSQL) database.
--
-- 1. New accounts default to "CTF Player" (only applies when no bio is given).
-- 2. When a user is promoted to admin, their bio is set to the administrator text.
-- 3. When an admin is demoted to a regular user, their bio is set back to "CTF Player".
--    Editing the bio afterwards is still allowed (the trigger only fires on role change).
--
-- Safe to run more than once.

-- Default bio for accounts created without an explicit bio.
ALTER TABLE public.users ALTER COLUMN bio SET DEFAULT 'CTF Player';

-- Normalise existing rows that predate the rules.
UPDATE public.users
SET bio = 'CTF Player'
WHERE (bio IS NULL OR bio IN ('DecryptMe platform administrator', 'DecryptMe platform administrator.'))
  AND role IS DISTINCT FROM 'admin';

UPDATE public.users
SET bio = 'DecryptMe platform administrator'
WHERE role = 'admin'
  AND (bio IS NULL OR bio = '' OR bio = 'DecryptMe platform administrator.');

CREATE OR REPLACE FUNCTION public.sync_user_bio_on_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.role = 'admin' THEN
            NEW.bio := 'DecryptMe platform administrator';
        ELSIF NEW.bio IS NULL THEN
            NEW.bio := 'CTF Player';
        END IF;

    -- Promoted to admin
    ELSIF NEW.role = 'admin' AND OLD.role IS DISTINCT FROM 'admin' THEN
        NEW.bio := 'DecryptMe platform administrator';

    -- Demoted from admin to user
    ELSIF OLD.role = 'admin' AND NEW.role IS DISTINCT FROM 'admin' THEN
        NEW.bio := 'CTF Player';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_bio_on_role ON public.users;

CREATE TRIGGER trg_sync_user_bio_on_role
BEFORE INSERT OR UPDATE OF role ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_bio_on_role();
