<?php
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set("display_errors", 1);

$dbUser = "xxfeszkb_techlynk";
$dbPass = "Newpass@12346";
$dbName = "xxfeszkb_techlynk";
$dbHost = "localhost";

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    
    // 1. Run Schema SQL
    $schemaStatements = array_filter(array_map("trim", explode(";", "-- CreateTable\nCREATE TABLE `User` (\n    `id` VARCHAR(191) NOT NULL,\n    `name` VARCHAR(191) NOT NULL,\n    `email` VARCHAR(191) NOT NULL,\n    `password` VARCHAR(191) NOT NULL,\n    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR') NOT NULL DEFAULT 'ADMIN',\n    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',\n    `mustChangePassword` BOOLEAN NOT NULL DEFAULT true,\n    `failedLoginAttempts` INTEGER NOT NULL DEFAULT 0,\n    `lockedUntil` DATETIME(3) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    UNIQUE INDEX `User_email_key`(`email`),\n    INDEX `User_email_idx`(`email`),\n    INDEX `User_role_idx`(`role`),\n    INDEX `User_status_idx`(`status`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- CreateTable\nCREATE TABLE `Service` (\n    `id` VARCHAR(191) NOT NULL,\n    `title` VARCHAR(191) NOT NULL,\n    `slug` VARCHAR(191) NOT NULL,\n    `shortDescription` TEXT NOT NULL,\n    `description` LONGTEXT NOT NULL,\n    `icon` VARCHAR(191) NOT NULL DEFAULT 'Code',\n    `technologies` TEXT NOT NULL,\n    `image` VARCHAR(191) NULL,\n    `seoTitle` VARCHAR(191) NULL,\n    `seoDescription` TEXT NULL,\n    `displayOrder` INTEGER NOT NULL DEFAULT 0,\n    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    UNIQUE INDEX `Service_slug_key`(`slug`),\n    INDEX `Service_slug_idx`(`slug`),\n    INDEX `Service_status_idx`(`status`),\n    INDEX `Service_displayOrder_idx`(`displayOrder`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- CreateTable\nCREATE TABLE `Project` (\n    `id` VARCHAR(191) NOT NULL,\n    `title` VARCHAR(191) NOT NULL,\n    `slug` VARCHAR(191) NOT NULL,\n    `category` VARCHAR(191) NOT NULL,\n    `clientType` VARCHAR(191) NULL,\n    `shortDesc` TEXT NOT NULL,\n    `description` LONGTEXT NOT NULL,\n    `problem` TEXT NULL,\n    `solution` TEXT NULL,\n    `features` TEXT NULL,\n    `technologies` TEXT NOT NULL,\n    `results` TEXT NULL,\n    `featuredImage` VARCHAR(191) NOT NULL,\n    `gallery` TEXT NULL,\n    `featured` BOOLEAN NOT NULL DEFAULT false,\n    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',\n    `displayOrder` INTEGER NOT NULL DEFAULT 0,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    UNIQUE INDEX `Project_slug_key`(`slug`),\n    INDEX `Project_slug_idx`(`slug`),\n    INDEX `Project_category_idx`(`category`),\n    INDEX `Project_status_idx`(`status`),\n    INDEX `Project_featured_idx`(`featured`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- CreateTable\nCREATE TABLE `BlogPost` (\n    `id` VARCHAR(191) NOT NULL,\n    `title` VARCHAR(191) NOT NULL,\n    `slug` VARCHAR(191) NOT NULL,\n    `excerpt` TEXT NOT NULL,\n    `content` LONGTEXT NOT NULL,\n    `featuredImage` VARCHAR(191) NULL,\n    `category` VARCHAR(191) NOT NULL,\n    `tags` VARCHAR(191) NULL,\n    `author` VARCHAR(191) NOT NULL DEFAULT 'TechInPedia Team',\n    `seoTitle` VARCHAR(191) NULL,\n    `seoDescription` TEXT NULL,\n    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',\n    `publishedAt` DATETIME(3) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    UNIQUE INDEX `BlogPost_slug_key`(`slug`),\n    INDEX `BlogPost_slug_idx`(`slug`),\n    INDEX `BlogPost_category_idx`(`category`),\n    INDEX `BlogPost_status_idx`(`status`),\n    INDEX `BlogPost_publishedAt_idx`(`publishedAt`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- CreateTable\nCREATE TABLE `Testimonial` (\n    `id` VARCHAR(191) NOT NULL,\n    `clientName` VARCHAR(191) NOT NULL,\n    `company` VARCHAR(191) NOT NULL,\n    `designation` VARCHAR(191) NOT NULL,\n    `testimonial` TEXT NOT NULL,\n    `image` VARCHAR(191) NULL,\n    `rating` INTEGER NOT NULL DEFAULT 5,\n    `displayOrder` INTEGER NOT NULL DEFAULT 0,\n    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    INDEX `Testimonial_status_idx`(`status`),\n    INDEX `Testimonial_displayOrder_idx`(`displayOrder`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- CreateTable\nCREATE TABLE `Faq` (\n    `id` VARCHAR(191) NOT NULL,\n    `question` TEXT NOT NULL,\n    `answer` TEXT NOT NULL,\n    `category` VARCHAR(191) NOT NULL DEFAULT 'General',\n    `displayOrder` INTEGER NOT NULL DEFAULT 0,\n    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    INDEX `Faq_category_idx`(`category`),\n    INDEX `Faq_status_idx`(`status`),\n    INDEX `Faq_displayOrder_idx`(`displayOrder`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- CreateTable\nCREATE TABLE `Enquiry` (\n    `id` VARCHAR(191) NOT NULL,\n    `name` VARCHAR(191) NOT NULL,\n    `email` VARCHAR(191) NOT NULL,\n    `phone` VARCHAR(191) NULL,\n    `company` VARCHAR(191) NULL,\n    `website` VARCHAR(191) NULL,\n    `service` VARCHAR(191) NULL,\n    `projectType` VARCHAR(191) NULL,\n    `budget` VARCHAR(191) NULL,\n    `timeline` VARCHAR(191) NULL,\n    `message` TEXT NOT NULL,\n    `source` VARCHAR(191) NOT NULL DEFAULT 'Contact Page',\n    `utmSource` VARCHAR(191) NULL,\n    `utmMedium` VARCHAR(191) NULL,\n    `utmCampaign` VARCHAR(191) NULL,\n    `utmContent` VARCHAR(191) NULL,\n    `status` ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST', 'ARCHIVED') NOT NULL DEFAULT 'NEW',\n    `assignedTo` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    INDEX `Enquiry_email_idx`(`email`),\n    INDEX `Enquiry_status_idx`(`status`),\n    INDEX `Enquiry_assignedTo_idx`(`assignedTo`),\n    INDEX `Enquiry_createdAt_idx`(`createdAt`),\n    INDEX `Enquiry_source_idx`(`source`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- CreateTable\nCREATE TABLE `EnquiryNote` (\n    `id` VARCHAR(191) NOT NULL,\n    `enquiryId` VARCHAR(191) NOT NULL,\n    `userId` VARCHAR(191) NOT NULL,\n    `note` TEXT NOT NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `EnquiryNote_enquiryId_idx`(`enquiryId`),\n    INDEX `EnquiryNote_userId_idx`(`userId`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- CreateTable\nCREATE TABLE `ActivityLog` (\n    `id` VARCHAR(191) NOT NULL,\n    `userId` VARCHAR(191) NULL,\n    `userEmail` VARCHAR(191) NULL,\n    `action` VARCHAR(191) NOT NULL,\n    `entityType` VARCHAR(191) NOT NULL,\n    `entityId` VARCHAR(191) NULL,\n    `metadata` TEXT NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `ActivityLog_userId_idx`(`userId`),\n    INDEX `ActivityLog_entityType_idx`(`entityType`),\n    INDEX `ActivityLog_createdAt_idx`(`createdAt`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- CreateTable\nCREATE TABLE `Media` (\n    `id` VARCHAR(191) NOT NULL,\n    `filename` VARCHAR(191) NOT NULL,\n    `url` VARCHAR(191) NOT NULL,\n    `mimeType` VARCHAR(191) NOT NULL,\n    `size` INTEGER NOT NULL,\n    `width` INTEGER NULL,\n    `height` INTEGER NULL,\n    `altText` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `Media_filename_idx`(`filename`),\n    INDEX `Media_mimeType_idx`(`mimeType`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- CreateTable\nCREATE TABLE `Setting` (\n    `id` VARCHAR(191) NOT NULL,\n    `key` VARCHAR(191) NOT NULL,\n    `value` TEXT NOT NULL,\n    `category` ENUM('COMPANY', 'SOCIAL', 'SEO', 'WEBSITE') NOT NULL DEFAULT 'COMPANY',\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    UNIQUE INDEX `Setting_key_key`(`key`),\n    INDEX `Setting_key_idx`(`key`),\n    INDEX `Setting_category_idx`(`category`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- CreateTable\nCREATE TABLE `ChatSession` (\n    `id` VARCHAR(191) NOT NULL,\n    `userName` VARCHAR(191) NOT NULL,\n    `userEmail` VARCHAR(191) NOT NULL,\n    `userPhone` VARCHAR(191) NULL,\n    `status` ENUM('ACTIVE', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',\n    `lastMessage` TEXT NULL,\n    `lastSender` ENUM('USER', 'ADMIN', 'SYSTEM') NOT NULL DEFAULT 'USER',\n    `ipAddress` VARCHAR(191) NULL,\n    `userAgent` VARCHAR(191) NULL,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n    `updatedAt` DATETIME(3) NOT NULL,\n\n    INDEX `ChatSession_userEmail_idx`(`userEmail`),\n    INDEX `ChatSession_status_idx`(`status`),\n    INDEX `ChatSession_createdAt_idx`(`createdAt`),\n    INDEX `ChatSession_updatedAt_idx`(`updatedAt`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- CreateTable\nCREATE TABLE `ChatMessage` (\n    `id` VARCHAR(191) NOT NULL,\n    `sessionId` VARCHAR(191) NOT NULL,\n    `sender` ENUM('USER', 'ADMIN', 'SYSTEM') NOT NULL DEFAULT 'USER',\n    `message` TEXT NOT NULL,\n    `emailSent` BOOLEAN NOT NULL DEFAULT false,\n    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n\n    INDEX `ChatMessage_sessionId_idx`(`sessionId`),\n    INDEX `ChatMessage_createdAt_idx`(`createdAt`),\n    PRIMARY KEY (`id`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\n-- AddForeignKey\nALTER TABLE `Enquiry` ADD CONSTRAINT `Enquiry_assignedTo_fkey` FOREIGN KEY (`assignedTo`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;\n\n-- AddForeignKey\nALTER TABLE `EnquiryNote` ADD CONSTRAINT `EnquiryNote_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `Enquiry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;\n\n-- AddForeignKey\nALTER TABLE `EnquiryNote` ADD CONSTRAINT `EnquiryNote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;\n\n-- AddForeignKey\nALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;\n\n-- AddForeignKey\nALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ChatSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;\n\n")));
    foreach ($schemaStatements as $stmt) {
        if (!empty($stmt)) {
            try {
                $pdo->exec($stmt);
            } catch (Exception $e) {
                // Ignore table exists errors
            }
        }
    }
    
    // 2. Run Seed Base SQL
    $baseStatements = array_filter(array_map("trim", explode(";", "INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `status`, `mustChangePassword`, `createdAt`, `updatedAt`) VALUES\n('super-admin-01', 'TechInPedia Admin', 'admin@techinpedia.in', '$2b$10$E6DEUwMAbvpNFTSsPx46lO5.S4mwZJoZK8qvRvl7E13SES4WEbxQy', 'SUPER_ADMIN', 'ACTIVE', 0, NOW(3), NOW(3))\nON DUPLICATE KEY UPDATE `password` = VALUES(`password`);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'company_name', 'TechInPedia India', 'COMPANY', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'company_tagline', 'We Build Digital Products That Move Businesses Forward', 'COMPANY', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'company_email', 'contact@techinpedia.in', 'COMPANY', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'company_phone', '+91 98765 43210', 'COMPANY', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'whatsapp_number', '919876543210', 'COMPANY', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'company_address', 'Cyber City, Tech Hub, Bengaluru, Karnataka, India', 'COMPANY', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'company_about', 'TechInPedia India is a high-performance digital product and software engineering agency delivering web applications, mobile solutions, custom SaaS, and enterprise software to global clients.', 'COMPANY', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'social_linkedin', 'https://linkedin.com/company/techinpedia-india', 'SOCIAL', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'social_github', 'https://github.com/techinpedia', 'SOCIAL', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'social_twitter', 'https://x.com/techinpedia', 'SOCIAL', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'social_instagram', 'https://www.instagram.com/techlynk.in/', 'SOCIAL', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'seo_default_title', 'TechInPedia India | Software Development & Digital Solutions Agency', 'SEO', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'seo_default_description', 'TechInPedia India builds custom web apps, mobile apps, SaaS platforms, and enterprise solutions. Websites & Apps That Grow Businesses.', 'SEO', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'seo_og_image', '/images/og-techinpedia.jpg', 'SEO', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'google_analytics_id', '', 'SEO', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'website_logo_text', 'TechInPedia', 'WEBSITE', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);\n\nINSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES\n(UUID(), 'website_footer_text', '\u00a9 2026 TechInPedia India. All rights reserved. Building scalable software solutions.', 'WEBSITE', NOW(3))\nON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);")));
    foreach ($baseStatements as $stmt) {
        if (!empty($stmt)) {
            try {
                $pdo->exec($stmt);
            } catch (Exception $e) {
                // Ignore duplicate errors
            }
        }
    }

    // 3. Run Seed Services SQL
    $serviceStatements = array_filter(array_map("trim", explode(";", "INSERT INTO `Service` (`id`, `title`, `slug`, `shortDescription`, `description`, `icon`, `technologies`, `seoTitle`, `seoDescription`, `displayOrder`, `status`, `createdAt`, `updatedAt`) VALUES\n(UUID(), 'Web Application Development', 'web-application-development', 'High-performance, responsive React & Next.js applications custom-engineered for business growth.', 'We architect and build enterprise-grade web applications that deliver lightning-fast performance, flawless mobile responsiveness, and intuitive UI/UX. Using modern frameworks like Next.js, Node.js, and modern cloud databases, we ensure your platform scales effortlessly as your user base expands.', 'Globe', '[\"React\",\"Next.js\",\"Node.js\",\"TypeScript\",\"Tailwind CSS\",\"MySQL\",\"GraphQL\"]', 'Custom Web Application Development Services | TechInPedia India', 'Build scalable, secure web applications with TechInPedia India. Node.js, Next.js, React, and MySQL expert developers.', 1, 'PUBLISHED', NOW(3), NOW(3))\nON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `shortDescription` = VALUES(`shortDescription`), `description` = VALUES(`description`), `updatedAt` = NOW(3);\n\nINSERT INTO `Service` (`id`, `title`, `slug`, `shortDescription`, `description`, `icon`, `technologies`, `seoTitle`, `seoDescription`, `displayOrder`, `status`, `createdAt`, `updatedAt`) VALUES\n(UUID(), 'Mobile App Development', 'mobile-app-development', 'Cross-platform iOS and Android applications crafted for native performance and user engagement.', 'Turn your mobile product vision into reality. We design and launch seamless iOS and Android applications built with React Native and Flutter. From API integrations to real-time sync and push notifications, our mobile apps deliver top-tier user experiences.', 'Smartphone', '[\"React Native\",\"Flutter\",\"iOS\",\"Android\",\"REST API\",\"Firebase\"]', 'Mobile App Development Agency | TechInPedia India', 'High-performance React Native & Flutter cross-platform mobile apps built for scale.', 2, 'PUBLISHED', NOW(3), NOW(3))\nON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `shortDescription` = VALUES(`shortDescription`), `description` = VALUES(`description`), `updatedAt` = NOW(3);\n\nINSERT INTO `Service` (`id`, `title`, `slug`, `shortDescription`, `description`, `icon`, `technologies`, `seoTitle`, `seoDescription`, `displayOrder`, `status`, `createdAt`, `updatedAt`) VALUES\n(UUID(), 'Custom Software & SaaS Development', 'custom-software-saas-development', 'End-to-end SaaS engineering, multi-tenant architectures, subscription billing, and cloud deployment.', 'Transform ideas into profitable SaaS products. We engineer multi-tenant cloud platforms, complete with user role management, billing gateway integrations (Stripe/Razorpay), automated analytics, and bulletproof security.', 'Cpu', '[\"Node.js\",\"TypeScript\",\"Prisma\",\"MySQL\",\"Docker\",\"AWS\",\"Stripe\"]', 'SaaS & Custom Software Development | TechInPedia India', 'End-to-end SaaS architecture, cloud infrastructure, and custom software development.', 3, 'PUBLISHED', NOW(3), NOW(3))\nON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `shortDescription` = VALUES(`shortDescription`), `description` = VALUES(`description`), `updatedAt` = NOW(3);\n\nINSERT INTO `Service` (`id`, `title`, `slug`, `shortDescription`, `description`, `icon`, `technologies`, `seoTitle`, `seoDescription`, `displayOrder`, `status`, `createdAt`, `updatedAt`) VALUES\n(UUID(), 'UI/UX & Product Design', 'ui-ux-product-design', 'Human-centered design systems, interactive prototypes, and conversion-focused digital interfaces.', 'Create products users love. Our UI/UX designers map user journeys, build interactive prototypes, design design systems, and optimize conversion funnels to ensure your business goals are met with elegance.', 'Layout', '[\"Figma\",\"Prototyping\",\"Design Systems\",\"User Research\",\"Wireframing\"]', 'UI/UX Design Agency | TechInPedia India', 'Custom digital product UI/UX design, interactive prototyping, and design system engineering.', 4, 'PUBLISHED', NOW(3), NOW(3))\nON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `shortDescription` = VALUES(`shortDescription`), `description` = VALUES(`description`), `updatedAt` = NOW(3);\n\nINSERT INTO `Service` (`id`, `title`, `slug`, `shortDescription`, `description`, `icon`, `technologies`, `seoTitle`, `seoDescription`, `displayOrder`, `status`, `createdAt`, `updatedAt`) VALUES\n(UUID(), 'E-Commerce Solutions', 'ecommerce-solutions', 'Custom, high-converting e-commerce platforms with multi-currency checkout and inventory management.', 'Drive sales with custom e-commerce stores designed for speed, security, and effortless checkout experiences. Features include payment gateway integration, real-time inventory tracking, and custom admin dashboards.', 'ShoppingBag', '[\"Next.js\",\"Node.js\",\"MySQL\",\"Stripe\",\"Razorpay\",\"Tailwind CSS\"]', 'E-Commerce Web Development | TechInPedia India', 'Build high-converting custom e-commerce stores with Next.js and secure payment integrations.', 5, 'PUBLISHED', NOW(3), NOW(3))\nON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `shortDescription` = VALUES(`shortDescription`), `description` = VALUES(`description`), `updatedAt` = NOW(3);\n\nINSERT INTO `Service` (`id`, `title`, `slug`, `shortDescription`, `description`, `icon`, `technologies`, `seoTitle`, `seoDescription`, `displayOrder`, `status`, `createdAt`, `updatedAt`) VALUES\n(UUID(), 'CRM & Enterprise ERP Systems', 'crm-erp-development', 'Tailored CRM pipelines, ERP workflows, and internal business automation tools.', 'Streamline operational efficiency with custom internal software. We build lead management CRMs, inventory tools, automated reporting dashboards, and workforce tracking solutions tailored to your workflow.', 'Database', '[\"React\",\"Node.js\",\"Express\",\"MySQL\",\"Prisma\",\"REST APIs\"]', 'Custom CRM & ERP Development | TechInPedia India', 'Bespoke CRM and ERP software engineering for business automation and lead tracking.', 6, 'PUBLISHED', NOW(3), NOW(3))\nON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `shortDescription` = VALUES(`shortDescription`), `description` = VALUES(`description`), `updatedAt` = NOW(3);")));
    foreach ($serviceStatements as $stmt) {
        if (!empty($stmt)) {
            try {
                $pdo->exec($stmt);
            } catch (Exception $e) {
                // Ignore duplicate errors
            }
        }
    }

    // 4. Seed All 8 Projects with UI Screenshots
    $projects = [
        [
            "id" => "vijaya-bharna-jewellers-01",
            "title" => "Vijaya Bharna Jewellers",
            "slug" => "vijaya-bharna-jewellers",
            "category" => "Jewellery / E-commerce",
            "clientType" => "Vijaya Bharna Jewellers",
            "shortDesc" => "Dedicated Android mobile application for exploring jewellery products and digital customer experience.",
            "description" => "A dedicated mobile application developed for Vijaya Bharna Jewellers to provide customers with a convenient digital experience for exploring jewellery products and connecting with the business. The application was developed with a focus on a smooth user experience, easy navigation, product presentation, and reliable mobile performance.",
            "problem" => "Customers lacked an easy, dedicated mobile catalog to browse latest jewellery collections remotely.",
            "solution" => "Developed a high-performance Android mobile application with rich product presentation, categorised catalogues, and direct store inquiry features.",
            "features" => json_encode(["Android App Development", "UI Implementation", "Product Catalogue", "User Experience Development", "Backend/API Integration", "Deployment & Play Store Publishing"]),
            "technologies" => json_encode(["Android", "API Integration", "Database", "Mobile UI"]),
            "results" => json_encode(["Published on Google Play Store", "Seamless Digital Shopping Experience"]),
            "featuredImage" => "https://play-lh.googleusercontent.com/CE2m2M1weOkVBu2WzhlYlUyRynAoxKGCW9znGDEiSJkeNGm8NZoG6ynMRQDdlflqMLFfejhwMZwqiDBfd4jD3w=w1200-h800-rw",
            "gallery" => json_encode([
                "https://play-lh.googleusercontent.com/CE2m2M1weOkVBu2WzhlYlUyRynAoxKGCW9znGDEiSJkeNGm8NZoG6ynMRQDdlflqMLFfejhwMZwqiDBfd4jD3w=w1200-h800-rw",
                "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
                "https://play.google.com/store/apps/details?id=com.vijayabharna.jewellers"
            ]),
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 1
        ],
        [
            "id" => "jagmohan-exam-sathi-02",
            "title" => "Jagmohan Exam Sathi",
            "slug" => "jagmohan-exam-sathi",
            "category" => "Education / Exam Preparation",
            "clientType" => "Jagmohan Institute",
            "shortDesc" => "Educational mobile application designed for student learning and exam preparation.",
            "description" => "Jagmohan Exam Sathi is an educational mobile application designed to provide students and exam aspirants with a convenient digital platform for learning and exam preparation.",
            "problem" => "Students needed a unified mobile platform to access structured study material and practice tests anywhere.",
            "solution" => "Engineered an accessible educational Android application with subject categories, test modules, and streamlined UI.",
            "features" => json_encode(["Android App Development", "Educational Platform Development", "UI/UX Implementation", "API Integration"]),
            "technologies" => json_encode(["Android", "API Integration", "Database", "Mobile UI"]),
            "results" => json_encode(["Published on Google Play Store", "High Student Engagement Rate"]),
            "featuredImage" => "https://play-lh.googleusercontent.com/W-JfZNKwRpfC5uYb1vSeHYgfwcZ_UcdF6nTAPCvJvw_Tc1367qNenguCM1ye8neYn1gqaMHCNK6-R5TSgsJRfw=w1200-h800-rw",
            "gallery" => json_encode([
                "https://play-lh.googleusercontent.com/W-JfZNKwRpfC5uYb1vSeHYgfwcZ_UcdF6nTAPCvJvw_Tc1367qNenguCM1ye8neYn1gqaMHCNK6-R5TSgsJRfw=w1200-h800-rw",
                "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
                "https://play.google.com/store/apps/details?id=com.jagmohanexamsathi.app"
            ]),
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 2
        ],
        [
            "id" => "ipl-bus-03",
            "title" => "IPL Bus",
            "slug" => "ipl-bus",
            "category" => "Transportation / Bus Services",
            "clientType" => "IPL Bus Services",
            "shortDesc" => "Transportation mobile application for convenient bus services and route management.",
            "description" => "A transportation-focused mobile application developed to provide users with a convenient digital experience for bus-related services.",
            "problem" => "Commuters required an easy mobile interface to access bus schedules, route information, and service alerts.",
            "solution" => "Built a reliable transportation Android app with quick route lookup, user-friendly interface, and fast response times.",
            "features" => json_encode(["Android App Development", "Mobile UI Development", "API Integration", "Service Management"]),
            "technologies" => json_encode(["Android", "API Integration", "Database", "Mobile UI"]),
            "results" => json_encode(["Published on Google Play Store", "Optimized Commuter Route Discovery"]),
            "featuredImage" => "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
            "gallery" => json_encode([
                "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=800&q=80",
                "https://play.google.com/store/apps/details?id=com.iplbus.bmnaveen"
            ]),
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 3
        ],
        [
            "id" => "bm-naveen-movies-04",
            "title" => "BM Naveen Movies",
            "slug" => "bm-naveen-movies",
            "category" => "Entertainment / Movies",
            "clientType" => "BM Naveen Entertainment",
            "shortDesc" => "Entertainment mobile application for exploring movie content and digital media.",
            "description" => "BM Naveen Movies is an entertainment-focused mobile application developed to provide users with a convenient way to explore movie-related content.",
            "problem" => "Movie enthusiasts needed a smooth mobile application for discovering movie trailers, reviews, and updates.",
            "solution" => "Created an engaging entertainment Android app with media streaming API integration and dynamic content categories.",
            "features" => json_encode(["Android App Development", "UI/UX Implementation", "Movie Content Integration", "API Integration"]),
            "technologies" => json_encode(["Android", "API Integration", "Database", "Mobile UI"]),
            "results" => json_encode(["Published on Google Play Store", "Fast Content Streaming & Discovery"]),
            "featuredImage" => "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
            "gallery" => json_encode([
                "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
                "https://play.google.com/store/apps/details?id=com.movies.bmnaveen"
            ]),
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 4
        ],
        [
            "id" => "naveen-taxi-05",
            "title" => "Naveen Taxi",
            "slug" => "naveen-taxi",
            "category" => "Transportation / Taxi Booking",
            "clientType" => "Naveen Mobility",
            "shortDesc" => "On-demand transportation application for convenient taxi booking services.",
            "description" => "Naveen Taxi is a transportation application developed to provide users with a convenient digital experience for taxi-related services.",
            "problem" => "Riders needed a simple, accessible mobile app for quick taxi booking and location-based ride requests.",
            "solution" => "Engineered an on-demand taxi Android application featuring location services, streamlined booking flow, and driver dispatch API.",
            "features" => json_encode(["Android App Development", "Booking Flow Development", "User Interface", "API Integration", "Location Services"]),
            "technologies" => json_encode(["Android", "API Integration", "Location Services", "Database"]),
            "results" => json_encode(["Published on Google Play Store", "On-Demand Ride Dispatch System"]),
            "featuredImage" => "https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&w=1200&q=80",
            "gallery" => json_encode([
                "https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1520105072000-f44fc083e508?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80",
                "https://play.google.com/store/apps/details?id=com.naveen.taxi.user"
            ]),
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 5
        ],
        [
            "id" => "allout-06",
            "title" => "AllOut",
            "slug" => "allout",
            "category" => "Business / Services",
            "clientType" => "AllOut Enterprise",
            "shortDesc" => "Business-focused mobile application for accessing commercial services.",
            "description" => "A business-focused mobile application developed to provide customers with a convenient digital platform for accessing services and interacting with the business.",
            "problem" => "Clients required a unified mobile app to request corporate services and track service requests.",
            "solution" => "Architected a robust business services Android app with customer account management and service tracking API.",
            "features" => json_encode(["Android App Development", "UI/UX Implementation", "API Integration", "Business Feature Development"]),
            "technologies" => json_encode(["Android", "API Integration", "Database", "Mobile UI"]),
            "results" => json_encode(["Published on Google Play Store", "Streamlined B2C Service Delivery"]),
            "featuredImage" => "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
            "gallery" => json_encode([
                "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
                "https://play.google.com/store/apps/details?id=com.customer.allout"
            ]),
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 6
        ],
        [
            "id" => "namasthe-daily-07",
            "title" => "Namasthe Daily",
            "slug" => "namasthe-daily",
            "category" => "News / Media",
            "clientType" => "Namasthe Daily Media",
            "shortDesc" => "Digital news application for discovering and consuming latest news content.",
            "description" => "Namasthe Daily is a digital news application developed to provide users with an accessible mobile platform for discovering and consuming news content.",
            "problem" => "Readers wanted a fast-loading daily news app with category filtering and real-time push alerts.",
            "solution" => "Developed a news & media Android app featuring push notifications, category filters, and lightweight article rendering.",
            "features" => json_encode(["Android App Development", "News Content Integration", "Category-Based Content", "Push Notifications"]),
            "technologies" => json_encode(["Android", "API Integration", "Push Notifications", "Database"]),
            "results" => json_encode(["Published on Google Play Store", "Real-Time News Push Alerts"]),
            "featuredImage" => "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
            "gallery" => json_encode([
                "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80",
                "https://play.google.com/store/apps/details?id=com.namasethedaily.news"
            ]),
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 7
        ],
        [
            "id" => "jobschoose-08",
            "title" => "JobsChoose",
            "slug" => "jobschoose",
            "category" => "Jobs / Recruitment",
            "clientType" => "JobsChoose Recruitment",
            "shortDesc" => "Recruitment-focused mobile application for discovering job opportunities.",
            "description" => "JobsChoose is a recruitment-focused mobile application developed to provide users with a convenient digital platform for discovering and accessing job opportunities.",
            "problem" => "Job seekers needed a straightforward mobile application to browse career openings and apply quickly.",
            "solution" => "Built a job search Android application with role filtering, employer listings, and fast application flow.",
            "features" => json_encode(["Android App Development", "Job Listing Integration", "Search & Discovery Features", "API Integration"]),
            "technologies" => json_encode(["Android", "API Integration", "Database", "Mobile UI"]),
            "results" => json_encode(["Published on Google Play Store", "Accessible Job Discovery Platform"]),
            "featuredImage" => "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80",
            "gallery" => json_encode([
                "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
                "https://play.google.com/store/apps/details?id=com.jobschoose.customer"
            ]),
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 8
        ]
    ];

    $stmt = $pdo->prepare("INSERT INTO `Project` (`id`, `title`, `slug`, `category`, `clientType`, `shortDesc`, `description`, `problem`, `solution`, `features`, `technologies`, `results`, `featuredImage`, `gallery`, `featured`, `status`, `displayOrder`, `createdAt`, `updatedAt`) VALUES (:id, :title, :slug, :category, :clientType, :shortDesc, :description, :problem, :solution, :features, :technologies, :results, :featuredImage, :gallery, :featured, :status, :displayOrder, NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `shortDesc` = VALUES(`shortDesc`), `description` = VALUES(`description`), `gallery` = VALUES(`gallery`), `updatedAt` = NOW(3)");

    foreach ($projects as $p) {
        $stmt->execute([
            ":id" => $p["id"],
            ":title" => $p["title"],
            ":slug" => $p["slug"],
            ":category" => $p["category"],
            ":clientType" => $p["clientType"],
            ":shortDesc" => $p["shortDesc"],
            ":description" => $p["description"],
            ":problem" => $p["problem"],
            ":solution" => $p["solution"],
            ":features" => $p["features"],
            ":technologies" => $p["technologies"],
            ":results" => $p["results"],
            ":featuredImage" => $p["featuredImage"],
            ":gallery" => $p["gallery"],
            ":featured" => $p["featured"],
            ":status" => $p["status"],
            ":displayOrder" => $p["displayOrder"]
        ]);
    }

    echo json_encode(["success" => true, "message" => "Seeded all 8 projects with screenshot galleries successfully!"]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
