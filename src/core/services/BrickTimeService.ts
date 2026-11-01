import { Exception } from '../../deepcore/application/core/Exception';
import { HttpStatus } from '../../deepcore/application/http/HttpContracts';
import { BrickAttributes, BrickMeasurement, BrickTime } from '../contracts/Brick';

export class BrickTimeService {
  static label(millis: number): string {
    const units = [[3600000, 'h'], [60000, 'min'], [1000, 's'], [1, 'ms']] as const;
    const parts: string[] = [];
    for (const [size, unit] of units) {
      const amount = Math.floor(millis / size); millis %= size;
      if (amount) parts.push(amount + unit);
    }
    return parts.join(' ') || '0s';
  }
  static totals(measurements: BrickMeasurement[], now: number, createdAt = now): BrickTime {
    const finished = measurements.filter(row => row.finishedAt !== null);
    const millis = finished.reduce((sum, row) => sum + row.millis, 0);
    const reported = finished.filter(row => row.reported).reduce((sum, row) => sum + row.millis, 0);
    if (!Number.isSafeInteger(millis) || millis < 0) throw new Exception('El total de tiempo está fuera de rango.', HttpStatus.BadRequest);
    return { measurements, totals: { millis, label: this.label(millis), createdAt, updatedAt: now, reported: this.label(reported) } };
  }
  static initial(millis: number, now: number, reported = false): BrickTime {
    if (millis > now) throw new Exception('La duración inicial está fuera de rango.', HttpStatus.BadRequest);
    return this.totals([{ startedAt: now - millis, finishedAt: now, millis, label: this.label(millis), createdAt: now, reported }], now);
  }
  static apply(attributes: BrickAttributes, action: unknown, now: number, measurementIndex?: unknown, interval?: { startedAt?: unknown; finishedAt?: unknown }): BrickAttributes {
    const measurements = (attributes.time?.measurements || []).map(row => ({ ...row }));
    const active = measurements.find(row => row.finishedAt === null);
    if (action === 'start') {
      if (active) throw new Exception('El brick ya tiene un temporizador en curso.', HttpStatus.Conflict);
      measurements.push({ startedAt: now, finishedAt: null, millis: 0, label: '0s', createdAt: now, reported: false });
    }
    else if (action === 'finish') {
      if (!active) throw new Exception('El brick no tiene un temporizador en curso.', HttpStatus.Conflict);
      if (now < active.startedAt) throw new Exception('La hora de finalización es inválida.', HttpStatus.Conflict);
      active.finishedAt = now; active.millis = now - active.startedAt; active.label = this.label(active.millis);
    }
    else if (action === 'add') {
      const startedAt = interval?.startedAt;
      const finishedAt = interval?.finishedAt;
      if (typeof startedAt !== 'number' || typeof finishedAt !== 'number'
        || !Number.isSafeInteger(startedAt) || !Number.isSafeInteger(finishedAt)
        || startedAt < 0 || finishedAt > 8640000000000000 || finishedAt <= startedAt) {
        throw new Exception('Ingresa fechas válidas; el fin debe ser posterior al inicio.', HttpStatus.BadRequest);
      }
      const millis = finishedAt - startedAt;
      measurements.push({ startedAt, finishedAt, millis, label: this.label(millis), createdAt: now, reported: false });
    }
    else if (action === 'report') {
      if (measurementIndex !== undefined) {
        if (!Number.isInteger(measurementIndex) || Number(measurementIndex) < 0 || !measurements[Number(measurementIndex)]) {
          throw new Exception('La medición seleccionada no existe.', HttpStatus.BadRequest);
        }
        const row = measurements[Number(measurementIndex)];
        if (row.finishedAt === null) throw new Exception('Finaliza la medición antes de reportarla.', HttpStatus.Conflict);
        row.reported = true;
      }
      else {
        if (!measurements.some(row => row.finishedAt !== null)) throw new Exception('No hay mediciones finalizadas para reportar.', HttpStatus.Conflict);
        for (const row of measurements) if (row.finishedAt !== null) row.reported = true;
      }
    }
    else throw new Exception('La acción de tiempo es inválida.', HttpStatus.BadRequest);
    return { ...attributes, time: this.totals(measurements, now, attributes.time?.totals.createdAt ?? now) };
  }
}
