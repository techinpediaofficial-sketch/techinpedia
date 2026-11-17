-- Phase A: Organization Structure, Hierarchy & RBAC
-- Safe, Additive Migration

-- AlterTable Department
ALTER TABLE `Department` ADD COLUMN `code` VARCHAR(191) NULL,
    ADD COLUMN `headId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable Designation
ALTER TABLE `Designation` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable Employee
ALTER TABLE `Employee` ADD COLUMN `aadhaarNumber` VARCHAR(191) NULL,
    ADD COLUMN `accountNumber` VARCHAR(191) NULL,
    ADD COLUMN `allowances` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `appRoleId` VARCHAR(191) NULL,
    ADD COLUMN `avatar` TEXT NULL,
    ADD COLUMN `bankName` VARCHAR(191) NULL,
    ADD COLUMN `confirmationDate` DATETIME(3) NULL,
    ADD COLUMN `documentsJson` TEXT NULL,
    ADD COLUMN `emergencyContactName` VARCHAR(191) NULL,
    ADD COLUMN `emergencyContactPhone` VARCHAR(191) NULL,
    ADD COLUMN `emergencyContactRelation` VARCHAR(191) NULL,
    ADD COLUMN `grossSalary` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `hra` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `ifscCode` VARCHAR(191) NULL,
    ADD COLUMN `lastWorkingDate` DATETIME(3) NULL,
    ADD COLUMN `managerId` VARCHAR(191) NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `panNumber` VARCHAR(191) NULL,
    ADD COLUMN `probationEndDate` DATETIME(3) NULL,
    ADD COLUMN `probationMonths` INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN `resignationDate` DATETIME(3) NULL,
    ADD COLUMN `shift` VARCHAR(191) NOT NULL DEFAULT 'REGULAR_DAY',
    ADD COLUMN `teamId` VARCHAR(191) NULL;

-- AlterTable User
ALTER TABLE `User` ADD COLUMN `appRoleId` VARCHAR(191) NULL,
    ADD COLUMN `avatar` TEXT NULL,
    ADD COLUMN `employeeId` VARCHAR(191) NULL;

-- CreateTable AppRole
CREATE TABLE IF NOT EXISTS `AppRole` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AppRole_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable AppRolePermission
CREATE TABLE IF NOT EXISTS `AppRolePermission` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AppRolePermission_roleId_idx`(`roleId`),
    INDEX `AppRolePermission_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `AppRolePermission_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Team
CREATE TABLE IF NOT EXISTS `Team` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `leaderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Team_code_key`(`code`),
    INDEX `Team_departmentId_idx`(`departmentId`),
    INDEX `Team_leaderId_idx`(`leaderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex Department code
CREATE UNIQUE INDEX `Department_code_key` ON `Department`(`code`);

-- CreateIndexes Employee
CREATE INDEX `Employee_teamId_idx` ON `Employee`(`teamId`);
CREATE INDEX `Employee_managerId_idx` ON `Employee`(`managerId`);
CREATE INDEX `Employee_appRoleId_idx` ON `Employee`(`appRoleId`);

-- CreateIndexes User
CREATE UNIQUE INDEX `User_employeeId_key` ON `User`(`employeeId`);
CREATE INDEX `User_appRoleId_idx` ON `User`(`appRoleId`);

-- Foreign Keys
ALTER TABLE `User` ADD CONSTRAINT `User_appRoleId_fkey` FOREIGN KEY (`appRoleId`) REFERENCES `AppRole`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `User` ADD CONSTRAINT `User_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `AppRolePermission` ADD CONSTRAINT `AppRolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `AppRole`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AppRolePermission` ADD CONSTRAINT `AppRolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Department` ADD CONSTRAINT `Department_headId_fkey` FOREIGN KEY (`headId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Team` ADD CONSTRAINT `Team_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Team` ADD CONSTRAINT `Team_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Employee` ADD CONSTRAINT `Employee_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_appRoleId_fkey` FOREIGN KEY (`appRoleId`) REFERENCES `AppRole`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
