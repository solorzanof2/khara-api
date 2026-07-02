import { Route } from '../../../deepcore/contracts/Route';
import { CreateProjectHandler } from './CreateProjectHandler';
import { ReadProjectHandler } from './ReadProjectHandler';
import { ReadProjectsCollectionHandler } from './ReadProjectsCollectionHandler';
import { UpdateProjectHandler } from './UpdateProjectHandler';
import { UpdateProjectStatusHandler } from './UpdateProjectStatusHandler';


export const ProjectRouting: Route[] = [
  {
    path: '/api/v1/projects/collection',
    method: 'get',
    handler: ReadProjectsCollectionHandler,
  },
  {
    path: '/api/v1/projects/single',
    method: 'get',
    handler: ReadProjectHandler,
  },
  {
    path: '/api/v1/projects/create',
    method: 'post',
    handler: CreateProjectHandler,
  },
  {
    path: '/api/v1/projects/update',
    method: 'post',
    handler: UpdateProjectHandler,
  },
  {
    path: '/api/v1/projects/update-status',
    method: 'post',
    handler: UpdateProjectStatusHandler,
  },
];

