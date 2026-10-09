-- Mesas propias del bar. No se comparten con las 9 del restaurante.
INSERT INTO `unidades` (`id`, `tipo`, `numero`, `etiqueta`, `capacidad`, `mesas`, `activa`) VALUES
    ('bar-1', 'MESA_BAR', 1, '1', 4, 1, true),
    ('bar-2', 'MESA_BAR', 2, '2', 4, 1, true),
    ('bar-3', 'MESA_BAR', 3, '3', 4, 1, true),
    ('bar-4', 'MESA_BAR', 4, '4', 4, 1, true),
    ('bar-5', 'MESA_BAR', 5, '5', 6, 1, true),
    ('bar-6', 'MESA_BAR', 6, '6', 6, 1, true)
ON DUPLICATE KEY UPDATE
    `etiqueta` = VALUES(`etiqueta`),
    `capacidad` = VALUES(`capacidad`),
    `mesas` = VALUES(`mesas`),
    `activa` = true;
