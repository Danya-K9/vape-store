-- MySQL-compatible DDL (avoid "quoted identifiers" syntax).

CREATE TABLE `Category` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BlogPost` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `dateLabel` VARCHAR(255) NOT NULL,
  `teaser` TEXT NULL,
  `description` VARCHAR(2500) NOT NULL,
  `image` TEXT NULL,
  `showOnHome` BOOLEAN NOT NULL DEFAULT true,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `BlogPost_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HeroBanner` (
  `id` VARCHAR(191) NOT NULL,
  `zone` VARCHAR(191) NOT NULL,
  `image` TEXT NOT NULL,
  `title` VARCHAR(500) NULL,
  `discountText` VARCHAR(500) NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
