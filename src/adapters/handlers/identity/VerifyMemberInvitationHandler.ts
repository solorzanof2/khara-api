import { RegularExpression } from '../../../core/commons/constants/RegexConstants';
import { LABEL } from '../../../core/helpers/LabelHelper';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { InvitationRepository } from '../../persistence/InvitationRepository';


interface RequestBody {
  username: string;
}


const VerifyMemberInvitation: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      username,
    } = event.body as RequestBody;

    if (!username || (username.includes('@') && !RegularExpression.Email.test(username))) {
      SimpleLogger.warning(`No se incluyó un Username o un Email válido. Username: ${username}`, 'VerifyMemberInvitationHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    const invitationRepository = new InvitationRepository();
    const invite = await invitationRepository.findByEmailAndStatusPending(username);

    const response = {
      uid: invite.uid,
      status: invite.status,
      statusLabel: LABEL.parse(invite.status),
      
    }
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const VerifyMemberInvitationHandler = Middlify(VerifyMemberInvitation, [
  ProvideLoggerMiddleware('VerifyMemberInvitationHandler'),
]);

