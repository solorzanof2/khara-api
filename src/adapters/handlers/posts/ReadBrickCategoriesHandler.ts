import { BrickCategoryContextService } from '../../../core/services/BrickCategoryContextService';
import { BrickCategoryService } from '../../../core/services/BrickCategoryService';
import { ApiProxyHandler } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';

const handler: ApiProxyHandler = async event => {
  try {
    const { ref, workspaceUid } = event.queryStringParameters || {};
    await new BrickCategoryContextService().project(ref, workspaceUid);
    const service = new BrickCategoryService();
    return ResponseEntity.ok(await service.list());
  }
  catch (error) { return ResponseEntity.error(error); }
};

export const ReadBrickCategoriesHandler = Middlify(handler, [
  ProvideLoggerMiddleware('ReadBrickCategoriesHandler'), ProvidePolicyMiddleware(),
]);
