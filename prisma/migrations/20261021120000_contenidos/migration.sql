-- CreateTable
CREATE TABLE `contenidos` (
    `clave` VARCHAR(40) NOT NULL,
    `valor` JSON NOT NULL,
    `actualizadoEn` DATETIME(3) NOT NULL,
    `actualizadoPor` VARCHAR(120) NULL,

    PRIMARY KEY (`clave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

