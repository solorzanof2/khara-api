import { BrickCategoryRepository } from '../../adapters/persistence/BrickCategoryRepository';
import { Exception } from '../../deepcore/application/core/Exception';
import { HttpStatus } from '../../deepcore/application/http/HttpContracts';
import { BrickCategoryDTO } from '../contracts/Brick';

export class BrickCategoryService {
  static normalize(value: unknown): { name: string; hashtag: string } {
    if (typeof value !== 'string') throw new Exception('La categoría es inválida.', HttpStatus.BadRequest);
    const name = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
    const words = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[_-]+/g, ' ').trim().replace(/\s+/g, ' ').split(' ');
    if (!name || name.length > 80 || !words.every(word => /^[a-z0-9]+$/.test(word))) {
      throw new Exception('La categoría debe tener entre 1 y 80 caracteres: letras, números y espacios.', HttpStatus.BadRequest);
    }
    return { name, hashtag: words[0] + words.slice(1).map(word => word[0].toUpperCase() + word.slice(1)).join('') };
  }
  async create(name: unknown): Promise<BrickCategoryDTO> {
    const category = await new BrickCategoryRepository().getOrCreate(BrickCategoryService.normalize(name).name);
    return { id: category.id, name: category.name };
  }
  async list(): Promise<BrickCategoryDTO[]> {
    const categories = await new BrickCategoryRepository().findAll();
    return categories.map(row => ({ id: row.id, name: row.name })).sort((a, b) => a.id - b.id);
  }
  async resolve(name?: string): Promise<BrickCategoryDTO> { return this.create(name === undefined ? 'General' : name); }
}
