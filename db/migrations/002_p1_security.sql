-- 002_p1_security.sql
-- P1 security migration: password policy/lockout, TOTP two-factor auth and an
-- append-only audit trail. Run once against the application database after 001.
--
--   mysql -u root -p williamdb < db/migrations/002_p1_security.sql
--
-- All statements are additive and safe to run on a populated database.

ALTER TABLE users
    ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN password_changed_at DATETIME NULL,
    ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN locked_until DATETIME NULL,
    ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN two_factor_secret VARCHAR(64) NULL,
    ADD COLUMN two_factor_pending_secret VARCHAR(64) NULL,
    ADD COLUMN backup_codes TEXT NULL;

CREATE TABLE IF NOT EXISTS audit_log (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NULL,
    target_id VARCHAR(64) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_created (created_at),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE SET NULL
);

-- Speed up ownership-scoped queries (person_round.created_by).
-- If this index already exists, MySQL will report "Duplicate key name";
-- that is safe to ignore.
CREATE INDEX idx_person_round_created_by ON person_round(created_by);
