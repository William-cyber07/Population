-- 001_p0_security.sql
-- P0 security migration. Run once against the application database
-- (default: williamdb) after backing it up.
--
--   mysql -u root -p williamdb < db/migrations/001_p0_security.sql
--
-- 1) Extend the role model so manager/administrator/inputer accounts can exist.
ALTER TABLE users
    MODIFY COLUMN role ENUM('inputer', 'field_user', 'manager', 'admin', 'administrator')
    NOT NULL DEFAULT 'field_user';

-- 2) Least-privilege application account (recommended).
--    The app should NOT connect as root. Replace the placeholders, run the
--    statements below, then update DB_USER / DB_PASSWORD in .env.
--
-- CREATE USER IF NOT EXISTS 'population_app'@'localhost'
--     IDENTIFIED BY 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON williamdb.* TO 'population_app'@'localhost';
-- FLUSH PRIVILEGES;
--
-- 3) Optional but recommended: make sure the app account cannot alter the
--    schema. The grants above already exclude DDL privileges.
--
-- 4) Rotate the old root password because the previous .env was committed to
--    git history:
-- ALTER USER 'root'@'localhost' IDENTIFIED BY 'REPLACE_WITH_A_NEW_STRONG_PASSWORD';
