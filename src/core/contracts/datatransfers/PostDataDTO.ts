import { Tag } from '../../domain/Tag';

export class PostDataDTO {

  mentions: string[] = new Array<string>();
  mentionEntities: Tag[] = new Array<Tag>();
  hashtags: string[] = new Array<string>();
  hashtagEntities: Tag[] = new Array<Tag>();
  rawPost: string = '';
  post: string = '';
  userId: number = 0;

  constructor() { }

}

