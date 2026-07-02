import { GlobalTaggableType } from '../../commons/constants/GlobalConstants';
import { Tag } from '../../domain/Tag';


export class PostDataDTO {

  mentions: string[] = new Array<string>();
  // mentionsText: string = '';
  mentionEntities: Tag[] = new Array<Tag>();
  hashtags: string[] = new Array<string>();
  // hashtagsText: string = '';
  hashtagEntities: Tag[] = new Array<Tag>();
  rawPost: string = '';
  post: string = '';
  userId: number = 0;
  postType: string = GlobalTaggableType.Post;

  constructor() { }

}

