-- Cada WhatsApp abierto para un cliente desde el panel: es el tilde de contacto en Puerta.
CREATE TABLE `contactos_whatsapp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` INTEGER NOT NULL,
    `reservaId` INTEGER NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `plantilla` VARCHAR(60) NULL,
    `por` VARCHAR(80) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contactos_whatsapp_clienteId_creadoEn_idx`(`clienteId`, `creadoEn`),
    INDEX `contactos_whatsapp_reservaId_creadoEn_idx`(`reservaId`, `creadoEn`),
    PRIMARY KEY (`id`),
    CONSTRAINT `contactos_whatsapp_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `contactos_whatsapp_reservaId_fkey` FOREIGN KEY (`reservaId`) REFERENCES `reservas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
