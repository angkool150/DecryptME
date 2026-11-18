-- ============================================================
-- DecryptMe - Set passwords for existing users
-- Run this in MySQL Workbench or via:
--   mysql -u root -p decryptme < database/set_passwords.sql
--
-- Passwords:
--   admin     →  Admin@decryptme1
--   r3v3rs3r  →  Player@decryptme1
--
-- Change these after first login!
-- ============================================================

USE decryptme;

UPDATE users
SET password_hash = '$2b$12$ZRZrS5n2hJY8LkC7tbrU4u37i24yaZad1bl1cDNGUUxO4iBihB/vS'
WHERE username = 'admin';

UPDATE users
SET password_hash = '$2b$12$mSMwBHbU1apHgtjHGWkpg.eek4QP5s/.yWBdiATV0qpO27R5.uUmG'
WHERE username = 'r3v3rs3r';

-- Confirm
SELECT username, role, LEFT(password_hash, 20) AS hash_preview FROM users;

