-- AlterTable
ALTER TABLE `pagos` ADD COLUMN `descuento` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `registradoPor` VARCHAR(80) NULL;

-- AlterTable
ALTER TABLE `reservas` ADD COLUMN `ingresoEn` DATETIME(3) NULL,
    ADD COLUMN `ingresoPor` VARCHAR(80) NULL;
