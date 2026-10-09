-- AlterTable
ALTER TABLE `reserva_personas` ADD COLUMN `ingresoEn` DATETIME(3) NULL,
    ADD COLUMN `salidaEn` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `reservas` ADD COLUMN `salidaEn` DATETIME(3) NULL;

-- Las reservas que ya figuraban como ingresadas pasan la hora a sus personas.
UPDATE `reserva_personas` AS p
  JOIN `reservas` AS r ON r.`id` = p.`reservaId`
SET p.`ingresoEn` = r.`ingresoEn`
WHERE r.`ingresoEn` IS NOT NULL AND p.`ingresoEn` IS NULL;
