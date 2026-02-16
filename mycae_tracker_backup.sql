-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: mycae_tracker
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('inventory-create','inventory-update','inventory-delete','checkout-create','checkout-return','project-create','project-update','project-status-change','timesheet-create','maintenance-create','maintenance-update','user-login','user-create','bulk-import') COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `details` text COLLATE utf8mb4_general_ci,
  `entity_type` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `entity_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `module` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_b82f1d8368dd5305ae7e7e664c2` (`user_id`),
  CONSTRAINT `FK_b82f1d8368dd5305ae7e7e664c2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `action` enum('create','update','delete','view','export','approve','reject') COLLATE utf8mb4_general_ci NOT NULL,
  `entity_type` enum('invoice','issued_po','received_po','project','payment','exchange_rate') COLLATE utf8mb4_general_ci NOT NULL,
  `entity_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `changes` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_audit_logs_entity` (`entity_type`,`entity_id`),
  KEY `IDX_audit_logs_user` (`user_id`),
  KEY `IDX_audit_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checkouts`
--

DROP TABLE IF EXISTS `checkouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checkouts` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `masterBarcode` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `item_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `quantity` int NOT NULL,
  `returned_quantity` int NOT NULL DEFAULT '0',
  `checkout_date` datetime NOT NULL,
  `expected_return_date` datetime DEFAULT NULL,
  `actual_return_date` datetime DEFAULT NULL,
  `status` enum('checked-out','returned','overdue','partial-return') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'checked-out',
  `purpose` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `location` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `condition` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_000468c91f3470cf5d7897f6e2f` (`item_id`),
  KEY `FK_24f9f28b7675d85d081881e32a3` (`user_id`),
  CONSTRAINT `FK_000468c91f3470cf5d7897f6e2f` FOREIGN KEY (`item_id`) REFERENCES `inventory` (`id`),
  CONSTRAINT `FK_24f9f28b7675d85d081881e32a3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkouts`
--

LOCK TABLES `checkouts` WRITE;
/*!40000 ALTER TABLE `checkouts` DISABLE KEYS */;
/*!40000 ALTER TABLE `checkouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `industry` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `status` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `activeProjects` int NOT NULL DEFAULT '0',
  `totalProjects` int NOT NULL DEFAULT '0',
  `contact_person` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `website` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_99e921caf21faa2aab020476e4` (`name`),
  CONSTRAINT `clients_chk_1` CHECK (json_valid(`categories`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES ('0450249a-3e13-4744-93a7-21d9b994e70c','Infineon 2',NULL,'john232@gmail.com','01845225461','',NULL,NULL,NULL,'Semicon',NULL,'active',0,0,'John doesd',NULL,'2025-11-09 16:33:47.324893','2025-11-09 16:33:47.324893','[\"client\",\"customer\"]',''),('277f558f-10d5-4cc4-b1dc-206a0eb73b1b','Infineon',NULL,'john@gmail.com','0184522546','',NULL,NULL,NULL,'Semicon',NULL,'archived',0,0,NULL,NULL,'2025-10-29 17:48:24.899802','2025-11-13 14:49:36.000000',NULL,NULL),('50c2ec19-0185-44e5-abff-c37dc7a43fe1','fdbadfbdabfdb',NULL,'dabad@gmsail.com','dsfsdfsf','',NULL,NULL,NULL,'fdbafbdfb',NULL,'active',0,0,'adfbadbfd',NULL,'2025-12-29 12:34:52.461441','2025-12-29 12:34:52.461441','[\"client\",\"customer\"]',''),('a6fc671a-22dc-4208-ab88-63b025b1d243','Boldgate',NULL,'dfsdfsfs@gmail.com','','',NULL,NULL,NULL,'Manufacturing',NULL,'active',0,0,'sdsds',NULL,'2025-11-13 14:49:30.408596','2025-11-13 14:49:30.408596','[\"client\",\"customer\",\"vendor\"]',''),('b7ef4324-a8db-4be0-9ecf-254961cb0486','efsdsdvsdv',NULL,'sdvsdv@gmail.com','','',NULL,NULL,NULL,'dsvsvdv',NULL,'active',0,0,'sdvsdv',NULL,'2025-11-26 17:04:51.093246','2025-11-26 17:04:51.093246','[\"client\"]','');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `company_type` text COLLATE utf8mb4_general_ci,
  `industry` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_companies_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES ('222a8c86-20fc-4ec6-8bcc-0242d335b52d','CMS Engineering',NULL,'','','','2026-01-29 08:30:06','2026-01-29 08:30:06',NULL),('d854ce4a-f07a-4bb5-8361-dba4ef13b26f','Micron Memory Penang (MMP)',NULL,'Semiconductor','https://my.micron.com','','2026-01-28 02:13:16','2026-01-28 02:13:16',NULL);
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `computers`
--

DROP TABLE IF EXISTS `computers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `computers` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `asset_tag` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `device_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `computer_type` enum('desktop','laptop','tablet','workstation') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'laptop',
  `manufacturer` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `model` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `serial_number` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `assigned_to` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `processor` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ram` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `storage` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `graphics` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `os` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `os_version` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('active','inactive','in-repair','decommissioned') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `purchase_cost` decimal(10,2) DEFAULT NULL,
  `purchase_date` datetime DEFAULT NULL,
  `warranty_expiry` datetime DEFAULT NULL,
  `decommission_date` datetime DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `installed_software` text COLLATE utf8mb4_general_ci,
  `notes` text COLLATE utf8mb4_general_ci,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_213ef2d53445c1f4285ea0f14b` (`asset_tag`),
  KEY `FK_82515a9b1ba8978695e70390ccd` (`assigned_to`),
  CONSTRAINT `FK_82515a9b1ba8978695e70390ccd` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `computers`
--

LOCK TABLES `computers` WRITE;
/*!40000 ALTER TABLE `computers` DISABLE KEYS */;
INSERT INTO `computers` VALUES ('36fd6ccd-5f4f-491f-847b-50032c108d01','PC4','PC4','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,'','2025-12-29 09:44:33.039250','2026-01-29 17:50:44.000000'),('3a65dbd5-5f08-4f8f-9c82-ce3e3f9a651f','PC12','PC12','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,NULL,'2026-01-08 15:35:05.671769','2026-01-08 15:35:05.671769'),('441c4b3b-2840-47ce-9cb0-525f46e2168f','PC10','PC10','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,NULL,'2026-01-08 15:34:40.790303','2026-01-08 15:34:40.790303'),('4f8ac452-6b8b-47ff-8f8c-137a35adaadf','PC2','PC2','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'decommissioned',NULL,NULL,NULL,'2026-01-12 02:55:44','Office','','','2025-12-17 22:59:20.777306','2026-01-12 10:55:43.000000'),('55e9c259-02fa-4fff-b4d1-46c0458738ca','PC11','PC11','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,NULL,'2026-01-08 15:34:56.708918','2026-01-08 15:34:56.708918'),('6e9d5927-4d66-4a94-8009-cbf54579877f','PC8','PC8','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office ',NULL,NULL,'2026-01-08 15:34:13.882872','2026-01-08 15:34:13.882872'),('9e3a5fd2-a7c5-4d54-b316-3621e984d5bf','PC3','PC3','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'decommissioned',NULL,NULL,NULL,'2026-01-12 02:10:38','Office',NULL,'','2025-12-29 09:44:24.348992','2026-01-12 10:10:37.000000'),('9fc90680-7666-4a36-8cf2-10dcc6c062cd','PC6','PC6','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,NULL,'2025-12-29 09:44:49.586069','2025-12-29 09:44:49.586069'),('bca610ce-a84d-450e-9eb5-8c46946d3f8f','PC1','PC1','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'decommissioned',NULL,NULL,NULL,'2026-01-13 07:52:13','Office','','','2025-11-25 12:09:56.034623','2026-01-13 15:52:12.000000'),('bca77783-8b55-4edf-b1a1-c56621bd0b0e','PC5','PC5','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,NULL,'2025-12-29 09:44:42.013291','2025-12-29 09:44:42.013291'),('bf1ec2f1-fe47-41c9-af8c-4058b70b6024','PC7-','PC7','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office','','','2026-01-08 15:33:44.472050','2026-01-12 10:43:54.000000'),('d591c8cc-425f-44dc-b1c5-e4622be84bbe','PC9','PC9','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,NULL,'2026-01-08 15:34:27.087727','2026-01-08 15:34:27.087727');
/*!40000 ALTER TABLE `computers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `position` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_contact_email` (`company_id`,`email`),
  KEY `idx_contacts_company_id` (`company_id`),
  KEY `idx_contacts_email` (`email`),
  CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES ('34b2f4ee-b730-4137-a6ee-2340c02b76cd','222a8c86-20fc-4ec6-8bcc-0242d335b52d','Ah Guan','Aghudh12uhduh@gmail.com','','','2026-01-29 08:30:23','2026-01-29 08:30:23',NULL),('491c0194-2cb3-41d6-b0f2-39a7e440e6d7','d854ce4a-f07a-4bb5-8361-dba4ef13b26f','Wai Keong','wcgefe@micron.com','','','2026-01-28 02:13:27','2026-01-28 02:13:27',NULL);
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exchange_rates`
--

DROP TABLE IF EXISTS `exchange_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exchange_rates` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `fromCurrency` varchar(3) COLLATE utf8mb4_general_ci NOT NULL,
  `toCurrency` varchar(3) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'MYR',
  `rate` decimal(10,6) NOT NULL,
  `effectiveDate` date NOT NULL,
  `source` enum('manual','api') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'manual',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exchange_rates`
--

LOCK TABLES `exchange_rates` WRITE;
/*!40000 ALTER TABLE `exchange_rates` DISABLE KEYS */;
INSERT INTO `exchange_rates` VALUES ('007878c3-d53d-4d6b-a706-23d98c448afa','INR','MYR',0.042626,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('00eef1ee-1424-45da-b147-a5192f6c4a08','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('0226315e-a8fc-4082-b72d-e86a3a03d3a8','JPY','MYR',0.025756,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('0245e1c3-4287-4e7c-9c1f-6caff9371172','PHP','MYR',0.068933,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('0356b4f9-ae4c-410e-ae3d-f7964bf74866','KRW','MYR',0.002797,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('0389c983-de9a-4c1d-b4e0-992c9a9667e3','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('038b8ab3-ac1a-4162-a55b-3eabfa2ba603','KRW','MYR',0.002810,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('04a95377-ea3b-496d-ab4a-32f72acb84ff','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('063a0030-23f4-410b-b3da-282c0dd54d6a','CNY','MYR',0.582615,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('071dea86-1feb-4a14-8f8c-b4b45d116a56','NZD','MYR',2.368602,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('07adebf2-8f69-4747-ba35-2cddfdc3e315','THB','MYR',0.129781,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('08532ff5-983f-433b-b3d3-0dccc65b9f7f','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('094d5118-94c6-44b1-9931-ba3073bb76c7','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('09bf03d4-60dc-43bf-ad82-1874c5858c53','SGD','MYR',3.163056,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('09cb5a12-da6b-4574-9d23-b7f958de1c43','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('0a27bef4-bcfc-495a-a0bf-b5ae15df53a9','SGD','MYR',3.166862,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('0a465d58-e30a-4f4f-b3ef-87fbc60ca5a0','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('0a6a3bf0-47e2-4ac6-b7e0-9b06fc39686d','EUR','MYR',4.749917,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('0b435bc0-8cef-43e9-abac-8743ba99c3b4','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('0bb0581f-a602-4448-879d-1446f8468911','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('0be955c4-7466-4665-966d-a1daa90a696b','EUR','MYR',4.742933,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('0c2e1afd-2580-41b0-a386-d5b08ede9813','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('0c6cc63c-26b0-47f1-982b-cce21b7b0cda','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('0d5ff56b-da91-403e-8e4f-c8c7692d50b3','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('0e36c055-d842-4917-89c8-20c8c23fb9c7','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('0e731e0e-e5c9-4ac7-bac0-2d10bd6eea7b','PHP','MYR',0.068890,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('0e9941c2-89c7-42cd-a2c7-e35ca9f81adb','KRW','MYR',0.002764,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('0ea4a863-1769-4cab-a9d8-f660b3e4ef73','THB','MYR',0.130105,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('0f2c66c3-14a5-47ba-b335-a6d42864472d','INR','MYR',0.045243,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('11e1143b-9ada-4403-90fb-3f0e10672056','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('11ef1ae1-51ca-452f-93ce-8eb83e444b2f','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('123cf506-afaf-4eab-826e-c95bddf2cd59','GBP','MYR',5.476151,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('1290b5ba-dbb6-43af-b727-ecb9f1e0c1f8','GBP','MYR',5.476151,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('13999657-a5cb-4c97-8a0d-187a47853d8a','KRW','MYR',0.002745,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('13fd4eaf-2aa5-4976-ad65-4deff5fd22a6','USD','MYR',4.088475,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('141585aa-023f-4bf5-8aec-c635e03aa74e','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('14ef4ff0-243c-4200-8c75-19e492b5c834','KRW','MYR',0.002743,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('153d7646-d803-4468-9788-370609e0573e','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('15a46e35-a8c2-4d05-bb5a-9090ae4f19cb','CNY','MYR',0.582615,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('16cfdb5c-9116-43be-845a-3dad1043ac1e','EUR','MYR',4.750143,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('17339992-fd90-496b-9a11-e6bf725b6ca0','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('175b0efb-5790-416e-b7d5-929b76e75d00','USD','MYR',4.072490,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('182fbbc2-9478-451c-9db1-6350c967a540','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('18c86070-e0fc-481c-98be-5d01854b94dc','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('19d2c64b-82c6-4a51-b031-5f64c4d35f60','EUR','MYR',4.667227,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('19e9d054-aed8-4444-9880-d09f2ce82563','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('1a5a2d85-c691-4580-8f4f-463d82e07e4a','IDR','MYR',0.000245,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('1aaaf596-8feb-43f5-b479-8fe8fd55c3e1','THB','MYR',0.128526,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('1afdb51e-4590-49b9-9435-566bc4858860','HKD','MYR',0.521322,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('1c3862de-42cb-44c7-82f1-8ef2824fc0a5','PHP','MYR',0.068413,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('1cfee3be-ce35-4c8f-abc3-e0d4deb08aac','NZD','MYR',2.362949,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('1d0539fe-3672-4e58-acff-8aa1d71765ca','SGD','MYR',3.151592,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('1d0c9355-c9fa-4055-bfe3-1bd692d13803','HKD','MYR',0.521322,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('1e415bbb-f114-481d-ac94-53105de0def2','USD','MYR',4.062563,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('1e759dfd-8115-411a-a170-40e28f9a2ac4','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('1ead1128-f12b-42f3-89ea-280e8f5bedf8','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('1f99b744-7c1a-421f-9e95-fd26df5dd29f','NZD','MYR',2.343292,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('2116ec10-26ed-445f-9e82-348ecfb574ff','IDR','MYR',0.000234,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('21bbe255-1193-4328-9239-e3b20ff12bce','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('2239b7b4-0a17-4026-8f0b-3fa6a134c92f','AUD','MYR',2.712453,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('22c157ab-c10c-4911-ba33-0a3340dc2b56','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('22e5f0af-330c-4318-97d7-ef16adfca49f','CNY','MYR',0.575142,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('22edb0ff-3a6b-410e-a5c1-2e33161475ab','USD','MYR',4.085468,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('234b8165-0ab5-4893-8ab8-5ff38cd4fd92','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('23aedbaf-902d-4094-82ea-7b6b2492f9f6','CAD','MYR',2.928601,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('24673cab-3e4a-481d-9c1a-f1d86c8a71a2','USD','MYR',4.062563,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('25942701-85de-4d1b-ac2b-8646458bcd98','KRW','MYR',0.002769,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('25c1a2dd-bfa7-4df1-935e-d16303b01b59','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('2838bc60-24ef-4305-8a19-0b035102fa39','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('28a88305-c7ae-435f-bb74-6cc5a57d21b5','SGD','MYR',3.100198,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('291cf389-f16c-4d41-949c-45a516351d27','AUD','MYR',2.707019,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('29b0715d-aad0-4324-85cd-64d4b73b6729','SGD','MYR',3.107134,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('2bc7bda2-a262-47f1-82d3-5e218ce03210','KRW','MYR',0.002803,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('2c9b9638-166c-4cb3-a300-da5a6b579477','THB','MYR',0.128805,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('2d0b8ab3-71c5-4fdd-a122-9c1657f2730f','EUR','MYR',4.751722,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('2d741a79-3641-4cc6-b652-b6918d51ec7c','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('2e5f336c-e154-4773-8299-ff490e74475e','PHP','MYR',0.069677,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('2e606e63-16b3-46c2-b4eb-f8181855ea73','INR','MYR',0.043048,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('2ecb5add-a909-45e2-a63d-40373b297287','SGD','MYR',3.132145,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('2ffe9d39-1f13-4515-9e8f-da30b5d60a35','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('303c9f2d-bff1-4988-99ff-8bdeb1d110db','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('31347c04-e114-460d-80c9-6c49a5abdbcd','IDR','MYR',0.000240,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('321d42c4-5cf4-4089-8de3-e87161facd0d','EUR','MYR',4.749917,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('3268c9ec-6ba6-4217-8468-19a8f313468a','AUD','MYR',2.720718,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('32ef756d-f6d8-4b61-a1f1-2e01a9d1e15a','SGD','MYR',3.180000,'2025-12-16','manual','2025-12-16 05:39:19','2025-12-16 05:39:19'),('332b82df-c410-4fde-8c07-a19e37b88d44','THB','MYR',0.128805,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('33384292-af13-44b0-be43-0261a63c1c11','IDR','MYR',0.000240,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('3369fea3-bc06-44c9-8da8-33f1e134b1a1','JPY','MYR',0.025756,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('33b6344a-bc0e-4f3b-938b-5629d4eb324f','USD','MYR',4.062563,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('33c7f0d6-4d11-4323-bfe8-85a7a6cd7d78','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('34ec2266-bbf9-4d6b-b717-e14db73d14d1','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('353de443-8879-45ff-a8fa-1297ffce9706','PHP','MYR',0.068462,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('364f610f-3ee2-4876-a5ea-6ccdb2e7684e','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('36a4ec8b-d646-4a6c-baad-c3952d91af48','JPY','MYR',0.025922,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('36a6d99e-707f-4bab-8509-85b44f8dad3c','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('38e5f782-10ff-4244-ba41-456c393b7698','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('39adbb38-29de-498c-9016-caccfd38568a','PHP','MYR',0.069677,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('3bbcd30e-f460-44ac-820c-8545a9ed8ab8','USD','MYR',4.057947,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('3d0dfb7e-8198-4940-a068-c594b8fef203','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('3d529ff0-250c-4729-931c-9588a3db6823','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('3d98ac0d-873d-4c3c-913a-f0eac81c28b2','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('3de31f18-1c08-4ac0-bf43-22e4223a5752','INR','MYR',0.045057,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('3e09d5be-55f0-4eb2-9477-4f9b37aeac18','EUR','MYR',4.741359,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('3eede2f9-471f-40b5-809d-7d5c44c67ed4','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('3f813716-e17e-45a1-8069-a8e0e62a5e5a','THB','MYR',0.130105,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('3fc1a61b-b387-45b5-aac8-6ae43c22214c','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('407a733a-a4b7-4f20-8f1b-29f9a166fb68','NZD','MYR',2.340440,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('416e15a4-0168-41b8-a094-166214b83446','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('41b78055-d77f-4631-802a-291bb561a68d','SGD','MYR',3.180000,'2025-12-16','manual','2025-12-16 08:03:16','2025-12-16 08:03:16'),('42d3cc29-5d54-481b-95a2-1fc9362deae2','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('42e1a4a8-acd7-49d0-aa3a-69c68b31ebec','NZD','MYR',2.364625,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('430accab-0577-4da9-a0ff-b2cd7ad408e0','SGD','MYR',3.165058,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('43e41a75-af80-4030-8e2a-b806c69de4ef','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('43f8e24f-4a95-4730-88d8-10a32ce70f45','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('44f4ddb7-c188-4f5b-bdaa-3ae48c513fdc','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('45e87bf0-b990-4bc0-8312-1595e2b554c6','IDR','MYR',0.000245,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('46412924-c3c2-484a-ac23-52dd5ab3d7be','CAD','MYR',2.930832,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('47d9a935-3834-41d8-bc98-f5ca79909c5e','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('4819d7cd-a504-4a0f-93ab-2bd9c2e4b569','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('48fe73bb-b6c9-4fbd-99e1-c1fa11e1e0e9','NZD','MYR',2.343292,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('490c5ed0-f990-4d4c-bc43-555dd63a3d45','JPY','MYR',0.025922,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('4a506435-3688-4a82-b20a-92738419909a','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('4aa74522-2c2f-48f3-9add-4fdc8053a5b6','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('4b38e9b7-cbb3-4a56-a36c-6988fb870fe0','HKD','MYR',0.502336,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('4d0bce70-19c7-455e-8381-22511961748d','CAD','MYR',2.951942,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('4d21d904-b66b-4363-afec-6499ecc737a9','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('4e2b84b2-ad61-441e-8b77-3183cd9cbeba','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('4e770286-1ce0-4347-93e4-3e2e26e6d765','INR','MYR',0.044934,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('4e827c4b-b1bf-407b-bf01-9eb440b4cf3a','NZD','MYR',2.334976,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('4e88e9a1-de8e-4154-aed0-189d0b87d8e8','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('4efab30d-ec48-47fa-ad91-2785cf4023e0','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('4f097d5d-cc94-42b3-bda6-074031eaef49','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('4fe08bc6-d0a9-46a3-b9ac-73a7c773ddab','HKD','MYR',0.521159,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('500c8dfe-2c28-4959-b474-7cae7de3f381','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('500e8ab6-bca8-4f54-9b61-596eac33ab26','INR','MYR',0.042728,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('504d794b-c7d0-4f2a-9fd8-a4d13c3b72bb','AUD','MYR',2.738676,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('50dac10a-c503-4c5d-9af9-fd5dad51a0d7','CAD','MYR',2.928601,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('510151ab-5055-499d-b8a9-69dab7b981e1','GBP','MYR',5.472555,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('5115500e-5890-4275-88a3-c599064c9a0b','NZD','MYR',2.387319,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('51660f3e-3b1f-4d54-aa6a-735bcd8f21c0','IDR','MYR',0.000240,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('5284edb4-9309-4427-8f72-a8ecb6477951','AUD','MYR',2.720718,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('52e22d37-19ab-46f6-9fb9-34337bf4dece','THB','MYR',0.129781,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('533f979a-8374-4d9c-a870-2bc474a76130','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('53cec6a2-9931-4a2a-9ce5-5d47657dd346','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('5416c5f7-8ac4-43e9-9e70-c14887620a43','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('5436039c-66f9-473b-9771-f2041e00ae01','IDR','MYR',0.000243,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('54df456c-2481-4752-8eb5-6be067fcfddd','PHP','MYR',0.068667,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('54edf322-23da-4722-94c5-dd2aa7b13085','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('54f8126f-5133-4bb1-bd66-60ae887cf761','GBP','MYR',5.489679,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('55588ab4-240d-4a72-a0d0-94e38e6ec8ea','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('565120b7-37fb-4a90-a87b-81576115d848','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('565e5fdf-2f32-42f1-bd34-bff93dce48ea','THB','MYR',0.129525,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('5747e12f-428b-486e-87d1-45380275140f','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('5869cc6c-b8a5-4cc6-94f0-2159ebb48fed','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('586b8f84-4be5-4a11-b4d3-e32c713f2367','SGD','MYR',3.170175,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('5984e4b7-3228-4960-ad3b-0554cdd94f02','CNY','MYR',0.580147,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('598cb3de-9e00-488f-b908-b375fa300809','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('59a8ca7e-dfcc-4496-8134-fd3232513fd1','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('5ae2119a-917a-4ba1-94a2-c27a90c7db5f','SGD','MYR',3.170175,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('5af066b8-4b68-4743-994f-f56a0e20d4b9','EUR','MYR',4.742933,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('5b182587-8bbf-4f09-80d7-3d9e7c294e6f','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('5b6451e2-7193-4b2e-94af-4be59713c0bb','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('5c8fca21-89ef-49be-8826-bdc7d318653e','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('5ca64b21-b2d7-4a7d-9d5e-6a3fbef33670','JPY','MYR',0.025677,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('5cddd630-c755-4016-8518-412df2beeb6d','USD','MYR',4.005608,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('5ce24d7c-132c-4f48-b052-f81801ed2de5','SGD','MYR',3.162555,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('5d9d2239-fca5-4917-9720-2e00f6d1d46e','CAD','MYR',2.938584,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('5dc57f4d-ac11-4b8f-9017-360de766f021','INR','MYR',0.044946,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('5f76bc7d-0ac5-4bfa-b19d-974bfeb729ec','USD','MYR',4.085468,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('5f9dd60d-b9a0-4189-82fe-72b0f2f4dd53','EUR','MYR',4.811162,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('5fc9eea5-9a09-4fb3-8fe9-9c728d51190f','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('61386855-889e-411b-8f5c-92be904e246b','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('61dde7ea-d48a-4060-922a-538569996028','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('61e675c7-ee72-41dc-9dc6-1dac4b4c2f65','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('62b04d80-b9ea-4f3c-800c-13d054e57a69','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('6376799f-8afc-448b-8506-0b3bac7a1744','CAD','MYR',2.910276,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('63ee95a5-284d-486c-9914-1a34b13a9079','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('63f524f6-e434-4749-ba7d-a5afb140a782','CNY','MYR',0.580417,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('644c52f3-df99-402a-9ae5-fad8852a3da7','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('6465cf76-a4b4-44cf-b26e-9ffda8d7234f','GBP','MYR',5.476151,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('648cebc5-c924-46b9-9c56-5f5231c0cdbf','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('64c2be6e-ff6d-4db4-a45a-dd6594ba10ae','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('6614e32d-5bb3-4f61-a8a0-984c30d455dc','USD','MYR',4.062563,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('666f9f01-bbc2-4e5b-9d6e-8778a9f91d8b','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('66b5eb1a-926b-4c4d-aa73-4e6833239fad','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('6850eaf0-4ae1-4eed-9b8d-3253066a5d6a','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('68bb059d-4a0b-46de-9d7a-97c5b07f8323','INR','MYR',0.045175,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('69814c47-38d4-49b8-bb96-81366c18eb66','PHP','MYR',0.068462,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('69eb1d7d-98ce-4b50-aaf9-90c339fa4eb2','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('6abd601f-466f-450c-98d4-064a40b4434c','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('6ad90572-8a3a-4404-959b-66daa86b6849','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('6af432d4-e485-41ff-9b48-91d93b525b93','CNY','MYR',0.580147,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('6b76fa6d-8f4e-4ec3-a7f9-5a5f62177022','PHP','MYR',0.066911,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('6c60c14b-ae87-40b1-9790-faaf380ea6b8','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('6c7a0011-7a56-45c4-994d-5d2fd6468db6','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('6d044eb6-cd91-4724-93dd-b1900d33112d','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('6d8d1b85-b17b-422b-ab5d-dd470ec1b01b','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('6da71944-0e5f-455b-973d-7b05ce9ccbf7','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('6e41aa74-f7e1-4cdf-8a85-b0f7c2f5b492','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('6e679e91-be08-4113-ae7b-60b6d5809858','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('6e69ba4e-f476-4c7c-a746-684d318d6ac9','GBP','MYR',5.455240,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('6e941aa7-5e40-48df-97b3-5cb91a9e438b','HKD','MYR',0.520291,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('6ead2f26-67f0-46fd-85b4-b3ffb36e62c3','CNY','MYR',0.564175,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('703784a9-f83d-4b76-ad84-fc4fa7fa90ef','CAD','MYR',2.904022,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('709dcd9d-390a-49e8-92ad-c1ec3f8af655','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('71af513c-ee94-4508-97b8-63e1e196f5a7','JPY','MYR',0.025967,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('723bf4b6-ea60-4495-8c5c-183415def157','AUD','MYR',2.728439,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('73547ee1-4f68-4f95-bfa7-6603eb0ed00b','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('743ae3a9-640c-4b7c-b83f-8bec053b13b0','HKD','MYR',0.521078,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('749bf806-b3b4-44a1-ace0-62938bda8b6d','USD','MYR',4.053999,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('75f8cd0a-4dfe-4d23-a984-8321886a477a','AUD','MYR',2.728439,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('761dfd77-fb6a-4cf6-a47d-48ab534b6971','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('777faf9e-1cb1-46bc-8520-70caad9284f9','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('78a344fa-3e31-4a13-a098-58ef182b4cbe','PHP','MYR',0.066572,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('7964f7e2-3d51-4e1f-9777-b4a0fec508d4','EUR','MYR',4.703226,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('7982b668-3b98-4224-bcac-8727df3b55d1','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('799d8b37-1fd2-49c7-bba5-f0c4df297c6b','USD','MYR',4.062563,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('7a7e63c9-eb7d-4c2e-8c58-5a21bb0b3ece','USD','MYR',3.918956,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('7abaab43-3c48-4d55-9505-c222246b8534','EUR','MYR',4.742933,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('7bec7585-c58d-4185-842a-2921b14977ad','CAD','MYR',2.888754,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('7c5c4078-e4a5-45d1-81d8-1ccfc7ae4a8d','NZD','MYR',2.343292,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('7ced61be-13ad-4a84-a1cf-fa751af3e979','AUD','MYR',2.712453,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('7d0ced72-5d27-41ae-a815-2dd36eec0635','INR','MYR',0.045165,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('7d4549a6-a2b8-45db-9712-0c5b5d1001eb','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('7e8be0eb-4c68-49a5-831e-fa645404dd69','CAD','MYR',2.952814,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('7f026f9b-7c75-4763-8d74-52ff06a7c07b','KRW','MYR',0.002797,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('7f578707-47db-477b-a288-bf50c3286fc6','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('80266bbb-b84c-4bed-9b38-68a26a969ee1','KRW','MYR',0.002729,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('808f2946-d779-436a-84a3-fecf1a8ccf90','NZD','MYR',2.343292,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('80a8cc4e-1fb5-4bf7-a681-826516ab4c19','THB','MYR',0.128805,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('81ef87b6-72e6-4fcf-8c9a-1c0a9191fa78','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('82aab350-f7c5-4927-b265-034f40a4eb8f','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('83624293-0885-4163-a29e-e92fb14cc001','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('83b6af89-e255-4231-9036-5e1382abcbe5','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('83f6a397-a53e-410a-aa73-9e9162c3f6a0','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('843bdbf8-ac17-4c3a-a110-2f85b154faea','JPY','MYR',0.026278,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('8581103d-0259-4236-925d-24e0c39a688d','JPY','MYR',0.026424,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('858f5a5a-a0e3-4505-998e-1821d5da6584','SGD','MYR',3.162555,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('859920c1-16a9-404a-ac7b-7d4d223699bb','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('85f6d81c-4c61-4c7d-99b4-2feb5e282312','INR','MYR',0.045102,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('86918d58-7975-47b6-81de-af2727d5fa65','SGD','MYR',3.162955,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('86d69260-93cf-40f3-8a62-1be2d7785260','SGD','MYR',3.106072,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('86f125dd-8409-4ab8-9b61-28c1465a6e29','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('878d2ef5-e087-4d6c-8498-e15a05856b27','AUD','MYR',2.730152,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('878e0842-5f07-45e6-b183-64b689faf7bb','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('87d45292-e99b-449e-8ade-09aafa4e880b','PHP','MYR',0.066701,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('88c8da5c-af79-4bfa-b6e8-c8034bc38273','CNY','MYR',0.580450,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('8994cc81-bd67-4651-a823-e3c2172c4d2e','HKD','MYR',0.525183,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('899fcc45-6614-4964-a3f5-a0cc27f6c2d9','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('8a1c51f6-41ae-485d-bc63-dc4e7a1fa839','CAD','MYR',2.928601,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('8a51e9de-2243-4b0e-90c0-2526082d6e4f','EUR','MYR',4.700353,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('8a56399b-5331-4bd3-a072-9292cfc1f5fb','HKD','MYR',0.513690,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('8aa1457a-9605-494e-84c0-a6b9e345cdbf','JPY','MYR',0.026424,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('8b397a7b-f57d-45b0-8c29-5bb6373324fe','PHP','MYR',0.067802,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('8b562e1c-df8b-460e-b191-9ed5d1f1673e','CNY','MYR',0.581869,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('8bd05491-7a29-49a4-9735-77695b5ae470','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('8bd23896-5d27-456b-849f-71494596cd1c','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('8c6fecc6-99e9-486b-abfc-3c284b216a46','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('8c70b3ea-16fe-4ee2-bf1a-4ad783b7a9fd','AUD','MYR',2.743108,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('8cc8d7ff-7661-40c7-9a5d-a1db3a7dfe8d','CNY','MYR',0.565419,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('8f5d9f44-fa5e-46e4-a9cc-3724ad49673a','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('9051cded-9ae7-4657-850a-92a0c3988a32','KRW','MYR',0.002769,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('90c1fc08-f3c6-4743-9cdb-cbb66c258c9c','CNY','MYR',0.579677,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('90ee4276-df14-4f6f-b8d7-6cc2969756c6','AUD','MYR',2.728439,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('918313e3-dc65-44c7-83c5-2d0bf6148928','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('92197ac6-3db7-4ee9-9e3e-3325764ac174','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('9229ed82-22c8-41ba-ba75-484367bac82d','CNY','MYR',0.581869,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('922a2d0a-db73-42ca-b36f-38d311ee9ca4','PHP','MYR',0.068667,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('92451491-202a-46e7-9c1c-b02526b02a82','SGD','MYR',3.163056,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('9294c7c3-c9a9-4d02-948b-60cbc4bc4dae','JPY','MYR',0.025833,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('93273fd5-b82d-4329-be6e-eb3e78ba3b86','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('9344d684-1963-4630-a0a2-520bdd6e5839','GBP','MYR',5.460005,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('93b20a7d-bc69-41c3-a729-b532a83099cf','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('93ec9f56-210b-4c34-8fbc-a528469ad4d6','INR','MYR',0.045175,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('93f87b2c-48d2-4c3d-a2c8-2c545247d544','JPY','MYR',0.025618,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('941e9c27-e8f4-4e36-93ae-6f027b43fe45','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('943acaef-a14d-446e-9b9c-205607c5b640','KRW','MYR',0.002773,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('94bfa1fd-5747-4bd2-b4fb-0dda15202ed1','EUR','MYR',4.692633,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('950cb5a3-b532-4001-9503-fb1497e674fa','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('98453827-e403-4bf6-b094-3dfb728d3e67','IDR','MYR',0.000234,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('98977c94-7d0c-4f6c-87ec-e58b4d40edab','CAD','MYR',2.964720,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('98eb145e-e54f-4b77-ac5b-ea1a2cf17876','PHP','MYR',0.069687,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('991769a2-62d8-404e-b653-fd36fd27b9b9','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('999508e2-2047-4b06-ab9e-9c959baf69a6','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('99ef0ab7-975d-4cc5-9143-d75a7ea6034d','CAD','MYR',2.889171,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('9abdff40-9c34-4340-8bdc-1962cc1ecb1c','GBP','MYR',5.460005,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('9b18c666-356b-4e6e-8513-ea180fce3196','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('9b73293f-a0a8-4640-921c-549d3364d750','USD','MYR',3.927421,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('9ce5df3e-41d6-44e4-a8b6-5f1521f0eef8','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('9d7e3dbe-c451-49f7-bf19-4c6fbfd9bcea','INR','MYR',0.043605,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('9dac67c0-3238-4baf-b918-cba544d7a432','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('9db1e925-e19e-4ca2-9bd3-0983544013ec','JPY','MYR',0.025423,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('9e55feac-81dd-4d79-b820-f39ebe2a3fc8','GBP','MYR',5.475252,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('9efd80bc-69be-4ee9-8971-ea15ec63ade8','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('9f2c1928-77b3-4b2d-ad82-fd8603ee3aee','EUR','MYR',4.749917,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('9f479e99-3af7-4900-97ea-e609a92f38ed','CNY','MYR',0.582615,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('9f59d9f5-372c-4953-b87f-91b1456ef5d1','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('9f61d1a9-bb40-4329-9cc3-6062f1bbb34b','AUD','MYR',2.728439,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('a08deb77-5897-4535-a65f-202c37593a6a','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('a0b856e0-c5fe-4d8d-abab-4bb698b758d4','AUD','MYR',2.715620,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('a193ef58-415a-4004-87d3-fcb041653135','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('a39c1127-333f-41a3-a0e3-7997b66af4a4','THB','MYR',0.129151,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('a3a807d6-760c-461f-b48d-688dc12dd43f','THB','MYR',0.130105,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('a3c42f21-44c4-4ec5-9783-a9f262363c9d','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('a402c9e2-91b1-427b-89dc-e3e966f9fb41','HKD','MYR',0.521078,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('a514f3d1-0521-4e53-887c-5f1e5a5279ed','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('a58a79e7-96ff-430b-a433-bd88d5d6f3f2','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('a5b99248-f99c-492e-8f88-22cb4c5cb4ce','USD','MYR',3.941974,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('a60238e1-4ee1-46c5-9055-34b8c97df486','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('a6217419-4ee3-4d0c-8eb0-3ab335f308ce','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('a64862f9-8aee-4150-bad6-6fc5e3b84e0b','IDR','MYR',0.000242,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('a74cb37d-2096-44c8-a34b-9272150748c2','HKD','MYR',0.521078,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('a7a6fb00-7551-4a82-a96d-9d4c86027742','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('a9439f3d-9eab-4041-b259-4e8c955f83af','SGD','MYR',3.163056,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('a98c6eae-ebd0-4871-9f04-3e39329f7e68','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('aa7d6e12-3877-42e0-be50-c62d8cef9e8c','HKD','MYR',0.525183,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('aa843cbd-05ab-4772-8088-1191636b89f6','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('aa8eed30-2f33-480e-97af-9681a7020fa3','THB','MYR',0.129801,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('ab834332-7332-4df2-88b2-204d8a316968','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('aba4e342-2cb5-4c1f-8d7f-3a2475f76a83','GBP','MYR',5.426525,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('ac2ccd2e-8a1e-406b-b28a-fc869cb849a9','CAD','MYR',2.968680,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('ac8f0ebf-f248-4870-b2d0-9a51ac681df0','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('acd1519c-beb5-426a-80fc-f0f7f5c53ad8','JPY','MYR',0.025326,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('ad96248c-da20-4672-b6b2-2fcba35efc50','GBP','MYR',5.390836,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('af61d6d5-85df-44ff-9a28-6c375145ad09','IDR','MYR',0.000241,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('b020b051-41f7-4366-9d78-7e98b9a79cbd','HKD','MYR',0.525458,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('b1999faf-722c-48a2-9423-60f450517bdc','USD','MYR',4.062563,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('b1de5407-a68e-4ade-aa19-04bebbceae7f','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('b27c4b77-94e0-4da9-b535-9b572d115354','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('b28c7b08-4738-4b05-842d-68f2dde0e302','HKD','MYR',0.523013,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('b2defcca-d339-4298-b8f0-feaf5d6671a5','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('b4582388-7646-4ca9-93f6-5b21ce5f6d7a','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('b507b565-743a-43bd-9abb-0bfca521ad34','KRW','MYR',0.002769,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('b6c4e789-dd2e-447b-9b79-bb6df0d37e52','GBP','MYR',5.476151,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('b6e76782-b9b6-44e7-a78d-dcca1eaf74a8','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('b74c0e9c-a4a5-43ae-90e0-edb9e28029ad','GBP','MYR',5.489679,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('b911cdb1-8123-476c-a11b-b84b0d79187c','KRW','MYR',0.002806,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('b96475ee-e30a-43d0-bce8-7b85f063b3ae','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('b98fffa1-b89f-4735-9713-1d893f417933','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('bb50ef96-ed39-402a-857a-1230266a0327','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('bbfc614f-9008-48ec-ae4e-f344e0f67aad','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('bc7b33e1-d71a-43aa-9697-14908101ae6b','IDR','MYR',0.000241,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('bca29a6d-dc0d-4e22-a7fc-9d939869a0db','IDR','MYR',0.000241,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('bda50a8f-ceb1-46ea-8e7c-9c5294980c0e','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('be03b825-338d-4715-a299-9c5d6d9bcdc9','PHP','MYR',0.068462,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('be177f80-5ecf-4702-9933-8e2c57b6fd9c','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('be3111d0-52ae-4374-9163-2a59e606c199','NZD','MYR',2.361554,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('bf5a8039-7e8d-4068-8b74-6495ee565865','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('bfbb441d-f598-44ea-a275-3b08f4f43f76','CNY','MYR',0.582615,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('c0c6130e-2fde-43d0-87f9-e98b6a8659ae','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('c0c8344c-c1fa-482a-bd67-204fb566634a','GBP','MYR',5.449888,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('c1004b75-fc3b-4259-b2d3-41d1fb72fef6','JPY','MYR',0.025922,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('c10aefad-c796-4658-b93f-0af0e92214c2','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('c1f6865a-9f90-4184-929d-f0822ca055bc','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('c205d36b-a2dc-467c-989a-7d92cc223f0b','THB','MYR',0.124687,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('c28964ba-4184-4c70-8fa5-a430c686d36b','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('c293422f-9d7f-4d0e-b108-553c031c6942','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('c2d1ef37-703c-49bc-984c-0fa2b9e29135','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('c34ee39c-2640-410d-98db-fc0f8a20be9a','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('c5f9f7e5-42a6-45fe-9dcd-8a3dfa6ad8a8','CNY','MYR',0.581869,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('c61f48cc-0341-42af-ae9f-68d7f4eb5659','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('c6a71274-c80d-420d-ad78-bd5e44ac32e1','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('c77c4132-88a8-483e-984e-95c8b45b47dc','JPY','MYR',0.025756,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('c7ff514b-c1a5-4881-aa35-542eb144099c','PHP','MYR',0.068462,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('c85943f4-9a30-4141-80a3-67b45b94f383','CAD','MYR',2.930832,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('c9ceb72e-ae5a-4817-b0f1-94e864c00f98','CNY','MYR',0.567730,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('caadbaad-a5a7-4f94-9df8-7d89b3bb1d43','JPY','MYR',0.025922,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('cb580e21-dbe0-4a92-a4de-494c00b0753d','GBP','MYR',5.403069,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('cc8f7e5e-0254-44d7-b9cf-7e883ba74f3f','IDR','MYR',0.000235,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('ccfd2318-d062-4e31-818f-97b86d3a6a33','HKD','MYR',0.504668,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('cf4d2e85-9a68-45da-9001-8b3c5cadd400','GBP','MYR',5.417999,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('d019c7a0-c434-4e67-a0d2-15abbcd0f6dd','KRW','MYR',0.002769,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('d01f5c71-4eea-4f4c-b776-04095ec4e943','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('d1af697f-75ca-411b-a74e-3fad9b719580','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('d1eb6260-db09-4e1f-b091-0da31b3a6ce7','USD','MYR',4.062563,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('d2e9c8b1-de85-4681-9cd8-91165f3b10cd','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('d30a4402-7958-41c4-8fd9-7cbfd38d1ef6','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('d3b09c3c-97a9-4cdb-bba7-dc26ccd12986','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('d41cceb7-2ab2-4c1d-8adb-508e65fb7751','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('d43a40f4-17b4-4b98-8b54-e5fcd8da6b15','IDR','MYR',0.000240,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('d4a54239-b3ca-4e16-bac1-ace675d84519','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('d54c82e6-1b27-4a0c-ae56-8540d5f61043','AUD','MYR',2.713999,'2026-01-05','api','2026-01-05 09:00:00','2026-01-05 09:00:00'),('d5c92601-c20e-4128-8c28-870e88242e08','NZD','MYR',2.368826,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('d6539b7e-fb02-4ed3-bfd4-0490b3ad0770','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('d6b577fd-4bef-42c9-8ccf-aed73bf900eb','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('d6f848c4-ca88-4e85-be24-6d3b1e6ab94c','THB','MYR',0.129730,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('d7e4d410-ac57-4267-85dc-bc7b191c059b','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('d8c12c66-cf27-488b-868e-7efcc8d60bae','KRW','MYR',0.002714,'2026-02-03','api','2026-02-03 09:00:03','2026-02-03 09:00:03'),('d93d0175-cfef-4623-b524-cde24573c55a','INR','MYR',0.045175,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('d96c9087-afc3-4435-81d6-a0f3ab09c3ba','NZD','MYR',2.347253,'2026-01-08','api','2026-01-08 09:00:02','2026-01-08 09:00:02'),('d9855ebb-9b3d-4c2a-a66c-bb5a22257996','CAD','MYR',2.930832,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('da40128d-38bc-4804-ba95-b52696630506','NZD','MYR',2.334976,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('da43ba32-d5b6-4777-940d-883abae39859','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('db9aa14d-5ab8-4d1d-95ff-cca4d5d67ea4','AUD','MYR',2.775542,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('dbea5f80-e088-4a85-a8ae-93042455a61a','CNY','MYR',0.582988,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('dc0a673c-1767-485c-b694-a9f345dd3fa6','INR','MYR',0.045057,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('dc2791a5-71f9-4061-a9f9-12dfa881df88','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('dc62787f-5bdf-4d2c-8359-7fb5f57f5ca2','IDR','MYR',0.000238,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('dcdaa5e4-89a1-40d6-b23c-272eeffddff9','NZD','MYR',2.334976,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('dcf100d7-5355-4c89-a555-545a1ecb8612','SGD','MYR',3.180000,'2025-12-16','manual','2025-12-16 08:03:54','2025-12-16 08:03:54'),('dcfdb676-9ffc-4c24-9d3a-5bd1259a3667','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('dd646ce1-94e0-4b50-a205-b8aeb85991e7','EUR','MYR',4.749917,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('de3299dd-c0b1-4f4a-8398-6b8d53dd5d09','IDR','MYR',0.000243,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('df400f9d-ebf1-4171-a66f-5b7e1ba11a56','CAD','MYR',2.968680,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('e00b0b64-9bad-42d7-94e9-16a40063707f','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('e0315075-0b85-4bd5-a54b-2c194d6bb785','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('e1354785-193b-4802-911e-e88ecaa654de','CAD','MYR',2.928601,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('e1977a75-2278-41f2-97c9-9705fa534ef0','EUR','MYR',4.792485,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('e1de09a0-c758-4acb-a973-68853b10b703','THB','MYR',0.130105,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('e1f09272-3616-41e2-aeb3-4adfb2bdadb7','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('e226b176-a95b-46bc-96c9-491aef2bcac2','NZD','MYR',2.364625,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('e26de000-770b-436d-906e-ed45ce2e6cfb','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('e3e7b7e2-ab27-43bc-86d1-f20f9d1b1588','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('e497a68a-2fec-4f27-949f-f433402cd852','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('e4d18569-85dd-4309-b5ef-837a8fd6e6a6','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('e6c3cff9-87f2-42a0-97b3-21e03b154010','JPY','MYR',0.025756,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('e6de8e4c-3179-4dd2-830f-837695756174','NZD','MYR',2.338798,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('e6fe1512-dc8e-4eca-8db3-9d3ee02cefdf','SGD','MYR',3.162555,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('e7b6fc52-3e1a-4498-87f2-8c53c881d448','GBP','MYR',5.460005,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('e7c8abc8-91ac-4e07-ac86-2b5fa15ee0e9','IDR','MYR',0.000245,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('e836cef2-b9cd-4d4b-9e6e-30ac03dc3c42','KRW','MYR',0.002797,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('e86aca03-f8a8-4b64-9401-8a5416ee7c5d','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('e8d51b0b-cc71-4d5c-a367-8e906eeca14a','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('e94a7efc-4ac3-4f1f-b41a-388272209d1a','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('e9fec440-ed3f-4286-8b51-2044bd9a2e9c','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('ea0f16c2-93d0-4dfe-8cda-7acf191096d8','HKD','MYR',0.503221,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('eb062972-387d-423a-85e3-d3f6885f7666','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('ebfec3ca-4ec8-466f-8081-01a1a110401c','AUD','MYR',2.720718,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('ed6da7cb-1553-4213-92e4-01009fbdd68d','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('eee93a5f-c18d-4cd9-894a-996d5432b60c','EUR','MYR',4.811162,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('ef68d209-8950-4932-a6f0-b6e2d2ca777d','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('efa79315-3790-4a96-95ee-54590a73661c','HKD','MYR',0.521078,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('efb08bf6-892c-4d1f-9c40-b6e048de62da','INR','MYR',0.045057,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('f0e528b0-72c8-4960-ade0-98c40adeea8f','AUD','MYR',2.749821,'2026-01-26','api','2026-01-26 09:00:02','2026-01-26 09:00:02'),('f0e67801-80dd-4d1c-885b-ba2fb7a4582b','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('f104fbc3-7151-4703-bab7-b91e3257235f','KRW','MYR',0.002773,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('f1379b6d-4a70-48d4-85d3-716a8d88907d','THB','MYR',0.125881,'2026-01-30','api','2026-01-30 09:00:01','2026-01-30 09:00:01'),('f15b4dd4-0129-4aac-9722-b92a18a76d6c','INR','MYR',0.044934,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('f1b97091-6eb1-4b9e-bc09-214b083e8a2d','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('f1d6e064-d4b2-44e3-ba83-b90d3a4e5ea9','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('f28d037c-a784-4e33-9abf-c07770ae4bee','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('f2cc95ad-0ede-4023-80d1-2c42cb1780c0','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('f2e6b04e-efc0-48ee-9f67-dca816639a84','PHP','MYR',0.068667,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('f3636cf7-7c71-4763-85b6-576a5e25c672','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('f3914f39-6131-43e1-bf88-0cd4b8c5a23a','HKD','MYR',0.521322,'2026-01-09','api','2026-01-09 09:00:01','2026-01-09 09:00:01'),('f4589345-f8fa-4332-b235-d0931bb92f11','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('f5b12550-812e-49e2-b9de-883ba2290bf1','INR','MYR',0.045057,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('f62b117e-589b-491b-8583-b437926b9879','SGD','MYR',3.162555,'2026-01-13','api','2026-01-13 09:00:01','2026-01-13 09:00:01'),('f6cdc302-a48a-4ed6-b06f-5760a77d6ceb','THB','MYR',0.125973,'2026-01-29','api','2026-01-29 09:00:03','2026-01-29 09:00:03'),('f6e3f8e6-96b9-4177-b114-2fca25a4bc61','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('f70d16c6-deca-423d-8c6a-7660b3ec6905','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('f812e805-2b45-4ccc-857d-2965aaaaebf4','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('f8894fe6-45ad-4ed0-9146-b1c8de58ec05','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('f9d474fb-3c53-4494-ae3c-29e11308a5e3','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('fa585fa5-3548-4128-a8b2-4641e983eae3','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('fd583ca4-0c5a-407f-9518-aa517252a5bb','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('fd6a367a-e2d1-4fc7-923d-4b4b11663a9a','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('fe58b8a8-df5d-4850-87ae-e83043b1d59f','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('fea85a7a-0db5-4725-b24f-a895c4ace658','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('fee43805-e113-4b0e-b54c-59c24a5fcf5f','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54');
/*!40000 ALTER TABLE `exchange_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `sku` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `barcode` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `minimumStock` int NOT NULL DEFAULT '0',
  `location` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `unitOfMeasure` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `supplier` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('available','low-stock','out-of-stock','in-maintenance','discontinued','added') COLLATE utf8mb4_general_ci DEFAULT 'available',
  `notes` text COLLATE utf8mb4_general_ci,
  `imageURL` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `next_maintenance_date` date DEFAULT NULL,
  `in_maintenance_quantity` int DEFAULT '0',
  `last_action` enum('added','returned','checked-out','updated') COLLATE utf8mb4_general_ci DEFAULT 'added',
  `last_action_date` timestamp NULL DEFAULT NULL,
  `last_action_by` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_c33f32cdf6993fe3852073b0d5` (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `invoice_number` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `project_code` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `project_name` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `invoice_date` datetime NOT NULL,
  `percentage_of_total` decimal(5,2) NOT NULL,
  `invoice_sequence` int NOT NULL,
  `cumulative_percentage` decimal(5,2) NOT NULL,
  `remark` text COLLATE utf8mb4_general_ci,
  `status` enum('draft','pending-approval','approved','sent','paid','overdue') COLLATE utf8mb4_general_ci DEFAULT 'draft',
  `file_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `currency` varchar(3) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'MYR',
  `amount_myr` decimal(15,2) DEFAULT NULL,
  `exchange_rate` decimal(10,6) DEFAULT NULL,
  `created_by` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `approved_by` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `submitted_for_approval_at` datetime DEFAULT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_d8f8d3788694e1b3f96c42c36fb` (`invoice_number`),
  KEY `IDX_invoices_project_code` (`project_code`),
  KEY `IDX_invoices_status` (`status`),
  KEY `IDX_invoices_invoice_date` (`invoice_date`),
  KEY `fk_invoices_approved_by` (`approved_by`),
  KEY `idx_invoices_created_by` (`created_by`),
  KEY `IDX_invoices_company_id` (`company_id`),
  CONSTRAINT `fk_invoices_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_invoices_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_invoices_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `issued_pos`
--

DROP TABLE IF EXISTS `issued_pos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `issued_pos` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `po_number` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `items` text COLLATE utf8mb4_general_ci NOT NULL,
  `recipient` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `project_code` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `issue_date` datetime NOT NULL,
  `due_date` datetime DEFAULT NULL,
  `status` enum('issued','received','completed') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'issued',
  `file_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `currency` varchar(3) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'MYR',
  `amount_myr` decimal(15,2) DEFAULT NULL,
  `exchange_rate` decimal(10,6) DEFAULT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_233acd3b08ef8c62ff1b4150765` (`po_number`),
  KEY `IDX_issued_pos_company_id` (`company_id`),
  CONSTRAINT `FK_issued_pos_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issued_pos`
--

LOCK TABLES `issued_pos` WRITE;
/*!40000 ALTER TABLE `issued_pos` DISABLE KEYS */;
INSERT INTO `issued_pos` VALUES ('8606df2b-a2f6-451e-897b-2f4e31c5d524','po28748974','Towa Substructure','CMS Engineering','J26002',110000.00,'2026-01-29 00:00:00',NULL,'issued',NULL,'2026-01-29 16:30:49','2026-01-29 16:30:49','MYR',NULL,NULL,'222a8c86-20fc-4ec6-8bcc-0242d335b52d');
/*!40000 ALTER TABLE `issued_pos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_tickets`
--

DROP TABLE IF EXISTS `maintenance_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_tickets` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `item_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `reported_by` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `priority` enum('low','medium','high','critical') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'medium',
  `status` enum('open','in-progress','resolved','closed') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'open',
  `reported_date` datetime NOT NULL,
  `resolved_date` datetime DEFAULT NULL,
  `assigned_to` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `resolution_notes` text COLLATE utf8mb4_general_ci,
  `category` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `scheduled_maintenance_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `inventory_action` enum('deduct','status-only','none') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `quantity_deducted` int DEFAULT '0',
  `inventory_restored` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `FK_e8fbd824b2716458cdf5a0f65b7` (`item_id`),
  KEY `FK_7767c461f000861afcc898418e9` (`reported_by`),
  KEY `FK_2c2c9aecc5dcca1261816420d9d` (`assigned_to`),
  CONSTRAINT `FK_2c2c9aecc5dcca1261816420d9d` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_7767c461f000861afcc898418e9` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_e8fbd824b2716458cdf5a0f65b7` FOREIGN KEY (`item_id`) REFERENCES `inventory` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_tickets`
--

LOCK TABLES `maintenance_tickets` WRITE;
/*!40000 ALTER TABLE `maintenance_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` bigint NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,1730000000000,'CreateInitialSchema1730000000000'),(2,1730100000000,'AddProjectFields1730100000000'),(3,1730200000000,'CreatePurchaseOrdersTable1730200000000'),(4,1730300000000,'UpdateTimesheetRelations1730300000000'),(5,1730307600000,'AddWebsiteToClients1730307600000'),(6,1763021810008,'CreatePurchaseOrdersTable1763021810008'),(7,1730307900000,'ConvertRoleToRoles1730307900000'),(8,1730635200000,'MakeLeadEngineerOptional1730635200000'),(9,1763025000000,'CreateInvoicesTable1763025000000'),(10,1763025100000,'CreateIssuedPOsTable1763025100000'),(11,1763026000000,'AddIsFirstLoginToUsers1763026000000'),(12,1763026001000,'CreateTokenBlacklistTable1763026001000'),(13,1730000000001,'CreateProjectHourlyRatesTable1730000000001'),(14,1763030000000,'CreateResearchTimesheetsTable1763030000000'),(15,1734268000000,'AddMultiCurrencySupport1734268000000'),(16,1734300000000,'AddPORevisionSupport1734300000000'),(17,1734519600000,'MigrateAvatarsToPresets1734519600000'),(18,1734519600000,'MigrateAvatarsToPresets1734519600000'),(19,1734600000000,'ConvertRolesToArray1734600000000'),(20,1735200000000,'AddPerformanceIndexes1735200000000'),(21,1735700000000,'AddCompanySettings1735700000000'),(22,1735800000000,'AddScheduledMaintenance1735800000000'),(23,1736100000000,'AddPasswordResetFields1736100000000'),(24,1736200000000,'SplitClientsIntoCompaniesContacts1736200000000'),(25,1736250000000,'RemoveIsPrimaryFromContacts1736250000000'),(26,1735900000000,'AddInvoiceApprovalWorkflow1735900000000'),(27,1736300000000,'CreateAuditLogsTable1736300000000'),(28,1768463760497,'AddExchangeRateSource1768463760497'),(29,1768463761497,'AddProjectDailyRate1768463761497'),(30,1736500000000,'CreateReceivedInvoicesTable1736500000000'),(31,1769496670941,'RenameClientIdToCompanyId1769496670941'),(32,1769567029752,'AddFileUrlToInvoicesAndIssuedPOs1769567029752'),(33,7433675000000,'AddCompanyIdToFinancialEntities17433675000000');
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_hourly_rates`
--

DROP TABLE IF EXISTS `project_hourly_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_hourly_rates` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `projectId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `teamMemberId` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `hourlyRate` decimal(10,2) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_project_team` (`projectId`,`teamMemberId`),
  KEY `IDX_projectId` (`projectId`),
  KEY `IDX_teamMemberId` (`teamMemberId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_hourly_rates`
--

LOCK TABLES `project_hourly_rates` WRITE;
/*!40000 ALTER TABLE `project_hourly_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_hourly_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `project_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `contact_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('pre-lim','ongoing','completed') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pre-lim',
  `inquiry_date` datetime DEFAULT NULL,
  `po_received_date` datetime DEFAULT NULL,
  `po_file_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `completion_date` datetime DEFAULT NULL,
  `invoiced_date` datetime DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `planned_hours` int NOT NULL,
  `actual_hours` int NOT NULL DEFAULT '0',
  `lead_engineer_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `manager_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `remarks` text COLLATE utf8mb4_general_ci,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `daily_rate` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_11b19c7d40d07fc1a4e167995e` (`project_code`),
  KEY `IDX_projects_manager_id` (`manager_id`),
  KEY `IDX_projects_lead_engineer_id` (`lead_engineer_id`),
  KEY `idx_projects_contact_id` (`contact_id`),
  KEY `IDX_projects_company_id` (`company_id`),
  CONSTRAINT `FK_87bd52575ded2be008b89dd7b21` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_d6808738576f5be91ff768ef425` FOREIGN KEY (`lead_engineer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_projects_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `projects_chk_1` CHECK (json_valid(`categories`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES ('2c9865c3-3dad-4be1-b827-2c3a499b0085','J26001','Equipment Tracking','d854ce4a-f07a-4bb5-8361-dba4ef13b26f','491c0194-2cb3-41d6-b0f2-39a7e440e6d7','completed','2026-01-28 02:13:58','2026-01-28 00:00:00',NULL,NULL,NULL,'2026-01-28 02:13:58',25,5,'dcf6496b-f109-444a-b976-aed7f2b8028a','dcf6496b-f109-444a-b976-aed7f2b8028a',NULL,'2026-01-28 10:13:58.021673','2026-01-28 15:58:40.000000','[\"Computational Fluid Dynamics\"]',NULL),('52b0e67f-5ae5-4a66-9089-4039b8ca9052','J26002','Structure Towa','d854ce4a-f07a-4bb5-8361-dba4ef13b26f','491c0194-2cb3-41d6-b0f2-39a7e440e6d7','ongoing','2026-01-29 08:20:18','2026-01-29 00:00:00',NULL,NULL,NULL,'2026-01-29 08:20:18',50,5,'dcf6496b-f109-444a-b976-aed7f2b8028a','dcf6496b-f109-444a-b976-aed7f2b8028a',NULL,'2026-01-29 16:20:18.150922','2026-01-29 16:59:04.000000','[\"Finite Element Analysis\",\"Vibration\"]',NULL),('6316f626-94c0-4e55-b5e7-9469dd6c6c16','J25003','Nikon Sub','d854ce4a-f07a-4bb5-8361-dba4ef13b26f','491c0194-2cb3-41d6-b0f2-39a7e440e6d7','ongoing','2026-01-29 09:03:42','2026-01-29 00:00:00',NULL,NULL,NULL,'2026-01-29 09:03:42',0,0,'6afc8fb3-e613-4ee2-a72e-50221fc69ffe','8400f925-e34f-4c31-ac9e-6cc6efd27067',NULL,'2026-01-29 17:03:42.258241','2026-01-29 17:04:30.000000','[\"Vibration\"]',NULL),('c2b9d98a-baee-4d38-b5ba-0316a1788175','J26004','currenvy selctornwkdngsd','d854ce4a-f07a-4bb5-8361-dba4ef13b26f','491c0194-2cb3-41d6-b0f2-39a7e440e6d7','ongoing','2026-01-30 14:28:52','2026-01-30 00:00:00',NULL,NULL,NULL,'2026-01-30 14:28:52',100,0,'dcf6496b-f109-444a-b976-aed7f2b8028a','dcf6496b-f109-444a-b976-aed7f2b8028a',NULL,'2026-01-30 22:28:51.740633','2026-01-30 22:29:50.000000','[\"Vibration\"]',NULL);
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `po_number` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `project_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `client_name` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `received_date` datetime NOT NULL,
  `due_date` datetime DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `status` enum('received','in-progress','invoiced','paid') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'received',
  `file_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `currency` varchar(3) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'MYR',
  `amount_myr` decimal(15,2) DEFAULT NULL,
  `exchange_rate` decimal(10,6) DEFAULT NULL,
  `revision_number` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `superseded_by` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `supersedes` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `revision_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revision_reason` text COLLATE utf8mb4_general_ci,
  `amount_myr_adjusted` decimal(15,2) DEFAULT NULL,
  `adjustment_reason` text COLLATE utf8mb4_general_ci,
  `adjusted_by` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `adjusted_at` datetime DEFAULT NULL,
  `po_number_base` varchar(100) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `exchange_rate_source` enum('auto','manual') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `company_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `po_number` (`po_number`),
  KEY `IDX_po_number_base` (`po_number_base`),
  KEY `IDX_is_active` (`is_active`),
  KEY `IDX_po_base_active_rev` (`po_number_base`,`is_active`,`revision_number`),
  KEY `FK_po_superseded_by` (`superseded_by`),
  KEY `FK_po_supersedes` (`supersedes`),
  KEY `FK_po_adjusted_by` (`adjusted_by`),
  KEY `IDX_purchase_orders_project_code` (`project_code`),
  KEY `IDX_purchase_orders_is_active` (`is_active`),
  KEY `IDX_purchase_orders_created_at` (`created_at`),
  KEY `IDX_purchase_orders_company_id` (`company_id`),
  CONSTRAINT `FK_purchase_orders_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES ('2b2f1032-6dc8-46cd-81db-5b2f45f60cac','po087645754545','J26002','Micron Memory Penang (MMP)',150000.00,'2026-01-29 00:00:00',NULL,NULL,'received',NULL,'2026-01-29 16:20:47','2026-01-29 16:20:47','MYR',150000.00,1.000000,1,1,NULL,NULL,'2026-01-29 08:20:47',NULL,NULL,NULL,NULL,NULL,'po087645754545',NULL,NULL),('567f9e3e-66e2-4f25-a5f0-be20bbbb5fe4','5466456546456546','J26004','Micron Memory Penang (MMP)',100000.00,'2026-01-30 00:00:00',NULL,NULL,'received',NULL,'2026-01-30 22:29:50','2026-01-30 22:29:50','SGD',310713.40,3.107134,1,1,NULL,NULL,'2026-01-30 14:29:51',NULL,NULL,NULL,NULL,NULL,'5466456546456546','auto',NULL),('91dac9ca-3248-4cf0-a757-46940c50514f','56456','J26001','Micron Memory Penang (MMP)',10000.00,'2026-01-28 00:00:00',NULL,NULL,'received',NULL,'2026-01-28 10:17:06','2026-01-28 16:17:33','MYR',10000.00,1.000000,1,1,NULL,NULL,'2026-01-28 02:17:07',NULL,NULL,NULL,NULL,NULL,'56456',NULL,'d854ce4a-f07a-4bb5-8361-dba4ef13b26f'),('a9e5b9fa-8fd7-411b-9864-3565815fcd20','3g53gg34','J25003','Micron Memory Penang (MMP)',10000000.00,'2026-01-29 00:00:00',NULL,NULL,'received',NULL,'2026-01-29 17:04:30','2026-01-29 17:04:30','MYR',10000000.00,1.000000,1,1,NULL,NULL,'2026-01-29 09:04:31',NULL,NULL,NULL,NULL,NULL,'3g53gg34',NULL,NULL);
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `received_invoices`
--

DROP TABLE IF EXISTS `received_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `received_invoices` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `invoice_number` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `issued_po_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `vendor_name` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'MYR',
  `amount_myr` decimal(15,2) DEFAULT NULL,
  `exchange_rate` decimal(10,6) DEFAULT NULL,
  `invoice_date` datetime NOT NULL,
  `received_date` datetime NOT NULL,
  `due_date` datetime DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `status` enum('pending','verified','paid','disputed') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `file_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_by` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `verified_by` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `company_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_7a46c31ad3ef4de9a41e78a3529` (`issued_po_id`),
  KEY `IDX_received_invoices_company_id` (`company_id`),
  CONSTRAINT `FK_7a46c31ad3ef4de9a41e78a3529` FOREIGN KEY (`issued_po_id`) REFERENCES `issued_pos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_received_invoices_company_id` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `received_invoices`
--

LOCK TABLES `received_invoices` WRITE;
/*!40000 ALTER TABLE `received_invoices` DISABLE KEYS */;
INSERT INTO `received_invoices` VALUES ('c8635784-7385-492b-a653-29542f36c6b4','mbftr453453','8606df2b-a2f6-451e-897b-2f4e31c5d524','CMS Engineering',110000.00,'MYR',NULL,NULL,'2026-01-29 00:00:00','2026-01-29 00:00:00',NULL,NULL,'disputed',NULL,NULL,'dcf6496b-f109-444a-b976-aed7f2b8028a','2026-01-29 09:58:09',NULL,'2026-01-29 16:32:37','2026-01-31 11:19:52',NULL);
/*!40000 ALTER TABLE `received_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `research_projects`
--

DROP TABLE IF EXISTS `research_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `research_projects` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `research_code` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `lead_researcher_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('planning','in-progress','on-hold','completed','archived') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'planning',
  `start_date` datetime DEFAULT NULL,
  `planned_end_date` datetime DEFAULT NULL,
  `actual_end_date` datetime DEFAULT NULL,
  `budget` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `funding_source` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `objectives` text COLLATE utf8mb4_general_ci,
  `methodology` text COLLATE utf8mb4_general_ci,
  `findings` text COLLATE utf8mb4_general_ci,
  `publications` text COLLATE utf8mb4_general_ci,
  `team_members` text COLLATE utf8mb4_general_ci,
  `collaborators` text COLLATE utf8mb4_general_ci,
  `equipment_used` text COLLATE utf8mb4_general_ci,
  `notes` text COLLATE utf8mb4_general_ci,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_334ec21bad136a1eb94a4e80b5` (`research_code`),
  KEY `FK_d9d4a53a57f65a1db73049c24bf` (`lead_researcher_id`),
  CONSTRAINT `FK_d9d4a53a57f65a1db73049c24bf` FOREIGN KEY (`lead_researcher_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `research_projects`
--

LOCK TABLES `research_projects` WRITE;
/*!40000 ALTER TABLE `research_projects` DISABLE KEYS */;
INSERT INTO `research_projects` VALUES ('5a751dd8-06e4-47f8-b95e-34fd9983dbe8','REsearch BimHVAC','R26001','asdasdads','dcf6496b-f109-444a-b976-aed7f2b8028a','planning','2026-01-28 00:00:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-28 15:47:10.693143','2026-01-28 15:47:24.000000'),('79feb2eb-3c1f-4838-8bb1-0e9b78104d38','RERERERERE','R26002','eihfuoheuif','3a01293b-fcb2-4907-9974-44c0e70bc0b0','planning','2026-01-30 00:00:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-30 16:39:38.194164','2026-01-30 16:39:38.194164');
/*!40000 ALTER TABLE `research_projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `research_timesheets`
--

DROP TABLE IF EXISTS `research_timesheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `research_timesheets` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `research_project_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `engineer_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `date` datetime NOT NULL,
  `hours` decimal(10,2) NOT NULL,
  `research_category` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'CFD, FEA, Vibration Analysis, Acoustics, Testing, Data Analysis, Documentation, Other',
  `description` text COLLATE utf8mb4_general_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_research_project_id` (`research_project_id`),
  KEY `IDX_engineer_id` (`engineer_id`),
  KEY `IDX_date` (`date`),
  CONSTRAINT `FK_33ce70486c86986d2c4b3ccd31a` FOREIGN KEY (`research_project_id`) REFERENCES `research_projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_498b9e3e3a9bc11b7dfd095303d` FOREIGN KEY (`engineer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `research_timesheets`
--

LOCK TABLES `research_timesheets` WRITE;
/*!40000 ALTER TABLE `research_timesheets` DISABLE KEYS */;
INSERT INTO `research_timesheets` VALUES ('c073c44a-222c-42fa-83db-3610f0756eb9','79feb2eb-3c1f-4838-8bb1-0e9b78104d38','dcf6496b-f109-444a-b976-aed7f2b8028a','2026-01-30 00:00:00',5.00,'General',NULL,'2026-01-30 16:39:59','2026-01-30 16:39:59');
/*!40000 ALTER TABLE `research_timesheets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scheduled_maintenance`
--

DROP TABLE IF EXISTS `scheduled_maintenance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_maintenance` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `item_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `maintenance_type` enum('calibration','inspection','servicing','replacement','other') COLLATE utf8mb4_general_ci DEFAULT 'other',
  `description` text COLLATE utf8mb4_general_ci,
  `scheduled_date` date NOT NULL,
  `is_completed` tinyint(1) DEFAULT '0',
  `completed_date` date DEFAULT NULL,
  `completed_by` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ticket_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reminder_14_sent` tinyint(1) DEFAULT '0',
  `reminder_7_sent` tinyint(1) DEFAULT '0',
  `reminder_1_sent` tinyint(1) DEFAULT '0',
  `inventory_action` enum('deduct','status-only','none') COLLATE utf8mb4_general_ci DEFAULT 'none',
  `quantity_affected` int DEFAULT '1',
  `created_by` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `completed_by` (`completed_by`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `scheduled_maintenance_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory` (`id`) ON DELETE CASCADE,
  CONSTRAINT `scheduled_maintenance_ibfk_2` FOREIGN KEY (`completed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `scheduled_maintenance_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheduled_maintenance`
--

LOCK TABLES `scheduled_maintenance` WRITE;
/*!40000 ALTER TABLE `scheduled_maintenance` DISABLE KEYS */;
/*!40000 ALTER TABLE `scheduled_maintenance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_members`
--

DROP TABLE IF EXISTS `team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_members` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `employee_id` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `job_title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `employment_type` enum('full-time','part-time','contract','intern') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'full-time',
  `department` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `manager_id` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `office_location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `hire_date` datetime DEFAULT NULL,
  `termination_date` datetime DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `skills` text COLLATE utf8mb4_general_ci,
  `certifications` text COLLATE utf8mb4_general_ci,
  `notes` text COLLATE utf8mb4_general_ci,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `REL_c2bf4967c8c2a6b845dadfbf3d` (`user_id`),
  KEY `IDX_team_members_user_id` (`user_id`),
  CONSTRAINT `FK_c2bf4967c8c2a6b845dadfbf3d4` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_members`
--

LOCK TABLES `team_members` WRITE;
/*!40000 ALTER TABLE `team_members` DISABLE KEYS */;
INSERT INTO `team_members` VALUES ('325c5a3c-f0ae-40f3-af1a-f58422c9a4ec','21f46957-77d7-48f5-91d3-5ef42c9f0ee7',NULL,NULL,'full-time','project-management',NULL,'',NULL,NULL,NULL,'inactive',NULL,NULL,NULL,NULL,'2025-12-19 15:10:40.043335','2026-01-16 11:02:18.000000'),('61f32816-8c5c-4678-9600-07d9ee980516','c50bb89e-efdf-454a-8676-7ae6920e36c4',NULL,NULL,'full-time','engineering',NULL,'0184522546',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 17:41:50.909775','2025-12-19 15:05:40.000000'),('6d006b5e-5a5a-431c-b1fd-a8a325677d7e','3a01293b-fcb2-4907-9974-44c0e70bc0b0',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 19:00:41.549587','2025-12-19 15:06:01.000000'),('98d60165-f33c-4f0b-b541-196e7ddfc221','c38a6397-0cc6-4a78-b499-8d7d40e104a2',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'inactive',NULL,NULL,NULL,NULL,'2025-11-08 19:02:26.479276','2026-01-16 11:02:22.000000'),('9d322a42-40ba-45b6-925a-7a36294f6d08','83a0ed9a-5c43-468e-bb1b-6e7f2457e4f3',NULL,NULL,'full-time','project-management',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 19:13:37.649327','2025-12-19 15:06:21.000000'),('9e2363b3-0d59-4426-b056-85d5bc63c357','4edd4581-3c9b-480c-8d4b-85b712a154db',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-12-19 11:28:29.648409','2025-12-19 11:28:29.648409'),('acae272c-0e30-445a-b24f-cd9abd23c54b','9823b105-8a76-4368-accb-cd72cfa1aad2',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 19:01:23.767028','2025-12-19 15:05:44.000000'),('aee98196-2d5e-4e08-b0aa-df1ea9b596e2','a794677b-b105-4a87-8f53-e53c85820c60',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 19:02:02.978774','2025-12-19 15:05:58.000000'),('b272f4a0-f2e9-4e96-9567-1776ba5116ff','8400f925-e34f-4c31-ac9e-6cc6efd27067',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-12-19 11:22:19.774118','2025-12-19 11:22:19.774118'),('bcb65a20-ac9f-40fa-acc0-f1232bc5b8f3','6afc8fb3-e613-4ee2-a72e-50221fc69ffe',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-12-19 15:06:55.870477','2025-12-19 15:06:55.870477'),('d35e28a0-d8d3-4168-8bf4-fbb5ded8b5bb','e31f2901-9223-4922-9dcb-fb962518d4f7',NULL,NULL,'full-time','project-management',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-12-19 15:07:25.839123','2025-12-19 15:07:25.839123'),('ee5fd7c7-7723-4c38-932e-3249c26d8f9b','dcf6496b-f109-444a-b976-aed7f2b8028a',NULL,NULL,'full-time','engineering',NULL,'0195805495',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 17:36:18.033350','2025-11-08 17:36:18.033350');
/*!40000 ALTER TABLE `team_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timesheets`
--

DROP TABLE IF EXISTS `timesheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timesheets` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `project_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `engineer_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `date` datetime NOT NULL,
  `hours` decimal(10,2) NOT NULL,
  `work_category` enum('engineering','project-management','measurement-site','measurement-office') COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_timesheets_project_id` (`project_id`),
  KEY `IDX_timesheets_engineer_id` (`engineer_id`),
  KEY `IDX_timesheets_date` (`date`),
  CONSTRAINT `FK_c792244262bc8e098bd80d34cd5` FOREIGN KEY (`engineer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_e890b44a3b88da8046e3fb43c03` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timesheets`
--

LOCK TABLES `timesheets` WRITE;
/*!40000 ALTER TABLE `timesheets` DISABLE KEYS */;
INSERT INTO `timesheets` VALUES ('76d13ae3-3f9e-42ec-a7ec-f0dcde1fe734','52b0e67f-5ae5-4a66-9089-4039b8ca9052','dcf6496b-f109-444a-b976-aed7f2b8028a','2026-01-28 16:00:00',5.00,'engineering','','2026-01-29 16:59:04.543594','2026-01-29 16:59:04.543594'),('e078b2c4-090a-4dda-bff9-9766add1842e','2c9865c3-3dad-4be1-b827-2c3a499b0085','dcf6496b-f109-444a-b976-aed7f2b8028a','2026-01-27 16:00:00',5.00,'engineering','d','2026-01-28 10:14:21.049555','2026-01-28 10:15:14.000000');
/*!40000 ALTER TABLE `timesheets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_blacklist`
--

DROP TABLE IF EXISTS `token_blacklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blacklist` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `token_hash` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `revoked_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_token_hash` (`token_hash`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blacklist`
--

LOCK TABLES `token_blacklist` WRITE;
/*!40000 ALTER TABLE `token_blacklist` DISABLE KEYS */;
/*!40000 ALTER TABLE `token_blacklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `department` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `position` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `roles` varchar(255) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'engineer',
  `is_first_login` tinyint(1) NOT NULL DEFAULT '1',
  `reset_token` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reset_token_expires` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  KEY `idx_users_reset_token` (`reset_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('21f46957-77d7-48f5-91d3-5ef42c9f0ee7','Mian Joo','mianjoo@mycae.com.my','$2a$10$s1d8HI5tmKVk19E8QQ2ISugdB4ItP5TrGkQU.sNZOV0j7CxrZsbcC',NULL,NULL,'male-01','2025-12-19 15:10:40.036561','2026-01-16 11:02:15.000000','[\"managing-director\"]',1,NULL,NULL),('3a01293b-fcb2-4907-9974-44c0e70bc0b0','Kah Xin','kxkhoo@mycae.com.my','$2a$10$s1d8HI5tmKVk19E8QQ2ISugdB4ItP5TrGkQU.sNZOV0j7CxrZsbcC',NULL,NULL,'male-01','2025-11-08 19:00:41.543395','2026-01-14 10:28:39.000000','[\"senior-engineer\"]',1,NULL,NULL),('4edd4581-3c9b-480c-8d4b-85b712a154db','Soon Sen Yao','senyao@mycae.com.my','$2a$10$s1d8HI5tmKVk19E8QQ2ISugdB4ItP5TrGkQU.sNZOV0j7CxrZsbcC',NULL,NULL,NULL,'2025-12-19 11:28:29.641768','2026-01-14 10:28:39.000000','engineer',1,NULL,NULL),('6afc8fb3-e613-4ee2-a72e-50221fc69ffe','Aqil Azad','maqilazad@mycae.com.my','$2a$10$s1d8HI5tmKVk19E8QQ2ISugdB4ItP5TrGkQU.sNZOV0j7CxrZsbcC',NULL,NULL,'male-01','2025-12-19 15:06:55.860210','2026-01-16 09:36:50.000000','[\"engineer\"]',1,NULL,NULL),('83a0ed9a-5c43-468e-bb1b-6e7f2457e4f3','Lee Wei Loon','wllee@mycae.com.my','$2a$10$s1d8HI5tmKVk19E8QQ2ISugdB4ItP5TrGkQU.sNZOV0j7CxrZsbcC',NULL,NULL,'male-01','2025-11-08 19:13:37.643563','2026-01-16 09:36:33.000000','[\"manager\"]',1,NULL,NULL),('8400f925-e34f-4c31-ac9e-6cc6efd27067','Mohd Haziq','haziqbakar@mycae.com.my','$2a$10$s1d8HI5tmKVk19E8QQ2ISugdB4ItP5TrGkQU.sNZOV0j7CxrZsbcC',NULL,NULL,'male-01','2025-12-19 11:22:19.762996','2026-01-14 10:28:39.000000','[\"manager\",\"senior-engineer\"]',1,NULL,NULL),('9823b105-8a76-4368-accb-cd72cfa1aad2','Muhammad Hafiz Naaim','naaimhafiz@mycae.com.my','$2a$10$s1d8HI5tmKVk19E8QQ2ISugdB4ItP5TrGkQU.sNZOV0j7CxrZsbcC',NULL,NULL,'male-01','2025-11-08 19:01:23.763644','2026-01-16 11:02:45.000000','[\"managing-director\"]',1,NULL,NULL),('a794677b-b105-4a87-8f53-e53c85820c60','Shahul Hameed','shahulhameed@mycae.com.my','$2a$10$s1d8HI5tmKVk19E8QQ2ISugdB4ItP5TrGkQU.sNZOV0j7CxrZsbcC',NULL,NULL,'male-01','2025-11-08 19:02:02.974672','2026-01-16 09:36:42.000000','[\"engineer\"]',1,NULL,NULL),('c38a6397-0cc6-4a78-b499-8d7d40e104a2','KC Tang','kctang@mycae.com.my','$2a$10$s1d8HI5tmKVk19E8QQ2ISugdB4ItP5TrGkQU.sNZOV0j7CxrZsbcC',NULL,NULL,'male-01','2025-11-08 19:02:26.473467','2026-01-16 09:32:00.000000','[\"managing-director\"]',1,NULL,NULL),('c50bb89e-efdf-454a-8676-7ae6920e36c4','Harrivin','Harrivin@mycae.com.my','$2a$10$s1d8HI5tmKVk19E8QQ2ISugdB4ItP5TrGkQU.sNZOV0j7CxrZsbcC',NULL,NULL,'male-01','2025-11-08 17:41:50.905994','2026-01-16 11:02:35.000000','[\"managing-director\"]',1,NULL,NULL),('dcf6496b-f109-444a-b976-aed7f2b8028a','Muhammad Hadi','hadi@mycae.com.my','$2a$10$.vzD2EMbIbmXY2K0xua4T.ZU9VLpmJO1z4xfSHeyBCeGQfWXo9WiK',NULL,NULL,'male-05','2025-11-08 17:36:18.029086','2026-02-04 11:01:19.000000','[\"admin\",\"senior-engineer\"]',0,'40177c847998215a01abb85bb134217cdfb6e637c7f62bd34f1520cfefccbc44','2026-01-12 23:52:38'),('e31f2901-9223-4922-9dcb-fb962518d4f7','Nik Haziq','nikhaziq@mycae.com.my','$2a$10$s1d8HI5tmKVk19E8QQ2ISugdB4ItP5TrGkQU.sNZOV0j7CxrZsbcC',NULL,NULL,NULL,'2025-12-19 15:07:25.831404','2026-01-14 10:28:39.000000','engineer',1,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-04 11:07:48
