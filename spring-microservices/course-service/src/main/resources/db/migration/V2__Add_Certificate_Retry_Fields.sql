-- Flyway migration: Add retry metadata fields and unique constraint to certificate table
-- Version: 2
-- Adds: attempt_count, last_attempted_at, last_error, next_retry_at, unique constraint (user_id, published_course_id)

ALTER TABLE certificate
    ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_attempted_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS last_error VARCHAR(2000) NULL,
    ADD COLUMN IF NOT EXISTS next_retry_at DATETIME NULL;

-- Add unique constraint to prevent duplicate certificates for a user/course
-- If the constraint already exists this will fail on some DBs; adjust as needed for your environment.
ALTER TABLE certificate
    ADD CONSTRAINT uq_certificate_user_published UNIQUE (user_id, published_course_id);

-- Optional indexes to speed up retry queries
CREATE INDEX IF NOT EXISTS idx_certificate_status_next_retry ON certificate (status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_certificate_user_published ON certificate (user_id, published_course_id);
