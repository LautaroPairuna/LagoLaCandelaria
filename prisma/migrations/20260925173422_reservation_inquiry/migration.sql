-- CreateTable
CREATE TABLE `reservation_inquiries` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `contact` VARCHAR(255) NOT NULL,
    `groupType` VARCHAR(120) NOT NULL,
    `date` DATE NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reservation_inquiries_contact_groupType_date_idx`(`contact`, `groupType`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
