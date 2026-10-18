-- Ajustes que cambia la administración: cupo de palapas por la web, alias, etc.
CREATE TABLE IF NOT EXISTS `ajustes` (
    `clave` VARCHAR(40) NOT NULL,
    `valor` VARCHAR(255) NOT NULL,
    `actualizadoEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`clave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
