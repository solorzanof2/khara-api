import { ProjectResponse } from './ProjectResponse';

export interface PostResponse {

  uid: string;
  totalChilds: number;
  fullContent: string;
  status: string;
  category: string;

}

export interface BasePostResponse {

  attributes?: Record<string, unknown>;
  category?: string;
  type?: 'post';

  uid: string;
  rawContent: string;
  htmlContent: string;
  createdLabel: string;
  created: number;
  updatedLabel: string;
  updated: number;
  totalChilds: number;
  displayName: string;
  mention: string;

}

export interface FullPostResponse extends BasePostResponse {

  project: ProjectResponse;
  childs: BasePostResponse[];

}

