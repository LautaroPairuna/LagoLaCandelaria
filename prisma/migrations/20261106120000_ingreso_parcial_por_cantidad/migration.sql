-- Ingreso parcial en las reservas por cantidad: cuántos adultos y menores ya entraron.
ALTER TABLE `reservas` ADD COLUMN `adultosAdentro` SMALLINT NOT NULL DEFAULT 0, ADD COLUMN `menoresAdentro` SMALLINT NOT NULL DEFAULT 0;
