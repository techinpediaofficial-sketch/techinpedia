-- =======================================================
-- TECHINPEDIA BUSINESS OS — PHASE F: MEETINGS & GOOGLE CALENDAR
-- Safe, idempotent, zero-downtime additive DDL statements
-- =======================================================

-- 1. Create Meeting table first
CREATE TABLE IF NOT EXISTS `Meeting` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `meetingType` VARCHAR(32) NOT NULL DEFAULT 'GOOGLE_MEET',
  `status` VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
  `startTime` DATETIME(3) NOT NULL,
  `endTime` DATETIME(3) NOT NULL,
  `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  `location` VARCHAR(255) NULL,
  `conferenceLink` TEXT NULL,
  `conferenceId` VARCHAR(64) NULL,
  `googleEventId` VARCHAR(128) NULL,
  `googleCalendarId` VARCHAR(128) NULL,
  `icalUid` VARCHAR(128) NULL,
  `htmlLink` TEXT NULL,
  `customerId` VARCHAR(191) NULL,
  `contactId` VARCHAR(191) NULL,
  `enquiryId` VARCHAR(191) NULL,
  `dealId` VARCHAR(191) NULL,
  `projectRecordId` VARCHAR(191) NULL,
  `departmentId` VARCHAR(191) NULL,
  `teamId` VARCHAR(191) NULL,
  `hostEmployeeId` VARCHAR(191) NULL,
  `createdById` VARCHAR(191) NOT NULL,
  `outcome` VARCHAR(64) NULL,
  `outcomeNotes` TEXT NULL,
  `followUpTaskId` VARCHAR(191) NULL,
  `cancelledReason` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `Meeting_googleEventId_key` (`googleEventId`),
  INDEX `Meeting_status_startTime_idx` (`status`, `startTime`),
  INDEX `Meeting_hostEmployeeId_idx` (`hostEmployeeId`),
  INDEX `Meeting_customerId_idx` (`customerId`),
  INDEX `Meeting_enquiryId_idx` (`enquiryId`),
  INDEX `Meeting_dealId_idx` (`dealId`),
  INDEX `Meeting_projectRecordId_idx` (`projectRecordId`),
  INDEX `Meeting_departmentId_idx` (`departmentId`),
  INDEX `Meeting_teamId_idx` (`teamId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create MeetingParticipant table
CREATE TABLE IF NOT EXISTS `MeetingParticipant` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `meetingId` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NULL,
  `email` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'ATTENDEE',
  `responseStatus` VARCHAR(32) NOT NULL DEFAULT 'NEEDS_ACTION',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `MeetingParticipant_meetingId_email_key` (`meetingId`, `email`),
  INDEX `MeetingParticipant_meetingId_idx` (`meetingId`),
  INDEX `MeetingParticipant_employeeId_idx` (`employeeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Safely add Foreign Key Constraints if they don't already exist
SET @dbname = DATABASE();

-- FK: Meeting -> Customer
SET @constraint_name = "Meeting_customerId_fkey";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @dbname AND TABLE_NAME = "Meeting" AND CONSTRAINT_NAME = @constraint_name) > 0,
  "SELECT 1",
  "ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK: Meeting -> Contact
SET @constraint_name = "Meeting_contactId_fkey";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @dbname AND TABLE_NAME = "Meeting" AND CONSTRAINT_NAME = @constraint_name) > 0,
  "SELECT 1",
  "ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK: Meeting -> Enquiry
SET @constraint_name = "Meeting_enquiryId_fkey";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @dbname AND TABLE_NAME = "Meeting" AND CONSTRAINT_NAME = @constraint_name) > 0,
  "SELECT 1",
  "ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `Enquiry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK: Meeting -> Deal
SET @constraint_name = "Meeting_dealId_fkey";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @dbname AND TABLE_NAME = "Meeting" AND CONSTRAINT_NAME = @constraint_name) > 0,
  "SELECT 1",
  "ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `Deal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK: Meeting -> ProjectRecord
SET @constraint_name = "Meeting_projectRecordId_fkey";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @dbname AND TABLE_NAME = "Meeting" AND CONSTRAINT_NAME = @constraint_name) > 0,
  "SELECT 1",
  "ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_projectRecordId_fkey` FOREIGN KEY (`projectRecordId`) REFERENCES `ProjectRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK: Meeting -> Department
SET @constraint_name = "Meeting_departmentId_fkey";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @dbname AND TABLE_NAME = "Meeting" AND CONSTRAINT_NAME = @constraint_name) > 0,
  "SELECT 1",
  "ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK: Meeting -> Team
SET @constraint_name = "Meeting_teamId_fkey";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @dbname AND TABLE_NAME = "Meeting" AND CONSTRAINT_NAME = @constraint_name) > 0,
  "SELECT 1",
  "ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK: Meeting -> Employee (host)
SET @constraint_name = "Meeting_hostEmployeeId_fkey";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @dbname AND TABLE_NAME = "Meeting" AND CONSTRAINT_NAME = @constraint_name) > 0,
  "SELECT 1",
  "ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_hostEmployeeId_fkey` FOREIGN KEY (`hostEmployeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK: Meeting -> User (creator)
SET @constraint_name = "Meeting_createdById_fkey";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @dbname AND TABLE_NAME = "Meeting" AND CONSTRAINT_NAME = @constraint_name) > 0,
  "SELECT 1",
  "ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK: MeetingParticipant -> Meeting
SET @constraint_name = "MeetingParticipant_meetingId_fkey";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @dbname AND TABLE_NAME = "MeetingParticipant" AND CONSTRAINT_NAME = @constraint_name) > 0,
  "SELECT 1",
  "ALTER TABLE `MeetingParticipant` ADD CONSTRAINT `MeetingParticipant_meetingId_fkey` FOREIGN KEY (`meetingId`) REFERENCES `Meeting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK: MeetingParticipant -> Employee
SET @constraint_name = "MeetingParticipant_employeeId_fkey";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = @dbname AND TABLE_NAME = "MeetingParticipant" AND CONSTRAINT_NAME = @constraint_name) > 0,
  "SELECT 1",
  "ALTER TABLE `MeetingParticipant` ADD CONSTRAINT `MeetingParticipant_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
