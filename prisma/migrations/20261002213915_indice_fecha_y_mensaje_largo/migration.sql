-- AlterTable
ALTER TABLE `reservation_inquiries` MODIFY `message` MEDIUMTEXT NOT NULL;

-- CreateIndex
CREATE INDEX `reservation_inquiries_date_idx` ON `reservation_inquiries`(`date`);
