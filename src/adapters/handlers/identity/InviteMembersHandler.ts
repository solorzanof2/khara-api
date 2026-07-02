import { GlobalStatus } from '../../../core/commons/constants/GlobalConstants';
import { RegularExpression } from '../../../core/commons/constants/RegexConstants';
import { Invitation } from '../../../core/domain/Invitation';
import { EventDate } from '../../../core/helpers/DatesHelper';
import { LABEL } from '../../../core/helpers/LabelHelper';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { Security } from '../../../deepcore/application/utils/Security';
import { InvitationRepository } from '../../persistence/InvitationRepository';
import { RoleRepository } from '../../persistence/RoleRepository';
import { WorkspaceRepository } from '../../persistence/WorkspaceRepository';


interface RequestBody {
  email: string;
  role: string;
  workspaceUid: string;
}


const InviteMember: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      email, role, workspaceUid,
    } = event.body as RequestBody;

    const invitationRepository = new InvitationRepository();
    const previousInvitation = await invitationRepository.findByEmailAndStatusPending(email);

    if (previousInvitation?.id) {
      SimpleLogger.warning(`Ya existe una invitación con estado: ${LABEL.parse(previousInvitation.status)} para el usuario: ${email} con Role: ${role}.`, 'InviteMemberHandler', event.requestId);
      return ResponseEntity.conflict();
    }

    if (email && !email.match(RegularExpression.Email)) {
      SimpleLogger.warning(`No se recibió un email o el mismo es inválido. -- ${email} -- [400] Bad Request`, 'InviteMembersHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!role) {
      SimpleLogger.warning(`No se recibió un role. -- ${role} -- [400] Bad Request`, 'InviteMembersHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    if (!workspaceUid) {
      SimpleLogger.warning(`No se recibió un UID válido para WORKSPACE. [400] Bad Request`, 'InviteMembersHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    const roleRepository = new RoleRepository();
    const roleEntity = await roleRepository.findByCode(role);

    if (!roleEntity?.id) {
      SimpleLogger.warning(`El role recibido es inválido. -- Role: ${role}. -- [404] Not Found`, 'InviteMembersHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const workspaceRepository = new WorkspaceRepository();
    const workspace = await workspaceRepository.findByUidAndStatusNotDeleted(workspaceUid);

    if (!workspace?.id) {
      SimpleLogger.warning(`No se encontró el WORKSPACE con el UID: ${workspaceUid}.`, 'CreatePostHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const dateNow = Date.now();

    const invite = new Invitation();
    invite.uid = Security.getRandomGUID();
    invite.workspaceId = workspace.id;
    invite.email = email;
    invite.roleId = roleEntity.id;
    invite.token = Security.getUUID();
    invite.status = GlobalStatus.Pending;
    invite.expiresAt = EventDate.getOneDayExpirationMillis();
    invite.createdAt = dateNow;
    invite.updatedAt = dateNow;
    invite.createdBy = event.principalUser.id;

    await invitationRepository.save(invite);

    return ResponseEntity.ok();
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const InviteMembersHandler = Middlify(InviteMember, [
  ProvideLoggerMiddleware('InviteMembersHandler'),
  ProvidePolicyMiddleware(),
]);

