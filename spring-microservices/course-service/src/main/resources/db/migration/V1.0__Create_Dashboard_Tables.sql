-- Dashboard Analytics Tables Migration
-- Version: 1.0
-- Date: 2024-12-18
-- Description: Creates tables for dashboard analytics including page visits and violations tracking

-- ============================================================================
-- Table: page_visits
-- Purpose: Track website traffic and user engagement metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS page_visits (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) COMMENT 'User ID (nullable for anonymous visitors)',
    page_url VARCHAR(500) NOT NULL COMMENT 'Visited page URL',
    visit_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Visit timestamp',
    ip_address VARCHAR(45) COMMENT 'IP address of visitor (supports IPv6)',
    user_agent VARCHAR(500) COMMENT 'Browser user agent string',
    session_id VARCHAR(255) COMMENT 'Session identifier for unique visitor tracking',
    
    -- Indexes for performance
    INDEX idx_visit_time (visit_time),
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_visit_time_url (visit_time, page_url(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks page visits for traffic analytics';

-- ============================================================================
-- Table: violations
-- Purpose: Track and manage content/behavior violations in the system
-- ============================================================================
CREATE TABLE IF NOT EXISTS violations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL COMMENT 'User who committed the violation',
    violation_type VARCHAR(100) NOT NULL COMMENT 'Type of violation (e.g., plagiarism, spam)',
    description VARCHAR(1000) COMMENT 'Detailed description of the violation',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' COMMENT 'Status: PENDING, REVIEWED, RESOLVED, DISMISSED',
    severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM' COMMENT 'Severity: LOW, MEDIUM, HIGH, CRITICAL',
    reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When violation was reported',
    reviewed_at DATETIME COMMENT 'When violation was reviewed',
    reviewed_by VARCHAR(255) COMMENT 'Admin/moderator who reviewed',
    course_id INT COMMENT 'Related course ID (if applicable)',
    reference_id VARCHAR(255) COMMENT 'Reference to related entity (assignment ID, quiz ID, etc.)',
    
    -- Indexes for performance
    INDEX idx_status (status),
    INDEX idx_reported_at (reported_at),
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_status_reported (status, reported_at),
    
    -- Foreign key constraint
    CONSTRAINT fk_violation_course 
        FOREIGN KEY (course_id) 
        REFERENCES course(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
        
    -- Check constraints
    CONSTRAINT chk_violation_status 
        CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED')),
    CONSTRAINT chk_violation_severity 
        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks violations and compliance issues';

-- ============================================================================
-- Sample Data for Testing (Optional)
-- ============================================================================

-- Insert sample page visits (last 30 days)
INSERT INTO page_visits (user_id, page_url, visit_time, ip_address, session_id) VALUES
('user_001', '/courses', DATE_SUB(NOW(), INTERVAL 1 DAY), '192.168.1.100', 'sess_001'),
('user_002', '/dashboard', DATE_SUB(NOW(), INTERVAL 2 DAY), '192.168.1.101', 'sess_002'),
('user_003', '/courses/123', DATE_SUB(NOW(), INTERVAL 3 DAY), '192.168.1.102', 'sess_003'),
(NULL, '/home', DATE_SUB(NOW(), INTERVAL 5 DAY), '192.168.1.103', 'sess_004');

-- Insert sample violations
INSERT INTO violations (user_id, violation_type, description, status, severity, course_id) VALUES
('user_005', 'PLAGIARISM', 'Assignment submission contains copied content', 'PENDING', 'HIGH', 1),
('user_006', 'SPAM', 'Multiple spam comments in discussion forum', 'REVIEWED', 'MEDIUM', 2),
('user_007', 'INAPPROPRIATE_CONTENT', 'Posted inappropriate material', 'RESOLVED', 'CRITICAL', 3);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify tables created
SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('page_visits', 'violations');

-- Check indexes
SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('page_visits', 'violations')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ============================================================================
-- Cleanup (Rollback) - Use with caution!
-- ============================================================================

-- Uncomment to drop tables (for rollback during development)
-- DROP TABLE IF EXISTS violations;
-- DROP TABLE IF EXISTS page_visits;
