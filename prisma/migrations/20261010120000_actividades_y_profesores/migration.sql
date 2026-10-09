-- Actividades realizadas por persona (una vez por visita) y actividades a cargo de cada
-- profesor. Cada tabla se crea en una sola instrucción y con IF NOT EXISTS: si un deploy
-- se corta a la mitad, volver a correr la migración no falla.
CREATE TABLE IF NOT EXISTS `actividades_realizadas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservaId` INTEGER NOT NULL,
    `personaId` INTEGER NULL,
    `actividad` VARCHAR(40) NOT NULL,
    `fecha` DATE NOT NULL,
    `cantidad` SMALLINT NOT NULL DEFAULT 1,
    `registradoPor` VARCHAR(80) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `actividades_realizadas_actividad_fecha_idx`(`actividad`, `fecha`),
    INDEX `actividades_realizadas_reservaId_idx`(`reservaId`),
    UNIQUE INDEX `actividades_realizadas_personaId_actividad_key`(`personaId`, `actividad`),
    PRIMARY KEY (`id`),
    CONSTRAINT `actividades_realizadas_reservaId_fkey` FOREIGN KEY (`reservaId`) REFERENCES `reservas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `actividades_realizadas_personaId_fkey` FOREIGN KEY (`personaId`) REFERENCES `reserva_personas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `profesores_actividad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(64) NOT NULL,
    `actividad` VARCHAR(40) NOT NULL,

    UNIQUE INDEX `profesores_actividad_userId_actividad_key`(`userId`, `actividad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
