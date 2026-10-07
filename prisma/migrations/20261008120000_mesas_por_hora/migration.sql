-- Las mesas del restaurante se ocupan por hora: la misma mesa puede tener una reserva
-- a la mañana y otra a la tarde. 0 es el día entero, como hasta ahora.
ALTER TABLE `ocupaciones` ADD COLUMN `hora` SMALLINT NOT NULL DEFAULT 0;

-- El índice nuevo se crea antes de borrar el viejo: la clave foránea de unidadId
-- necesita siempre un índice que empiece por esa columna.
CREATE UNIQUE INDEX `ocupaciones_unidadId_fecha_hora_key` ON `ocupaciones`(`unidadId`, `fecha`, `hora`);
DROP INDEX `ocupaciones_unidadId_fecha_key` ON `ocupaciones`;
