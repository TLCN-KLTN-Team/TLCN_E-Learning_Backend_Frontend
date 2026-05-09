-- Flyway migration: drop wallet_address column from user table
-- This migration removes the wallet_address column which is no longer used.

ALTER TABLE `user` DROP COLUMN IF EXISTS `wallet_address`;
