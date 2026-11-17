-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR') NOT NULL DEFAULT 'ADMIN',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT true,
    `failedLoginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `avatar` TEXT NULL,
    `appRoleId` VARCHAR(191) NULL,
    `employeeId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_employeeId_key`(`employeeId`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_status_idx`(`status`),
    INDEX `User_appRoleId_idx`(`appRoleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Permission_code_key`(`code`),
    INDEX `Permission_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `id` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR') NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RolePermission_role_idx`(`role`),
    UNIQUE INDEX `RolePermission_role_permissionId_key`(`role`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppRole` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AppRole_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppRolePermission` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AppRolePermission_roleId_idx`(`roleId`),
    INDEX `AppRolePermission_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `AppRolePermission_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Service` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `shortDescription` TEXT NOT NULL,
    `description` LONGTEXT NOT NULL,
    `icon` VARCHAR(191) NOT NULL DEFAULT 'Code',
    `technologies` TEXT NOT NULL,
    `image` VARCHAR(191) NULL,
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Service_slug_key`(`slug`),
    INDEX `Service_slug_idx`(`slug`),
    INDEX `Service_status_idx`(`status`),
    INDEX `Service_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `clientType` VARCHAR(191) NULL,
    `shortDesc` TEXT NOT NULL,
    `description` LONGTEXT NOT NULL,
    `problem` TEXT NULL,
    `solution` TEXT NULL,
    `features` TEXT NULL,
    `technologies` TEXT NOT NULL,
    `results` TEXT NULL,
    `featuredImage` VARCHAR(191) NOT NULL,
    `gallery` TEXT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Project_slug_key`(`slug`),
    INDEX `Project_slug_idx`(`slug`),
    INDEX `Project_category_idx`(`category`),
    INDEX `Project_status_idx`(`status`),
    INDEX `Project_featured_idx`(`featured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogPost` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `content` LONGTEXT NOT NULL,
    `featuredImage` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `tags` VARCHAR(191) NULL,
    `author` VARCHAR(191) NOT NULL DEFAULT 'TechInPedia Team',
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` TEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BlogPost_slug_key`(`slug`),
    INDEX `BlogPost_slug_idx`(`slug`),
    INDEX `BlogPost_category_idx`(`category`),
    INDEX `BlogPost_status_idx`(`status`),
    INDEX `BlogPost_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsPost` (
    `id` VARCHAR(64) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(64) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `content` LONGTEXT NOT NULL,
    `featuredImage` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `tags` VARCHAR(191) NULL,
    `author` VARCHAR(191) NOT NULL DEFAULT 'TechInPedia Team',
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` TEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NewsPost_slug_key`(`slug`),
    INDEX `NewsPost_slug_idx`(`slug`),
    INDEX `NewsPost_category_idx`(`category`),
    INDEX `NewsPost_status_idx`(`status`),
    INDEX `NewsPost_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Testimonial` (
    `id` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `testimonial` TEXT NOT NULL,
    `image` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Testimonial_status_idx`(`status`),
    INDEX `Testimonial_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Faq` (
    `id` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'General',
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Faq_category_idx`(`category`),
    INDEX `Faq_status_idx`(`status`),
    INDEX `Faq_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeoLandingPage` (
    `id` VARCHAR(191) NOT NULL,
    `internalName` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` TEXT NULL,
    `focusKeyword` VARCHAR(191) NULL,
    `canonicalUrl` VARCHAR(191) NULL,
    `robotsIndex` BOOLEAN NOT NULL DEFAULT true,
    `robotsFollow` BOOLEAN NOT NULL DEFAULT true,
    `ogTitle` VARCHAR(191) NULL,
    `ogDescription` TEXT NULL,
    `ogImage` VARCHAR(191) NULL,
    `heroHeading` VARCHAR(191) NULL,
    `heroSubheading` TEXT NULL,
    `heroImage` VARCHAR(191) NULL,
    `heroImageAlt` VARCHAR(191) NULL,
    `primaryCtaText` VARCHAR(191) NULL,
    `primaryCtaLink` VARCHAR(191) NULL,
    `secondaryCtaText` VARCHAR(191) NULL,
    `secondaryCtaLink` VARCHAR(191) NULL,
    `blocks` LONGTEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SeoLandingPage_slug_key`(`slug`),
    INDEX `SeoLandingPage_slug_idx`(`slug`),
    INDEX `SeoLandingPage_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeoPageRedirect` (
    `id` VARCHAR(191) NOT NULL,
    `oldPath` VARCHAR(191) NOT NULL,
    `newPath` VARCHAR(191) NOT NULL,
    `pageId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SeoPageRedirect_oldPath_key`(`oldPath`),
    INDEX `SeoPageRedirect_oldPath_idx`(`oldPath`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BusinessUnit` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BusinessUnit_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Site` (
    `id` VARCHAR(191) NOT NULL,
    `businessUnitId` VARCHAR(191) NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `type` ENUM('PUBLIC_WEBSITE', 'MARKETPLACE', 'INTERNAL_PORTAL', 'API') NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Site_code_key`(`code`),
    INDEX `Site_businessUnitId_idx`(`businessUnitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteDomain` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `hostname` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SiteDomain_hostname_key`(`hostname`),
    INDEX `SiteDomain_siteId_idx`(`siteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enquiry` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `alternatePhone` VARCHAR(191) NULL,
    `whatsappNumber` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `jobTitle` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL DEFAULT 'India',
    `postalCode` VARCHAR(191) NULL,
    `service` VARCHAR(191) NULL,
    `projectType` VARCHAR(191) NULL,
    `budget` VARCHAR(191) NULL,
    `timeline` VARCHAR(191) NULL,
    `message` TEXT NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'Contact Page',
    `leadSubSource` VARCHAR(191) NULL,
    `utmSource` VARCHAR(191) NULL,
    `utmMedium` VARCHAR(191) NULL,
    `utmCampaign` VARCHAR(191) NULL,
    `utmTerm` VARCHAR(191) NULL,
    `utmContent` VARCHAR(191) NULL,
    `referrerUrl` VARCHAR(191) NULL,
    `landingPage` VARCHAR(191) NULL,
    `estimatedValue` DOUBLE NULL,
    `priority` VARCHAR(191) NULL DEFAULT 'MEDIUM',
    `temperature` VARCHAR(191) NULL DEFAULT 'WARM',
    `score` INTEGER NULL DEFAULT 10,
    `status` ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST', 'ARCHIVED') NOT NULL DEFAULT 'NEW',
    `assignedTo` VARCHAR(191) NULL,
    `pipelineStageId` VARCHAR(191) NULL,
    `nextFollowUp` DATETIME(3) NULL,
    `lastContacted` DATETIME(3) NULL,
    `convertedDate` DATETIME(3) NULL,
    `lostDate` DATETIME(3) NULL,
    `lostReason` VARCHAR(191) NULL,
    `lostNotes` TEXT NULL,
    `departmentId` VARCHAR(191) NULL,
    `teamId` VARCHAR(191) NULL,
    `assignedEmployeeId` VARCHAR(191) NULL,
    `wonDealId` VARCHAR(191) NULL,
    `businessUnitId` VARCHAR(191) NULL,
    `siteId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Enquiry_wonDealId_key`(`wonDealId`),
    INDEX `Enquiry_email_idx`(`email`),
    INDEX `Enquiry_status_idx`(`status`),
    INDEX `Enquiry_assignedTo_idx`(`assignedTo`),
    INDEX `Enquiry_assignedEmployeeId_idx`(`assignedEmployeeId`),
    INDEX `Enquiry_departmentId_idx`(`departmentId`),
    INDEX `Enquiry_teamId_idx`(`teamId`),
    INDEX `Enquiry_createdAt_idx`(`createdAt`),
    INDEX `Enquiry_source_idx`(`source`),
    INDEX `Enquiry_businessUnitId_idx`(`businessUnitId`),
    INDEX `Enquiry_siteId_idx`(`siteId`),
    INDEX `Enquiry_businessUnitId_status_idx`(`businessUnitId`, `status`),
    INDEX `Enquiry_businessUnitId_createdAt_idx`(`businessUnitId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnquiryNote` (
    `id` VARCHAR(191) NOT NULL,
    `enquiryId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `note` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EnquiryNote_enquiryId_idx`(`enquiryId`),
    INDEX `EnquiryNote_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Company` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `industry` VARCHAR(191) NULL,
    `domain` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL DEFAULT 'India',
    `postalCode` VARCHAR(191) NULL,
    `gstNumber` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Company_name_idx`(`name`),
    INDEX `Company_domain_idx`(`domain`),
    INDEX `Company_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contact` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `jobTitle` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Contact_companyId_idx`(`companyId`),
    INDEX `Contact_email_idx`(`email`),
    INDEX `Contact_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `contactId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `lifetimeValue` DOUBLE NOT NULL DEFAULT 0,
    `accountManagerId` VARCHAR(191) NULL,
    `businessUnitId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Customer_companyId_idx`(`companyId`),
    INDEX `Customer_email_idx`(`email`),
    INDEX `Customer_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pipeline` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Pipeline_code_key`(`code`),
    INDEX `Pipeline_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PipelineStage` (
    `id` VARCHAR(191) NOT NULL,
    `pipelineId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `color` VARCHAR(191) NOT NULL DEFAULT '#802ee3',
    `probability` INTEGER NOT NULL DEFAULT 50,
    `isWon` BOOLEAN NOT NULL DEFAULT false,
    `isLost` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PipelineStage_pipelineId_idx`(`pipelineId`),
    INDEX `PipelineStage_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Deal` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `contactId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `pipelineId` VARCHAR(191) NOT NULL,
    `stageId` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL DEFAULT 0,
    `probability` INTEGER NOT NULL DEFAULT 50,
    `expectedCloseDate` DATETIME(3) NULL,
    `assignedToId` VARCHAR(191) NULL,
    `assignedEmployeeId` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `wonDate` DATETIME(3) NULL,
    `lostDate` DATETIME(3) NULL,
    `lostReason` VARCHAR(191) NULL,
    `lostNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Deal_pipelineId_idx`(`pipelineId`),
    INDEX `Deal_stageId_idx`(`stageId`),
    INDEX `Deal_customerId_idx`(`customerId`),
    INDEX `Deal_companyId_idx`(`companyId`),
    INDEX `Deal_assignedToId_idx`(`assignedToId`),
    INDEX `Deal_assignedEmployeeId_idx`(`assignedEmployeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUp` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `dealId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `enquiryId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'CALL',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `scheduledAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `assignedToId` VARCHAR(191) NULL,
    `assignedEmployeeId` VARCHAR(191) NULL,
    `assignedToEmail` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `outcome` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FollowUp_status_idx`(`status`),
    INDEX `FollowUp_scheduledAt_idx`(`scheduledAt`),
    INDEX `FollowUp_assignedToId_idx`(`assignedToId`),
    INDEX `FollowUp_assignedEmployeeId_idx`(`assignedEmployeeId`),
    INDEX `FollowUp_dealId_idx`(`dealId`),
    INDEX `FollowUp_enquiryId_idx`(`enquiryId`),
    INDEX `FollowUp_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DealStageHistory` (
    `id` VARCHAR(191) NOT NULL,
    `dealId` VARCHAR(191) NOT NULL,
    `fromStageId` VARCHAR(191) NULL,
    `toStageId` VARCHAR(191) NOT NULL,
    `changedById` VARCHAR(191) NULL,
    `durationHours` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DealStageHistory_dealId_idx`(`dealId`),
    INDEX `DealStageHistory_toStageId_idx`(`toStageId`),
    INDEX `DealStageHistory_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DealItem` (
    `id` VARCHAR(191) NOT NULL,
    `dealId` VARCHAR(191) NOT NULL,
    `serviceName` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DOUBLE NOT NULL DEFAULT 0,
    `totalPrice` DOUBLE NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DealItem_dealId_idx`(`dealId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadTimelineEvent` (
    `id` VARCHAR(191) NOT NULL,
    `enquiryId` VARCHAR(191) NULL,
    `dealId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `actorEmail` VARCHAR(191) NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeadTimelineEvent_enquiryId_idx`(`enquiryId`),
    INDEX `LeadTimelineEvent_dealId_idx`(`dealId`),
    INDEX `LeadTimelineEvent_customerId_idx`(`customerId`),
    INDEX `LeadTimelineEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomFieldDefinition` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `fieldName` VARCHAR(50) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `fieldType` VARCHAR(191) NOT NULL,
    `options` TEXT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CustomFieldDefinition_entityType_idx`(`entityType`),
    UNIQUE INDEX `CustomFieldDefinition_entityType_fieldName_key`(`entityType`, `fieldName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomFieldValue` (
    `id` VARCHAR(191) NOT NULL,
    `fieldId` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(50) NOT NULL,
    `value` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CustomFieldValue_entityId_idx`(`entityId`),
    UNIQUE INDEX `CustomFieldValue_fieldId_entityId_key`(`fieldId`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#802ee3',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Tag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EntityTag` (
    `id` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(50) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EntityTag_entityType_entityId_idx`(`entityType`, `entityId`),
    UNIQUE INDEX `EntityTag_tagId_entityType_entityId_key`(`tagId`, `entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Quotation` (
    `id` VARCHAR(191) NOT NULL,
    `quotationNumber` VARCHAR(191) NOT NULL,
    `dealId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `clientEmail` VARCHAR(191) NOT NULL,
    `clientPhone` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NULL,
    `subtotal` DOUBLE NOT NULL DEFAULT 0,
    `taxRate` DOUBLE NOT NULL DEFAULT 18,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `terms` TEXT NULL,
    `notes` TEXT NULL,
    `validUntil` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Quotation_quotationNumber_key`(`quotationNumber`),
    INDEX `Quotation_quotationNumber_idx`(`quotationNumber`),
    INDEX `Quotation_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuotationItem` (
    `id` VARCHAR(191) NOT NULL,
    `quotationId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 1,
    `rate` DOUBLE NOT NULL DEFAULT 0,
    `amount` DOUBLE NOT NULL DEFAULT 0,

    INDEX `QuotationItem_quotationId_idx`(`quotationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proposal` (
    `id` VARCHAR(191) NOT NULL,
    `proposalNumber` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `parentId` VARCHAR(191) NULL,
    `proposalType` VARCHAR(191) NOT NULL DEFAULT 'WEBSITE_DEVELOPMENT',
    `title` VARCHAR(191) NOT NULL,
    `proposalDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validUntil` DATETIME(3) NULL,
    `preparedBy` VARCHAR(191) NULL,
    `branch` VARCHAR(191) NULL DEFAULT 'TechInPedia',
    `clientName` VARCHAR(191) NOT NULL,
    `contactPerson` VARCHAR(191) NULL,
    `clientEmail` VARCHAR(191) NOT NULL,
    `clientPhone` VARCHAR(191) NULL,
    `clientWhatsApp` VARCHAR(191) NULL,
    `billingAddress` TEXT NULL,
    `gstin` VARCHAR(191) NULL,
    `enquiryId` VARCHAR(191) NULL,
    `dealId` VARCHAR(191) NULL,
    `salesExecutive` VARCHAR(191) NULL,
    `leadSource` VARCHAR(191) NULL,
    `projectName` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `requirement` TEXT NULL,
    `clientObjective` TEXT NULL,
    `proposedSolution` TEXT NULL,
    `executiveSummary` LONGTEXT NULL,
    `techStack` TEXT NULL,
    `deliverables` LONGTEXT NULL,
    `features` LONGTEXT NULL,
    `includedServices` LONGTEXT NULL,
    `excludedServices` LONGTEXT NULL,
    `thirdPartyIntegrations` TEXT NULL,
    `startDate` DATETIME(3) NULL,
    `totalDuration` VARCHAR(191) NULL,
    `milestones` TEXT NULL,
    `deliveryDate` DATETIME(3) NULL,
    `subtotal` DOUBLE NOT NULL DEFAULT 0,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `taxRate` DOUBLE NOT NULL DEFAULT 18,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAdditionalCharges` DOUBLE NOT NULL DEFAULT 0,
    `grandTotal` DOUBLE NOT NULL DEFAULT 0,
    `advancePercent` DOUBLE NULL,
    `paymentMilestones` TEXT NULL,
    `finalPaymentPercent` DOUBLE NULL,
    `dueDays` INTEGER NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `freeSupportPeriod` VARCHAR(191) NULL,
    `amcCharges` VARCHAR(191) NULL,
    `renewalCharges` VARCHAR(191) NULL,
    `revisionLimit` INTEGER NULL,
    `sourceCodeTerms` TEXT NULL,
    `termsConditions` LONGTEXT NULL,
    `internalNotes` TEXT NULL,
    `clientNotes` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `sentAt` DATETIME(3) NULL,
    `viewedAt` DATETIME(3) NULL,
    `acceptedAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `acceptedBy` VARCHAR(191) NULL,
    `acceptedDesignation` VARCHAR(191) NULL,
    `clientSignature` VARCHAR(191) NULL,
    `managerApproved` BOOLEAN NOT NULL DEFAULT false,
    `managerApprovedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Proposal_proposalNumber_key`(`proposalNumber`),
    INDEX `Proposal_proposalNumber_idx`(`proposalNumber`),
    INDEX `Proposal_status_idx`(`status`),
    INDEX `Proposal_enquiryId_idx`(`enquiryId`),
    INDEX `Proposal_dealId_idx`(`dealId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProposalItem` (
    `id` VARCHAR(191) NOT NULL,
    `proposalId` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `serviceName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 1,
    `rate` DOUBLE NOT NULL DEFAULT 0,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `taxPercent` DOUBLE NOT NULL DEFAULT 18,
    `amount` DOUBLE NOT NULL DEFAULT 0,

    INDEX `ProposalItem_proposalId_idx`(`proposalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProposalAdditionalCharge` (
    `id` VARCHAR(191) NOT NULL,
    `proposalId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL DEFAULT 0,

    INDEX `ProposalAdditionalCharge_proposalId_idx`(`proposalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contract` (
    `id` VARCHAR(191) NOT NULL,
    `contractNumber` VARCHAR(191) NOT NULL,
    `dealId` VARCHAR(191) NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `contractType` VARCHAR(191) NOT NULL DEFAULT 'SOFTWARE_DEV',
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `renewalDate` DATETIME(3) NULL,
    `totalValue` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `terms` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Contract_contractNumber_key`(`contractNumber`),
    INDEX `Contract_contractNumber_idx`(`contractNumber`),
    INDEX `Contract_status_idx`(`status`),
    INDEX `Contract_renewalDate_idx`(`renewalDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `clientEmail` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `issueDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NOT NULL,
    `subtotal` DOUBLE NOT NULL DEFAULT 0,
    `taxRate` DOUBLE NOT NULL DEFAULT 18,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `amountPaid` DOUBLE NOT NULL DEFAULT 0,
    `balanceDue` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SENT',
    `notes` TEXT NULL,
    `businessUnitId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    INDEX `Invoice_invoiceNumber_idx`(`invoiceNumber`),
    INDEX `Invoice_status_idx`(`status`),
    INDEX `Invoice_dueDate_idx`(`dueDate`),
    INDEX `Invoice_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceItem` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 1,
    `unitPrice` DOUBLE NOT NULL DEFAULT 0,
    `amount` DOUBLE NOT NULL DEFAULT 0,

    INDEX `InvoiceItem_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `paymentLinkId` VARCHAR(191) NULL,
    `invoiceId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'BANK_TRANSFER',
    `provider` VARCHAR(191) NOT NULL DEFAULT 'OFFLINE_MANUAL',
    `providerPaymentId` VARCHAR(191) NULL,
    `salesEmployeeId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SUCCESS',
    `referenceId` VARCHAR(191) NULL,
    `rawWebhookPayload` LONGTEXT NULL,
    `notes` TEXT NULL,
    `recordedBy` VARCHAR(191) NULL,
    `businessUnitId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Payment_providerPaymentId_key`(`providerPaymentId`),
    INDEX `Payment_businessUnitId_idx`(`businessUnitId`),
    INDEX `Payment_invoiceId_idx`(`invoiceId`),
    INDEX `Payment_customerId_idx`(`customerId`),
    INDEX `Payment_paymentDate_idx`(`paymentDate`),
    INDEX `Payment_paymentLinkId_idx`(`paymentLinkId`),
    INDEX `Payment_providerPaymentId_idx`(`providerPaymentId`),
    INDEX `Payment_salesEmployeeId_idx`(`salesEmployeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentLink` (
    `id` VARCHAR(191) NOT NULL,
    `providerLinkId` VARCHAR(191) NOT NULL,
    `providerOrderId` VARCHAR(191) NULL,
    `shortUrl` VARCHAR(191) NOT NULL,
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
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentLink_providerLinkId_key`(`providerLinkId`),
    INDEX `PaymentLink_status_idx`(`status`),
    INDEX `PaymentLink_salesEmployeeId_idx`(`salesEmployeeId`),
    INDEX `PaymentLink_departmentId_idx`(`departmentId`),
    INDEX `PaymentLink_teamId_idx`(`teamId`),
    INDEX `PaymentLink_customerId_idx`(`customerId`),
    INDEX `PaymentLink_dealId_idx`(`dealId`),
    INDEX `PaymentLink_invoiceId_idx`(`invoiceId`),
    INDEX `PaymentLink_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentWebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `signature` VARCHAR(191) NULL,
    `payloadJson` LONGTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `errorMessage` TEXT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    UNIQUE INDEX `PaymentWebhookEvent_eventId_key`(`eventId`),
    INDEX `PaymentWebhookEvent_eventId_idx`(`eventId`),
    INDEX `PaymentWebhookEvent_status_idx`(`status`),
    INDEX `PaymentWebhookEvent_eventType_idx`(`eventType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Meeting` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `meetingType` VARCHAR(32) NOT NULL DEFAULT 'GOOGLE_MEET',
    `status` VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    `location` VARCHAR(191) NULL,
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
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Meeting_googleEventId_key`(`googleEventId`),
    INDEX `Meeting_status_startTime_idx`(`status`, `startTime`),
    INDEX `Meeting_hostEmployeeId_idx`(`hostEmployeeId`),
    INDEX `Meeting_customerId_idx`(`customerId`),
    INDEX `Meeting_enquiryId_idx`(`enquiryId`),
    INDEX `Meeting_dealId_idx`(`dealId`),
    INDEX `Meeting_projectRecordId_idx`(`projectRecordId`),
    INDEX `Meeting_departmentId_idx`(`departmentId`),
    INDEX `Meeting_teamId_idx`(`teamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MeetingParticipant` (
    `id` VARCHAR(191) NOT NULL,
    `meetingId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `role` VARCHAR(32) NOT NULL DEFAULT 'ATTENDEE',
    `responseStatus` VARCHAR(32) NOT NULL DEFAULT 'NEEDS_ACTION',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MeetingParticipant_meetingId_idx`(`meetingId`),
    INDEX `MeetingParticipant_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expense` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `vendorName` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'BANK_TRANSFER',
    `receiptUrl` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'APPROVED',
    `approvedBy` VARCHAR(191) NULL,
    `businessUnitId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Expense_businessUnitId_idx`(`businessUnitId`),
    INDEX `Expense_category_idx`(`category`),
    INDEX `Expense_date_idx`(`date`),
    INDEX `Expense_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectRecord` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `managerId` VARCHAR(191) NULL,
    `managerName` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `deadline` DATETIME(3) NULL,
    `budget` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProjectRecord_code_key`(`code`),
    INDEX `ProjectRecord_code_idx`(`code`),
    INDEX `ProjectRecord_status_idx`(`status`),
    INDEX `ProjectRecord_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Milestone` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Milestone_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `milestoneId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `assignedUserId` VARCHAR(191) NULL,
    `assignedToName` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'TODO',
    `startDate` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `estimatedHours` DOUBLE NOT NULL DEFAULT 0,
    `actualHours` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Task_projectId_idx`(`projectId`),
    INDEX `Task_status_idx`(`status`),
    INDEX `Task_priority_idx`(`priority`),
    INDEX `Task_assignedUserId_idx`(`assignedUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Timesheet` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `employeeId` VARCHAR(191) NULL,
    `employeeName` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `hours` DOUBLE NOT NULL,
    `description` TEXT NULL,
    `isBillable` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Timesheet_projectId_idx`(`projectId`),
    INDEX `Timesheet_date_idx`(`date`),
    INDEX `Timesheet_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Department` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `headId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Department_name_key`(`name`),
    UNIQUE INDEX `Department_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Team` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `leaderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Team_code_key`(`code`),
    INDEX `Team_departmentId_idx`(`departmentId`),
    INDEX `Team_leaderId_idx`(`leaderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Designation` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Designation_title_key`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `id` VARCHAR(191) NOT NULL,
    `employeeCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `personalEmail` VARCHAR(191) NULL,
    `companyEmail` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `avatar` TEXT NULL,
    `emergencyContactName` VARCHAR(191) NULL,
    `emergencyContactPhone` VARCHAR(191) NULL,
    `emergencyContactRelation` VARCHAR(191) NULL,
    `departmentId` VARCHAR(191) NULL,
    `teamId` VARCHAR(191) NULL,
    `designationId` VARCHAR(191) NULL,
    `appRoleId` VARCHAR(191) NULL,
    `managerId` VARCHAR(191) NULL,
    `joiningDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `employmentType` VARCHAR(191) NOT NULL DEFAULT 'FULL_TIME',
    `workLocation` VARCHAR(191) NOT NULL DEFAULT 'HYBRID',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `probationMonths` INTEGER NOT NULL DEFAULT 3,
    `probationEndDate` DATETIME(3) NULL,
    `confirmationDate` DATETIME(3) NULL,
    `resignationDate` DATETIME(3) NULL,
    `lastWorkingDate` DATETIME(3) NULL,
    `shift` VARCHAR(191) NOT NULL DEFAULT 'REGULAR_DAY',
    `basicSalary` DOUBLE NOT NULL DEFAULT 0,
    `hra` DOUBLE NOT NULL DEFAULT 0,
    `allowances` DOUBLE NOT NULL DEFAULT 0,
    `grossSalary` DOUBLE NOT NULL DEFAULT 0,
    `bankName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `ifscCode` VARCHAR(191) NULL,
    `panNumber` VARCHAR(191) NULL,
    `aadhaarNumber` VARCHAR(191) NULL,
    `documentsJson` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Employee_employeeCode_key`(`employeeCode`),
    UNIQUE INDEX `Employee_companyEmail_key`(`companyEmail`),
    INDEX `Employee_employeeCode_idx`(`employeeCode`),
    INDEX `Employee_companyEmail_idx`(`companyEmail`),
    INDEX `Employee_status_idx`(`status`),
    INDEX `Employee_departmentId_idx`(`departmentId`),
    INDEX `Employee_teamId_idx`(`teamId`),
    INDEX `Employee_managerId_idx`(`managerId`),
    INDEX `Employee_appRoleId_idx`(`appRoleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeBusinessUnit` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `businessUnitId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmployeeBusinessUnit_businessUnitId_idx`(`businessUnitId`),
    UNIQUE INDEX `EmployeeBusinessUnit_employeeId_businessUnitId_key`(`employeeId`, `businessUnitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceRecord` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `checkIn` DATETIME(3) NULL,
    `checkOut` DATETIME(3) NULL,
    `totalHours` DOUBLE NOT NULL DEFAULT 0,
    `workMinutes` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PRESENT',
    `isLate` BOOLEAN NOT NULL DEFAULT false,
    `isEarlyExit` BOOLEAN NOT NULL DEFAULT false,
    `ipAddress` VARCHAR(191) NULL,
    `device` VARCHAR(191) NULL,
    `regularized` BOOLEAN NOT NULL DEFAULT false,
    `regularizationReason` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AttendanceRecord_date_idx`(`date`),
    INDEX `AttendanceRecord_status_idx`(`status`),
    UNIQUE INDEX `AttendanceRecord_employeeId_date_key`(`employeeId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RegularizationRequest` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `requestedCheckIn` DATETIME(3) NOT NULL,
    `requestedCheckOut` DATETIME(3) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedById` VARCHAR(191) NULL,
    `managerNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RegularizationRequest_employeeId_idx`(`employeeId`),
    INDEX `RegularizationRequest_status_idx`(`status`),
    INDEX `RegularizationRequest_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveBalance` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `leaveType` VARCHAR(32) NOT NULL,
    `totalAllocated` DOUBLE NOT NULL,
    `used` DOUBLE NOT NULL DEFAULT 0,
    `pending` DOUBLE NOT NULL DEFAULT 0,
    `carriedForward` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LeaveBalance_employeeId_idx`(`employeeId`),
    INDEX `LeaveBalance_year_idx`(`year`),
    UNIQUE INDEX `LeaveBalance_employeeId_year_leaveType_key`(`employeeId`, `year`, `leaveType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveRequest` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `leaveType` VARCHAR(191) NOT NULL DEFAULT 'CASUAL',
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `daysCount` DOUBLE NOT NULL DEFAULT 1,
    `reason` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LeaveRequest_employeeId_idx`(`employeeId`),
    INDEX `LeaveRequest_status_idx`(`status`),
    INDEX `LeaveRequest_startDate_idx`(`startDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Holiday` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `isOptional` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Holiday_date_key`(`date`),
    INDEX `Holiday_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shift` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `gracePeriod` INTEGER NOT NULL DEFAULT 15,
    `weeklyOffs` VARCHAR(191) NOT NULL DEFAULT 'Sunday',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayrollRecord` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `basicSalary` DOUBLE NOT NULL,
    `hra` DOUBLE NOT NULL DEFAULT 0,
    `specialAllowance` DOUBLE NOT NULL DEFAULT 0,
    `grossSalary` DOUBLE NOT NULL DEFAULT 0,
    `totalDaysInMonth` INTEGER NOT NULL DEFAULT 30,
    `presentDays` DOUBLE NOT NULL DEFAULT 0,
    `paidLeaveDays` DOUBLE NOT NULL DEFAULT 0,
    `unpaidLeaveDays` DOUBLE NOT NULL DEFAULT 0,
    `lossOfPayDays` DOUBLE NOT NULL DEFAULT 0,
    `lossOfPayDeduction` DOUBLE NOT NULL DEFAULT 0,
    `taxDeduction` DOUBLE NOT NULL DEFAULT 0,
    `otherDeductions` DOUBLE NOT NULL DEFAULT 0,
    `allowances` DOUBLE NOT NULL DEFAULT 0,
    `bonus` DOUBLE NOT NULL DEFAULT 0,
    `deductions` DOUBLE NOT NULL DEFAULT 0,
    `netSalary` DOUBLE NOT NULL,
    `paymentDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'GENERATED',
    `paymentMode` VARCHAR(191) NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `approvedById` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PayrollRecord_month_year_idx`(`month`, `year`),
    INDEX `PayrollRecord_status_idx`(`status`),
    UNIQUE INDEX `PayrollRecord_employeeId_month_year_key`(`employeeId`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportTicket` (
    `id` VARCHAR(191) NOT NULL,
    `ticketNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `clientEmail` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'TECHNICAL',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `assignedTo` VARCHAR(191) NULL,
    `assignedToName` VARCHAR(191) NULL,
    `slaDueDate` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SupportTicket_ticketNumber_key`(`ticketNumber`),
    INDEX `SupportTicket_ticketNumber_idx`(`ticketNumber`),
    INDEX `SupportTicket_status_idx`(`status`),
    INDEX `SupportTicket_priority_idx`(`priority`),
    INDEX `SupportTicket_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TicketComment` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `authorRole` VARCHAR(191) NOT NULL DEFAULT 'AGENT',
    `isInternal` BOOLEAN NOT NULL DEFAULT false,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TicketComment_ticketId_idx`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeArticle` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'General',
    `content` LONGTEXT NOT NULL,
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'INTERNAL',
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KnowledgeArticle_slug_key`(`slug`),
    INDEX `KnowledgeArticle_slug_idx`(`slug`),
    INDEX `KnowledgeArticle_category_idx`(`category`),
    INDEX `KnowledgeArticle_visibility_idx`(`visibility`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RentalAsset` (
    `id` VARCHAR(191) NOT NULL,
    `assetCode` VARCHAR(191) NOT NULL,
    `serialNumber` VARCHAR(191) NOT NULL,
    `assetType` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `specs` TEXT NOT NULL,
    `purchaseCost` DOUBLE NOT NULL DEFAULT 0,
    `purchaseDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'AVAILABLE',
    `location` VARCHAR(191) NOT NULL DEFAULT 'Main Warehouse, Delhi NCR',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RentalAsset_assetCode_key`(`assetCode`),
    UNIQUE INDEX `RentalAsset_serialNumber_key`(`serialNumber`),
    INDEX `RentalAsset_assetCode_idx`(`assetCode`),
    INDEX `RentalAsset_serialNumber_idx`(`serialNumber`),
    INDEX `RentalAsset_status_idx`(`status`),
    INDEX `RentalAsset_assetType_idx`(`assetType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RentalOrder` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `billingCycle` VARCHAR(191) NOT NULL DEFAULT 'MONTHLY',
    `monthlyRate` DOUBLE NOT NULL,
    `securityDeposit` DOUBLE NOT NULL DEFAULT 0,
    `deliveryAddress` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `agreementRef` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RentalOrder_orderNumber_key`(`orderNumber`),
    INDEX `RentalOrder_orderNumber_idx`(`orderNumber`),
    INDEX `RentalOrder_status_idx`(`status`),
    INDEX `RentalOrder_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RentalOrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `rentalOrderId` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `rate` DOUBLE NOT NULL,
    `returnedAt` DATETIME(3) NULL,

    INDEX `RentalOrderItem_rentalOrderId_idx`(`rentalOrderId`),
    INDEX `RentalOrderItem_assetId_idx`(`assetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AMCContract` (
    `id` VARCHAR(191) NOT NULL,
    `amcNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `contractTitle` VARCHAR(191) NOT NULL,
    `coveredDevices` INTEGER NOT NULL DEFAULT 1,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `renewalDate` DATETIME(3) NOT NULL,
    `visitFrequency` VARCHAR(191) NOT NULL DEFAULT 'MONTHLY',
    `replacementSLA` VARCHAR(191) NOT NULL DEFAULT '24_HOURS',
    `contractValue` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `engineerName` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AMCContract_amcNumber_key`(`amcNumber`),
    INDEX `AMCContract_amcNumber_idx`(`amcNumber`),
    INDEX `AMCContract_status_idx`(`status`),
    INDEX `AMCContract_renewalDate_idx`(`renewalDate`),
    INDEX `AMCContract_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssetMaintenance` (
    `id` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `issue` TEXT NOT NULL,
    `repairAction` TEXT NULL,
    `cost` DOUBLE NOT NULL DEFAULT 0,
    `technician` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'IN_PROGRESS',
    `loggedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,

    INDEX `AssetMaintenance_assetId_idx`(`assetId`),
    INDEX `AssetMaintenance_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaaSProduct` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SaaSProduct_code_key`(`code`),
    INDEX `SaaSProduct_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaaSPlan` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `billingCycle` VARCHAR(191) NOT NULL DEFAULT 'MONTHLY',
    `price` DOUBLE NOT NULL,
    `features` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SaaSPlan_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaaSSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `renewalDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `price` DOUBLE NOT NULL,
    `autoRenew` BOOLEAN NOT NULL DEFAULT true,
    `externalSubId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SaaSSubscription_customerId_idx`(`customerId`),
    INDEX `SaaSSubscription_productId_idx`(`productId`),
    INDEX `SaaSSubscription_status_idx`(`status`),
    INDEX `SaaSSubscription_renewalDate_idx`(`renewalDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SoftwareLicense` (
    `id` VARCHAR(191) NOT NULL,
    `licenseKey` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `productId` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NULL,
    `activationLimit` INTEGER NOT NULL DEFAULT 1,
    `activationsCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SoftwareLicense_licenseKey_key`(`licenseKey`),
    INDEX `SoftwareLicense_licenseKey_idx`(`licenseKey`),
    INDEX `SoftwareLicense_status_idx`(`status`),
    INDEX `SoftwareLicense_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowRule` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'CRM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `version` INTEGER NOT NULL DEFAULT 1,
    `parentWorkflowId` VARCHAR(191) NULL,
    `trigger` VARCHAR(191) NOT NULL,
    `triggerConfig` TEXT NULL,
    `nodes` LONGTEXT NULL,
    `edges` LONGTEXT NULL,
    `conditions` TEXT NULL,
    `actions` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isTemplate` BOOLEAN NOT NULL DEFAULT false,
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `totalExecutions` INTEGER NOT NULL DEFAULT 0,
    `successfulExecutions` INTEGER NOT NULL DEFAULT 0,
    `failedExecutions` INTEGER NOT NULL DEFAULT 0,
    `lastExecutedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WorkflowRule_trigger_idx`(`trigger`),
    INDEX `WorkflowRule_status_idx`(`status`),
    INDEX `WorkflowRule_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowExecution` (
    `id` VARCHAR(191) NOT NULL,
    `workflowId` VARCHAR(191) NOT NULL,
    `workflowVersion` INTEGER NOT NULL DEFAULT 1,
    `triggerEvent` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `triggerPayload` LONGTEXT NULL,
    `idempotencyKey` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `stepCount` INTEGER NOT NULL DEFAULT 0,
    `currentStepId` VARCHAR(191) NULL,
    `errorLog` LONGTEXT NULL,
    `durationMs` INTEGER NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `resumedAt` DATETIME(3) NULL,

    UNIQUE INDEX `WorkflowExecution_idempotencyKey_key`(`idempotencyKey`),
    INDEX `WorkflowExecution_workflowId_idx`(`workflowId`),
    INDEX `WorkflowExecution_status_idx`(`status`),
    INDEX `WorkflowExecution_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowExecutionStep` (
    `id` VARCHAR(191) NOT NULL,
    `executionId` VARCHAR(191) NOT NULL,
    `nodeId` VARCHAR(191) NOT NULL,
    `nodeType` VARCHAR(191) NOT NULL,
    `nodeName` VARCHAR(191) NOT NULL,
    `actionType` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `inputPayload` LONGTEXT NULL,
    `outputPayload` LONGTEXT NULL,
    `errorDetails` LONGTEXT NULL,
    `durationMs` INTEGER NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `executedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WorkflowExecutionStep_executionId_idx`(`executionId`),
    INDEX `WorkflowExecutionStep_nodeId_idx`(`nodeId`),
    INDEX `WorkflowExecutionStep_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowJob` (
    `id` VARCHAR(191) NOT NULL,
    `executionId` VARCHAR(191) NOT NULL,
    `workflowId` VARCHAR(191) NOT NULL,
    `nodeId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `runAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `priority` INTEGER NOT NULL DEFAULT 0,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `lastError` TEXT NULL,
    `lockedAt` DATETIME(3) NULL,
    `lockedBy` VARCHAR(191) NULL,
    `payload` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WorkflowJob_status_runAt_idx`(`status`, `runAt`),
    INDEX `WorkflowJob_executionId_idx`(`executionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SheetIntegration` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `spreadsheetId` VARCHAR(191) NOT NULL,
    `sheetTabName` VARCHAR(191) NOT NULL DEFAULT 'Sheet1',
    `columnMappings` TEXT NOT NULL,
    `syncDirection` VARCHAR(191) NOT NULL DEFAULT 'INBOUND',
    `lastSyncAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NOT_CONFIGURED',
    `logs` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `secretKey` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WebhookSubscription_event_idx`(`event`),
    INDEX `WebhookSubscription_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookDeliveryLog` (
    `id` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `payload` TEXT NOT NULL,
    `responseCode` INTEGER NULL,
    `responseBody` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DELIVERED',
    `deliveredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WebhookDeliveryLog_subscriptionId_idx`(`subscriptionId`),
    INDEX `WebhookDeliveryLog_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_idx`(`userId`),
    INDEX `Notification_isRead_idx`(`isRead`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `userEmail` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ActivityLog_userId_idx`(`userId`),
    INDEX `ActivityLog_entityType_idx`(`entityType`),
    INDEX `ActivityLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Media` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `altText` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Media_filename_idx`(`filename`),
    INDEX `Media_mimeType_idx`(`mimeType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `category` ENUM('COMPANY', 'SOCIAL', 'SEO', 'WEBSITE') NOT NULL DEFAULT 'COMPANY',
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Setting_key_key`(`key`),
    INDEX `Setting_key_idx`(`key`),
    INDEX `Setting_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatSession` (
    `id` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `userEmail` VARCHAR(191) NOT NULL,
    `userPhone` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    `lastMessage` TEXT NULL,
    `lastSender` ENUM('USER', 'ADMIN', 'SYSTEM') NOT NULL DEFAULT 'USER',
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ChatSession_userEmail_idx`(`userEmail`),
    INDEX `ChatSession_status_idx`(`status`),
    INDEX `ChatSession_createdAt_idx`(`createdAt`),
    INDEX `ChatSession_updatedAt_idx`(`updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `sender` ENUM('USER', 'ADMIN', 'SYSTEM') NOT NULL DEFAULT 'USER',
    `message` TEXT NOT NULL,
    `emailSent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatMessage_sessionId_idx`(`sessionId`),
    INDEX `ChatMessage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappConnection` (
    `id` VARCHAR(191) NOT NULL,
    `wabaId` VARCHAR(191) NULL,
    `phoneNumberId` VARCHAR(191) NOT NULL,
    `businessPhoneNumber` VARCHAR(191) NULL,
    `displayName` VARCHAR(191) NULL,
    `appId` VARCHAR(191) NULL,
    `appSecretEncrypted` TEXT NULL,
    `accessTokenEncrypted` TEXT NOT NULL,
    `verifyToken` VARCHAR(191) NOT NULL,
    `apiVersion` VARCHAR(191) NOT NULL DEFAULT 'v21.0',
    `status` VARCHAR(191) NOT NULL DEFAULT 'DISCONNECTED',
    `qualityRating` VARCHAR(191) NULL,
    `messagingLimit` VARCHAR(191) NULL,
    `connectionHealth` VARCHAR(191) NULL,
    `lastSuccessfulApiCall` DATETIME(3) NULL,
    `lastWebhookReceivedAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappWebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `metaEventId` VARCHAR(128) NULL,
    `eventType` VARCHAR(64) NOT NULL,
    `fromPhone` VARCHAR(32) NULL,
    `toPhone` VARCHAR(32) NULL,
    `messageType` VARCHAR(32) NULL,
    `payload` LONGTEXT NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    `error` TEXT NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `relatedContactId` VARCHAR(64) NULL,
    `relatedLeadId` VARCHAR(64) NULL,
    `relatedConversationId` VARCHAR(64) NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WhatsappWebhookEvent_metaEventId_key`(`metaEventId`),
    INDEX `WhatsappWebhookEvent_metaEventId_idx`(`metaEventId`),
    INDEX `WhatsappWebhookEvent_eventType_idx`(`eventType`),
    INDEX `WhatsappWebhookEvent_fromPhone_idx`(`fromPhone`),
    INDEX `WhatsappWebhookEvent_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappConversation` (
    `id` VARCHAR(191) NOT NULL,
    `waNumber` VARCHAR(32) NOT NULL,
    `customerName` VARCHAR(191) NULL,
    `contactId` VARCHAR(64) NULL,
    `leadId` VARCHAR(64) NULL,
    `customerId` VARCHAR(64) NULL,
    `assignedUserId` VARCHAR(64) NULL,
    `assignedTeam` VARCHAR(191) NULL DEFAULT 'Sales',
    `status` VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    `priority` VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    `unreadCount` INTEGER NOT NULL DEFAULT 0,
    `lastMessageText` TEXT NULL,
    `lastMessageSender` VARCHAR(191) NOT NULL DEFAULT 'CONTACT',
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastCustomerActivityAt` DATETIME(3) NULL,
    `labels` TEXT NULL,
    `internalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WhatsappConversation_waNumber_idx`(`waNumber`),
    INDEX `WhatsappConversation_status_idx`(`status`),
    INDEX `WhatsappConversation_assignedUserId_idx`(`assignedUserId`),
    INDEX `WhatsappConversation_leadId_idx`(`leadId`),
    INDEX `WhatsappConversation_contactId_idx`(`contactId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappMessage` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(64) NOT NULL,
    `metaMessageId` VARCHAR(128) NULL,
    `direction` VARCHAR(16) NOT NULL,
    `senderType` VARCHAR(16) NOT NULL,
    `senderUserId` VARCHAR(64) NULL,
    `type` VARCHAR(32) NOT NULL DEFAULT 'text',
    `textBody` TEXT NULL,
    `mediaUrl` TEXT NULL,
    `mimeType` VARCHAR(128) NULL,
    `mediaCaption` TEXT NULL,
    `templateName` VARCHAR(128) NULL,
    `templateVariables` TEXT NULL,
    `interactiveData` TEXT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'SENT',
    `failureReason` TEXT NULL,
    `errorCode` VARCHAR(32) NULL,
    `campaignId` VARCHAR(64) NULL,
    `sentAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WhatsappMessage_metaMessageId_key`(`metaMessageId`),
    INDEX `WhatsappMessage_conversationId_idx`(`conversationId`),
    INDEX `WhatsappMessage_metaMessageId_idx`(`metaMessageId`),
    INDEX `WhatsappMessage_status_idx`(`status`),
    INDEX `WhatsappMessage_campaignId_idx`(`campaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `metaTemplateId` VARCHAR(128) NULL,
    `name` VARCHAR(100) NOT NULL,
    `language` VARCHAR(20) NOT NULL DEFAULT 'en_US',
    `category` VARCHAR(50) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
    `headerType` VARCHAR(32) NULL,
    `headerContent` TEXT NULL,
    `bodyText` TEXT NOT NULL,
    `footerText` TEXT NULL,
    `buttonsConfig` TEXT NULL,
    `variablesJson` TEXT NULL,
    `crmMappingJson` TEXT NULL,
    `rejectionReason` TEXT NULL,
    `lastSyncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhatsappTemplate_metaTemplateId_key`(`metaTemplateId`),
    INDEX `WhatsappTemplate_name_language_idx`(`name`, `language`),
    INDEX `WhatsappTemplate_status_idx`(`status`),
    INDEX `WhatsappTemplate_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappCampaign` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(32) NOT NULL DEFAULT 'MARKETING',
    `status` VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    `templateId` VARCHAR(64) NOT NULL,
    `variableMapping` TEXT NOT NULL,
    `audienceSource` VARCHAR(64) NOT NULL,
    `audienceFilter` TEXT NULL,
    `totalAudience` INTEGER NOT NULL DEFAULT 0,
    `validCount` INTEGER NOT NULL DEFAULT 0,
    `suppressedCount` INTEGER NOT NULL DEFAULT 0,
    `attemptedCount` INTEGER NOT NULL DEFAULT 0,
    `sentCount` INTEGER NOT NULL DEFAULT 0,
    `deliveredCount` INTEGER NOT NULL DEFAULT 0,
    `readCount` INTEGER NOT NULL DEFAULT 0,
    `failedCount` INTEGER NOT NULL DEFAULT 0,
    `replyCount` INTEGER NOT NULL DEFAULT 0,
    `scheduledAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WhatsappCampaign_status_idx`(`status`),
    INDEX `WhatsappCampaign_templateId_idx`(`templateId`),
    INDEX `WhatsappCampaign_scheduledAt_idx`(`scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappCampaignRecipient` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(64) NOT NULL,
    `phone` VARCHAR(32) NOT NULL,
    `contactId` VARCHAR(64) NULL,
    `leadId` VARCHAR(64) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    `metaMessageId` VARCHAR(128) NULL,
    `providerMessageId` VARCHAR(128) NULL,
    `errorMessage` TEXT NULL,
    `errorCode` VARCHAR(32) NULL,
    `providerErrorCode` VARCHAR(32) NULL,
    `providerErrorMessage` TEXT NULL,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `lastAttemptAt` DATETIME(3) NULL,
    `nextRetryAt` DATETIME(3) NULL,
    `variablesSent` TEXT NULL,
    `sentAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `repliedAt` DATETIME(3) NULL,

    INDEX `WhatsappCampaignRecipient_campaignId_status_idx`(`campaignId`, `status`),
    INDEX `WhatsappCampaignRecipient_phone_idx`(`phone`),
    INDEX `WhatsappCampaignRecipient_metaMessageId_idx`(`metaMessageId`),
    INDEX `WhatsappCampaignRecipient_nextRetryAt_idx`(`nextRetryAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappSuppression` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(32) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'OPTED_OUT',
    `reason` VARCHAR(64) NULL,
    `source` VARCHAR(64) NOT NULL,
    `optedOutAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,

    UNIQUE INDEX `WhatsappSuppression_phone_key`(`phone`),
    INDEX `WhatsappSuppression_phone_idx`(`phone`),
    INDEX `WhatsappSuppression_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoogleConnection` (
    `id` VARCHAR(191) NOT NULL,
    `authType` VARCHAR(32) NOT NULL DEFAULT 'SERVICE_ACCOUNT',
    `clientEmail` VARCHAR(191) NULL,
    `privateKeyEncrypted` TEXT NULL,
    `refreshTokenEncrypted` TEXT NULL,
    `accessToken` TEXT NULL,
    `tokenExpiresAt` DATETIME(3) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'CONNECTED',
    `lastTestedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoogleSheetSyncConfig` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `spreadsheetId` VARCHAR(128) NOT NULL,
    `sheetName` VARCHAR(128) NOT NULL DEFAULT 'Sheet1',
    `syncDirection` VARCHAR(32) NOT NULL DEFAULT 'INBOUND',
    `columnMapping` TEXT NOT NULL,
    `defaultPipelineId` VARCHAR(64) NULL,
    `defaultStageId` VARCHAR(64) NULL,
    `defaultSource` VARCHAR(128) NOT NULL DEFAULT 'Google Sheets Sync',
    `defaultAssigneeId` VARCHAR(64) NULL,
    `assignmentStrategy` VARCHAR(32) NOT NULL DEFAULT 'ROUND_ROBIN',
    `tags` VARCHAR(191) NULL,
    `dedupField` VARCHAR(32) NOT NULL DEFAULT 'PHONE_OR_EMAIL',
    `duplicateAction` VARCHAR(32) NOT NULL DEFAULT 'UPDATE',
    `enableAutoWhatsApp` BOOLEAN NOT NULL DEFAULT false,
    `whatsAppTemplateId` VARCHAR(64) NULL,
    `autoSyncIntervalMinutes` INTEGER NOT NULL DEFAULT 15,
    `lastSyncAt` DATETIME(3) NULL,
    `nextSyncAt` DATETIME(3) NULL,
    `lastSyncStatus` VARCHAR(32) NULL DEFAULT 'IDLE',
    `lastSyncDuration` INTEGER NULL,
    `lastSuccessfulSyncAt` DATETIME(3) NULL,
    `rowsProcessed` INTEGER NOT NULL DEFAULT 0,
    `rowsCreated` INTEGER NOT NULL DEFAULT 0,
    `rowsUpdated` INTEGER NOT NULL DEFAULT 0,
    `rowsSkipped` INTEGER NOT NULL DEFAULT 0,
    `rowsFailed` INTEGER NOT NULL DEFAULT 0,
    `lastRowImported` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GoogleSheetSyncConfig_status_idx`(`status`),
    INDEX `GoogleSheetSyncConfig_spreadsheetId_idx`(`spreadsheetId`),
    INDEX `GoogleSheetSyncConfig_nextSyncAt_idx`(`nextSyncAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoogleSheetSyncLog` (
    `id` VARCHAR(191) NOT NULL,
    `configId` VARCHAR(64) NOT NULL,
    `syncType` VARCHAR(32) NOT NULL DEFAULT 'MANUAL',
    `rowsScanned` INTEGER NOT NULL DEFAULT 0,
    `leadsCreated` INTEGER NOT NULL DEFAULT 0,
    `leadsUpdated` INTEGER NOT NULL DEFAULT 0,
    `duplicatesSkipped` INTEGER NOT NULL DEFAULT 0,
    `errorsCount` INTEGER NOT NULL DEFAULT 0,
    `details` LONGTEXT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',

    INDEX `GoogleSheetSyncLog_configId_idx`(`configId`),
    INDEX `GoogleSheetSyncLog_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BackgroundJob` (
    `id` VARCHAR(128) NOT NULL,
    `queue` VARCHAR(64) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    `payload` LONGTEXT NOT NULL,
    `result` LONGTEXT NULL,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `scheduledAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `failedAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `lockedAt` DATETIME(3) NULL,
    `lockedBy` VARCHAR(128) NULL,
    `correlationId` VARCHAR(128) NULL,
    `entityType` VARCHAR(64) NULL,
    `entityId` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BackgroundJob_queue_status_idx`(`queue`, `status`),
    INDEX `BackgroundJob_scheduledAt_idx`(`scheduledAt`),
    INDEX `BackgroundJob_lockedAt_idx`(`lockedAt`),
    INDEX `BackgroundJob_correlationId_idx`(`correlationId`),
    INDEX `BackgroundJob_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkerHeartbeat` (
    `id` VARCHAR(64) NOT NULL,
    `workerId` VARCHAR(128) NOT NULL,
    `hostname` VARCHAR(128) NOT NULL,
    `pid` INTEGER NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
    `activeJobsCount` INTEGER NOT NULL DEFAULT 0,
    `lastHeartbeatAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `version` VARCHAR(32) NULL,

    UNIQUE INDEX `WorkerHeartbeat_workerId_key`(`workerId`),
    INDEX `WorkerHeartbeat_status_idx`(`status`),
    INDEX `WorkerHeartbeat_lastHeartbeatAt_idx`(`lastHeartbeatAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffTask` (
    `id` VARCHAR(64) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `priority` VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(32) NOT NULL DEFAULT 'TODO',
    `dueDate` DATETIME(3) NULL,
    `completionNote` TEXT NULL,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `recurringTime` VARCHAR(191) NULL,
    `lastResetAt` DATETIME(3) NULL,
    `createdByUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffTaskAssignee` (
    `id` VARCHAR(64) NOT NULL,
    `taskId` VARCHAR(64) NOT NULL,
    `employeeId` VARCHAR(64) NULL,
    `employeeName` VARCHAR(191) NOT NULL,
    `employeeCode` VARCHAR(191) NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffTaskReply` (
    `id` VARCHAR(64) NOT NULL,
    `taskId` VARCHAR(64) NOT NULL,
    `authorId` VARCHAR(64) NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `authorRole` VARCHAR(32) NOT NULL DEFAULT 'EMPLOYEE',
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeSession` (
    `id` VARCHAR(64) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` TEXT NULL,
    `loginAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `logoutAt` DATETIME(3) NULL,
    `lastActiveAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(32) NOT NULL DEFAULT 'ONLINE',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamChat` (
    `id` VARCHAR(64) NOT NULL,
    `type` VARCHAR(32) NOT NULL DEFAULT 'DIRECT',
    `name` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamChatParticipant` (
    `id` VARCHAR(64) NOT NULL,
    `chatId` VARCHAR(64) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(32) NOT NULL DEFAULT 'MEMBER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamChatMessage` (
    `id` VARCHAR(64) NOT NULL,
    `chatId` VARCHAR(64) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `sharedLeadId` VARCHAR(64) NULL,
    `sharedTaskId` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamChatMessageRead` (
    `id` VARCHAR(64) NOT NULL,
    `messageId` VARCHAR(64) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_appRoleId_fkey` FOREIGN KEY (`appRoleId`) REFERENCES `AppRole`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppRolePermission` ADD CONSTRAINT `AppRolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `AppRole`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppRolePermission` ADD CONSTRAINT `AppRolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeoPageRedirect` ADD CONSTRAINT `SeoPageRedirect_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `SeoLandingPage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Site` ADD CONSTRAINT `Site_businessUnitId_fkey` FOREIGN KEY (`businessUnitId`) REFERENCES `BusinessUnit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteDomain` ADD CONSTRAINT `SiteDomain_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enquiry` ADD CONSTRAINT `Enquiry_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enquiry` ADD CONSTRAINT `Enquiry_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enquiry` ADD CONSTRAINT `Enquiry_assignedEmployeeId_fkey` FOREIGN KEY (`assignedEmployeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enquiry` ADD CONSTRAINT `Enquiry_wonDealId_fkey` FOREIGN KEY (`wonDealId`) REFERENCES `Deal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enquiry` ADD CONSTRAINT `Enquiry_assignedTo_fkey` FOREIGN KEY (`assignedTo`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enquiry` ADD CONSTRAINT `Enquiry_businessUnitId_fkey` FOREIGN KEY (`businessUnitId`) REFERENCES `BusinessUnit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enquiry` ADD CONSTRAINT `Enquiry_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnquiryNote` ADD CONSTRAINT `EnquiryNote_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `Enquiry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnquiryNote` ADD CONSTRAINT `EnquiryNote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_businessUnitId_fkey` FOREIGN KEY (`businessUnitId`) REFERENCES `BusinessUnit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PipelineStage` ADD CONSTRAINT `PipelineStage_pipelineId_fkey` FOREIGN KEY (`pipelineId`) REFERENCES `Pipeline`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deal` ADD CONSTRAINT `Deal_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deal` ADD CONSTRAINT `Deal_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deal` ADD CONSTRAINT `Deal_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deal` ADD CONSTRAINT `Deal_pipelineId_fkey` FOREIGN KEY (`pipelineId`) REFERENCES `Pipeline`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deal` ADD CONSTRAINT `Deal_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `PipelineStage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deal` ADD CONSTRAINT `Deal_assignedEmployeeId_fkey` FOREIGN KEY (`assignedEmployeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUp` ADD CONSTRAINT `FollowUp_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `Deal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUp` ADD CONSTRAINT `FollowUp_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUp` ADD CONSTRAINT `FollowUp_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `Enquiry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUp` ADD CONSTRAINT `FollowUp_assignedEmployeeId_fkey` FOREIGN KEY (`assignedEmployeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DealStageHistory` ADD CONSTRAINT `DealStageHistory_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `Deal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DealItem` ADD CONSTRAINT `DealItem_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `Deal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomFieldValue` ADD CONSTRAINT `CustomFieldValue_fieldId_fkey` FOREIGN KEY (`fieldId`) REFERENCES `CustomFieldDefinition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EntityTag` ADD CONSTRAINT `EntityTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Quotation` ADD CONSTRAINT `Quotation_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `Deal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuotationItem` ADD CONSTRAINT `QuotationItem_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `Quotation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proposal` ADD CONSTRAINT `Proposal_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `Enquiry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proposal` ADD CONSTRAINT `Proposal_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `Deal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProposalItem` ADD CONSTRAINT `ProposalItem_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `Proposal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProposalAdditionalCharge` ADD CONSTRAINT `ProposalAdditionalCharge_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `Proposal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contract` ADD CONSTRAINT `Contract_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `Deal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_businessUnitId_fkey` FOREIGN KEY (`businessUnitId`) REFERENCES `BusinessUnit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceItem` ADD CONSTRAINT `InvoiceItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_paymentLinkId_fkey` FOREIGN KEY (`paymentLinkId`) REFERENCES `PaymentLink`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_salesEmployeeId_fkey` FOREIGN KEY (`salesEmployeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_businessUnitId_fkey` FOREIGN KEY (`businessUnitId`) REFERENCES `BusinessUnit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentLink` ADD CONSTRAINT `PaymentLink_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentLink` ADD CONSTRAINT `PaymentLink_salesEmployeeId_fkey` FOREIGN KEY (`salesEmployeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentLink` ADD CONSTRAINT `PaymentLink_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentLink` ADD CONSTRAINT `PaymentLink_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentLink` ADD CONSTRAINT `PaymentLink_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentLink` ADD CONSTRAINT `PaymentLink_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `Enquiry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentLink` ADD CONSTRAINT `PaymentLink_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `Deal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentLink` ADD CONSTRAINT `PaymentLink_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentLink` ADD CONSTRAINT `PaymentLink_projectRecordId_fkey` FOREIGN KEY (`projectRecordId`) REFERENCES `ProjectRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `Enquiry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `Deal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_projectRecordId_fkey` FOREIGN KEY (`projectRecordId`) REFERENCES `ProjectRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_hostEmployeeId_fkey` FOREIGN KEY (`hostEmployeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MeetingParticipant` ADD CONSTRAINT `MeetingParticipant_meetingId_fkey` FOREIGN KEY (`meetingId`) REFERENCES `Meeting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MeetingParticipant` ADD CONSTRAINT `MeetingParticipant_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_businessUnitId_fkey` FOREIGN KEY (`businessUnitId`) REFERENCES `BusinessUnit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectRecord` ADD CONSTRAINT `ProjectRecord_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Milestone` ADD CONSTRAINT `Milestone_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ProjectRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ProjectRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `Milestone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timesheet` ADD CONSTRAINT `Timesheet_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ProjectRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timesheet` ADD CONSTRAINT `Timesheet_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_headId_fkey` FOREIGN KEY (`headId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_designationId_fkey` FOREIGN KEY (`designationId`) REFERENCES `Designation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_appRoleId_fkey` FOREIGN KEY (`appRoleId`) REFERENCES `AppRole`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeBusinessUnit` ADD CONSTRAINT `EmployeeBusinessUnit_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeBusinessUnit` ADD CONSTRAINT `EmployeeBusinessUnit_businessUnitId_fkey` FOREIGN KEY (`businessUnitId`) REFERENCES `BusinessUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceRecord` ADD CONSTRAINT `AttendanceRecord_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegularizationRequest` ADD CONSTRAINT `RegularizationRequest_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegularizationRequest` ADD CONSTRAINT `RegularizationRequest_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveBalance` ADD CONSTRAINT `LeaveBalance_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollRecord` ADD CONSTRAINT `PayrollRecord_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TicketComment` ADD CONSTRAINT `TicketComment_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `SupportTicket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RentalOrder` ADD CONSTRAINT `RentalOrder_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RentalOrderItem` ADD CONSTRAINT `RentalOrderItem_rentalOrderId_fkey` FOREIGN KEY (`rentalOrderId`) REFERENCES `RentalOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RentalOrderItem` ADD CONSTRAINT `RentalOrderItem_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `RentalAsset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AMCContract` ADD CONSTRAINT `AMCContract_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetMaintenance` ADD CONSTRAINT `AssetMaintenance_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `RentalAsset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaaSPlan` ADD CONSTRAINT `SaaSPlan_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `SaaSProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaaSSubscription` ADD CONSTRAINT `SaaSSubscription_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaaSSubscription` ADD CONSTRAINT `SaaSSubscription_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `SaaSProduct`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaaSSubscription` ADD CONSTRAINT `SaaSSubscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SaaSPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SoftwareLicense` ADD CONSTRAINT `SoftwareLicense_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `SaaSProduct`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowExecution` ADD CONSTRAINT `WorkflowExecution_workflowId_fkey` FOREIGN KEY (`workflowId`) REFERENCES `WorkflowRule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowExecutionStep` ADD CONSTRAINT `WorkflowExecutionStep_executionId_fkey` FOREIGN KEY (`executionId`) REFERENCES `WorkflowExecution`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowJob` ADD CONSTRAINT `WorkflowJob_executionId_fkey` FOREIGN KEY (`executionId`) REFERENCES `WorkflowExecution`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowJob` ADD CONSTRAINT `WorkflowJob_workflowId_fkey` FOREIGN KEY (`workflowId`) REFERENCES `WorkflowRule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebhookDeliveryLog` ADD CONSTRAINT `WebhookDeliveryLog_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `WebhookSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ChatSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsappMessage` ADD CONSTRAINT `WhatsappMessage_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `WhatsappConversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsappCampaignRecipient` ADD CONSTRAINT `WhatsappCampaignRecipient_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `WhatsappCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoogleSheetSyncLog` ADD CONSTRAINT `GoogleSheetSyncLog_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `GoogleSheetSyncConfig`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffTaskAssignee` ADD CONSTRAINT `StaffTaskAssignee_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `StaffTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffTaskReply` ADD CONSTRAINT `StaffTaskReply_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `StaffTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeSession` ADD CONSTRAINT `EmployeeSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamChatParticipant` ADD CONSTRAINT `TeamChatParticipant_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `TeamChat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamChatParticipant` ADD CONSTRAINT `TeamChatParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamChatMessage` ADD CONSTRAINT `TeamChatMessage_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `TeamChat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamChatMessage` ADD CONSTRAINT `TeamChatMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamChatMessageRead` ADD CONSTRAINT `TeamChatMessageRead_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `TeamChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamChatMessageRead` ADD CONSTRAINT `TeamChatMessageRead_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

