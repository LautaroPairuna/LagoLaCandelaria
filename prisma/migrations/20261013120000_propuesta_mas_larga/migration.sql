-- Las propuestas estudiantiles tienen nombres largos ("Campamento de aventura, 2 días y
-- 1 noche en carpa, pensión completa"). Una sola instrucción, que se puede repetir.
ALTER TABLE `reservas` MODIFY `propuesta` VARCHAR(120) NULL;
