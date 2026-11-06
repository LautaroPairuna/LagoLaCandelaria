-- El detalle de una reserva muestra lo anotado sobre ella en el registro de actividad.
CREATE INDEX `actividad_reservaId_idx` ON `actividad`(`reservaId`);
