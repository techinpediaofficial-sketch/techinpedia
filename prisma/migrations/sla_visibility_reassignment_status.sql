-- Migration: SLA, Visibility, Reassignment, Employee Status, First View/Response tracking
-- Run this on production AFTER backing up the database

-- Add firstViewedAt and firstResponseAt to Enquiry
ALTER TABLE `Enquiry` 
  ADD COLUMN IF NOT EXISTS `firstViewedAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `firstResponseAt` DATETIME(3) NULL;

-- Add firstViewedAt and firstResponseAt to WhatsappConversation
ALTER TABLE `WhatsappConversation`
  ADD COLUMN IF NOT EXISTS `firstViewedAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `firstResponseAt` DATETIME(3) NULL;

-- SlaRule table
CREATE TABLE IF NOT EXISTS `SlaRule` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `companyId` VARCHAR(64) NULL,
  `entityType` VARCHAR(32) NOT NULL,
  `actionType` VARCHAR(64) NOT NULL,
  `priority` VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
  `warningMinutes` INT NOT NULL DEFAULT 8,
  `breachMinutes` INT NOT NULL DEFAULT 10,
  `escalationActions` TEXT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SlaRule_companyId_entityType_actionType_priority_key` (`companyId`, `entityType`, `actionType`, `priority`),
  KEY `SlaRule_companyId_idx` (`companyId`),
  CONSTRAINT `SlaRule_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ResourceVisibility table
CREATE TABLE IF NOT EXISTS `ResourceVisibility` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `companyId` VARCHAR(64) NOT NULL,
  `resourceType` VARCHAR(32) NOT NULL,
  `resourceId` VARCHAR(64) NOT NULL,
  `visibilityType` VARCHAR(64) NOT NULL DEFAULT 'ALL_AUTHORIZED',
  `employeeIds` TEXT NULL,
  `teamIds` TEXT NULL,
  `departmentIds` TEXT NULL,
  `setByUserId` VARCHAR(64) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ResourceVisibility_resourceType_resourceId_key` (`resourceType`, `resourceId`),
  KEY `ResourceVisibility_companyId_resourceType_idx` (`companyId`, `resourceType`),
  KEY `ResourceVisibility_resourceId_idx` (`resourceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ReassignmentHistory table
CREATE TABLE IF NOT EXISTS `ReassignmentHistory` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `companyId` VARCHAR(64) NULL,
  `resourceType` VARCHAR(32) NOT NULL,
  `resourceId` VARCHAR(64) NOT NULL,
  `fromUserId` VARCHAR(64) NULL,
  `toUserId` VARCHAR(64) NOT NULL,
  `reassignedBy` VARCHAR(64) NOT NULL,
  `reason` VARCHAR(64) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ReassignmentHistory_resourceType_resourceId_idx` (`resourceType`, `resourceId`),
  KEY `ReassignmentHistory_companyId_idx` (`companyId`),
  KEY `ReassignmentHistory_toUserId_idx` (`toUserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- EmployeeStatus table
CREATE TABLE IF NOT EXISTS `EmployeeStatus` (
  `id` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `userId` VARCHAR(64) NOT NULL,
  `companyId` VARCHAR(64) NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'OFFLINE',
  `currentLeadId` VARCHAR(64) NULL,
  `currentChatId` VARCHAR(64) NULL,
  `currentTicketId` VARCHAR(64) NULL,
  `lastActivityAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `EmployeeStatus_userId_key` (`userId`),
  KEY `EmployeeStatus_companyId_idx` (`companyId`),
  KEY `EmployeeStatus_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default SLA rules for existing companies (will apply to all, override per company)
-- Platform default (companyId = NULL):
INSERT IGNORE INTO `SlaRule` (`id`, `companyId`, `entityType`, `actionType`, `priority`, `warningMinutes`, `breachMinutes`, `isActive`, `updatedAt`) VALUES
  (UUID(), NULL, 'LEAD', 'ACCEPTANCE', 'NORMAL', 8, 10, 1, NOW()),
  (UUID(), NULL, 'LEAD', 'ACCEPTANCE', 'HIGH', 4, 5, 1, NOW()),
  (UUID(), NULL, 'LEAD', 'ACCEPTANCE', 'URGENT', 2, 3, 1, NOW()),
  (UUID(), NULL, 'WHATSAPP_CHAT', 'ACCEPTANCE', 'NORMAL', 4, 5, 1, NOW()),
  (UUID(), NULL, 'WHATSAPP_CHAT', 'ACCEPTANCE', 'HIGH', 2, 3, 1, NOW()),
  (UUID(), NULL, 'WHATSAPP_CHAT', 'FIRST_RESPONSE', 'NORMAL', 12, 15, 1, NOW()),
  (UUID(), NULL, 'WHATSAPP_CHAT', 'FIRST_RESPONSE', 'HIGH', 4, 5, 1, NOW());
