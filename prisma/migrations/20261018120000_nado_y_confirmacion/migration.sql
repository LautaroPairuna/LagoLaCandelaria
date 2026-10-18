-- Nado en aguas abiertas como tipo de reserva, y la respuesta al mensaje del día
-- anterior. Una sola instrucción: si un deploy se corta, no queda a medias.
ALTER TABLE `reservas`
    MODIFY `modulo` ENUM('FINDE_FAMILIA', 'BUNGALOW', 'RESTAURANTE', 'CAMPAMENTO', 'SALIDA_EDUCATIVA', 'VIAJE_EGRESADOS', 'ACTIVIDAD_AVENTURA', 'NADO') NOT NULL,
    ADD COLUMN `confirmacion` VARCHAR(12) NULL,
    ADD COLUMN `confirmacionEn` DATETIME(3) NULL;
