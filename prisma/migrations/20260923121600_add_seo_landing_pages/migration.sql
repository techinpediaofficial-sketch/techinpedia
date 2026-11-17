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

-- AddForeignKey
ALTER TABLE `SeoPageRedirect` ADD CONSTRAINT `SeoPageRedirect_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `SeoLandingPage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
