import { BrickCategoryContextService } from '../../../core/services/BrickCategoryContextService';
import { BrickCategoryService } from '../../../core/services/BrickCategoryService';
import { ApiProxyHandler } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';

const handler: ApiProxyHandler = async event => {
  try {
    const { ref, workspaceUid, name } = event.body || {};
    await new BrickCategoryContextService().project(ref, workspaceUid);
    const service = new BrickCategoryService();
    return ResponseEntity.ok(await service.create(name));
  }
  catch (error) { return ResponseEntity.error(error); }
};

export const CreateBrickCategoryHandler = Middlify(handler, [
  ProvideLoggerMiddleware('CreateBrickCategoryHandler'), ProvidePolicyMiddleware(),
]);
