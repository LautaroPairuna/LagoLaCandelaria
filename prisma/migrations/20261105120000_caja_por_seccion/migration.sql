-- Cada movimiento de caja es de una sección: la general del predio, Puerta (reservas),
-- el restaurante o el bar. Los que ya estaban son del predio.
ALTER TABLE `movimientos_caja` ADD COLUMN `seccion` VARCHAR(20) NOT NULL DEFAULT 'predio';
