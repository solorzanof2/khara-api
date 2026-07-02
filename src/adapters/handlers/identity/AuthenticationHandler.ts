import { LABEL } from '../../../core/helpers/LabelHelper';
import { SignInUseCase } from '../../../core/usecases/SignInUseCase';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';


const Authentication: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      username, password,
    } = event.body;

    if (!username || !password) {
      SimpleLogger.warning(`No se detectaron usuarios o contraseñas. [400] Bad Request`, 'AuthenticationHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    let response: any;
    try {
      response = await (new SignInUseCase())
        .execute<any>({ username, password, requestId: event.requestId });
    }
    catch (error) {
      SimpleLogger.warning(`Ocurrió un error al ejecutar SignInUseCase: ${error.message}`, 'AuthenticationHandler', event.requestId);

      if (LABEL.exists(error.message)) {
        return ResponseEntity.conflict(LABEL.parse(error.message, 'default'));
      }

      throw error;
    }

    return ResponseEntity.ok(response);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const AuthenticationHandler = Middlify(Authentication, [
  ProvideLoggerMiddleware('AuthenticationHandler'),
]);

