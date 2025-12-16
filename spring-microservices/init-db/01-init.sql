-- spring-microservices/init-db/01-init.sql

-- Create databases
CREATE DATABASE IF NOT EXISTS identity_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS course_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions to appuser
GRANT ALL PRIVILEGES ON identity_service.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON course_management.* TO 'appuser'@'%';

FLUSH PRIVILEGES;