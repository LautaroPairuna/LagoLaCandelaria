-- Movimientos manuales de la caja (gastos, retiros, ingresos extra, pases entre cajones)
-- y registro de actividad de la plata.
-- CreateTable
CREATE TABLE `movimientos_caja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('INGRESO', 'EGRESO', 'TRANSFERENCIA') NOT NULL,
    `cajon` ENUM('EFECTIVO', 'BANCO') NOT NULL,
    `fecha` DATE NOT NULL,
    `concepto` VARCHAR(160) NOT NULL,
    `monto` INTEGER NOT NULL,
    `registradoPor` VARCHAR(80) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `movimientos_caja_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actividad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuario` VARCHAR(80) NOT NULL,
    `accion` VARCHAR(40) NOT NULL,
    `detalle` VARCHAR(255) NOT NULL,
    `reservaId` INTEGER NULL,
    `monto` INTEGER NULL,

    INDEX `actividad_creadoEn_idx`(`creadoEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

