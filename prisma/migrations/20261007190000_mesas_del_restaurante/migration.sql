-- Mesas del restaurante según la planilla del predio: 9 mesas, de 2, 4 y 6 personas.
-- El bar no tiene mesas reservables, así que las que había quedan inactivas.
INSERT INTO `unidades` (`id`, `tipo`, `numero`, `etiqueta`, `capacidad`, `mesas`, `activa`) VALUES
    ('restaurante-1', 'MESA_RESTAURANTE', 1, '1', 2, 1, true),
    ('restaurante-2', 'MESA_RESTAURANTE', 2, '2', 4, 1, true),
    ('restaurante-3', 'MESA_RESTAURANTE', 3, '3', 6, 1, true),
    ('restaurante-4', 'MESA_RESTAURANTE', 4, '4', 6, 1, true),
    ('restaurante-5', 'MESA_RESTAURANTE', 5, '5', 2, 1, true),
    ('restaurante-6', 'MESA_RESTAURANTE', 6, '6', 4, 1, true),
    ('restaurante-7', 'MESA_RESTAURANTE', 7, '7', 2, 1, true),
    ('restaurante-8', 'MESA_RESTAURANTE', 8, '8', 4, 1, true),
    ('restaurante-9', 'MESA_RESTAURANTE', 9, '9', 6, 1, true)
ON DUPLICATE KEY UPDATE
    `etiqueta` = VALUES(`etiqueta`),
    `capacidad` = VALUES(`capacidad`),
    `mesas` = VALUES(`mesas`),
    `activa` = true;

UPDATE `unidades` SET `activa` = false WHERE `tipo` = 'MESA_BAR';
