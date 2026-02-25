-- =====================================================
-- MyCAE Tracker Database Migration Script
-- Safe Update from Old Version to New Version
-- Created: 2026-02-25
-- Run this in phpMyAdmin on your cPanel database
-- =====================================================

-- This script safely adds new tables and columns WITHOUT affecting existing data
-- SKIPPED: Destructive migrations that would delete data

-- =====================================================
-- STEP 1: Create New Tables (Safe - No existing data affected)
-- =====================================================

-- 1.1 Create project_team_members table (CRITICAL - Required for Project Team feature)
CREATE TABLE IF NOT EXISTS `project_team_members` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `team_member_id` varchar(36) NOT NULL,
  `role` enum('lead_engineer','engineer') NOT NULL DEFAULT 'engineer',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_project_team_member` (`project_id`,`team_member_id`),
  KEY `FK_project_team_members_project` (`project_id`),
  KEY `FK_project_team_members_team_member` (`team_member_id`),
  CONSTRAINT `FK_project_team_members_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_project_team_members_team_member` FOREIGN KEY (`team_member_id`) REFERENCES `team_members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.2 Create audit_logs table
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` varchar(36) NOT NULL,
  `action` enum('create','update','delete','view','export','approve','reject') NOT NULL,
  `entity_type` enum('invoice','issued_po','received_po','project','payment','exchange_rate') NOT NULL,
  `entity_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `changes` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_audit_logs_entity` (`entity_type`,`entity_id`),
  KEY `IDX_audit_logs_user` (`user_id`),
  KEY `IDX_audit_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.3 Create received_invoices table
CREATE TABLE IF NOT EXISTS `received_invoices` (
  `id` varchar(36) NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `issued_po_id` varchar(36) NOT NULL,
  `vendor_name` varchar(200) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'MYR',
  `amount_myr` decimal(15,2) DEFAULT NULL,
  `exchange_rate` decimal(10,6) DEFAULT NULL,
  `invoice_date` datetime NOT NULL,
  `received_date` datetime NOT NULL,
  `due_date` datetime DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','verified','paid','disputed') NOT NULL DEFAULT 'pending',
  `file_url` varchar(500) DEFAULT NULL,
  `created_by` varchar(36) DEFAULT NULL,
  `verified_by` varchar(36) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK_received_invoices_issued_po` (`issued_po_id`),
  CONSTRAINT `FK_received_invoices_issued_po` FOREIGN KEY (`issued_po_id`) REFERENCES `issued_pos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- STEP 2: Add New Columns to Existing Tables (Safe)
-- =====================================================

-- 2.1 Add columns to users table (Temp Password Feature)
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `temp_password_expires` timestamp NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `is_temp_password` tinyint(1) NOT NULL DEFAULT 0;

-- 2.2 Add columns to projects table (Variation Order Support)
ALTER TABLE `projects` 
ADD COLUMN IF NOT EXISTS `parent_project_id` varchar(36) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `is_variation_order` tinyint(1) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `vo_number` int(11) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `billing_type` enum('hourly','lump_sum') NOT NULL DEFAULT 'hourly';

-- Add indexes for projects
CREATE INDEX IF NOT EXISTS `IDX_parent_project_id` ON `projects` (`parent_project_id`);
CREATE INDEX IF NOT EXISTS `IDX_parent_vo` ON `projects` (`parent_project_id`, `is_variation_order`, `vo_number`);

-- Add self-referential foreign key for variation orders
ALTER TABLE `projects` 
ADD CONSTRAINT IF NOT EXISTS `FK_project_parent` 
FOREIGN KEY (`parent_project_id`) REFERENCES `projects` (`id`) ON DELETE RESTRICT;

-- 2.3 Add columns to invoices table (Approval Workflow)
ALTER TABLE `invoices` 
ADD COLUMN IF NOT EXISTS `created_by` varchar(36) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `approved_by` varchar(36) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `approved_at` datetime DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `submitted_for_approval_at` datetime DEFAULT NULL;

-- Add foreign keys for invoices
ALTER TABLE `invoices` 
ADD CONSTRAINT IF NOT EXISTS `fk_invoices_created_by` 
FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT IF NOT EXISTS `fk_invoices_approved_by` 
FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Add index for invoices
CREATE INDEX IF NOT EXISTS `idx_invoices_created_by` ON `invoices` (`created_by`);

-- 2.4 Add columns to inventory table
ALTER TABLE `inventory` 
ADD COLUMN IF NOT EXISTS `last_calibrated_date` date DEFAULT NULL;

-- 2.5 Add columns to purchase_orders table
ALTER TABLE `purchase_orders` 
ADD COLUMN IF NOT EXISTS `exchange_rate_source` enum('manual','xe','bank') DEFAULT NULL;

-- 2.6 Add file_url columns to invoices and issued_pos (if not exist)
ALTER TABLE `invoices` 
ADD COLUMN IF NOT EXISTS `file_url` varchar(500) DEFAULT NULL;

ALTER TABLE `issued_pos` 
ADD COLUMN IF NOT EXISTS `file_url` varchar(500) DEFAULT NULL;

-- 2.7 Add company_id to financial entities (nullable, safe to add)
ALTER TABLE `invoices` 
ADD COLUMN IF NOT EXISTS `company_id` varchar(36) DEFAULT NULL,
ADD CONSTRAINT IF NOT EXISTS `fk_invoices_company` 
FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

ALTER TABLE `issued_pos` 
ADD COLUMN IF NOT EXISTS `company_id` varchar(36) DEFAULT NULL,
ADD CONSTRAINT IF NOT EXISTS `fk_issued_pos_company` 
FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

ALTER TABLE `purchase_orders` 
ADD COLUMN IF NOT EXISTS `company_id` varchar(36) DEFAULT NULL,
ADD CONSTRAINT IF NOT EXISTS `fk_purchase_orders_company` 
FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

-- =====================================================
-- STEP 3: Update Enum Values (Safe)
-- =====================================================

-- 3.1 Update invoices status enum to include approval workflow
-- First, update any existing 'sent' statuses to 'draft' to match new workflow
UPDATE `invoices` SET `status` = 'draft' WHERE `status` = 'sent';

-- Then modify the enum
ALTER TABLE `invoices` 
MODIFY COLUMN `status` enum('draft','pending-approval','approved','sent','paid','overdue') DEFAULT 'draft';

-- 3.2 Update checkouts status enum to include 'received'
ALTER TABLE `checkouts` 
MODIFY COLUMN `status` enum('checked-out','returned','overdue','partial-return','received') NOT NULL DEFAULT 'checked-out';

-- =====================================================
-- STEP 4: Add daily_rate/hourly_rate to projects
-- =====================================================

-- Add daily_rate column first (for backward compatibility)
ALTER TABLE `projects` 
ADD COLUMN IF NOT EXISTS `daily_rate` decimal(10,2) DEFAULT NULL;

-- Note: hourly_rate will be added in a separate step if needed
-- The migration 1770800000001-RenameDailyRateToHourlyRate renames daily_rate to hourly_rate
-- For now, we'll keep daily_rate to avoid breaking existing code

-- =====================================================
-- STEP 5: Migration Tracking (Optional but Recommended)
-- =====================================================

-- Insert records into migrations table to mark these as applied
-- This prevents TypeORM from trying to run them again
INSERT IGNORE INTO `migrations` (`timestamp`, `name`) VALUES 
(1770800000000, 'CreateProjectTeamMembers1770800000000'),
(1736300000000, 'CreateAuditLogsTable1736300000000'),
(1736500000000, 'CreateReceivedInvoicesTable1736500000000'),
(1770700000000, 'AddTempPasswordFields1770700000000'),
(1735900000000, 'AddInvoiceApprovalWorkflow1735900000000'),
(1738000000000, 'AddVariationOrderSupport1738000000000'),
(1769570000001, 'AddBillingTypeToProject1769570000001'),
(1769570000000, 'AddLastCalibratedToInventory1769570000000'),
(1768463760497, 'AddExchangeRateSource1768463760497'),
(1768463761497, 'AddProjectDailyRate1768463761497'),
(1769567029752, 'AddFileUrlToInvoicesAndIssuedPOs1769567029752'),
(17433675000000, 'AddCompanyIdToFinancialEntities17433675000000'),
(1770688951000, 'AddReceivedStatusToCheckout1770688951000');

-- =====================================================
-- END OF MIGRATION SCRIPT
-- =====================================================

-- NOTES:
-- 1. This script is SAFE to run - it only ADDS new tables and columns
-- 2. Existing data is preserved
-- 3. SKIPPED migrations (destructive):
--    - 1770690000000-ClearAllCheckoutTransactions.ts (would delete checkout data)
--    - 1769496670941-RenameClientIdToCompanyId.ts (column rename - handle manually if needed)
--    - 1769580000000-RemoveRemarksFromProject.ts (column rename - handle manually if needed)
--    - 1770800000001-RenameDailyRateToHourlyRate.ts (column rename - handle manually if needed)
-- 4. After running this, your database will be compatible with the new code
-- 5. Remember to also update your backend and frontend files on cPanel!
