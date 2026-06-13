-- Add pdf_hash column to certificate table
-- This stores the SHA-256 hash of the actual PDF file bytes,
-- enabling verification via PDF upload on the public verification page.
USE course_management;

ALTER TABLE certificate
    ADD COLUMN pdf_hash VARCHAR(64) NULL;

-- Index for fast lookup by pdf_hash
CREATE INDEX idx_certificate_pdf_hash ON certificate (pdf_hash);
