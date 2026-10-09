-- Menú, cuentas de mesa y pedidos del restaurante y el bar (caja propia de cada local).
-- CreateTable
CREATE TABLE `menu_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `local` ENUM('RESTAURANTE', 'BAR') NOT NULL,
    `categoria` VARCHAR(60) NOT NULL,
    `nombre` VARCHAR(80) NOT NULL,
    `descripcion` VARCHAR(200) NULL,
    `precio` INTEGER NOT NULL,
    `disponible` BOOLEAN NOT NULL DEFAULT true,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `menu_items_local_categoria_idx`(`local`, `categoria`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuentas_de_mesa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `local` ENUM('RESTAURANTE', 'BAR') NOT NULL,
    `fecha` DATE NOT NULL,
    `mesa` VARCHAR(30) NOT NULL,
    `titular` VARCHAR(80) NULL,
    `reservaId` INTEGER NULL,
    `estado` ENUM('ABIERTA', 'COBRADA') NOT NULL DEFAULT 'ABIERTA',
    `forma` ENUM('EFECTIVO', 'DEBITO', 'TRANSFERENCIA') NULL,
    `cobradaEn` DATETIME(3) NULL,
    `cobradaPor` VARCHAR(80) NULL,
    `abiertaPor` VARCHAR(80) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cuentas_de_mesa_local_fecha_idx`(`local`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuenta_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cuentaId` INTEGER NOT NULL,
    `menuItemId` INTEGER NULL,
    `nombre` VARCHAR(80) NOT NULL,
    `precio` INTEGER NOT NULL,
    `cantidad` SMALLINT NOT NULL DEFAULT 1,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cuenta_items_cuentaId_idx`(`cuentaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cuenta_items` ADD CONSTRAINT `cuenta_items_cuentaId_fkey` FOREIGN KEY (`cuentaId`) REFERENCES `cuentas_de_mesa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

