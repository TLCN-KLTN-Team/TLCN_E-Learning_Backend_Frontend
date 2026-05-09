-- Ensure certificate inserts do not fail on legacy schemas where attempt_count has no default.
-- This keeps the current claim flow working even though retry scheduling was removed.

ALTER TABLE certificate
    MODIFY COLUMN attempt_count INT NOT NULL DEFAULT 0;