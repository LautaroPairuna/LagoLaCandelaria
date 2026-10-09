-- El registro de actividad pasa a cubrir todo el panel: guarda a qué usuario buscarle el
-- rol y en qué sección pasó. Todo en una sola instrucción: si un deploy se corta, no
-- queda a medias.
ALTER TABLE `actividad`
    ADD COLUMN `seccion` VARCHAR(30) NOT NULL DEFAULT 'caja',
    ADD COLUMN `userId` VARCHAR(64) NULL,
    ADD INDEX `actividad_userId_creadoEn_idx`(`userId`, `creadoEn`),
    ADD INDEX `actividad_seccion_creadoEn_idx`(`seccion`, `creadoEn`);
