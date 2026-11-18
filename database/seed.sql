-- ============================================================
-- DecryptMe - Seed data
-- Run AFTER schema.sql.
--
--   mysql -u root -p decryptme < database/seed.sql
--
-- What this file does:
--   1. Inserts all 6 challenges (Forensics + Cryptography) that
--      match Challenges.jsx exactly, including their ordered steps
--      and per-step "wiki" info entries.
--   2. Creates a demo admin account and a demo player account so
--      you can log in immediately after setup.
--   3. Awards the demo player solved challenges + points so every
--      UI widget (dashboard, leaderboard, profile) has real data.
--
-- Flag hashes are SHA-256 of the plaintext flag.
-- ============================================================

USE decryptme;

-- ============================================================
-- 1. CATEGORIES  (already seeded by schema.sql with INSERT IGNORE)
--    Re-run is safe; nothing changes if rows already exist.
-- ============================================================
INSERT IGNORE INTO categories (name, slug, description, sort_order)
VALUES
    ('Forensics',     'forensics',     'Hidden data in files, images and disk images.', 1),
    ('Cryptography',  'cryptography',  'Ciphers, encodings and classical cryptanalysis.', 2);


-- ============================================================
-- 2. CHALLENGES
--    flag_hash = SHA2(plaintext_flag, 256)
--    Flags (plaintext, for reference only – never stored here):
--      fore-1   flag{T4bby_Wisp3rs_Myst3ri0us}
--      fore-2   flag{m3t4d4t4_l34ks_wh1l3_zip_h1d3s_1n_pl41n_s1ght}
--      fore-3   flag{Wh1sk_Th3_M4tch4_0r_L0s3_Th3_S3cr3t!}
--      crypto-1 flag{c4n_y0u_r34d_7h15}
--      crypto-2 flag{b1n4ry_b1ts}
--      crypto-3 flag{b4s3_32_1s_c0mm0n}
-- ============================================================
INSERT IGNORE INTO challenges
    (category_id, slug, title, description, difficulty, points, flag_hash, attachment_url, is_active)
VALUES
    -- ── Forensics ──────────────────────────────────────────
    (
        (SELECT id FROM categories WHERE slug = 'forensics'),
        'cute-miming',
        'Cute Miming',
        'A friend sent you a photo of their cat, but something about it feels off.\nFind the hidden message inside the image.',
        'easy',
        50,
        SHA2('flag{T4bby_Wisp3rs_Myst3ri0us}', 256),
        '/assets/Miming.png',
        TRUE
    ),
    (
        (SELECT id FROM categories WHERE slug = 'forensics'),
        'last-light',
        'Last Light',
        'A coastguard archivist found this photo of Greywatch Point lighthouse in a decommissioned camera. The keeper''s logbook was supposedly sealed with the photo itself. Can you open it?',
        'easy',
        50,
        SHA2('flag{m3t4d4t4_l34ks_wh1l3_zip_h1d3s_1n_pl41n_s1ght}', 256),
        '/assets/last_light.jpg',
        TRUE
    ),
    (
        (SELECT id FROM categories WHERE slug = 'forensics'),
        'dont-tell-kuromi',
        'Don''t Tell Kuromi',
        'My Melody''s Cafe is famous for its golden matcha latte, and the secret recipe is strictly confidential. She snapped a photo of her latest creation, but she may have left more than just the recipe behind. Dig into the photo, find what''s hidden, and recover the secret before Kuromi does.',
        'medium',
        100,
        SHA2('flag{Wh1sk_Th3_M4tch4_0r_L0s3_Th3_S3cr3t!}', 256),
        '/assets/my_golisden_matischa_laistte_raistio.jpg',
        TRUE
    ),
    -- ── Cryptography ───────────────────────────────────────
    (
        (SELECT id FROM categories WHERE slug = 'cryptography'),
        'can-you-read-me',
        'Can You Read Me',
        'Decode this message:\n\nc4n_y0u_r34d_7h15',
        'easy',
        10,
        SHA2('flag{c4n_y0u_r34d_7h15}', 256),
        NULL,
        TRUE
    ),
    (
        (SELECT id FROM categories WHERE slug = 'cryptography'),
        'zero-knowledge-one-answer',
        'Zero Knowledge One Answer',
        'Decode this message:\n\n01100110 01101100 01100001 01100111 01111011 01100010 00110001 01101110 00110100 01110010 01111001 01011111 01100010 00110001 01110100 01110011 01111101',
        'easy',
        10,
        SHA2('flag{b1n4ry_b1ts}', 256),
        NULL,
        TRUE
    ),
    (
        (SELECT id FROM categories WHERE slug = 'cryptography'),
        'too-common',
        'Too Common',
        'Hint: Only 32 People Know the Answer\n\nDecode this message:\n\nMZWGCZ33MI2HGM27GMZF6MLTL5RTA3LNGBXH2===',
        'easy',
        10,
        SHA2('flag{b4s3_32_1s_c0mm0n}', 256),
        NULL,
        TRUE
    );


-- ============================================================
-- 3. CHALLENGE STEPS
--    Mirrors the steps[] arrays in Challenges.jsx exactly,
--    including the wiki info (stored as JSON in the content col).
--
--    Content format:
--      {"text":"...","info":{"title":"...","body":"...","link":"..."}}
--    Steps without wiki info:
--      {"text":"..."}
--    Your backend API should detect the leading '{' and parse it.
-- ============================================================

-- Resolve challenge IDs once
SET @fore1   = (SELECT id FROM challenges WHERE slug = 'cute-miming');
SET @fore2   = (SELECT id FROM challenges WHERE slug = 'last-light');
SET @fore3   = (SELECT id FROM challenges WHERE slug = 'dont-tell-kuromi');
SET @crypt1  = (SELECT id FROM challenges WHERE slug = 'can-you-read-me');
SET @crypt2  = (SELECT id FROM challenges WHERE slug = 'zero-knowledge-one-answer');
SET @crypt3  = (SELECT id FROM challenges WHERE slug = 'too-common');

-- ── Cute Miming steps ───────────────────────────────────────
INSERT IGNORE INTO challenge_steps (challenge_id, step_order, content) VALUES
(@fore1, 1, '{"text":"Download the image and open it in an image viewer.","info":{"title":"What is Steganography?","body":"Steganography is the practice of hiding secret data inside ordinary, non-secret files or messages. Unlike encryption, which makes data unreadable, steganography hides the fact that secret data exists at all — for example, inside images, audio files, or video."}}'),
(@fore1, 2, '{"text":"Go to https://aperisolve.fr/ in your web browser.","info":{"title":"What is Aperisolve?","body":"Aperisolve is a free online steganography analysis platform. It automatically runs many popular steg tools (zsteg, steghide, outguess, exiftool, binwalk, strings, and more) on an uploaded image and displays their combined results in a single view.","link":"https://aperisolve.fr/"}}'),
(@fore1, 3, '{"text":"Drag and drop the image into the Aperisolve tool or choose a file and find the image on your computer."}'),
(@fore1, 4, '{"text":"Click Analyze and wait for the tool to process the image."}'),
(@fore1, 5, '{"text":"Look for any hidden messages or text that may appear in the results."}'),
(@fore1, 6, '{"text":"In the Decomposer (Blue section) you can find the first part of the flag.","info":{"title":"What is Bit-Plane Decomposition?","body":"Bit-plane decomposition splits an image into individual bit layers. Data hidden using LSB (Least Significant Bit) steganography is stored in the lowest bit of each pixel, making it invisible to the human eye but detectable by tools like Aperisolvs Decomposer."}}'),
(@fore1, 7, '{"text":"In the Identify section find the Comment field — it contains the second part of the flag.","info":{"title":"What is EXIF / Image Metadata?","body":"EXIF (Exchangeable Image File Format) metadata is extra information embedded in image files, such as the camera model, GPS coordinates, timestamps, and custom comment fields. Tools like ExifTool and Aperisolvs Identify tab can read and display this hidden metadata."}}');

-- ── Last Light steps ────────────────────────────────────────
INSERT IGNORE INTO challenge_steps (challenge_id, step_order, content) VALUES
(@fore2, 1, '{"text":"Download the image and open it in an image viewer. It looks like a normal photo, so the secret must be hidden in the file itself.","info":{"title":"File Carving","body":"File carving is a technique for recovering files or data hidden inside another file, without relying on the file system. Tools like Binwalk scan for known file signatures (magic bytes) to detect embedded archives, images, or executables."}}'),
(@fore2, 2, '{"text":"Go to https://aperisolve.fr/ in your web browser.","info":{"title":"What is Aperisolve?","body":"Aperisolve is a free online steganography analysis platform. It automatically runs many popular steg tools (zsteg, steghide, outguess, exiftool, binwalk, strings, and more) on an uploaded image and displays their combined results in a single view.","link":"https://aperisolve.fr/"}}'),
(@fore2, 3, '{"text":"Drag and drop the image into the Aperisolve tool or choose the file from your computer, then click Analyze and wait for the results."}'),
(@fore2, 4, '{"text":"Open the Identify tab and look through the metadata. Find the User Comment field, which contains a strange string: YmVhY29uX2tlZXBlcl8xOTg3","info":{"title":"What is EXIF Metadata?","body":"EXIF metadata is extra information embedded in image files. The User Comment field is a free-form field that cameras and software can write to, making it a common spot to hide data in forensics challenges."}}'),
(@fore2, 5, '{"text":"That string is Base64. Go to https://gchq.github.io/CyberChef/ and add the From Base64 operation, then paste the string as the input. The output is the password: beacon_keeper_1987","info":{"title":"What is Base64?","body":"Base64 is a binary-to-text encoding scheme that represents binary data using 64 printable ASCII characters (A-Z, a-z, 0-9, +, /). It is widely used to safely transport binary data in text-only contexts. It is NOT encryption — anyone can decode it.","link":"https://gchq.github.io/CyberChef/"}}'),
(@fore2, 6, '{"text":"The Copyright field says the logbook is sealed, so there must be a locked file hiding inside the image. Go back to Aperisolve and open the Binwalk tab. It shows a Zip archive hidden after the end of the JPEG data.","info":{"title":"What is Binwalk?","body":"Binwalk is a tool for searching binary images for embedded files and executable code. It uses a database of magic bytes — unique byte sequences at the start of known file formats — to find and extract files hidden inside other files."}}'),
(@fore2, 7, '{"text":"Extract the hidden zip. Either download the extracted file from the Binwalk results, or rename last_light.jpg to last_light.zip and open it with an online unzip tool such as https://www.ezyzip.com/unzip-files-online.html","info":{"title":"ZIP Polyglot Files","body":"A polyglot file is a file that is simultaneously valid in two different formats. JPEG files end with the bytes FF D9; any data appended after that is ignored by image viewers but can be read by ZIP tools — allowing a single file to be both a valid image and a valid ZIP archive."}}'),
(@fore2, 8, '{"text":"When asked for a password, enter beacon_keeper_1987 and extract the archive."}'),
(@fore2, 9, '{"text":"Open flag.txt. The text inside is the flag."}');

-- ── Don't Tell Kuromi steps ─────────────────────────────────
INSERT IGNORE INTO challenge_steps (challenge_id, step_order, content) VALUES
(@fore3, 1, '{"text":"This is a Special Problem Challenge. You will need to find the hidden message in the image and submit it as a flag."}');

-- ── Can You Read Me steps ───────────────────────────────────
INSERT IGNORE INTO challenge_steps (challenge_id, step_order, content) VALUES
(@crypt1, 1, '{"text":"Look closely at the ciphertext. Some letters have been replaced with numbers.","info":{"title":"What is Leetspeak (1337)?","body":"Leetspeak (or leet) is an informal alphabet that substitutes letters with visually similar numbers or symbols. It originated in early internet culture and hacker communities. Common substitutions: A->4, E->3, I->1, O->0, T->7, S->5."}}'),
(@crypt1, 2, '{"text":"This technique is commonly called leetspeak (1337)."}'),
(@crypt1, 3, '{"text":"Try replacing 4 with A, 0 with O, 3 with E, 7 with T, and 1 with I."}'),
(@crypt1, 4, '{"text":"Read the decoded message and submit it using the required flag format."}');

-- ── Zero Knowledge One Answer steps ─────────────────────────
INSERT IGNORE INTO challenge_steps (challenge_id, step_order, content) VALUES
(@crypt2, 1, '{"text":"Copy the encrypted message."}'),
(@crypt2, 2, '{"text":"Go to https://gchq.github.io/CyberChef/","info":{"title":"What is CyberChef?","body":"CyberChef is a free, open-source web tool by GCHQ (the UKs intelligence agency) nicknamed the Cyber Swiss Army Knife. It supports hundreds of encoding, encryption, compression, and data analysis operations that can be chained together into a recipe for quick decoding.","link":"https://gchq.github.io/CyberChef/"}}'),
(@crypt2, 3, '{"text":"Search for the operation From Binary and drag it to the recipe area.","info":{"title":"What is Binary Encoding?","body":"Binary encoding represents data as sequences of 0s and 1s. Each group of 8 bits (a byte) corresponds to one character in ASCII. For example, 01100110 = 102 in decimal = f in ASCII. Reading binary is a fundamental skill in computing and CTF challenges."}}'),
(@crypt2, 4, '{"text":"Paste the encrypted message into the input area."}'),
(@crypt2, 5, '{"text":"Click on the Bake! button to decode the message."}'),
(@crypt2, 6, '{"text":"Read the decoded message and submit it using the required flag format."}');

-- ── Too Common steps ─────────────────────────────────────────
INSERT IGNORE INTO challenge_steps (challenge_id, step_order, content) VALUES
(@crypt3, 1, '{"text":"Copy the encrypted message."}'),
(@crypt3, 2, '{"text":"Go to https://gchq.github.io/CyberChef/","info":{"title":"What is CyberChef?","body":"CyberChef is a free, open-source web tool by GCHQ nicknamed the Cyber Swiss Army Knife. It supports hundreds of encoding and decoding operations you can chain together into a recipe.","link":"https://gchq.github.io/CyberChef/"}}'),
(@crypt3, 3, '{"text":"Search for the operation From Base32 and drag it to the recipe area.","info":{"title":"What is Base32?","body":"Base32 encodes binary data using 32 characters (A-Z and 2-7) plus = padding. It is less common than Base64 but useful when case-sensitivity is a problem (since it uses only uppercase letters). The hint Only 32 People Know the Answer is a clue pointing to Base32."}}'),
(@crypt3, 4, '{"text":"Paste the encrypted message into the input area."}'),
(@crypt3, 5, '{"text":"Click on the Bake! button to decode the message."}'),
(@crypt3, 6, '{"text":"Read the decoded message and submit it using the required flag format."}');


-- ============================================================
-- 4. DEMO USERS
--    Passwords below are PLACEHOLDER hashes.
--    Before going live, generate real bcrypt hashes and replace them:
--
--    Node.js:  bcrypt.hash('your_password', 12)
--    Python:   bcrypt.hashpw(b'your_password', bcrypt.gensalt(12))
--
--    admin    / (set via your auth system)
--    r3v3rs3r / (set via your auth system)
-- ============================================================
INSERT IGNORE INTO users
    (username, email, password_hash, role, bio, country, timezone, total_points, solved_count, is_active)
VALUES
    (
        'admin',
        'admin@decryptme.local',
        '$2b$12$ZRZrS5n2hJY8LkC7tbrU4u37i24yaZad1bl1cDNGUUxO4iBihB/vS', -- Admin@decryptme1
        'admin',
        'DecryptMe platform administrator',
        'PH',
        'Asia/Manila',
        0,
        0,
        TRUE
    ),
    (
        'r3v3rs3r',
        'r3v3rs3r@decryptme.local',
        '$2b$12$mSMwBHbU1apHgtjHGWkpg.eek4QP5s/.yWBdiATV0qpO27R5.uUmG', -- Player@decryptme1
        'user',
        'Reverse engineer and CTF generalist. I like packed binaries, unusual file formats, and the moment a hidden string finally makes sense.',
        'TH',
        'Asia/Bangkok',
        0,   -- will be updated by award_challenge_points calls below
        0,
        TRUE
    );


-- ============================================================
-- 5. SOLVES for the demo player
--    Matches the solved challenges shown in Profile.jsx ACTIVITY:
--      Cute Miming          Forensics    50 pts
--      Last Light           Forensics    50 pts
--      Can You Read Me      Crypto       10 pts
--      Zero Knowledge ...   Crypto       10 pts
--      Too Common           Crypto       10 pts
--    Total: 130 pts, 5 solves
-- ============================================================
SET @player = (SELECT id FROM users WHERE username = 'r3v3rs3r');

CALL award_challenge_points(@player, (SELECT id FROM challenges WHERE slug = 'cute-miming'));
CALL award_challenge_points(@player, (SELECT id FROM challenges WHERE slug = 'last-light'));
CALL award_challenge_points(@player, (SELECT id FROM challenges WHERE slug = 'can-you-read-me'));
CALL award_challenge_points(@player, (SELECT id FROM challenges WHERE slug = 'zero-knowledge-one-answer'));
CALL award_challenge_points(@player, (SELECT id FROM challenges WHERE slug = 'too-common'));


-- ============================================================
-- 6. ACHIEVEMENTS  (schema.sql already seeds these with INSERT IGNORE)
--    Duplicated here so this file is fully self-contained.
-- ============================================================
INSERT IGNORE INTO achievements (code, name, description, criteria, points_bonus, is_active) VALUES
    ('FF',   'First flag',    'Solved your first challenge',          'First correct solve',       0, TRUE),
    ('7D',   'Week streak',   'Active for 7 consecutive days',        '7 consecutive active days', 0, TRUE),
    ('CR',   'Crypto mind',   'Solved 5 Cryptography challenges',     '5 Cryptography solves',     0, TRUE),
    ('FO',   'Forensic eye',  'Solved 3 Forensics challenges',        '3 Forensics solves',        0, TRUE),
    ('T100', 'Top 100',       'Reached the global top 100',           'Rank <= 100',               0, TRUE),
    ('SP',   'Speedrun',      'Solved a challenge in under 5 minutes','Solve time < 5 minutes',    0, TRUE);


-- ============================================================
-- 7. UNLOCK achievements for the demo player
--    Matches Profile.jsx BADGES:
--      Unlocked: FF, 7D, CR, FO
--      Locked  : T100, SP  (not inserted — not yet earned)
-- ============================================================
SET @player = (SELECT id FROM users WHERE username = 'r3v3rs3r');

INSERT IGNORE INTO user_achievements (user_id, achievement_id)
VALUES
    (@player, (SELECT id FROM achievements WHERE code = 'FF')),
    (@player, (SELECT id FROM achievements WHERE code = '7D')),
    (@player, (SELECT id FROM achievements WHERE code = 'CR')),
    (@player, (SELECT id FROM achievements WHERE code = 'FO'));


-- ============================================================
-- 8. SANITY CHECK — run this after seeding to verify wiring
-- ============================================================
SELECT
    cat.name            AS category,
    c.slug,
    c.title,
    c.points,
    c.difficulty,
    COUNT(cs.id)        AS step_count
FROM challenges c
JOIN categories  cat ON cat.id = c.category_id
LEFT JOIN challenge_steps cs ON cs.challenge_id = c.id
GROUP BY c.id
ORDER BY cat.sort_order, c.id;

SELECT u.username, u.total_points, u.solved_count,
       COUNT(ua.achievement_id) AS achievements_unlocked
FROM users u
LEFT JOIN user_achievements ua ON ua.user_id = u.id
GROUP BY u.id;

