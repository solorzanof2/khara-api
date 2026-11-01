import { BasePostResponse, FullPostResponse } from './PostResponse';

export interface InsightResponse extends BasePostResponse {
  parentUid: string;
  totalBricks: number;
  project: FullPostResponse['project'];
  comments: BasePostResponse[];
  bricks: BasePostResponse[];
}
