INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `status`, `mustChangePassword`, `createdAt`, `updatedAt`) VALUES
('super-admin-01', 'TechInPedia Admin', 'admin@techinpedia.in', '$2b$10$E6DEUwMAbvpNFTSsPx46lO5.S4mwZJoZK8qvRvl7E13SES4WEbxQy', 'SUPER_ADMIN', 'ACTIVE', 0, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'company_name', 'TechInPedia India', 'COMPANY', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'company_tagline', 'We Build Digital Products That Move Businesses Forward', 'COMPANY', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'company_email', 'contact@techinpedia.in', 'COMPANY', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'company_phone', '+91 98765 43210', 'COMPANY', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'whatsapp_number', '919876543210', 'COMPANY', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'company_address', 'Cyber City, Tech Hub, Bengaluru, Karnataka, India', 'COMPANY', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'company_about', 'TechInPedia India is a high-performance digital product and software engineering agency delivering web applications, mobile solutions, custom SaaS, and enterprise software to global clients.', 'COMPANY', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'social_linkedin', 'https://linkedin.com/company/techinpedia-india', 'SOCIAL', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'social_github', 'https://github.com/techinpedia', 'SOCIAL', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'social_twitter', 'https://x.com/techinpedia', 'SOCIAL', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'social_instagram', 'https://www.instagram.com/techlynk.in/', 'SOCIAL', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'seo_default_title', 'TechInPedia India | Software Development & Digital Solutions Agency', 'SEO', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'seo_default_description', 'TechInPedia India builds custom web apps, mobile apps, SaaS platforms, and enterprise solutions. Websites & Apps That Grow Businesses.', 'SEO', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'seo_og_image', '/images/og-techinpedia.jpg', 'SEO', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'google_analytics_id', '', 'SEO', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'website_logo_text', 'TechInPedia', 'WEBSITE', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);

INSERT INTO `Setting` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'website_footer_text', '© 2026 TechInPedia India. All rights reserved. Building scalable software solutions.', 'WEBSITE', NOW(3))
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `category` = VALUES(`category`), `updatedAt` = NOW(3);