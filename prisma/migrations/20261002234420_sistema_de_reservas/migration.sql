-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dni` VARCHAR(8) NULL,
    `nombre` VARCHAR(80) NOT NULL,
    `apellido` VARCHAR(80) NOT NULL,
    `email` VARCHAR(120) NULL,
    `telefono` VARCHAR(40) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `clientes_dni_key`(`dni`),
    INDEX `clientes_telefono_idx`(`telefono`),
    INDEX `clientes_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(40) NOT NULL,
    `codigo` VARCHAR(12) NOT NULL,
    `modulo` ENUM('FINDE_FAMILIA', 'BUNGALOW', 'RESTAURANTE', 'CAMPAMENTO', 'ACTIVIDAD_AVENTURA', 'VIAJE_EGRESADOS') NOT NULL,
    `estado` ENUM('PENDIENTE', 'CONFIRMADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
    `origen` ENUM('WEB', 'PREDIO', 'LEGADO') NOT NULL DEFAULT 'WEB',
    `desde` DATE NOT NULL,
    `hasta` DATE NOT NULL,
    `ingreso` VARCHAR(5) NOT NULL,
    `salida` VARCHAR(5) NOT NULL,
    `clienteId` INTEGER NOT NULL,
    `institucion` VARCHAR(120) NULL,
    `cargo` VARCHAR(80) NULL,
    `edadesGrupo` VARCHAR(120) NULL,
    `propuesta` VARCHAR(40) NULL,
    `adultos` SMALLINT NOT NULL DEFAULT 0,
    `menores` SMALLINT NOT NULL DEFAULT 0,
    `sinCargo` SMALLINT NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL,
    `formaPago` ENUM('EFECTIVO', 'DEBITO', 'TRANSFERENCIA') NULL,
    `notas` TEXT NULL,
    `detalle` JSON NOT NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadaEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reservas_token_key`(`token`),
    UNIQUE INDEX `reservas_codigo_key`(`codigo`),
    INDEX `reservas_desde_idx`(`desde`),
    INDEX `reservas_estado_desde_idx`(`estado`, `desde`),
    INDEX `reservas_modulo_desde_idx`(`modulo`, `desde`),
    INDEX `reservas_clienteId_idx`(`clienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reserva_personas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservaId` INTEGER NOT NULL,
    `familia` SMALLINT NOT NULL DEFAULT 1,
    `responsable` BOOLEAN NOT NULL DEFAULT false,
    `nombre` VARCHAR(80) NOT NULL,
    `apellido` VARCHAR(80) NOT NULL,
    `dni` VARCHAR(8) NULL,
    `edad` SMALLINT NOT NULL,
    `cud` BOOLEAN NOT NULL DEFAULT false,
    `notas` VARCHAR(400) NULL,

    INDEX `reserva_personas_reservaId_idx`(`reservaId`),
    INDEX `reserva_personas_dni_idx`(`dni`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unidades` (
    `id` VARCHAR(24) NOT NULL,
    `tipo` ENUM('PARRILLA', 'QUINCHO', 'GAZEBO', 'PALAPA', 'BUNGALOW', 'MESA_RESTAURANTE', 'MESA_BAR') NOT NULL,
    `numero` SMALLINT NOT NULL,
    `etiqueta` VARCHAR(20) NOT NULL,
    `capacidad` SMALLINT NULL,
    `mesas` SMALLINT NOT NULL DEFAULT 0,
    `activa` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `unidades_tipo_numero_key`(`tipo`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ocupaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservaId` INTEGER NOT NULL,
    `unidadId` VARCHAR(24) NOT NULL,
    `fecha` DATE NOT NULL,

    INDEX `ocupaciones_fecha_idx`(`fecha`),
    INDEX `ocupaciones_reservaId_idx`(`reservaId`),
    UNIQUE INDEX `ocupaciones_unidadId_fecha_key`(`unidadId`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservaId` INTEGER NOT NULL,
    `fecha` DATE NOT NULL,
    `importe` INTEGER NOT NULL,
    `forma` ENUM('EFECTIVO', 'DEBITO', 'TRANSFERENCIA') NOT NULL,
    `detalle` VARCHAR(120) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pagos_reservaId_idx`(`reservaId`),
    INDEX `pagos_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dias_especiales` (
    `fecha` DATE NOT NULL,
    `tipo` ENUM('FERIADO', 'NO_LABORABLE', 'CERRADO', 'ABIERTO') NOT NULL,
    `motivo` VARCHAR(120) NOT NULL,

    PRIMARY KEY (`fecha`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reservas` ADD CONSTRAINT `reservas_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reserva_personas` ADD CONSTRAINT `reserva_personas_reservaId_fkey` FOREIGN KEY (`reservaId`) REFERENCES `reservas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ocupaciones` ADD CONSTRAINT `ocupaciones_reservaId_fkey` FOREIGN KEY (`reservaId`) REFERENCES `reservas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ocupaciones` ADD CONSTRAINT `ocupaciones_unidadId_fkey` FOREIGN KEY (`unidadId`) REFERENCES `unidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_reservaId_fkey` FOREIGN KEY (`reservaId`) REFERENCES `reservas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
