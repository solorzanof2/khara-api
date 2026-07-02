import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';


const SystemPing: ApiProxyHandler = async (_event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    return ResponseEntity.ok({
      core: 'DeepCore v1.0.0',
      appVersion: '1.0.0',
      developer: 'Félix E. Solórzano C.',
    });
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const SystemPingHandler = Middlify(SystemPing, []);

