import { Route } from '../../../deepcore/contracts/Route';
import { AuthenticationHandler } from './AuthenticationHandler';
import { UserRegisterHandler } from './UserRegisterHandler';
import { VerifyEmailAndUsernameHandler } from './VerifyEmailAndUsernameHandler';


export const IdentityRouting: Route[] = [
  {
    path: '/api/v1/users/signin',
    method: 'post',
    handler: AuthenticationHandler,
  },
  {
    path: '/api/v1/users/signup',
    method: 'post',
    handler: UserRegisterHandler,
  },
  {
    path: '/api/v1/users/signup/check-availability',
    method: 'post',
    handler: VerifyEmailAndUsernameHandler,
  },
];

