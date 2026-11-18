-- ============================================================
-- DecryptMe - Admin dashboard schema additions
-- Run AFTER database/schema.sql.
--
--   mysql -u root -p decryptme < database/admin_features.sql
--
-- Adds:
--   announcements  - platform announcements (draft/published)
--   user_presence  - heartbeat-based online status
--   audit_logs     - administrative action trail
--
-- Existing tables are reused:
--   challenges / challenge_steps  - problems and solve modules
--   solves / flag_attempts        - solver and submission monitoring
--   users                         - accounts, roles, last_seen_at
-- ============================================================

USE decryptme;

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Announcements
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title        VARCHAR(160) NOT NULL,
    body         TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_by   BIGINT UNSIGNED NULL,
    published_at DATETIME(6) NULL,
    created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                 ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_announcements_published (is_published, published_at DESC),
    KEY idx_announcements_created_by (created_by),
    CONSTRAINT fk_announcements_author
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Presence / heartbeat
-- One row per user. Online status is derived from the last
-- heartbeat, not from whether a JWT still exists.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_presence (
    user_id           BIGINT UNSIGNED NOT NULL,
    last_heartbeat_at DATETIME(6) NULL,
    current_activity  VARCHAR(120) NULL,
    current_path      VARCHAR(255) NULL,
    last_login_at     DATETIME(6) NULL,
    updated_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                      ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id),
    KEY idx_user_presence_heartbeat (last_heartbeat_at),
    CONSTRAINT fk_user_presence_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Audit logs
-- actor_user_id is nullable so records survive account deletion.
-- details is JSON text; the API returns it parsed where possible.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT UNSIGNED NULL,
    action        VARCHAR(80) NOT NULL,
    entity_type   VARCHAR(50) NULL,
    entity_id     VARCHAR(64) NULL,
    details       JSON NULL,
    ip_hash       CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
    user_agent    VARCHAR(255) NULL,
    created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_audit_created (created_at),
    KEY idx_audit_actor (actor_user_id, created_at),
    KEY idx_audit_action (action, created_at),
    KEY idx_audit_entity (entity_type, entity_id),
    CONSTRAINT fk_audit_actor
        FOREIGN KEY (actor_user_id) REFERENCES users (id)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB;
