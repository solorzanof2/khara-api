import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { Security } from '../../../deepcore/application/utils/Security';


const Testing: ApiProxyHandler = async (_event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const source = 'sudoroso123.';

    const password = Security.getPasswordHash(source);

    SimpleLogger.info(`La contraseña es: ${password}`, 'TestingHandler');

    return ResponseEntity.noContent();
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const TestingHandler = Middlify(Testing, []);

