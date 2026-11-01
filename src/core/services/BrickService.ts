import { Exception } from '../../deepcore/application/core/Exception';
import { HttpStatus } from '../../deepcore/application/http/HttpContracts';
import { BrickAttributes, BrickInput } from '../contracts/Brick';
import { InsightBrick } from '../domain/InsightBrick';
import { Project } from '../domain/Project';
import { BrickCategoryService } from './BrickCategoryService';
import { BrickTimeService } from './BrickTimeService';
import { PostReplyService } from './PostReplyService';

export class BrickService {
  static parse(value: unknown): any {
    const parsed = typeof value === 'string' ? JSON.parse(value || '{}') : value;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  }
  static attributes(value: unknown, createdAt = Date.now()): BrickAttributes {
    const attributes = { ...this.parse(value) };
    // Compatibility while migration 10 converts the previous shape; never persist duplicate metadata again.
    if (!attributes.time && attributes.measurements?.time?.millis > 0) {
      attributes.time = BrickTimeService.initial(attributes.measurements.time.millis, createdAt);
    }
    delete attributes.description; delete attributes.category;
    if (attributes.measurements) {
      attributes.measurements = { ...attributes.measurements }; delete attributes.measurements.time;
      if (!Object.keys(attributes.measurements).length) delete attributes.measurements;
    }
    return attributes;
  }
  static description(entity: InsightBrick): string {
    return this.parse(entity.attributes).description ?? entity.markdownSource ?? '';
  }
  static duration(value: unknown): { millis: number; label: string } {
    const input = value as BrickInput['duration'];
    if (!input || !['minutes', 'hours'].includes(input.unit) || !['number', 'string'].includes(typeof input.amount)
      || (typeof input.amount === 'string' && !/^\d+(?:[.,]\d+)?$/.test(input.amount.trim()))) {
      throw new Exception('Ingresa una duración positiva en minutos u horas.', HttpStatus.BadRequest);
    }
    const amount = typeof input.amount === 'string' ? Number(input.amount.trim().replace(',', '.')) : input.amount;
    const millis = Math.round(amount * (input.unit === 'hours' ? 3600000 : 60000));
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(millis) || millis <= 0) {
      throw new Exception('La duración debe ser positiva y representar al menos un milisegundo.', HttpStatus.BadRequest);
    }
    return { millis, label: BrickTimeService.label(millis) };
  }
  static durationLabel(millis: number): string { return BrickTimeService.label(millis); }

  async render(content: string, category: string, attributes: BrickAttributes, project: Project, userId: number) {
    const hashtag = BrickCategoryService.hashtag(category);
    const footer = [hashtag ? '#' + hashtag : '', attributes.time ? 'Tiempo: ' + attributes.time.totals.label : ''].filter(Boolean).join(' · ');
    const reply = await new PostReplyService().prepare(content, 'insight-brick', project, userId, footer);
    // Keep the editable description free of generated hashtags and timing metadata.
    return { ...reply, markdown: content };
  }
  async prepare(content: string, input: BrickInput, project: Project, userId: number, existing?: InsightBrick) {
    const attributes = BrickService.attributes(existing?.attributes, existing?.createdAt);
    if (input.reported !== undefined && typeof input.reported !== 'boolean') throw new Exception('El estado reportado es inválido.', HttpStatus.BadRequest);
    if (existing && input.duration !== undefined && attributes.time) {
      throw new Exception('Los tiempos registrados se gestionan desde el temporizador del brick.', HttpStatus.BadRequest);
    }
    if (input.duration !== undefined) {
      const duration = BrickService.duration(input.duration);
      attributes.time = BrickTimeService.initial(duration.millis, Date.now(), input.reported ?? false);
    }
    const category = existing && input.category === undefined ? existing.category
      : BrickCategoryService.normalize(input.category === undefined ? 'General' : input.category);
    const reply = await this.render(content, category || 'General', attributes, project, userId);
    return { reply, category: category || 'General', attributes };
  }
}
