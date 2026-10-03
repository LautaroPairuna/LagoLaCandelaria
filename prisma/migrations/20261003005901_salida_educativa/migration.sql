-- AlterTable
ALTER TABLE `reservas` MODIFY `modulo` ENUM('FINDE_FAMILIA', 'BUNGALOW', 'RESTAURANTE', 'CAMPAMENTO', 'SALIDA_EDUCATIVA', 'VIAJE_EGRESADOS', 'ACTIVIDAD_AVENTURA') NOT NULL;

-- CreateIndex
CREATE INDEX `account_userId_idx` ON `account`(`userId`(191));

-- CreateIndex
CREATE INDEX `session_userId_idx` ON `session`(`userId`(191));
