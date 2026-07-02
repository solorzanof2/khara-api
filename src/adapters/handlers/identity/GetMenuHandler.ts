import { Role } from '../../../core/domain/Role';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { RoleRepository } from '../../persistence/RoleRepository';


const GetMenu: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const roleDTO: Role = event.principalUser.roles[0];

    const roleRepository = new RoleRepository();
    const role = await roleRepository.findByUid(roleDTO.uid);

    return ResponseEntity.ok(role.menus);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const GetMenuHandler = Middlify(GetMenu, [
  ProvideLoggerMiddleware('GetMenuHandler'),
  ProvidePolicyMiddleware(),
]);

