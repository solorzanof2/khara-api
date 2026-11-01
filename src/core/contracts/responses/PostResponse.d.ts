import { ProjectResponse } from './ProjectResponse';


export interface PostResponse {

  uid: string;
  totalComments: number;
  totalInsights: number;
  fullContent: string;
  status: string;
  category: string;

}

export interface BasePostResponse {

  type?: 'comment' | 'insight';

  uid: string;
  rawContent: string;
  htmlContent: string;
  createdLabel: string;
  created: number;
  updatedLabel: string;
  updated: number;
  totalComments: number;
  totalInsights: number;
  displayName: string;
  mention: string;

}

export interface FullPostResponse extends BasePostResponse {

  project: ProjectResponse;
  insights: BasePostResponse[];
  comments: BasePostResponse[];

}

