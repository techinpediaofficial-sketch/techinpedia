-- =======================================================
-- TECHINPEDIA BUSINESS OS — PHASE E: RAZORPAY MIGRATION
-- Safe, idempotent, zero-downtime additive DDL statements
-- =======================================================

-- 1. Create PaymentLink table first
CREATE TABLE IF NOT EXISTS `PaymentLink` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `providerLinkId` VARCHAR(191) NOT NULL,
  `providerOrderId` VARCHAR(191) NULL,
  `shortUrl` VARCHAR(500) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
  `purpose` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'CREATED',
  `createdByUserId` VARCHAR(191) NOT NULL,
  `salesEmployeeId` VARCHAR(191) NULL,
  `departmentId` VARCHAR(191) NULL,
  `teamId` VARCHAR(191) NULL,
  `customerId` VARCHAR(191) NULL,
  `enquiryId` VARCHAR(191) NULL,
  `dealId` VARCHAR(191) NULL,
  `invoiceId` VARCHAR(191) NULL,
  `projectRecordId` VARCHAR(191) NULL,
  `clientName` VARCHAR(191) NULL,
  `clientEmail` VARCHAR(191) NULL,
  `clientPhone` VARCHAR(191) NULL,
  `expiresAt` DATETIME(3) NULL,
  `cancelledAt` DATETIME(3) NULL,
  `paidAt` DATETIME(3) NULL,
  `providerResponse` LONGTEXT NULL,
  `internalNotes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `PaymentLink_providerLinkId_key` (`providerLinkId`),
  INDEX `PaymentLink_status_idx` (`status`),
  INDEX `PaymentLink_salesEmployeeId_idx` (`salesEmployeeId`),
  INDEX `PaymentLink_departmentId_idx` (`departmentId`),
  INDEX `PaymentLink_teamId_idx` (`teamId`),
  INDEX `PaymentLink_customerId_idx` (`customerId`),
  INDEX `PaymentLink_dealId_idx` (`dealId`),
  INDEX `PaymentLink_invoiceId_idx` (`invoiceId`),
  INDEX `PaymentLink_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create PaymentWebhookEvent table
CREATE TABLE IF NOT EXISTS `PaymentWebhookEvent` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `eventId` VARCHAR(191) NOT NULL,
  `eventType` VARCHAR(191) NOT NULL,
  `signature` VARCHAR(500) NULL,
  `payloadJson` LONGTEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `errorMessage` TEXT NULL,
  `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `processedAt` DATETIME(3) NULL,
  UNIQUE KEY `PaymentWebhookEvent_eventId_key` (`eventId`),
  INDEX `PaymentWebhookEvent_eventId_idx` (`eventId`),
  INDEX `PaymentWebhookEvent_status_idx` (`status`),
  INDEX `PaymentWebhookEvent_eventType_idx` (`eventType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add additive columns to Payment table safely
SET @dbname = DATABASE();
SET @tablename = "Payment";

-- Column: paymentLinkId
SET @colname = "paymentLinkId";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @colname, "` VARCHAR(191) NULL;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Column: currency
SET @colname = "currency";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @colname, "` VARCHAR(191) NOT NULL DEFAULT 'INR';")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Column: provider
SET @colname = "provider";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @colname, "` VARCHAR(191) NOT NULL DEFAULT 'OFFLINE_MANUAL';")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Column: providerPaymentId
SET @colname = "providerPaymentId";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @colname, "` VARCHAR(191) NULL UNIQUE;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Column: salesEmployeeId
SET @colname = "salesEmployeeId";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @colname, "` VARCHAR(191) NULL;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Column: status
SET @colname = "status";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @colname, "` VARCHAR(191) NOT NULL DEFAULT 'SUCCESS';")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Column: rawWebhookPayload
SET @colname = "rawWebhookPayload";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @colname, "` LONGTEXT NULL;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
