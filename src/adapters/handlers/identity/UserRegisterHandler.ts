import { SignUpAdminUseCase } from '../../../core/usecases/SignUpAdminUseCase';
import { SignInUseCase } from '../../../core/usecases/SignInUseCase';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { RegularExpression } from '../../../core/commons/constants/RegexConstants';
import { LABEL } from '../../../core/helpers/LabelHelper';


interface RequestBody {
  username: string;
  email: string;
  password: string;
  name: string;
  lastname: string;
}


const UserRegister: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      username, email, password, name, lastname,
    } = event.body as RequestBody;

    if (!username) {
      SimpleLogger.warning(`No se recibió un nombre de usuario`, 'UserRegisterHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!email || !(email.match(RegularExpression.Email))) {
      SimpleLogger.warning(`No se recibió un email o el mismo es inválido. -- ${email}`, 'UserRegisterHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!password) {
      SimpleLogger.warning(`No se recibió un password`, 'UserRegisterHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!name) {
      SimpleLogger.warning(`No se recibió el primer nombre del usuario`, 'UserRegisterHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!lastname) {
      SimpleLogger.warning(`No se recibió el apellido del usuario`, 'UserRegisterHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    SimpleLogger.info(`Iniciando Alta de Usuario ADMIN -- email: ${email}`, 'UserRegisterHandler', event.requestId);

    try {
      await (new SignUpAdminUseCase()).execute({
        username, email, password, name, lastname,
      });
    }
    catch (error) {
      if (LABEL.exists(error.message)) {
        return ResponseEntity.conflict(LABEL.parse(error.message));
      }

      SimpleLogger.warning(`Falló la creación del usuario ${username}, ${email}`, 'UserRegisterHandler', event.requestId);

      throw error;
    }

    SimpleLogger.info(`Finalizó el Alta de Usuario ADMIN -- ${email}`, 'UserRegisterHandler', event.requestId);

    SimpleLogger.info(`Haciendo login para el usuario: ${email}`, 'UserRegisterHandler', event.requestId);

    let signinResponse: any;
    try {
      signinResponse = await (new SignInUseCase())
        .execute<any>({ username, password, });
    }
    catch (error) {
      SimpleLogger.warning(`Ocurrió un error al ejecutar SignInUseCase: ${error.message}`, 'AuthenticationHandler', event.requestId);

      if (LABEL.exists(error.message)) {
        return ResponseEntity.conflict(LABEL.parse(error.message, 'default'));
      }

      throw error;
    }

    return ResponseEntity.ok(signinResponse);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const UserRegisterHandler = Middlify(UserRegister, [
  ProvideLoggerMiddleware('UserRegisterHandler'),
]);

