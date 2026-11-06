-- Los mensajes de WhatsApp guardados (confirmación, ticket y libres), editables desde el panel.
CREATE TABLE `plantillas_whatsapp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(60) NOT NULL,
    `texto` TEXT NOT NULL,
    `orden` SMALLINT NOT NULL DEFAULT 0,
    `actualizadoEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
