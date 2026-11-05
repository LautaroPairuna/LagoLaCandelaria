-- Cuándo se abrió el WhatsApp con el ticket desde el envío guiado de Puerta.
ALTER TABLE `reservas` ADD COLUMN `ticketEnviadoEn` DATETIME(3) NULL;
