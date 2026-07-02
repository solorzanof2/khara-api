import { RegularExpression } from '../../../core/commons/constants/RegexConstants';
import { User } from '../../../core/domain/User';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { UserRepository } from '../../persistence/UserRepository';


interface RequestBody {
  reference: string;
  type: string; // email | username...
}


const VerifyEmailAndUsername: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      reference, type
    } = event.body as RequestBody;

    const isEmail = (type === 'email');

    if (isEmail) {
      if (!reference || !(reference.match(RegularExpression.Email))) {
        SimpleLogger.warning(`No se recibió un email o el mismo es inválido. -- ${reference}`, 'UserRegisterHandler', event.requestId);
        return ResponseEntity.badRequest();
      }
    }

    // username
    if (!isEmail && !reference) {
      SimpleLogger.warning(`No se recibió un username o el mismo es inválido. -- ${reference}`, 'VerifyEmailAndUsernameHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    const userRepository = new UserRepository();

    let user: User;

    if (isEmail) {
      user = await userRepository.findByEmail(reference);
    }

    // username
    if (!isEmail) {
      user = await userRepository.findUserByUsername(reference);
    }

    const response = {
      result: 'already_exists',
    };

    if (!user?.id) {
      response.result = 'not_found';
    }

    return ResponseEntity.ok(response);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const VerifyEmailAndUsernameHandler = Middlify(VerifyEmailAndUsername, [
  ProvideLoggerMiddleware('VerifyEmailAndUsernameHandler'),
]);

