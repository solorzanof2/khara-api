import { BrickCategoryRepository } from '../../adapters/persistence/BrickCategoryRepository';
import { Exception } from '../../deepcore/application/core/Exception';
import { HttpStatus } from '../../deepcore/application/http/HttpContracts';
import { BrickCategoryDTO } from '../contracts/Brick';

export class BrickCategoryService {
  static normalize(value: unknown): string {
    if (typeof value !== 'string') throw new Exception('La categoría es inválida.', HttpStatus.BadRequest);
    const name = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
    if (!name || name.length > 128) {
      throw new Exception('La categoría debe tener entre 1 y 128 caracteres.', HttpStatus.BadRequest);
    }
    return name;
  }

  static hashtag(name: string): string {
    return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }

  async list(): Promise<BrickCategoryDTO[]> {
    const categories = await new BrickCategoryRepository().findAll();
    return categories.map(row => ({ id: row.id, name: row.name })).sort((a, b) => a.id - b.id);
  }
}
