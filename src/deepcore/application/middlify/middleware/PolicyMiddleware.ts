import { PolicyRepository } from '../../../../adapters/persistence/PolicyRepository';
import { UserRepository } from '../../../../adapters/persistence/UserRepository';
import { GlobalPolicy, GlobalStatus } from '../../../../core/commons/constants/GlobalConstants';
import { Action } from '../../../../core/domain/Action';
import { Policy } from '../../../../core/domain/Policy';
import { PrincipalUserDTO } from '../../../../core/utils/security/PrincipalUser';
import { ApiEvent, ApiProxyHandler, ApiProxyResult, HttpStatus } from '../../http/HttpContracts';
import { Security } from '../../utils/Security';
import { Middleware } from '../Middlify';


const ForbiddenMessage = "403 Forbidden";


const PolicyMiddleware: Middleware = async (event: ApiEvent, next: ApiProxyHandler): Promise<ApiProxyResult> => {
  try {
    let token = event.headers.Authorization || event.headers.authorization;

    if (!token) {
      throw new Error('No authorization token detected.');
    }

    if (!token.includes('Bearer ')) {
      throw new Error('No Bearer keyword detected.');
    }

    token = token.replace('Bearer ', '');

    const tokenInfo = await Security.validateJSONWebToken<PrincipalUserDTO>(token);

    // leer usuario
    const userRepository = new UserRepository();
    const user = await userRepository.findByUid(tokenInfo.uid);

    if (!user?.id) {
      throw new Error(`User not Found with UID: ${tokenInfo.uid}`);
    }

    // leer policies
    const policyRepository = new PolicyRepository();
    const policies = await policyRepository.findByRoleIdIn(user.roles.map(role => role.id));

    const canProceed = await userCanProceed(event.resourceName, event.method, policies);

    if (!canProceed) {
      throw new Error(`User ${tokenInfo.email} have no permissions to access the requested resource: ${event.method}/${event.resourceName}`);
    }

    event.principalUser = user;

    return next(event);
  }
  catch (error) {
    console.error(`[ERR0] PolicyMiddleware - ${error.message}`);
    return Promise.resolve(new ApiProxyResult(ForbiddenMessage, HttpStatus.Forbidden));
  }
}


export const ProvidePolicyMiddleware = (): Middleware => {
  // try {

  // }
  // catch (error) {
  //   console.error(`[ERR0] ProvidePolicyMiddleware - ${error.message}`);
  // }

  return async (event: ApiEvent, next: ApiProxyHandler): Promise<ApiProxyResult> => {
    return PolicyMiddleware(event, next);
  }
}


// getRecord:get || getRecord:list
const userCanProceed = async (resourceName: string, method: string, policies: Policy[]): Promise<boolean> => {
  for (const policy of policies) {
    let actions = new Array<Action>();

    // check if wildcard is present
    actions = findActionsByName('*', method, policy.actions);

    // we find at least one or more elements with wildcard;
    if (actions?.length === 1 || actions?.length > 1) {
      // make sure that there is no permission *.deny (this is an ambiguity) try to handle it in FE;
      if (actions.length > 1 && policy.effect === GlobalPolicy.Deny) {
        return Promise.resolve(false);
      }

      return Promise.resolve(true);
    }

    // if no wildcard is present, then we search the other elements {function:type};
    actions = findActionsByName(resourceName, method, policy.actions);

    // if no actions has been found;
    if (!actions?.length) {
      return Promise.resolve(false);
    }

    // if permission has one element only return policy effect (allow/deny);
    return Promise.resolve((policy.effect === GlobalPolicy.Allow));
  }
}


// const findPermissionByName = (value: string, permissions: Permission[]): PermissionDTO[] => {
//   return permissions.filter(permission => permission.actions.includes(value));
// }


const findActionsByName = (value: string, method: string, actions: Action[]): Action[] => {
  // return actions.filter(action => action.status === GlobalStatus.Active && action.name === value);
  if (value === '*') {
    return actions
      .filter(action => action.status === GlobalStatus.Active)
      .filter(action => action.name === value);
  }

  return actions
    .filter(action => action.status === GlobalStatus.Active)
    .filter(action => action.method === method)
    .filter(action => action.name === value);
}

