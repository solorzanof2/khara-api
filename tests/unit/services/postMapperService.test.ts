import { PostMapperService } from '../../../src/core/services/PostMapperService';
import { TagService } from '../../../src/core/services/TagService';
import { Tag } from '../../../src/core/domain/Tag';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));

describe('PostMapperService', () => {
  beforeEach(() => {
    jest.spyOn(TagService.prototype, 'getByNameAndUpdateUsage').mockImplementation(async (name, userId, category) => Object.assign(new Tag(), { id: 1, name, userId, category, link: '<a class="tag">' + (category === 'mention' ? '@' : '#') + name + '</a>' }));
  });
  afterEach(() => jest.restoreAllMocks());

  test('reemplaza menciones repetidas y prefijos sin anidar enlaces', async () => {
    const result = await new PostMapperService().parse('<p>@ana @anabel @ana #test</p>', 7);
    expect(result.mentions).toEqual(['ana', 'anabel']);
    expect(result.hashtags).toEqual(['test']);
    expect(result.post).toBe('<p><a class="tag">@ana</a> <a class="tag">@anabel</a> <a class="tag">@ana</a> <a class="tag">#test</a></p>');
    expect(TagService.prototype.getByNameAndUpdateUsage).toHaveBeenCalledTimes(3);
  });

  test('ignora emails, código, enlaces y atributos HTML', async () => {
    const result = await new PostMapperService().parse('<p>ana@example.com <code>@code</code> <a href="/x#hash">@link</a><img src="/@image"> @real</p>', 7);
    expect(result.mentions).toEqual(['real']);
    expect(result.hashtags).toEqual([]);
    expect(result.post).toContain('href="/x#hash"');
    expect(result.post).toContain('<code>@code</code>');
  });

  test('preserva texto escapado y el autor aun sin tags', async () => {
    const result = await new PostMapperService().parse('<p>&lt;hola&gt; &amp; @ana</p>', 7);
    expect(result.post).toContain('&lt;hola&gt; &amp;');
    expect((await new PostMapperService().parse('<p>hola</p>', 7)).userId).toBe(7);
  });
});
