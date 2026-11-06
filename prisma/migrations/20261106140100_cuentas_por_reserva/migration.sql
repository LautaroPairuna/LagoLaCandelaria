-- El detalle de una reserva muestra sus cuentas del restaurante y el bar.
CREATE INDEX `cuentas_de_mesa_reservaId_idx` ON `cuentas_de_mesa`(`reservaId`);
