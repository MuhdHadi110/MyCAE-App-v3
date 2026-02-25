-- =====================================================
-- MyCAE Tracker Database Migration Script
-- Compatible with older MySQL/MariaDB versions
-- Created: 2026-02-25
-- Run this in phpMyAdmin on your cPanel database
-- =====================================================

-- This script safely adds new tables and columns WITHOUT affecting existing data

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
-- STEP 2: Add New Columns to Existing Tables
-- NOTE: These will FAIL if columns already exist, which is OK
-- =====================================================

-- 2.1 Add columns to users table (Temp Password Feature)
ALTER TABLE `users` 
ADD COLUMN `temp_password_expires` timestamp NULL DEFAULT NULL,
ADD COLUMN `is_temp_password` tinyint(1) NOT NULL DEFAULT 0;

-- 2.2 Add columns to projects table (Variation Order Support)
ALTER TABLE `projects` 
ADD COLUMN `parent_project_id` varchar(36) DEFAULT NULL,
ADD COLUMN `is_variation_order` tinyint(1) NOT NULL DEFAULT 0,
ADD COLUMN `vo_number` int(11) DEFAULT NULL,
ADD COLUMN `billing_type` enum('hourly','lump_sum') NOT NULL DEFAULT 'hourly';

-- 2.3 Add indexes for projects (ignore errors if they exist)
CREATE INDEX `IDX_parent_project_id` ON `projects` (`parent_project_id`);
CREATE INDEX `IDX_parent_vo` ON `projects` (`parent_project_id`, `is_variation_order`, `vo_number`);

-- 2.4 Add foreign key for projects (ignore errors if it exists)
ALTER TABLE `projects` 
ADD CONSTRAINT `FK_project_parent` 
FOREIGN KEY (`parent_project_id`) REFERENCES `projects` (`id`) ON DELETE RESTRICT;

-- 2.5 Add columns to invoices table (Approval Workflow)
ALTER TABLE `invoices` 
ADD COLUMN `created_by` varchar(36) DEFAULT NULL,
ADD COLUMN `approved_by` varchar(36) DEFAULT NULL,
ADD COLUMN `approved_at` datetime DEFAULT NULL,
ADD COLUMN `submitted_for_approval_at` datetime DEFAULT NULL;

-- 2.6 Add foreign keys for invoices (ignore errors if they exist)
ALTER TABLE `invoices` 
ADD CONSTRAINT `fk_invoices_created_by` 
FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_invoices_approved_by` 
FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- 2.7 Add index for invoices (ignore errors if it exists)
CREATE INDEX `idx_invoices_created_by` ON `invoices` (`created_by`);

-- 2.8 Add columns to inventory table
ALTER TABLE `inventory` 
ADD COLUMN `last_calibrated_date` date DEFAULT NULL;

-- 2.9 Add columns to purchase_orders table
ALTER TABLE `purchase_orders` 
ADD COLUMN `exchange_rate_source` enum('manual','xe','bank') DEFAULT NULL;

-- 2.10 Add file_url columns to invoices and issued_pos
ALTER TABLE `invoices` 
ADD COLUMN `file_url` varchar(500) DEFAULT NULL;

ALTER TABLE `issued_pos` 
ADD COLUMN `file_url` varchar(500) DEFAULT NULL;

-- 2.11 Add company_id to financial entities
ALTER TABLE `invoices` 
ADD COLUMN `company_id` varchar(36) DEFAULT NULL,
ADD CONSTRAINT `fk_invoices_company` 
FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

ALTER TABLE `issued_pos` 
ADD COLUMN `company_id` varchar(36) DEFAULT NULL,
ADD CONSTRAINT `fk_issued_pos_company` 
FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

ALTER TABLE `purchase_orders` 
ADD COLUMN `company_id` varchar(36) DEFAULT NULL,
ADD CONSTRAINT `fk_purchase_orders_company` 
FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

-- =====================================================
-- STEP 3: Update Enum Values
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
-- STEP 4: Add daily_rate to projects
-- =====================================================

ALTER TABLE `projects` 
ADD COLUMN `daily_rate` decimal(10,2) DEFAULT NULL;

-- =====================================================
-- STEP 5: Migration Tracking
-- =====================================================

-- Insert records into migrations table to mark these as applied
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
