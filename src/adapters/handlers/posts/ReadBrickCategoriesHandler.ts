import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { Exception } from '../../../deepcore/application/core/Exception';
import { BrickCategoryContextService } from '../../../core/services/BrickCategoryContextService';
import { BrickCategoryService } from '../../../core/services/BrickCategoryService';
import { ApiProxyHandler } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';

const handler: ApiProxyHandler = async event => {
  const handlerName = 'ReadBrickCategoriesHandler';
  try {
    const { ref, workspaceUid } = event.queryStringParameters || {};
    await new BrickCategoryContextService().project(ref, workspaceUid);
    const service = new BrickCategoryService();
    return ResponseEntity.ok(await service.list());
  }
  catch (error) {
    if (error instanceof Exception && error.code >= 400 && error.code < 500) {
      SimpleLogger.warning('No se pudieron leer las categorías para el insight ' + event.queryStringParameters?.ref + ' y workspace ' + event.queryStringParameters?.workspaceUid + '. ' + error.message + ' [' + error.code + ']', handlerName, event.requestId);
    }
    else {
      SimpleLogger.error('No se pudieron leer las categorías para el insight ' + event.queryStringParameters?.ref + ' y workspace ' + event.queryStringParameters?.workspaceUid + '. ' + '[' + (error instanceof Exception ? error.code : 500) + '] ' + (error instanceof Error ? error.stack || error.message : String(error)), handlerName, event.requestId);
    }
    return ResponseEntity.error(error);
  }
};

export const ReadBrickCategoriesHandler = Middlify(handler, [
  ProvideLoggerMiddleware('ReadBrickCategoriesHandler'), ProvidePolicyMiddleware(),
]);
