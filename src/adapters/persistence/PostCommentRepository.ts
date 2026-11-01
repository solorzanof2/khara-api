import { jsonParse } from '../../core/helpers/functions/Json';
import { PostComment } from '../../core/domain/PostComment';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class PostCommentRepository extends Repository<PostComment> {
  async findByUid(uid: string): Promise<PostComment> {
    this.selectQuery.equals('uid', uid).limit(1);
    const [row] = await this.execute(this.selectQuery);
    if (!row?.id) return new PostComment();
    row.attributes = jsonParse(row.attributes);
    return row;
  }


  constructor() {
    super(PostComment);
  }

}

