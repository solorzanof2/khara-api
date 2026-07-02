import { Invitation } from '../../../core/domain/Invitation';
import { Dates } from '../../../core/helpers/DatesHelper';
import { LABEL } from '../../../core/helpers/LabelHelper';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { InvitationRepository } from '../../persistence/InvitationRepository';


interface ResponseBody {
  email: string;
  createdAt: number;
  createdAtLabel: string;
  status: string;
  statusLabel: string;
  uid: string;
}


const ReadInvitations: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {

    const invitationRepository = new InvitationRepository();
    const invitationsCollection = await invitationRepository.findAllByCreatedBy(event.principalUser.id);

    const response = new Array<ResponseBody>();

    if (!invitationsCollection?.length) {
      SimpleLogger.warning(`No se encontraron invitaciones para el usuario: ${event.principalUser.email}`, 'ReadInvitationsHandler', event.requestId);
      return ResponseEntity.ok(response);
    }

    let row: Invitation;
    let invitationDTO: ResponseBody;

    for (row of invitationsCollection) {
      invitationDTO = {
        email: row.email,
        createdAt: row.createdAt,
        createdAtLabel: Dates.millisToLocalUserDatetime(row.createdAt),
        status: row.status,
        statusLabel: LABEL.parse(row.status),
        uid: row.uid,
      } as ResponseBody;

      response.push(invitationDTO);
    }

    return ResponseEntity.ok(response);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const ReadInvitationsHandler = Middlify(ReadInvitations, [
  ProvideLoggerMiddleware('ReadInvitationsHandler'),
  ProvidePolicyMiddleware(),
]);

