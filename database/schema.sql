-- ============================================================
-- DecryptMe - MySQL 8.0 schema
-- Run this file in MySQL Workbench.
--
-- This script creates the database, tables, views, and the
-- stored procedure used to award challenge points.
--
-- NOTE: This is the initial schema script. It does not delete
-- existing tables. To start over, drop the database manually:
--   DROP DATABASE decryptme;
-- ============================================================

CREATE DATABASE IF NOT EXISTS decryptme
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE decryptme;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ------------------------------------------------------------
-- Users
-- total_points and solved_count are cached totals, updated by
-- the award_challenge_points procedure below.
-- ------------------------------------------------------------
CREATE TABLE users (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username        VARCHAR(32) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    bio             VARCHAR(500) NULL,
    avatar_url      VARCHAR(2048) NULL,
    country         CHAR(2) NULL,
    timezone        VARCHAR(64) NOT NULL DEFAULT 'UTC',
    total_points    INT NOT NULL DEFAULT 0,
    solved_count    INT UNSIGNED NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                    ON UPDATE CURRENT_TIMESTAMP(6),
    last_seen_at    DATETIME(6) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_leaderboard (is_active, total_points DESC, solved_count DESC, username),
    CONSTRAINT chk_users_points CHECK (total_points >= 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Challenge categories
-- ------------------------------------------------------------
CREATE TABLE categories (
    id          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50) NOT NULL,
    slug        VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_name (name),
    UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Challenges
-- flag_hash stores a SHA-256/HMAC hex hash, never the flag.
-- ------------------------------------------------------------
CREATE TABLE challenges (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_id      TINYINT UNSIGNED NOT NULL,
    slug             VARCHAR(100) NOT NULL,
    title            VARCHAR(150) NOT NULL,
    description      TEXT NOT NULL,
    difficulty       ENUM('easy', 'medium', 'hard', 'insane') NOT NULL DEFAULT 'easy',
    points           SMALLINT UNSIGNED NOT NULL,
    flag_hash        CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    attachment_url   VARCHAR(2048) NULL,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                     ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_challenges_slug (slug),
    KEY idx_challenges_category (category_id),
    KEY idx_challenges_active (is_active, points),
    CONSTRAINT fk_challenges_category
        FOREIGN KEY (category_id) REFERENCES categories (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_challenges_points CHECK (points > 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Ordered steps shown in the challenge modal
-- ------------------------------------------------------------
CREATE TABLE challenge_steps (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    challenge_id BIGINT UNSIGNED NOT NULL,
    step_order   SMALLINT UNSIGNED NOT NULL,
    content      TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_challenge_steps_order (challenge_id, step_order),
    CONSTRAINT fk_challenge_steps_challenge
        FOREIGN KEY (challenge_id) REFERENCES challenges (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT chk_challenge_steps_order CHECK (step_order > 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Solved challenges
-- ------------------------------------------------------------
CREATE TABLE solves (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id        BIGINT UNSIGNED NOT NULL,
    challenge_id   BIGINT UNSIGNED NOT NULL,
    points_awarded SMALLINT UNSIGNED NOT NULL,
    solved_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_solves_user_challenge (user_id, challenge_id),
    KEY idx_solves_challenge (challenge_id),
    KEY idx_solves_user_date (user_id, solved_at),
    CONSTRAINT fk_solves_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_solves_challenge
        FOREIGN KEY (challenge_id) REFERENCES challenges (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT chk_solves_points CHECK (points_awarded > 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Flag submission audit trail
-- Only the hash of the submitted flag is retained.
-- ------------------------------------------------------------
CREATE TABLE flag_attempts (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id             BIGINT UNSIGNED NOT NULL,
    challenge_id        BIGINT UNSIGNED NOT NULL,
    submitted_flag_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    is_correct          BOOLEAN NOT NULL,
    ip_hash             CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
    attempted_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_flag_attempts_user (user_id, attempted_at),
    KEY idx_flag_attempts_challenge (challenge_id, attempted_at),
    CONSTRAINT fk_flag_attempts_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_flag_attempts_challenge
        FOREIGN KEY (challenge_id) REFERENCES challenges (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Append-only points ledger
-- A solve can produce at most one challenge-solve transaction.
-- ------------------------------------------------------------
CREATE TABLE point_transactions (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED NOT NULL,
    amount      INT NOT NULL,
    source_type ENUM(
        'challenge_solve',
        'achievement',
        'bonus',
        'admin_adjustment',
        'correction'
    ) NOT NULL,
    solve_id    BIGINT UNSIGNED NULL,
    description VARCHAR(255) NULL,
    created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_point_transactions_solve (solve_id),
    KEY idx_point_transactions_user (user_id, created_at),
    CONSTRAINT fk_point_transactions_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_point_transactions_solve
        FOREIGN KEY (solve_id) REFERENCES solves (id)
        ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT chk_point_transactions_amount CHECK (amount <> 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Achievements
-- ------------------------------------------------------------
CREATE TABLE achievements (
    id           SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code         VARCHAR(16) NOT NULL,
    name         VARCHAR(80) NOT NULL,
    description  VARCHAR(255) NOT NULL,
    criteria     VARCHAR(255) NULL,
    points_bonus SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_achievements_code (code)
) ENGINE=InnoDB;

CREATE TABLE user_achievements (
    user_id        BIGINT UNSIGNED NOT NULL,
    achievement_id SMALLINT UNSIGNED NOT NULL,
    unlocked_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, achievement_id),
    KEY idx_user_achievements_achievement (achievement_id),
    CONSTRAINT fk_user_achievements_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_user_achievements_achievement
        FOREIGN KEY (achievement_id) REFERENCES achievements (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- Views
-- ============================================================

-- Ranked active users. Username is the deterministic final tie-breaker.
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT
    ROW_NUMBER() OVER (
        ORDER BY u.total_points DESC, u.solved_count DESC, u.username ASC
    ) AS rank_position,
    u.id AS user_id,
    u.username,
    u.avatar_url,
    u.total_points AS points,
    u.solved_count AS solved_challenges
FROM users u
WHERE u.is_active = TRUE;

CREATE OR REPLACE VIEW v_user_profile_stats AS
SELECT
    l.user_id,
    l.username,
    l.avatar_url,
    l.points,
    l.solved_challenges,
    l.rank_position,
    (
        SELECT COUNT(*)
        FROM user_achievements ua
        WHERE ua.user_id = l.user_id
    ) AS achievements_unlocked,
    (
        SELECT MAX(s.solved_at)
        FROM solves s
        WHERE s.user_id = l.user_id
    ) AS last_solved_at
FROM v_leaderboard l;

CREATE OR REPLACE VIEW v_recent_activity AS
SELECT
    s.id AS solve_id,
    s.user_id,
    u.username,
    s.challenge_id,
    c.title AS challenge_title,
    cat.name AS category_name,
    s.points_awarded,
    s.solved_at
FROM solves s
JOIN users u ON u.id = s.user_id
JOIN challenges c ON c.id = s.challenge_id
JOIN categories cat ON cat.id = c.category_id;

-- ============================================================
-- Point awarding procedure
-- Inserts a solve, a ledger entry, and updates cached user totals
-- in a single transaction. A second solve of the same challenge
-- raises an error and leaves the database unchanged.
-- ============================================================
DROP PROCEDURE IF EXISTS award_challenge_points;

DELIMITER $$

CREATE PROCEDURE award_challenge_points(
    IN p_user_id BIGINT UNSIGNED,
    IN p_challenge_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_points SMALLINT UNSIGNED DEFAULT 0;
    DECLARE v_user_exists INT DEFAULT 0;
    DECLARE v_solve_id BIGINT UNSIGNED;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT COUNT(*)
    INTO v_user_exists
    FROM users
    WHERE id = p_user_id
      AND is_active = TRUE;

    IF v_user_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'User not found or inactive';
    END IF;

    SELECT COALESCE((
        SELECT points
        FROM challenges
        WHERE id = p_challenge_id
          AND is_active = TRUE
    ), 0)
    INTO v_points;

    IF v_points = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Challenge not found or inactive';
    END IF;

    INSERT IGNORE INTO solves (user_id, challenge_id, points_awarded)
    VALUES (p_user_id, p_challenge_id, v_points);

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Challenge already solved by this user';
    END IF;

    SET v_solve_id = LAST_INSERT_ID();

    INSERT INTO point_transactions (
        user_id,
        amount,
        source_type,
        solve_id,
        description
    )
    VALUES (
        p_user_id,
        v_points,
        'challenge_solve',
        v_solve_id,
        CONCAT('Solved challenge #', p_challenge_id)
    );

    UPDATE users
    SET total_points = total_points + v_points,
        solved_count = solved_count + 1
    WHERE id = p_user_id;

    COMMIT;
END$$

DELIMITER ;

-- ============================================================
-- Reference data
-- ============================================================
INSERT IGNORE INTO categories (name, slug, sort_order)
VALUES
    ('Forensics', 'forensics', 1),
    ('Cryptography', 'cryptography', 2);

INSERT IGNORE INTO achievements
    (code, name, description, criteria, points_bonus)
VALUES
    ('FF', 'First flag', 'Solved the first challenge', 'First correct solve', 0),
    ('7D', 'Week streak', 'Active for 7 days', '7 consecutive active days', 0),
    ('CR', 'Crypto mind', 'Solved 5 crypto targets', '5 Cryptography solves', 0),
    ('FO', 'Forensic eye', 'Solved 3 stego targets', '3 Forensics solves', 0),
    ('T100', 'Top 100', 'Reached the global top 100', 'Rank <= 100', 0),
    ('SP', 'Speedrun', 'Solved a challenge in under 5 minutes', 'Solve time < 5 minutes', 0);
