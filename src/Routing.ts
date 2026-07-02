import { IdentityRouting } from './adapters/handlers/identity/IdentityRouting';
import { PostRouting } from './adapters/handlers/posts/PostRouting';
import { ProjectRouting } from './adapters/handlers/projects/ProjectRouting';
import { SystemRouting } from './adapters/handlers/system/SystemRouting';


export const Routings = [
  ...SystemRouting,
  ...IdentityRouting,
  ...PostRouting,
  ...ProjectRouting,
] as const;

