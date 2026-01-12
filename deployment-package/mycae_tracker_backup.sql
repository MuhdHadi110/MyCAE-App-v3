-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: mycae_tracker
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activities` (
  `id` varchar(36) NOT NULL,
  `type` enum('inventory-create','inventory-update','inventory-delete','checkout-create','checkout-return','project-create','project-update','project-status-change','timesheet-create','maintenance-create','maintenance-update','user-login','user-create','bulk-import') NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `description` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `entity_type` varchar(255) DEFAULT NULL,
  `entity_id` varchar(36) DEFAULT NULL,
  `module` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `FK_b82f1d8368dd5305ae7e7e664c2` (`user_id`),
  CONSTRAINT `FK_b82f1d8368dd5305ae7e7e664c2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
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
-- Table structure for table `checkouts`
--

DROP TABLE IF EXISTS `checkouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `checkouts` (
  `id` varchar(36) NOT NULL,
  `masterBarcode` varchar(255) NOT NULL,
  `item_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `quantity` int(11) NOT NULL,
  `returned_quantity` int(11) NOT NULL DEFAULT 0,
  `checkout_date` datetime NOT NULL,
  `expected_return_date` datetime DEFAULT NULL,
  `actual_return_date` datetime DEFAULT NULL,
  `status` enum('checked-out','returned','overdue','partial-return') NOT NULL DEFAULT 'checked-out',
  `purpose` varchar(255) DEFAULT NULL,
  `location` varchar(500) DEFAULT NULL,
  `condition` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `FK_000468c91f3470cf5d7897f6e2f` (`item_id`),
  KEY `FK_24f9f28b7675d85d081881e32a3` (`user_id`),
  CONSTRAINT `FK_000468c91f3470cf5d7897f6e2f` FOREIGN KEY (`item_id`) REFERENCES `inventory` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_24f9f28b7675d85d081881e32a3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkouts`
--

LOCK TABLES `checkouts` WRITE;
/*!40000 ALTER TABLE `checkouts` DISABLE KEYS */;
INSERT INTO `checkouts` VALUES ('1e9352da-fe95-4514-8f59-6e10b2206116','REC-dvsdvdsvsdv-1767768974173','e11eaca6-9e72-45c8-ae8f-0b65ea594ab8','dcf6496b-f109-444a-b976-aed7f2b8028a',5,5,'2026-01-07 06:56:14',NULL,NULL,'returned','Item received: dvdvdsvsdvdsvsdvsd','Warehouse',NULL,NULL,'2026-01-07 14:56:14.177194','2026-01-07 14:56:14.177194'),('d1c8f469-13f4-4a4a-ad28-2887cce25f94','REC-334-1767665260227','547e5436-22cb-4917-b0cf-001522fb471e','dcf6496b-f109-444a-b976-aed7f2b8028a',1,1,'2026-01-06 02:07:40',NULL,NULL,'returned','Item received: NVIDIA 2343244242444','Warehouse',NULL,NULL,'2026-01-06 10:07:40.232562','2026-01-06 10:07:40.232562');
/*!40000 ALTER TABLE `checkouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clients` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `industry` varchar(20) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `activeProjects` int(11) NOT NULL DEFAULT 0,
  `totalProjects` int(11) NOT NULL DEFAULT 0,
  `contact_person` varchar(255) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`categories`)),
  `website` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_99e921caf21faa2aab020476e4` (`name`)
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `companies` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `company_type` text DEFAULT NULL,
  `industry` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
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
INSERT INTO `companies` VALUES ('2e1c6704-8aa7-40a6-932f-43a534608ac4','Infineon',NULL,'Semicon',NULL,'','2026-01-06 13:56:53','2026-01-06 13:56:53',NULL),('58fc3a84-c6b8-45a5-85df-632a2a95e0a5','Infineon 2',NULL,'Semicon','','','2026-01-06 13:56:53','2026-01-06 13:56:53',NULL),('9638dbe6-f97b-486a-90a2-539a8000ebaa','fdbadfbdabfdb',NULL,'fdbafbdfb','','','2026-01-06 13:56:53','2026-01-07 05:56:53','2026-01-06 21:56:53'),('c1b27da2-a9d3-46b5-8dea-d537c180eac9','efsdsdvsdv',NULL,'dsvsvdv','','','2026-01-06 13:56:53','2026-01-06 13:56:53',NULL),('dcdf7f0f-2312-43c2-be59-cac80a9f994d','Boldgate',NULL,'Manufacturing','','','2026-01-06 13:56:53','2026-01-06 13:56:53',NULL);
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `computers`
--

DROP TABLE IF EXISTS `computers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `computers` (
  `id` varchar(36) NOT NULL,
  `asset_tag` varchar(100) NOT NULL,
  `device_name` varchar(255) NOT NULL,
  `computer_type` enum('desktop','laptop','tablet','workstation') NOT NULL DEFAULT 'laptop',
  `manufacturer` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_number` varchar(255) DEFAULT NULL,
  `assigned_to` varchar(36) DEFAULT NULL,
  `processor` varchar(100) DEFAULT NULL,
  `ram` varchar(100) DEFAULT NULL,
  `storage` varchar(100) DEFAULT NULL,
  `graphics` varchar(100) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `os_version` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive','in-repair','decommissioned') NOT NULL DEFAULT 'active',
  `purchase_cost` decimal(10,2) DEFAULT NULL,
  `purchase_date` datetime DEFAULT NULL,
  `warranty_expiry` datetime DEFAULT NULL,
  `decommission_date` datetime DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `installed_software` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_213ef2d53445c1f4285ea0f14b` (`asset_tag`),
  KEY `FK_82515a9b1ba8978695e70390ccd` (`assigned_to`),
  CONSTRAINT `FK_82515a9b1ba8978695e70390ccd` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `computers`
--

LOCK TABLES `computers` WRITE;
/*!40000 ALTER TABLE `computers` DISABLE KEYS */;
INSERT INTO `computers` VALUES ('36fd6ccd-5f4f-491f-847b-50032c108d01','PC4','PC4','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,NULL,'2025-12-29 09:44:33.039250','2025-12-29 09:44:33.039250'),('4f8ac452-6b8b-47ff-8f8c-137a35adaadf','PC2','PC2','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,NULL,'2025-12-17 22:59:20.777306','2026-01-06 15:35:28.000000'),('9e3a5fd2-a7c5-4d54-b316-3621e984d5bf','PC3','PC3','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,NULL,'2025-12-29 09:44:24.348992','2026-01-06 15:17:07.000000'),('9fc90680-7666-4a36-8cf2-10dcc6c062cd','PC6','PC6','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,NULL,'2025-12-29 09:44:49.586069','2025-12-29 09:44:49.586069'),('bca610ce-a84d-450e-9eb5-8c46946d3f8f','PC1','PC1','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,'','2025-11-25 12:09:56.034623','2026-01-06 17:56:45.000000'),('bca77783-8b55-4edf-b1a1-c56621bd0b0e','PC5','PC5','laptop',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'Office',NULL,NULL,'2025-12-29 09:44:42.013291','2025-12-29 09:44:42.013291');
/*!40000 ALTER TABLE `computers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contacts` (
  `id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
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
INSERT INTO `contacts` VALUES ('0450249a-3e13-4744-93a7-21d9b994e70c','58fc3a84-c6b8-45a5-85df-632a2a95e0a5','John doesd','john232@gmail.com','01845225461',NULL,'2026-01-06 13:56:53','2026-01-06 13:56:53',NULL),('277f558f-10d5-4cc4-b1dc-206a0eb73b1b','2e1c6704-8aa7-40a6-932f-43a534608ac4','Primary Contact','john@gmail.com','0184522546',NULL,'2026-01-06 13:56:53','2026-01-06 13:56:53',NULL),('50c2ec19-0185-44e5-abff-c37dc7a43fe1','9638dbe6-f97b-486a-90a2-539a8000ebaa','adfbadbfd','dabad@gmsail.com','dsfsdfsf',NULL,'2026-01-06 13:56:53','2026-01-06 13:56:53',NULL),('a6fc671a-22dc-4208-ab88-63b025b1d243','dcdf7f0f-2312-43c2-be59-cac80a9f994d','sdsds','dfsdfsfs@gmail.com','',NULL,'2026-01-06 13:56:53','2026-01-06 13:56:53',NULL),('b7ef4324-a8db-4be0-9ecf-254961cb0486','c1b27da2-a9d3-46b5-8dea-d537c180eac9','sdvsdv','sdvsdv@gmail.com','',NULL,'2026-01-06 13:56:53','2026-01-06 13:56:53',NULL);
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exchange_rates`
--

DROP TABLE IF EXISTS `exchange_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exchange_rates` (
  `id` varchar(36) NOT NULL,
  `fromCurrency` varchar(3) NOT NULL,
  `toCurrency` varchar(3) NOT NULL DEFAULT 'MYR',
  `rate` decimal(10,6) NOT NULL,
  `effectiveDate` date NOT NULL,
  `source` enum('manual','api') NOT NULL DEFAULT 'manual',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exchange_rates`
--

LOCK TABLES `exchange_rates` WRITE;
/*!40000 ALTER TABLE `exchange_rates` DISABLE KEYS */;
INSERT INTO `exchange_rates` VALUES ('00eef1ee-1424-45da-b147-a5192f6c4a08','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('0245e1c3-4287-4e7c-9c1f-6caff9371172','PHP','MYR',0.068933,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('0389c983-de9a-4c1d-b4e0-992c9a9667e3','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('038b8ab3-ac1a-4162-a55b-3eabfa2ba603','KRW','MYR',0.002810,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('04a95377-ea3b-496d-ab4a-32f72acb84ff','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('07adebf2-8f69-4747-ba35-2cddfdc3e315','THB','MYR',0.129781,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('08532ff5-983f-433b-b3d3-0dccc65b9f7f','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('094d5118-94c6-44b1-9931-ba3073bb76c7','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('09cb5a12-da6b-4574-9d23-b7f958de1c43','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('0a465d58-e30a-4f4f-b3ef-87fbc60ca5a0','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('0b435bc0-8cef-43e9-abac-8743ba99c3b4','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('0bb0581f-a602-4448-879d-1446f8468911','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('0c2e1afd-2580-41b0-a386-d5b08ede9813','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('0c6cc63c-26b0-47f1-982b-cce21b7b0cda','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('0d5ff56b-da91-403e-8e4f-c8c7692d50b3','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('0e36c055-d842-4917-89c8-20c8c23fb9c7','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('0e731e0e-e5c9-4ac7-bac0-2d10bd6eea7b','PHP','MYR',0.068890,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('0e9941c2-89c7-42cd-a2c7-e35ca9f81adb','KRW','MYR',0.002764,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('0f2c66c3-14a5-47ba-b335-a6d42864472d','INR','MYR',0.045243,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('11e1143b-9ada-4403-90fb-3f0e10672056','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('11ef1ae1-51ca-452f-93ce-8eb83e444b2f','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('13fd4eaf-2aa5-4976-ad65-4deff5fd22a6','USD','MYR',4.088475,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('141585aa-023f-4bf5-8aec-c635e03aa74e','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('153d7646-d803-4468-9788-370609e0573e','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('16cfdb5c-9116-43be-845a-3dad1043ac1e','EUR','MYR',4.750143,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('17339992-fd90-496b-9a11-e6bf725b6ca0','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('175b0efb-5790-416e-b7d5-929b76e75d00','USD','MYR',4.072490,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('182fbbc2-9478-451c-9db1-6350c967a540','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('18c86070-e0fc-481c-98be-5d01854b94dc','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('19e9d054-aed8-4444-9880-d09f2ce82563','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('1a5a2d85-c691-4580-8f4f-463d82e07e4a','IDR','MYR',0.000245,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('1d0539fe-3672-4e58-acff-8aa1d71765ca','SGD','MYR',3.151592,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('1e759dfd-8115-411a-a170-40e28f9a2ac4','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('1ead1128-f12b-42f3-89ea-280e8f5bedf8','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('21bbe255-1193-4328-9239-e3b20ff12bce','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('2239b7b4-0a17-4026-8f0b-3fa6a134c92f','AUD','MYR',2.712453,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('22c157ab-c10c-4911-ba33-0a3340dc2b56','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('22edb0ff-3a6b-410e-a5c1-2e33161475ab','USD','MYR',4.085468,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('234b8165-0ab5-4893-8ab8-5ff38cd4fd92','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('25c1a2dd-bfa7-4df1-935e-d16303b01b59','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('2838bc60-24ef-4305-8a19-0b035102fa39','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('291cf389-f16c-4d41-949c-45a516351d27','AUD','MYR',2.707019,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('2d0b8ab3-71c5-4fdd-a122-9c1657f2730f','EUR','MYR',4.751722,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('2d741a79-3641-4cc6-b652-b6918d51ec7c','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('2e5f336c-e154-4773-8299-ff490e74475e','PHP','MYR',0.069677,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('2ffe9d39-1f13-4515-9e8f-da30b5d60a35','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('303c9f2d-bff1-4988-99ff-8bdeb1d110db','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('32ef756d-f6d8-4b61-a1f1-2e01a9d1e15a','SGD','MYR',3.180000,'2025-12-16','manual','2025-12-16 05:39:19','2025-12-16 05:39:19'),('33c7f0d6-4d11-4323-bfe8-85a7a6cd7d78','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('34ec2266-bbf9-4d6b-b717-e14db73d14d1','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('364f610f-3ee2-4876-a5ea-6ccdb2e7684e','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('36a6d99e-707f-4bab-8509-85b44f8dad3c','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('38e5f782-10ff-4244-ba41-456c393b7698','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('39adbb38-29de-498c-9016-caccfd38568a','PHP','MYR',0.069677,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('3d0dfb7e-8198-4940-a068-c594b8fef203','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('3d529ff0-250c-4729-931c-9588a3db6823','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('3d98ac0d-873d-4c3c-913a-f0eac81c28b2','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('3eede2f9-471f-40b5-809d-7d5c44c67ed4','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('3fc1a61b-b387-45b5-aac8-6ae43c22214c','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('407a733a-a4b7-4f20-8f1b-29f9a166fb68','NZD','MYR',2.340440,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('416e15a4-0168-41b8-a094-166214b83446','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('41b78055-d77f-4631-802a-291bb561a68d','SGD','MYR',3.180000,'2025-12-16','manual','2025-12-16 08:03:16','2025-12-16 08:03:16'),('42d3cc29-5d54-481b-95a2-1fc9362deae2','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('42e1a4a8-acd7-49d0-aa3a-69c68b31ebec','NZD','MYR',2.364625,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('430accab-0577-4da9-a0ff-b2cd7ad408e0','SGD','MYR',3.165058,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('43e41a75-af80-4030-8e2a-b806c69de4ef','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('43f8e24f-4a95-4730-88d8-10a32ce70f45','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('44f4ddb7-c188-4f5b-bdaa-3ae48c513fdc','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('45e87bf0-b990-4bc0-8312-1595e2b554c6','IDR','MYR',0.000245,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('47d9a935-3834-41d8-bc98-f5ca79909c5e','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('4819d7cd-a504-4a0f-93ab-2bd9c2e4b569','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('4a506435-3688-4a82-b20a-92738419909a','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('4aa74522-2c2f-48f3-9add-4fdc8053a5b6','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('4d0bce70-19c7-455e-8381-22511961748d','CAD','MYR',2.951942,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('4d21d904-b66b-4363-afec-6499ecc737a9','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('4e2b84b2-ad61-441e-8b77-3183cd9cbeba','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('4e770286-1ce0-4347-93e4-3e2e26e6d765','INR','MYR',0.044934,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('4e88e9a1-de8e-4154-aed0-189d0b87d8e8','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('4efab30d-ec48-47fa-ad91-2785cf4023e0','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('4f097d5d-cc94-42b3-bda6-074031eaef49','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('500c8dfe-2c28-4959-b474-7cae7de3f381','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('52e22d37-19ab-46f6-9fb9-34337bf4dece','THB','MYR',0.129781,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('533f979a-8374-4d9c-a870-2bc474a76130','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('53cec6a2-9931-4a2a-9ce5-5d47657dd346','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('5416c5f7-8ac4-43e9-9e70-c14887620a43','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('5436039c-66f9-473b-9771-f2041e00ae01','IDR','MYR',0.000243,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('54edf322-23da-4722-94c5-dd2aa7b13085','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('54f8126f-5133-4bb1-bd66-60ae887cf761','GBP','MYR',5.489679,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('55588ab4-240d-4a72-a0d0-94e38e6ec8ea','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('565120b7-37fb-4a90-a87b-81576115d848','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('5747e12f-428b-486e-87d1-45380275140f','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('5869cc6c-b8a5-4cc6-94f0-2159ebb48fed','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('586b8f84-4be5-4a11-b4d3-e32c713f2367','SGD','MYR',3.170175,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('5984e4b7-3228-4960-ad3b-0554cdd94f02','CNY','MYR',0.580147,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('598cb3de-9e00-488f-b908-b375fa300809','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('59a8ca7e-dfcc-4496-8134-fd3232513fd1','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('5ae2119a-917a-4ba1-94a2-c27a90c7db5f','SGD','MYR',3.170175,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('5b182587-8bbf-4f09-80d7-3d9e7c294e6f','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('5b6451e2-7193-4b2e-94af-4be59713c0bb','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('5c8fca21-89ef-49be-8826-bdc7d318653e','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('5dc57f4d-ac11-4b8f-9017-360de766f021','INR','MYR',0.044946,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('5f76bc7d-0ac5-4bfa-b19d-974bfeb729ec','USD','MYR',4.085468,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('5f9dd60d-b9a0-4189-82fe-72b0f2f4dd53','EUR','MYR',4.811162,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('5fc9eea5-9a09-4fb3-8fe9-9c728d51190f','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('61386855-889e-411b-8f5c-92be904e246b','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('61dde7ea-d48a-4060-922a-538569996028','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('61e675c7-ee72-41dc-9dc6-1dac4b4c2f65','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('62b04d80-b9ea-4f3c-800c-13d054e57a69','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('63ee95a5-284d-486c-9914-1a34b13a9079','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('63f524f6-e434-4749-ba7d-a5afb140a782','CNY','MYR',0.580417,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('644c52f3-df99-402a-9ae5-fad8852a3da7','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('648cebc5-c924-46b9-9c56-5f5231c0cdbf','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('64c2be6e-ff6d-4db4-a45a-dd6594ba10ae','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('666f9f01-bbc2-4e5b-9d6e-8778a9f91d8b','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('66b5eb1a-926b-4c4d-aa73-4e6833239fad','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('6850eaf0-4ae1-4eed-9b8d-3253066a5d6a','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('69eb1d7d-98ce-4b50-aaf9-90c339fa4eb2','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('6abd601f-466f-450c-98d4-064a40b4434c','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('6ad90572-8a3a-4404-959b-66daa86b6849','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('6af432d4-e485-41ff-9b48-91d93b525b93','CNY','MYR',0.580147,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('6c60c14b-ae87-40b1-9790-faaf380ea6b8','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('6c7a0011-7a56-45c4-994d-5d2fd6468db6','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('6d044eb6-cd91-4724-93dd-b1900d33112d','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('6d8d1b85-b17b-422b-ab5d-dd470ec1b01b','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('6da71944-0e5f-455b-973d-7b05ce9ccbf7','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('6e41aa74-f7e1-4cdf-8a85-b0f7c2f5b492','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('6e679e91-be08-4113-ae7b-60b6d5809858','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('6e69ba4e-f476-4c7c-a746-684d318d6ac9','GBP','MYR',5.455240,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('6e941aa7-5e40-48df-97b3-5cb91a9e438b','HKD','MYR',0.520291,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('709dcd9d-390a-49e8-92ad-c1ec3f8af655','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('71af513c-ee94-4508-97b8-63e1e196f5a7','JPY','MYR',0.025967,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('73547ee1-4f68-4f95-bfa7-6603eb0ed00b','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('749bf806-b3b4-44a1-ace0-62938bda8b6d','USD','MYR',4.053999,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('761dfd77-fb6a-4cf6-a47d-48ab534b6971','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('777faf9e-1cb1-46bc-8520-70caad9284f9','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('7982b668-3b98-4224-bcac-8727df3b55d1','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('7ced61be-13ad-4a84-a1cf-fa751af3e979','AUD','MYR',2.712453,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('7d4549a6-a2b8-45db-9712-0c5b5d1001eb','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('7e8be0eb-4c68-49a5-831e-fa645404dd69','CAD','MYR',2.952814,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('7f578707-47db-477b-a288-bf50c3286fc6','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('81ef87b6-72e6-4fcf-8c9a-1c0a9191fa78','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('82aab350-f7c5-4927-b265-034f40a4eb8f','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('83624293-0885-4163-a29e-e92fb14cc001','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('83b6af89-e255-4231-9036-5e1382abcbe5','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('83f6a397-a53e-410a-aa73-9e9162c3f6a0','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('843bdbf8-ac17-4c3a-a110-2f85b154faea','JPY','MYR',0.026278,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('8581103d-0259-4236-925d-24e0c39a688d','JPY','MYR',0.026424,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('859920c1-16a9-404a-ac7b-7d4d223699bb','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('85f6d81c-4c61-4c7d-99b4-2feb5e282312','INR','MYR',0.045102,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('86918d58-7975-47b6-81de-af2727d5fa65','SGD','MYR',3.162955,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('86f125dd-8409-4ab8-9b61-28c1465a6e29','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('878e0842-5f07-45e6-b183-64b689faf7bb','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('8994cc81-bd67-4651-a823-e3c2172c4d2e','HKD','MYR',0.525183,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('899fcc45-6614-4964-a3f5-a0cc27f6c2d9','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('8aa1457a-9605-494e-84c0-a6b9e345cdbf','JPY','MYR',0.026424,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('8bd05491-7a29-49a4-9735-77695b5ae470','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('8bd23896-5d27-456b-849f-71494596cd1c','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('8c6fecc6-99e9-486b-abfc-3c284b216a46','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('8f5d9f44-fa5e-46e4-a9cc-3724ad49673a','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('90c1fc08-f3c6-4743-9cdb-cbb66c258c9c','CNY','MYR',0.579677,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('918313e3-dc65-44c7-83c5-2d0bf6148928','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('92197ac6-3db7-4ee9-9e3e-3325764ac174','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('9294c7c3-c9a9-4d02-948b-60cbc4bc4dae','JPY','MYR',0.025833,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('93273fd5-b82d-4329-be6e-eb3e78ba3b86','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('93b20a7d-bc69-41c3-a729-b532a83099cf','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('941e9c27-e8f4-4e36-93ae-6f027b43fe45','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('943acaef-a14d-446e-9b9c-205607c5b640','KRW','MYR',0.002773,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('950cb5a3-b532-4001-9503-fb1497e674fa','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('98977c94-7d0c-4f6c-87ec-e58b4d40edab','CAD','MYR',2.964720,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('98eb145e-e54f-4b77-ac5b-ea1a2cf17876','PHP','MYR',0.069687,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('991769a2-62d8-404e-b653-fd36fd27b9b9','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('999508e2-2047-4b06-ab9e-9c959baf69a6','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('9b18c666-356b-4e6e-8513-ea180fce3196','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('9ce5df3e-41d6-44e4-a8b6-5f1521f0eef8','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('9dac67c0-3238-4baf-b918-cba544d7a432','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('9e55feac-81dd-4d79-b820-f39ebe2a3fc8','GBP','MYR',5.475252,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('9efd80bc-69be-4ee9-8971-ea15ec63ade8','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('9f59d9f5-372c-4953-b87f-91b1456ef5d1','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('a08deb77-5897-4535-a65f-202c37593a6a','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('a0b856e0-c5fe-4d8d-abab-4bb698b758d4','AUD','MYR',2.715620,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('a193ef58-415a-4004-87d3-fcb041653135','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('a39c1127-333f-41a3-a0e3-7997b66af4a4','THB','MYR',0.129151,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('a3c42f21-44c4-4ec5-9783-a9f262363c9d','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('a514f3d1-0521-4e53-887c-5f1e5a5279ed','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('a58a79e7-96ff-430b-a433-bd88d5d6f3f2','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('a60238e1-4ee1-46c5-9055-34b8c97df486','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('a6217419-4ee3-4d0c-8eb0-3ab335f308ce','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('a7a6fb00-7551-4a82-a96d-9d4c86027742','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('a98c6eae-ebd0-4871-9f04-3e39329f7e68','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('aa7d6e12-3877-42e0-be50-c62d8cef9e8c','HKD','MYR',0.525183,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('aa843cbd-05ab-4772-8088-1191636b89f6','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('aa8eed30-2f33-480e-97af-9681a7020fa3','THB','MYR',0.129801,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('ab834332-7332-4df2-88b2-204d8a316968','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('ac2ccd2e-8a1e-406b-b28a-fc869cb849a9','CAD','MYR',2.968680,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('ac8f0ebf-f248-4870-b2d0-9a51ac681df0','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('b020b051-41f7-4366-9d78-7e98b9a79cbd','HKD','MYR',0.525458,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('b1de5407-a68e-4ade-aa19-04bebbceae7f','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('b27c4b77-94e0-4da9-b535-9b572d115354','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('b28c7b08-4738-4b05-842d-68f2dde0e302','HKD','MYR',0.523013,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('b2defcca-d339-4298-b8f0-feaf5d6671a5','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('b4582388-7646-4ca9-93f6-5b21ce5f6d7a','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('b6e76782-b9b6-44e7-a78d-dcca1eaf74a8','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('b74c0e9c-a4a5-43ae-90e0-edb9e28029ad','GBP','MYR',5.489679,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('b911cdb1-8123-476c-a11b-b84b0d79187c','KRW','MYR',0.002806,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('b96475ee-e30a-43d0-bce8-7b85f063b3ae','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('b98fffa1-b89f-4735-9713-1d893f417933','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('bb50ef96-ed39-402a-857a-1230266a0327','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('bbfc614f-9008-48ec-ae4e-f344e0f67aad','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('bda50a8f-ceb1-46ea-8e7c-9c5294980c0e','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('be177f80-5ecf-4702-9933-8e2c57b6fd9c','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('be3111d0-52ae-4374-9163-2a59e606c199','NZD','MYR',2.361554,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('bf5a8039-7e8d-4068-8b74-6495ee565865','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('c0c6130e-2fde-43d0-87f9-e98b6a8659ae','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('c0c8344c-c1fa-482a-bd67-204fb566634a','GBP','MYR',5.449888,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('c10aefad-c796-4658-b93f-0af0e92214c2','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('c1f6865a-9f90-4184-929d-f0822ca055bc','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('c28964ba-4184-4c70-8fa5-a430c686d36b','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('c293422f-9d7f-4d0e-b108-553c031c6942','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('c2d1ef37-703c-49bc-984c-0fa2b9e29135','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('c34ee39c-2640-410d-98db-fc0f8a20be9a','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('c61f48cc-0341-42af-ae9f-68d7f4eb5659','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('c6a71274-c80d-420d-ad78-bd5e44ac32e1','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('d01f5c71-4eea-4f4c-b776-04095ec4e943','CNY','MYR',0.580754,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('d1af697f-75ca-411b-a74e-3fad9b719580','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('d2e9c8b1-de85-4681-9cd8-91165f3b10cd','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('d30a4402-7958-41c4-8fd9-7cbfd38d1ef6','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('d3b09c3c-97a9-4cdb-bba7-dc26ccd12986','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('d41cceb7-2ab2-4c1d-8adb-508e65fb7751','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('d4a54239-b3ca-4e16-bac1-ace675d84519','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('d54c82e6-1b27-4a0c-ae56-8540d5f61043','AUD','MYR',2.713999,'2026-01-05','api','2026-01-05 09:00:00','2026-01-05 09:00:00'),('d6539b7e-fb02-4ed3-bfd4-0490b3ad0770','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('d6b577fd-4bef-42c9-8ccf-aed73bf900eb','KRW','MYR',0.002793,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('d6f848c4-ca88-4e85-be24-6d3b1e6ab94c','THB','MYR',0.129730,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('d7e4d410-ac57-4267-85dc-bc7b191c059b','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('da43ba32-d5b6-4777-940d-883abae39859','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('dbea5f80-e088-4a85-a8ae-93042455a61a','CNY','MYR',0.582988,'2026-01-06','api','2026-01-06 09:00:01','2026-01-06 09:00:01'),('dc2791a5-71f9-4061-a9f9-12dfa881df88','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 08:05:09','2025-12-16 08:05:09'),('dcf100d7-5355-4c89-a555-545a1ecb8612','SGD','MYR',3.180000,'2025-12-16','manual','2025-12-16 08:03:54','2025-12-16 08:03:54'),('dcfdb676-9ffc-4c24-9d3a-5bd1259a3667','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('de3299dd-c0b1-4f4a-8398-6b8d53dd5d09','IDR','MYR',0.000243,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('df400f9d-ebf1-4171-a66f-5b7e1ba11a56','CAD','MYR',2.968680,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('e00b0b64-9bad-42d7-94e9-16a40063707f','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('e0315075-0b85-4bd5-a54b-2c194d6bb785','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('e1977a75-2278-41f2-97c9-9705fa534ef0','EUR','MYR',4.792485,'2025-12-18','api','2025-12-18 10:05:12','2025-12-18 10:05:12'),('e1f09272-3616-41e2-aeb3-4adfb2bdadb7','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('e226b176-a95b-46bc-96c9-491aef2bcac2','NZD','MYR',2.364625,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('e26de000-770b-436d-906e-ed45ce2e6cfb','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('e3e7b7e2-ab27-43bc-86d1-f20f9d1b1588','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54'),('e497a68a-2fec-4f27-949f-f433402cd852','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('e4d18569-85dd-4309-b5ef-837a8fd6e6a6','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('e6de8e4c-3179-4dd2-830f-837695756174','NZD','MYR',2.338798,'2026-01-05','api','2026-01-05 09:00:01','2026-01-05 09:00:01'),('e7c8abc8-91ac-4e07-ac86-2b5fa15ee0e9','IDR','MYR',0.000245,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('e86aca03-f8a8-4b64-9401-8a5416ee7c5d','SGD','MYR',3.175309,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('e8d51b0b-cc71-4d5c-a367-8e906eeca14a','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('e94a7efc-4ac3-4f1f-b41a-388272209d1a','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:02:56','2025-12-16 08:02:56'),('e9fec440-ed3f-4286-8b51-2044bd9a2e9c','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('eb062972-387d-423a-85e3-d3f6885f7666','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:03:11','2025-12-16 08:03:11'),('ed6da7cb-1553-4213-92e4-01009fbdd68d','INR','MYR',0.045100,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('eee93a5f-c18d-4cd9-894a-996d5432b60c','EUR','MYR',4.811162,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('ef68d209-8950-4932-a6f0-b6e2d2ca777d','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:03:28','2025-12-16 08:03:28'),('f0e67801-80dd-4d1c-885b-ba2fb7a4582b','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('f104fbc3-7151-4703-bab7-b91e3257235f','KRW','MYR',0.002773,'2025-12-17','api','2025-12-17 10:04:12','2025-12-17 10:04:12'),('f15b4dd4-0129-4aac-9722-b92a18a76d6c','INR','MYR',0.044934,'2025-12-17','api','2025-12-17 03:18:05','2025-12-17 03:18:05'),('f1b97091-6eb1-4b9e-bc09-214b083e8a2d','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 08:05:12','2025-12-16 08:05:12'),('f1d6e064-d4b2-44e3-ba83-b90d3a4e5ea9','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('f28d037c-a784-4e33-9abf-c07770ae4bee','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('f2cc95ad-0ede-4023-80d1-2c42cb1780c0','HKD','MYR',0.525901,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('f3636cf7-7c71-4763-85b6-576a5e25c672','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('f4589345-f8fa-4332-b235-d0931bb92f11','PHP','MYR',0.069407,'2025-12-16','api','2025-12-16 05:38:52','2025-12-16 05:38:52'),('f6e3f8e6-96b9-4177-b114-2fca25a4bc61','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 05:42:29','2025-12-16 05:42:29'),('f70d16c6-deca-423d-8c6a-7660b3ec6905','THB','MYR',0.130022,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('f812e805-2b45-4ccc-857d-2965aaaaebf4','GBP','MYR',5.478852,'2025-12-16','api','2025-12-16 08:05:11','2025-12-16 08:05:11'),('f8894fe6-45ad-4ed0-9146-b1c8de58ec05','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('f9d474fb-3c53-4494-ae3c-29e11308a5e3','NZD','MYR',2.370567,'2025-12-16','api','2025-12-16 14:08:21','2025-12-16 14:08:21'),('fa585fa5-3548-4128-a8b2-4641e983eae3','EUR','MYR',4.810005,'2025-12-16','api','2025-12-16 08:04:09','2025-12-16 08:04:09'),('fd583ca4-0c5a-407f-9518-aa517252a5bb','CAD','MYR',2.974774,'2025-12-16','api','2025-12-16 08:04:06','2025-12-16 08:04:06'),('fd6a367a-e2d1-4fc7-923d-4b4b11663a9a','IDR','MYR',0.000245,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('fe58b8a8-df5d-4850-87ae-e83043b1d59f','USD','MYR',4.092490,'2025-12-16','api','2025-12-16 08:02:53','2025-12-16 08:02:53'),('fea85a7a-0db5-4725-b24f-a895c4ace658','AUD','MYR',2.722200,'2025-12-16','api','2025-12-16 03:44:12','2025-12-16 03:44:12'),('fee43805-e113-4b0e-b54c-59c24a5fcf5f','JPY','MYR',0.026382,'2025-12-16','api','2025-12-16 14:00:54','2025-12-16 14:00:54');
/*!40000 ALTER TABLE `exchange_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `barcode` varchar(255) DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `minimumStock` int(11) NOT NULL DEFAULT 0,
  `location` varchar(255) NOT NULL,
  `unitOfMeasure` varchar(50) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `status` enum('available','low-stock','out-of-stock','in-maintenance','discontinued','added') DEFAULT 'available',
  `notes` text DEFAULT NULL,
  `imageURL` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `next_maintenance_date` date DEFAULT NULL,
  `in_maintenance_quantity` int(11) DEFAULT 0,
  `last_action` enum('added','returned','checked-out','updated') DEFAULT 'added',
  `last_action_date` timestamp NULL DEFAULT NULL,
  `last_action_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_c33f32cdf6993fe3852073b0d5` (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES ('547e5436-22cb-4917-b0cf-001522fb471e','NVIDIA 2343244242444','334','44','Electronics',1,2,'In the office','boxes',0.00,0.00,'','low-stock','',NULL,'2026-01-06 10:07:40.220522','2026-01-07 15:03:03.000000','2026-01-07',1,'added','2026-01-05 18:07:40','Hadi'),('e11eaca6-9e72-45c8-ae8f-0b65ea594ab8','dvdvdsvsdvdsvsdvsd','dvsdvdsvsdv','','Office Supplies',5,0,'In the office','units',0.00,0.00,'','available','',NULL,'2026-01-07 14:56:14.167960','2026-01-07 14:56:14.167960',NULL,0,'added','2026-01-06 22:56:14','Hadi');
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoices` (
  `id` varchar(36) NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `project_code` varchar(100) NOT NULL,
  `project_name` varchar(500) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `invoice_date` datetime NOT NULL,
  `percentage_of_total` decimal(5,2) NOT NULL,
  `invoice_sequence` int(11) NOT NULL,
  `cumulative_percentage` decimal(5,2) NOT NULL,
  `remark` text DEFAULT NULL,
  `status` enum('draft','sent','paid','overdue') NOT NULL DEFAULT 'draft',
  `file_url` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `currency` varchar(3) NOT NULL DEFAULT 'MYR',
  `amount_myr` decimal(15,2) DEFAULT NULL,
  `exchange_rate` decimal(10,6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_d8f8d3788694e1b3f96c42c36fb` (`invoice_number`),
  KEY `IDX_invoices_project_code` (`project_code`),
  KEY `IDX_invoices_status` (`status`),
  KEY `IDX_invoices_invoice_date` (`invoice_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES ('fdfd7495-6178-47b0-9042-bfeaaa0bf618','MCE1548','J25000','Dummy',5000.00,'2026-01-07 00:00:00',100.00,1,100.00,'','draft',NULL,'2026-01-07 16:11:23','2026-01-07 16:11:23','MYR',NULL,NULL);
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `issued_pos`
--

DROP TABLE IF EXISTS `issued_pos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `issued_pos` (
  `id` varchar(36) NOT NULL,
  `po_number` varchar(100) NOT NULL,
  `items` text NOT NULL,
  `recipient` varchar(200) NOT NULL,
  `project_code` varchar(100) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `issue_date` datetime NOT NULL,
  `due_date` datetime DEFAULT NULL,
  `status` enum('issued','received','completed') NOT NULL DEFAULT 'issued',
  `file_url` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `currency` varchar(3) NOT NULL DEFAULT 'MYR',
  `amount_myr` decimal(15,2) DEFAULT NULL,
  `exchange_rate` decimal(10,6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_233acd3b08ef8c62ff1b4150765` (`po_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issued_pos`
--

LOCK TABLES `issued_pos` WRITE;
/*!40000 ALTER TABLE `issued_pos` DISABLE KEYS */;
INSERT INTO `issued_pos` VALUES ('1e90a684-607f-4202-ae5b-84415de3ecfd','PO_MCE23001','ANSYS Mechanical Premium 2 months Lease','CAD-IT','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('25174d14-d298-4db7-ac88-ed3836814896','PO_MCE23009','Monitran Vibration Sensor Recalibration - June 2023 - 7 units','Monitran Ltd','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('25b69f4e-092c-470d-ad0e-dd0803c396ce','PO_MCE24006','ESD Attire','Super Starnix','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('2cfc9d81-3a64-43d9-8f50-074bbeca42cf','PO_MCE25001','HP Z840 Refurblished Workstation','NTS Computers Sdn. Bhd.','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('39ce772a-bcd0-4788-99ac-b0598f30b26b','PO_MCE25003','TeamViewer Tensor 2025 - 1 year renewal with remaining credit deduction','TeamViewer Germany GmbH','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('3c4e9a5c-31d9-4548-865c-64350c085b3a','PO_MCE24009','Custom  Made Enclosure - Custom made tablet casing enclosure','GV INDUSTRIES SDN. BHD','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('3e66e561-7722-4d19-ac42-01fddaa87a39','PO_MCE24001','Monitran Vibration Sensor Recalibration - January 2024 - 6 units','Monitran Ltd','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('4ac3d772-b8d7-4e1b-bb26-c42cb31c3406','PO_MCE24005','Dytran 5803A Sledge Impulse Hammer','Test Measurement & Engineering Sdn Bhd','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('4dffa2ce-37db-48cb-879e-a3433887da82','PO_MCE23012','ANSYS Mechanical package TECS subscription renewal','CAD-IT','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('55aa98a3-368f-4211-86b6-c71bd8235c4c','PO_MCE23014','Wilcoxon Model SF3 Studs','Mutiara Jayateknik Engineering Sdn. Bhd.','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('6476fde3-4e4f-49de-ba0b-24602012bd97','PO_MCE24012','Monitran Vibration Sensor Recalibration - September 2024 - 8 units','Monitran Ltd','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('723d5d09-d4d6-455c-9ec8-731de6996195','PO_MCE24011','Microsoft 365 Business Standard Annual Subscription Addon for 3 pax','PenTech Solution Sdn Bhd (740957-T)','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('79501e39-f53f-4bf0-b0fd-3ddbee1e9c27','PO_MCE23010','J23030 Osram KUL2 IMS7F Auto Vibration & Magnetic Measurement','RF Station','J23030',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('7997220a-1d73-425b-8fc1-ac14fa373f24','PO_MCE24010','SolidWorks Standard and Flow Simulation Perpectual License Aug 2024','CADVision Systems','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('7d8cb872-45d1-48c7-945f-de8424ced979','PO_MCE24008','ANSYS Annual TECS Renewal and Software Upgrade','CAD-IT','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('7f8c65c8-3394-41ce-abdd-0e3782452ad4','PO_MCE24013','Custom  Made Enclosure - Custom made tablet casing enclosure (2nd prototype)','GV INDUSTRIES SDN. BHD','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('963705b2-155f-4f36-bf9e-1033e5f7257c','PO_MCE24015','GRAS Microphones and accessories (2 nos)','Test Measurement & Engineering Sdn Bhd','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('9657552e-1cd4-4a61-a006-f0dc86dfc8b9','PO_MCE24017','LabVIEW FULL DEVELOPMENT SYSTEM & NI SOUND AND VIBRATION TOOLKIT BASE','Kumpulan ABEX Sdn Bhd','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('98d6107e-1b03-4996-830d-4ec914be696c','PO_MCE23003','J22052_2 ams OSRAM KUL@ TEM FIB Rooms Acoustic Treatment ','ACOUSTRO CORPORATION SDN BHD ','J22052_2',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('9b8feced-2368-44d0-b9da-550c59d908d5','PO_MCE25006','ANSYS HPC - 2 Perpetual and 2 Annual Leased Licenses.','CAD-IT','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('9fd60385-8bdc-4d43-8f19-0dca1ed2eba6','PO_MCE23006','ANSYS Mechanical Premium 2 months Lease','CAD-IT','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('a3ce6db3-960d-4997-9700-81ee2655a0a6','PO_MCE24003','ANSYS CFD Premium 1 month Lease','CAD-IT','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('aa83b30d-0e76-4719-923f-76bfd25c9d79','PO_MCE23007','J22052_2 ams OSRAM KUL@ DSIMS room door Acoustic Treatment ','ACOUSTRO CORPORATION SDN BHD ','J22052_2',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('aade9fc7-6a35-4808-8072-82e88ba36054','PO_MCE25008','Nilfisk GM80P clean room vaccume w/ HEPA filters','Easton Equipment Sdn Bhd','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('ab13f949-b509-4c91-9fc7-582c78220d51','PO_MCE24016','S&V ANALYSIS LIBRARY DEPLOYMENT & LABVIEW APPLICATION BUILDER','Kumpulan ABEX Sdn Bhd','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('ac90e261-76e5-4462-a255-7adfa1e4cfa6','PO_MCE25004','NI cDAQ-9185 Repair S/N: 204D2C7','Kumpulan ABEX Sdn Bhd','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('aed55de4-fc21-4bed-9a3d-4904199a1dd9','PO_MCE23013','ANSYS Mechanical Premium 3 months Lease','CAD-IT','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('b88cac89-a661-4a7a-84f6-ad48b747be45','PO_MCE24002','Wilcoxon 731-207 sensors and studs','Mutiara Jayateknik Engineering Sdn. Bhd.','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('b952d49b-a265-4c9a-92f8-5cfbc90c9c8a','PO_MCE23004','Monitran Vibration Sensor Recalibration - April 2023 - 7 units','Monitran Ltd','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('baf141c8-4e21-4a3e-83a5-28b6e9498d9c','PO_MCE25005','J25029 NXP FA Lab Vibration Acoustic Magnetic Measurement','RF Station Sdn. Bhd.','J25029',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('c61a9fee-bdb0-4349-9a0f-db37d7669cba','PO_MCE23005','Sound Level Meter Recalibration','Absolute Instrument Sdn. Bhd.','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('c69d7799-87a9-450f-8e66-03fa6b6c7454','PO_MCE25002','Dytran Triaxial Accelerometer, Cables, Stud & Magnet','Test Measurement & Engineering Sdn Bhd','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('d5b434cc-9318-48c6-ae5d-11df798a006c','PO_MCE23015','ANSYS CFD Premium 2 months Lease and 4 Core HPC 1 Year Lease','CAD-IT','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('d810df5e-9073-4edf-9045-78a9ef883de0','PO_MCE24004','SolidWorks 3 Months Term License March 2024','CADVision Systems','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('de14f19b-367d-4eb3-9c3a-ebbb48bbb82e','PO_MCE24007','4 x cDAQ-9171+NI-9234 Bundle and 2 x cDAQ-9171','Kumpulan ABEX Sdn Bhd','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('e119ebc6-90e1-4fcf-908a-932ada670427','PO_MCE23008','Microsoft 365 Business Standard Annual Subscription for 8 pax','PenTech Solution Sdn Bhd (740957-T)','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('e7b79dab-928e-4414-b0c2-a2a87ecfe177','PO_MCE23011','Wilcoxon Sensors and Cables Purchase','Mutiara Jayateknik Engineering Sdn. Bhd.','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('e8d8ce20-3645-45e1-af1f-d27a6f20fe9e','PO_MCE24018','Sound Level Meter Recalibration','Absolute Instrument Sdn. Bhd.','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('e9636344-4c90-4e0b-8e39-ace0069f170a','PO_MCE23002','J22081 Vibration, Acoustic and EMF Measurement at ams OSRAM KUL2','RF Station','J22081',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('ed0461e1-3f6f-420e-926c-b71be49c4978','PO_MCE24014','ANSYS Mechanical Premium 2 months Lease','CAD-IT','',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000),('fb35a29a-f214-44e4-9d0b-4d2c69bf51e5','PO_MCE25007','J25057 TF AMD VC-C Pedastal Design and Supply_Polycool','LEAN HAP STEEL &CONSTRUCTION SDN NHD','J25057',0.00,'2025-11-14 03:08:29',NULL,'issued',NULL,'2025-11-14 11:08:29','2025-12-15 22:08:22','MYR',0.00,1.000000);
/*!40000 ALTER TABLE `issued_pos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_tickets`
--

DROP TABLE IF EXISTS `maintenance_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `maintenance_tickets` (
  `id` varchar(36) NOT NULL,
  `item_id` varchar(36) NOT NULL,
  `reported_by` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status` enum('open','in-progress','resolved','closed') NOT NULL DEFAULT 'open',
  `reported_date` datetime NOT NULL,
  `resolved_date` datetime DEFAULT NULL,
  `assigned_to` varchar(36) DEFAULT NULL,
  `resolution_notes` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `scheduled_maintenance_id` varchar(36) DEFAULT NULL,
  `inventory_action` enum('deduct','status-only','none') DEFAULT NULL,
  `quantity_deducted` int(11) DEFAULT 0,
  `inventory_restored` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `FK_e8fbd824b2716458cdf5a0f65b7` (`item_id`),
  KEY `FK_7767c461f000861afcc898418e9` (`reported_by`),
  KEY `FK_2c2c9aecc5dcca1261816420d9d` (`assigned_to`),
  CONSTRAINT `FK_2c2c9aecc5dcca1261816420d9d` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_7767c461f000861afcc898418e9` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_e8fbd824b2716458cdf5a0f65b7` FOREIGN KEY (`item_id`) REFERENCES `inventory` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,1730000000000,'CreateInitialSchema1730000000000'),(2,1730100000000,'AddProjectFields1730100000000'),(3,1730200000000,'CreatePurchaseOrdersTable1730200000000'),(4,1730300000000,'UpdateTimesheetRelations1730300000000'),(5,1730307600000,'AddWebsiteToClients1730307600000'),(6,1763021810008,'CreatePurchaseOrdersTable1763021810008'),(7,1730307900000,'ConvertRoleToRoles1730307900000'),(8,1730635200000,'MakeLeadEngineerOptional1730635200000'),(9,1763025000000,'CreateInvoicesTable1763025000000'),(10,1763025100000,'CreateIssuedPOsTable1763025100000'),(11,1763026000000,'AddIsFirstLoginToUsers1763026000000'),(12,1763026001000,'CreateTokenBlacklistTable1763026001000'),(13,1730000000001,'CreateProjectHourlyRatesTable1730000000001'),(14,1763030000000,'CreateResearchTimesheetsTable1763030000000'),(15,1734268000000,'AddMultiCurrencySupport1734268000000'),(16,1734300000000,'AddPORevisionSupport1734300000000'),(17,1734519600000,'MigrateAvatarsToPresets1734519600000'),(18,1734519600000,'MigrateAvatarsToPresets1734519600000'),(19,1734600000000,'ConvertRolesToArray1734600000000'),(20,1735200000000,'AddPerformanceIndexes1735200000000'),(21,1735700000000,'AddCompanySettings1735700000000'),(22,1735800000000,'AddScheduledMaintenance1735800000000'),(23,1736100000000,'AddPasswordResetFields1736100000000'),(24,1736200000000,'SplitClientsIntoCompaniesContacts1736200000000'),(25,1736250000000,'RemoveIsPrimaryFromContacts1736250000000');
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_hourly_rates`
--

DROP TABLE IF EXISTS `project_hourly_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_hourly_rates` (
  `id` varchar(36) NOT NULL,
  `projectId` varchar(36) NOT NULL,
  `teamMemberId` varchar(36) NOT NULL,
  `hourlyRate` decimal(10,2) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `projects` (
  `id` varchar(36) NOT NULL,
  `project_code` varchar(50) NOT NULL,
  `title` varchar(500) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `contact_id` varchar(36) DEFAULT NULL,
  `status` enum('pre-lim','ongoing','completed') NOT NULL DEFAULT 'pre-lim',
  `inquiry_date` datetime DEFAULT NULL,
  `po_received_date` datetime DEFAULT NULL,
  `po_file_url` varchar(500) DEFAULT NULL,
  `completion_date` datetime DEFAULT NULL,
  `invoiced_date` datetime DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `planned_hours` int(11) NOT NULL,
  `actual_hours` int(11) NOT NULL DEFAULT 0,
  `lead_engineer_id` varchar(36) DEFAULT NULL,
  `manager_id` varchar(36) NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`categories`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_11b19c7d40d07fc1a4e167995e` (`project_code`),
  KEY `IDX_projects_manager_id` (`manager_id`),
  KEY `IDX_projects_lead_engineer_id` (`lead_engineer_id`),
  KEY `idx_projects_contact_id` (`contact_id`),
  CONSTRAINT `FK_87bd52575ded2be008b89dd7b21` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_d6808738576f5be91ff768ef425` FOREIGN KEY (`lead_engineer_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES ('1a8f9d42-25fd-435e-a241-fcb46e11aea4','J25094','dfgdsbfdbdsbdfb','a6fc671a-22dc-4208-ab88-63b025b1d243','a6fc671a-22dc-4208-ab88-63b025b1d243','ongoing','2025-12-09 06:30:03','2025-12-09 00:00:00',NULL,NULL,NULL,'2025-12-09 06:30:03',0,5,'dcf6496b-f109-444a-b976-aed7f2b8028a','3a01293b-fcb2-4907-9974-44c0e70bc0b0','tygytggy','2025-12-09 14:30:03.701857','2026-01-06 21:56:53.000000','[\"Finite Element Analysis\"]'),('1a976b54-7eeb-4a34-a316-7a2a76ece980','J25020','equodndnksnd','a6fc671a-22dc-4208-ab88-63b025b1d243','a6fc671a-22dc-4208-ab88-63b025b1d243','pre-lim','2025-12-05 06:33:12',NULL,NULL,NULL,NULL,'2025-12-05 06:33:12',20,6,'dcf6496b-f109-444a-b976-aed7f2b8028a','c50bb89e-efdf-454a-8676-7ae6920e36c4',NULL,'2025-12-05 14:33:12.735829','2026-01-06 21:56:53.000000','[\"Finite Element Analysis\"]'),('2044b522-08d2-43e4-97b1-87786155fb2c','J25006','testing phase','a6fc671a-22dc-4208-ab88-63b025b1d243','a6fc671a-22dc-4208-ab88-63b025b1d243','ongoing','2025-11-20 06:51:08','2025-11-20 00:00:00',NULL,NULL,NULL,'2025-11-20 06:51:08',100,0,'a794677b-b105-4a87-8f53-e53c85820c60','9823b105-8a76-4368-accb-cd72cfa1aad2',NULL,'2025-11-20 14:51:08.770219','2026-01-06 21:56:53.000000','[\"Acoustics\"]'),('4cff6dd2-96b8-4c03-97d9-2533460b36a8','J26001','ecdscsdcsdcsdcsdc','b7ef4324-a8db-4be0-9ecf-254961cb0486',NULL,'pre-lim','2026-01-07 02:44:09',NULL,NULL,NULL,NULL,'2026-01-07 02:44:09',0,0,'3a01293b-fcb2-4907-9974-44c0e70bc0b0','dcf6496b-f109-444a-b976-aed7f2b8028a',NULL,'2026-01-07 10:44:09.206942','2026-01-07 10:44:09.206942','[]'),('6964bb98-acda-442a-83b9-d4ff706318ed','J25004','sascascascacacs','277f558f-10d5-4cc4-b1dc-206a0eb73b1b','277f558f-10d5-4cc4-b1dc-206a0eb73b1b','completed',NULL,NULL,NULL,NULL,NULL,'2025-11-18 16:00:00',80,10,'dcf6496b-f109-444a-b976-aed7f2b8028a','c50bb89e-efdf-454a-8676-7ae6920e36c4',NULL,'2025-11-08 20:11:38.432886','2026-01-06 21:56:53.000000','[\"Computational Fluid Dynamics\",\"Vibration\"]'),('7bf08d97-c058-4e26-b743-c8091f5697d5','J25000','Dummy','a6fc671a-22dc-4208-ab88-63b025b1d243','a6fc671a-22dc-4208-ab88-63b025b1d243','completed','2025-12-19 07:39:12','2025-12-19 00:00:00',NULL,NULL,NULL,'2025-12-19 07:39:12',120,7,'dcf6496b-f109-444a-b976-aed7f2b8028a','dcf6496b-f109-444a-b976-aed7f2b8028a','Testing','2025-12-19 15:39:12.646119','2026-01-07 16:11:23.000000','[\"Finite Element Analysis\"]'),('e83bf9a5-ef85-4491-8d56-9c18a3acdb37','J25008','sdfsdfsdf','a6fc671a-22dc-4208-ab88-63b025b1d243','a6fc671a-22dc-4208-ab88-63b025b1d243','pre-lim','2025-12-09 06:29:22',NULL,NULL,NULL,NULL,'2025-12-09 06:29:22',100,0,'dcf6496b-f109-444a-b976-aed7f2b8028a','c50bb89e-efdf-454a-8676-7ae6920e36c4',NULL,'2025-12-09 14:29:22.618445','2026-01-06 21:56:53.000000','[\"Computational Fluid Dynamics\"]'),('eb546fc2-a55d-4e24-bb11-7731135c2649','J25092','Vibration Equtonnsda','277f558f-10d5-4cc4-b1dc-206a0eb73b1b','277f558f-10d5-4cc4-b1dc-206a0eb73b1b','pre-lim','2025-11-12 06:31:09',NULL,NULL,NULL,NULL,'2025-11-12 06:31:09',11,27,'a794677b-b105-4a87-8f53-e53c85820c60','c50bb89e-efdf-454a-8676-7ae6920e36c4',NULL,'2025-11-12 14:31:09.929727','2026-01-06 21:56:53.000000','[\"Computational Fluid Dynamics\",\"Vibration\"]');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_orders` (
  `id` varchar(36) NOT NULL,
  `po_number` varchar(100) NOT NULL,
  `project_code` varchar(50) NOT NULL,
  `client_name` varchar(500) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `received_date` datetime NOT NULL,
  `due_date` datetime DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('received','in-progress','invoiced','paid') NOT NULL DEFAULT 'received',
  `file_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `currency` varchar(3) NOT NULL DEFAULT 'MYR',
  `amount_myr` decimal(15,2) DEFAULT NULL,
  `exchange_rate` decimal(10,6) DEFAULT NULL,
  `revision_number` int(11) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `superseded_by` varchar(36) DEFAULT NULL,
  `supersedes` varchar(36) DEFAULT NULL,
  `revision_date` datetime NOT NULL DEFAULT current_timestamp(),
  `revision_reason` text DEFAULT NULL,
  `amount_myr_adjusted` decimal(15,2) DEFAULT NULL,
  `adjustment_reason` text DEFAULT NULL,
  `adjusted_by` varchar(36) DEFAULT NULL,
  `adjusted_at` datetime DEFAULT NULL,
  `po_number_base` varchar(100) NOT NULL DEFAULT '',
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
  KEY `IDX_purchase_orders_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES ('02fbc8dc-c22c-4f7d-aff7-27a2a7f3d783','PO-50-0','J25000','Boldgate',2.00,'2025-12-19 00:00:00','2025-12-31 00:00:00','Testing','received',NULL,'2025-12-19 15:40:16','2025-12-19 15:40:16','MYR',2.00,1.000000,1,1,NULL,NULL,'2025-12-19 07:40:16',NULL,NULL,NULL,NULL,NULL,'PO-50-0'),('1e2f6598-fa06-461c-aa49-a655ae8f98fd','po3746832','J25094','Boldgate',5000.00,'2025-12-09 00:00:00',NULL,NULL,'received',NULL,'2025-12-09 15:08:15','2025-12-16 17:04:24','MYR',5000.00,1.000000,1,1,NULL,NULL,'2025-12-09 15:08:15',NULL,NULL,NULL,NULL,NULL,'po3746832'),('3c74fb60-60ed-4774-8ac6-a94356fdaf06','15151616','J25006','Infineone',5000.00,'2025-11-20 00:00:00',NULL,NULL,'received',NULL,'2025-11-20 14:53:13','2025-12-16 17:04:24','MYR',5000.00,1.000000,1,1,NULL,NULL,'2025-11-20 14:53:13',NULL,NULL,NULL,NULL,NULL,'15151616');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `research_projects`
--

DROP TABLE IF EXISTS `research_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `research_projects` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `research_code` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `lead_researcher_id` varchar(36) DEFAULT NULL,
  `status` enum('planning','in-progress','on-hold','completed','archived') NOT NULL DEFAULT 'planning',
  `start_date` datetime DEFAULT NULL,
  `planned_end_date` datetime DEFAULT NULL,
  `actual_end_date` datetime DEFAULT NULL,
  `budget` varchar(255) DEFAULT NULL,
  `funding_source` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `objectives` text DEFAULT NULL,
  `methodology` text DEFAULT NULL,
  `findings` text DEFAULT NULL,
  `publications` text DEFAULT NULL,
  `team_members` text DEFAULT NULL,
  `collaborators` text DEFAULT NULL,
  `equipment_used` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_334ec21bad136a1eb94a4e80b5` (`research_code`),
  KEY `FK_d9d4a53a57f65a1db73049c24bf` (`lead_researcher_id`),
  CONSTRAINT `FK_d9d4a53a57f65a1db73049c24bf` FOREIGN KEY (`lead_researcher_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `research_projects`
--

LOCK TABLES `research_projects` WRITE;
/*!40000 ALTER TABLE `research_projects` DISABLE KEYS */;
INSERT INTO `research_projects` VALUES ('7c30f9d0-9d5d-4d9c-9f05-0b9f8a1b340d','tbfgbfbgf','R25001','bfgbfbgfbf','dcf6496b-f109-444a-b976-aed7f2b8028a','planning','2025-12-08 00:00:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-08 09:22:27.594744','2025-12-31 15:56:09.578836'),('d69e5f17-104f-4272-9868-a00f9e47ffaa','bgbfgbfgb','R25002','fgbfgbfgb','dcf6496b-f109-444a-b976-aed7f2b8028a','planning','2025-12-08 00:00:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-08 10:56:14.967072','2025-12-31 15:56:09.583121');
/*!40000 ALTER TABLE `research_projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `research_timesheets`
--

DROP TABLE IF EXISTS `research_timesheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `research_timesheets` (
  `id` varchar(36) NOT NULL,
  `research_project_id` varchar(36) NOT NULL,
  `engineer_id` varchar(36) NOT NULL,
  `date` datetime NOT NULL,
  `hours` decimal(10,2) NOT NULL,
  `research_category` varchar(100) DEFAULT NULL COMMENT 'CFD, FEA, Vibration Analysis, Acoustics, Testing, Data Analysis, Documentation, Other',
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
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
INSERT INTO `research_timesheets` VALUES ('228e3e56-ec23-42ac-9213-3f0e79a91196','d69e5f17-104f-4272-9868-a00f9e47ffaa','20440c7f-028a-4014-88f9-69c34bfbf195','2025-12-30 00:00:00',5.00,'General',NULL,'2025-12-30 16:16:47','2025-12-30 16:16:47'),('3236d3c4-e9e4-4b07-a0e9-389d77d20e30','7c30f9d0-9d5d-4d9c-9f05-0b9f8a1b340d','dcf6496b-f109-444a-b976-aed7f2b8028a','2025-12-18 00:00:00',2.00,'General',NULL,'2025-12-18 18:01:13','2025-12-18 18:01:13'),('3e0f46e2-2660-4016-8da5-1112e618e7ad','d69e5f17-104f-4272-9868-a00f9e47ffaa','dcf6496b-f109-444a-b976-aed7f2b8028a','2025-12-18 00:00:00',5.00,'General',NULL,'2025-12-18 18:01:28','2025-12-18 18:01:28');
/*!40000 ALTER TABLE `research_timesheets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scheduled_maintenance`
--

DROP TABLE IF EXISTS `scheduled_maintenance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `scheduled_maintenance` (
  `id` varchar(36) NOT NULL,
  `item_id` varchar(36) NOT NULL,
  `maintenance_type` enum('calibration','inspection','servicing','replacement','other') DEFAULT 'other',
  `description` text DEFAULT NULL,
  `scheduled_date` date NOT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `completed_date` date DEFAULT NULL,
  `completed_by` varchar(36) DEFAULT NULL,
  `ticket_id` varchar(36) DEFAULT NULL,
  `reminder_14_sent` tinyint(1) DEFAULT 0,
  `reminder_7_sent` tinyint(1) DEFAULT 0,
  `reminder_1_sent` tinyint(1) DEFAULT 0,
  `inventory_action` enum('deduct','status-only','none') DEFAULT 'none',
  `quantity_affected` int(11) DEFAULT 1,
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
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
INSERT INTO `scheduled_maintenance` VALUES ('73decdb9-3602-4034-a785-095b0e9beb8a','547e5436-22cb-4917-b0cf-001522fb471e','calibration',NULL,'2026-01-07',1,'2026-01-07','dcf6496b-f109-444a-b976-aed7f2b8028a','2040613b-e8ff-4f90-907f-1ce93dd92b66',0,0,0,'status-only',1,'dcf6496b-f109-444a-b976-aed7f2b8028a','2026-01-06 07:15:35','2026-01-07 05:56:36');
/*!40000 ALTER TABLE `scheduled_maintenance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_members`
--

DROP TABLE IF EXISTS `team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_members` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `employee_id` varchar(100) DEFAULT NULL,
  `job_title` varchar(255) DEFAULT NULL,
  `employment_type` enum('full-time','part-time','contract','intern') NOT NULL DEFAULT 'full-time',
  `department` varchar(100) DEFAULT NULL,
  `manager_id` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `office_location` varchar(255) DEFAULT NULL,
  `hire_date` datetime DEFAULT NULL,
  `termination_date` datetime DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `certifications` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `REL_c2bf4967c8c2a6b845dadfbf3d` (`user_id`),
  KEY `IDX_team_members_user_id` (`user_id`),
  CONSTRAINT `FK_c2bf4967c8c2a6b845dadfbf3d4` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_members`
--

LOCK TABLES `team_members` WRITE;
/*!40000 ALTER TABLE `team_members` DISABLE KEYS */;
INSERT INTO `team_members` VALUES ('046dd102-ebfd-435d-9d92-debfceee660e','71ff672c-be77-4748-ae3e-bd6a9b05836c',NULL,'Project Manager','full-time','Management',NULL,NULL,NULL,NULL,NULL,'inactive',NULL,NULL,NULL,NULL,'2025-11-17 10:43:10.605685','2025-11-26 16:41:01.000000'),('189da95c-2b58-4376-8c46-7c6673aed7c5','65f53b3d-9c4a-4d9d-877c-50a53dd12690',NULL,NULL,'full-time','engineering',NULL,'sadd',NULL,NULL,NULL,'inactive',NULL,NULL,NULL,NULL,'2025-10-31 16:36:14.425280','2025-11-08 11:25:23.000000'),('2c2ce0e6-13d6-4719-a706-026e7eb20f59','4b8b7611-f57d-4399-8b45-cbcbafccbcf9',NULL,'Engineer','full-time','Engineering',NULL,NULL,NULL,NULL,NULL,'inactive',NULL,NULL,NULL,NULL,'2025-11-17 10:43:10.583410','2025-11-26 16:41:14.000000'),('325c5a3c-f0ae-40f3-af1a-f58422c9a4ec','21f46957-77d7-48f5-91d3-5ef42c9f0ee7',NULL,NULL,'full-time','project-management',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-12-19 15:10:40.043335','2025-12-19 15:10:40.043335'),('3c6392ad-e205-490b-88fa-58ca3699e60a','70f7c4fe-53e0-49b2-9a69-f7145b7a1f27',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'inactive',NULL,NULL,NULL,NULL,'2025-12-19 11:27:51.103088','2025-12-19 15:08:27.000000'),('57ec152f-c750-4ad8-a8a9-f64f4adb95b1','ced65f6e-1dd8-4a68-a593-a5203b7d1950',NULL,'Principal Engineer','full-time','Engineering',NULL,NULL,NULL,NULL,NULL,'inactive',NULL,NULL,NULL,NULL,'2025-11-17 10:43:10.598376','2025-11-26 16:41:10.000000'),('589d701c-caca-45c4-937c-88154474f470','2a742dec-f7c1-49a8-bc39-64df4791946e',NULL,'Senior Engineer','full-time','Engineering',NULL,NULL,NULL,NULL,NULL,'inactive',NULL,NULL,NULL,NULL,'2025-11-17 10:43:10.593329','2025-11-26 16:41:04.000000'),('61f32816-8c5c-4678-9600-07d9ee980516','c50bb89e-efdf-454a-8676-7ae6920e36c4',NULL,NULL,'full-time','engineering',NULL,'0184522546',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 17:41:50.909775','2025-12-19 15:05:40.000000'),('6d006b5e-5a5a-431c-b1fd-a8a325677d7e','3a01293b-fcb2-4907-9974-44c0e70bc0b0',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 19:00:41.549587','2025-12-19 15:06:01.000000'),('98d60165-f33c-4f0b-b541-196e7ddfc221','c38a6397-0cc6-4a78-b499-8d7d40e104a2',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 19:02:26.479276','2025-12-19 15:06:26.000000'),('9d322a42-40ba-45b6-925a-7a36294f6d08','83a0ed9a-5c43-468e-bb1b-6e7f2457e4f3',NULL,NULL,'full-time','project-management',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 19:13:37.649327','2025-12-19 15:06:21.000000'),('9e2363b3-0d59-4426-b056-85d5bc63c357','4edd4581-3c9b-480c-8d4b-85b712a154db',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-12-19 11:28:29.648409','2025-12-19 11:28:29.648409'),('acae272c-0e30-445a-b24f-cd9abd23c54b','9823b105-8a76-4368-accb-cd72cfa1aad2',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 19:01:23.767028','2025-12-19 15:05:44.000000'),('aee98196-2d5e-4e08-b0aa-df1ea9b596e2','a794677b-b105-4a87-8f53-e53c85820c60',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 19:02:02.978774','2025-12-19 15:05:58.000000'),('b272f4a0-f2e9-4e96-9567-1776ba5116ff','8400f925-e34f-4c31-ac9e-6cc6efd27067',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-12-19 11:22:19.774118','2025-12-19 11:22:19.774118'),('bcb65a20-ac9f-40fa-acc0-f1232bc5b8f3','6afc8fb3-e613-4ee2-a72e-50221fc69ffe',NULL,NULL,'full-time','engineering',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-12-19 15:06:55.870477','2025-12-19 15:06:55.870477'),('d35e28a0-d8d3-4168-8bf4-fbb5ded8b5bb','e31f2901-9223-4922-9dcb-fb962518d4f7',NULL,NULL,'full-time','project-management',NULL,'',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-12-19 15:07:25.839123','2025-12-19 15:07:25.839123'),('ee5fd7c7-7723-4c38-932e-3249c26d8f9b','dcf6496b-f109-444a-b976-aed7f2b8028a',NULL,NULL,'full-time','engineering',NULL,'0195805495',NULL,NULL,NULL,'active',NULL,NULL,NULL,NULL,'2025-11-08 17:36:18.033350','2025-11-08 17:36:18.033350');
/*!40000 ALTER TABLE `team_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timesheets`
--

DROP TABLE IF EXISTS `timesheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `timesheets` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `engineer_id` varchar(36) NOT NULL,
  `date` datetime NOT NULL,
  `hours` decimal(10,2) NOT NULL,
  `work_category` enum('engineering','project-management','measurement-site','measurement-office') NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_timesheets_project_id` (`project_id`),
  KEY `IDX_timesheets_engineer_id` (`engineer_id`),
  KEY `IDX_timesheets_date` (`date`),
  CONSTRAINT `FK_c792244262bc8e098bd80d34cd5` FOREIGN KEY (`engineer_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_e890b44a3b88da8046e3fb43c03` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timesheets`
--

LOCK TABLES `timesheets` WRITE;
/*!40000 ALTER TABLE `timesheets` DISABLE KEYS */;
INSERT INTO `timesheets` VALUES ('0d85d98c-c743-4fbf-a40f-bff16274eb86','eb546fc2-a55d-4e24-bb11-7731135c2649','dcf6496b-f109-444a-b976-aed7f2b8028a','2025-12-12 16:00:00',20.00,'engineering','jbhbjb','2025-12-13 23:58:32.227506','2025-12-13 23:58:32.227506'),('49de9eb1-ea6a-4d85-92ca-d6b8bd8b16af','eb546fc2-a55d-4e24-bb11-7731135c2649','c38a6397-0cc6-4a78-b499-8d7d40e104a2','2025-11-25 16:00:00',5.00,'engineering','','2025-11-26 17:05:13.558396','2025-11-26 17:05:13.558396'),('91b0a7c7-704b-4e65-a2d2-7a7feb581e5c','1a976b54-7eeb-4a34-a316-7a2a76ece980','6afc8fb3-e613-4ee2-a72e-50221fc69ffe','2025-12-18 16:00:00',4.00,'engineering','','2025-12-19 15:42:40.935438','2025-12-19 15:42:40.935438'),('b124fbfd-a8f9-4813-a747-93f8a9fde18f','7bf08d97-c058-4e26-b743-c8091f5697d5','6afc8fb3-e613-4ee2-a72e-50221fc69ffe','2025-11-04 16:00:00',5.00,'measurement-site','','2025-12-19 15:44:14.177153','2025-12-19 15:44:14.177153'),('b52679ce-621e-4792-b0e2-0f8f99c96f2c','7bf08d97-c058-4e26-b743-c8091f5697d5','6afc8fb3-e613-4ee2-a72e-50221fc69ffe','2025-12-18 16:00:00',2.00,'project-management','','2025-12-19 15:43:14.218659','2025-12-19 15:43:14.218659'),('b9d2d4a8-2d26-4552-a2b1-2f6d1b8327b6','1a976b54-7eeb-4a34-a316-7a2a76ece980','dcf6496b-f109-444a-b976-aed7f2b8028a','2025-12-11 16:00:00',2.00,'engineering','bvhvgh','2025-12-12 17:24:02.508960','2025-12-12 17:24:02.508960'),('c66f8222-e16c-482b-a675-57d8e669f982','1a8f9d42-25fd-435e-a241-fcb46e11aea4','dcf6496b-f109-444a-b976-aed7f2b8028a','2025-12-11 16:00:00',5.00,'engineering','njnkn','2025-12-12 17:24:18.663573','2025-12-12 17:24:18.663573'),('cc6eb503-f5a8-417a-a5d1-b90bd4ca1b39','6964bb98-acda-442a-83b9-d4ff706318ed','dcf6496b-f109-444a-b976-aed7f2b8028a','2025-11-12 16:00:00',10.00,'engineering','testing today\n','2025-11-13 09:41:16.462721','2025-11-13 09:41:16.462721'),('d058b3fb-9c3b-4e65-8af5-4bc7fae79520','eb546fc2-a55d-4e24-bb11-7731135c2649','dcf6496b-f109-444a-b976-aed7f2b8028a','2025-12-15 16:00:00',2.00,'project-management','','2025-12-17 07:33:56.715777','2025-12-17 07:33:56.715777');
/*!40000 ALTER TABLE `timesheets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_blacklist`
--

DROP TABLE IF EXISTS `token_blacklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `token_blacklist` (
  `id` varchar(36) NOT NULL,
  `token_hash` varchar(500) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `revoked_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
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
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `roles` varchar(255) NOT NULL DEFAULT 'engineer',
  `is_first_login` tinyint(1) NOT NULL DEFAULT 1,
  `reset_token` varchar(255) DEFAULT NULL,
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
INSERT INTO `users` VALUES ('20440c7f-028a-4014-88f9-69c34bfbf195','Admin User','admin@mycae.com','$2a$10$MNDPKl9dClliuc/AlpGry.QtqiKpY1kNZFaLa6PlPR/bt3/mEUUpe','Administration','System Administrator','male-07','2025-10-31 16:12:32.908276','2025-12-30 15:56:57.126979','[\"admin\"]',1,NULL,NULL),('21f46957-77d7-48f5-91d3-5ef42c9f0ee7','Mian Joo','mianjoo@mycae.com.my','$2a$10$oMWREubqhlSoAvL/1eZ/cexGgk6XjKYRqiVhR2L8A50YupOfWlwTC',NULL,NULL,'male-01','2025-12-19 15:10:40.036561','2025-12-19 15:10:54.000000','[\"managing-director\"]',1,NULL,NULL),('2a742dec-f7c1-49a8-bc39-64df4791946e','Sarah Senior','sarah@mycae.com','$2a$10$Hqq1vSUDERJ9FiYjmlrf0uBXb80Ibjs94Yw8bRTNdZuQJlc2N6azK','Engineering','Senior Engineer','male-03','2025-11-17 10:43:10.560465','2025-12-19 10:41:56.031203','[\"engineer\"]',1,NULL,NULL),('3a01293b-fcb2-4907-9974-44c0e70bc0b0','Kah Xin','kxkhoo@mycae.com.my','$2a$10$Qg2cbnFEWUoppGo22TmTNetLtrCpE7R2k2H44dG9HHrcoipa416GK',NULL,NULL,'male-01','2025-11-08 19:00:41.543395','2025-12-19 11:19:07.000000','[\"senior-engineer\",\"managing-director\"]',1,NULL,NULL),('4b8b7611-f57d-4399-8b45-cbcbafccbcf9','John Engineer','john@mycae.com','$2a$10$Cg1l2r.SH1dIWo5LigqyWu2/cSojWHtKNgjBI3y9LwRH4qfxYJEgO','Engineering','Engineer','male-08','2025-11-17 10:43:10.550372','2025-12-19 10:41:56.032970','[\"engineer\"]',1,NULL,NULL),('4edd4581-3c9b-480c-8d4b-85b712a154db','Soon Sen Yao','senyao@mycae.com.my','$2a$10$f02haIxAPKyhtDCzAFQFAOKbTARzlk0aWhobBQdAc/X1Ji8.iYBra',NULL,NULL,NULL,'2025-12-19 11:28:29.641768','2025-12-19 11:28:29.641768','engineer',1,NULL,NULL),('5b755a45-c03d-11f0-a2eb-5405dbeb19c6','Test User','test@mycae.com','a0/2A6','Engineering','Test Engineer','male-01','2025-11-13 11:03:40.000000','2025-12-19 10:41:56.033958','[\"engineer\"]',0,NULL,NULL),('65f53b3d-9c4a-4d9d-877c-50a53dd12690','Haziq','haziq@mycae.com','$2a$10$68r40bButZWQLjkeN0cKp.pXSI9bDEju09zP/ers.KffyMb3hcGcO',NULL,NULL,'male-03','2025-10-31 16:36:14.415374','2025-12-19 10:41:56.035344','[\"senior-engineer\"]',1,NULL,NULL),('6afc8fb3-e613-4ee2-a72e-50221fc69ffe','Aqil','maqilazad@mycae.com.my','$2a$10$m9BrJnzahGztiBSDHaSUb.r8GUwZuSAf1lAOdfeB7MzCtVUwkpwq.',NULL,NULL,'male-01','2025-12-19 15:06:55.860210','2025-12-19 15:37:17.000000','[\"managing-director\",\"engineer\"]',1,NULL,NULL),('70f7c4fe-53e0-49b2-9a69-f7145b7a1f27','Hafiz Naaim','naaimhafiz1@mycae.com.my','$2a$10$gebpQe10e.CXOo8ACkT45ebC67XHiE1jn5NbSwh7Bf75ljRhV8eAC',NULL,NULL,'male-01','2025-12-19 11:27:51.086534','2025-12-19 11:27:59.000000','[\"engineer\",\"manager\"]',1,NULL,NULL),('71ff672c-be77-4748-ae3e-bd6a9b05836c','Lisa Manager','lisa@mycae.com','$2a$10$qwAphF7UPPoIrT15UlPFTuldTxfCKLGSj3LrvyNl0HF46INpdLNZC','Management','Project Manager','male-06','2025-11-17 10:43:10.574820','2025-12-19 10:41:56.035882','[\"engineer\"]',1,NULL,NULL),('83a0ed9a-5c43-468e-bb1b-6e7f2457e4f3','Lee','wllee@mycae.com.my','$2a$10$MVyeB4ZBx8sW.Uc3VQSRruOI.s3xHBwxgWP9Tq.HlHzhcGppI9nOy',NULL,NULL,'male-01','2025-11-08 19:13:37.643563','2025-12-19 15:08:01.000000','[\"manager\"]',1,NULL,NULL),('8400f925-e34f-4c31-ac9e-6cc6efd27067','Mohd Haziq','haziqbakar@mycae.com.my','$2a$10$yEdsdDBbQNw6m5hEwFCu8.ovBtm50Jf/vKs8FGPR7Xxpy9qubpxhS',NULL,NULL,'male-01','2025-12-19 11:22:19.762996','2025-12-19 12:23:24.000000','[\"manager\",\"senior-engineer\"]',1,NULL,NULL),('9823b105-8a76-4368-accb-cd72cfa1aad2','Hafiz','naaimhafiz@mycae.com.my','$2a$10$D/nAAamYcSlonIedegvSU.uYIzT/8bsLmItpDou/072pfycHawI4e',NULL,NULL,'male-01','2025-11-08 19:01:23.763644','2025-12-19 15:13:39.000000','[\"senior-engineer\",\"manager\"]',1,NULL,NULL),('a794677b-b105-4a87-8f53-e53c85820c60','Shahul','shahulhameed@mycae.com.my','$2a$10$8XpjPZbJNuizo6coJKHBseh2CCbq.Y/7nlnvWGGjaJ9ftwrre8dl2',NULL,NULL,'male-01','2025-11-08 19:02:02.974672','2025-12-19 15:07:45.000000','[\"engineer\"]',1,NULL,NULL),('bffca181-c03d-11f0-a2eb-5405dbeb19c6','Test FirstTime','firsttime@mycae.com','$2a$10$.aXpFPhsOCec3s2hvHNLoOcmfjhooUmTt2WFckbw9b7aDeQK4cBWu','Engineering','Test Engineer','female-01','2025-11-13 11:06:29.000000','2025-12-19 10:41:56.038360','[\"engineer\"]',1,NULL,NULL),('c38a6397-0cc6-4a78-b499-8d7d40e104a2','Ir Tang Kok Cheong (KC)','kctang@mycae.com.my','$2a$10$whRuD.fB3ack.TldJ30EI.ljs.fCYUxmRpuyfNi8wqj/XsaRcJ.Z.',NULL,NULL,'male-01','2025-11-08 19:02:26.473467','2025-12-19 15:09:18.000000','[\"managing-director\"]',1,NULL,NULL),('c50bb89e-efdf-454a-8676-7ae6920e36c4','Ir Harrivin','Harrivin@mycae.com.my','$2a$10$3ApBxlvf/yYt5ZyN8Y8TGO1.K9HnYVs11tSA0MKJjwph/6Agyho3W',NULL,NULL,'male-01','2025-11-08 17:41:50.905994','2025-12-19 15:09:25.000000','[\"principal-engineer\"]',1,NULL,NULL),('ced65f6e-1dd8-4a68-a593-a5203b7d1950','Mike Principal','mike@mycae.com','$2a$10$t5KS2dt/ACIjNxSOS8kdLeSM5i6DxSMYKhQy4Hw.bIOjem9.BGmVu','Engineering','Principal Engineer','female-07','2025-11-17 10:43:10.567041','2025-12-19 10:41:56.039800','[\"engineer\"]',1,NULL,NULL),('dcf6496b-f109-444a-b976-aed7f2b8028a','Hadi','hadi@mycae.com.my','$2a$10$gbHnMAW5Bn3vdQMfv9CTTe/EfoWn3X6ccWS12JRr7V6mFyvuMuOhu',NULL,NULL,'male-03','2025-11-08 17:36:18.029086','2026-01-05 16:01:30.968491','[\"senior-engineer\"]',0,NULL,NULL),('e31f2901-9223-4922-9dcb-fb962518d4f7','Nik Haziq','nikhaziq@mycae.com.my','$2a$10$jcHjYWCk6unkYVJa72qW0.0Ac/AIJYuFNBtVpSnisCMI9OBx7GEKu',NULL,NULL,NULL,'2025-12-19 15:07:25.831404','2025-12-19 15:07:25.831404','engineer',1,NULL,NULL);
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

-- Dump completed on 2026-01-07 16:14:12
