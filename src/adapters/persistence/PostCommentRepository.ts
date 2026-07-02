import { PostComment } from '../../core/domain/PostComment';
import { Repository } from '../../deepcore/infrastructure/persistence/Repository';


export class PostCommentRepository extends Repository<PostComment> {

  constructor() {
    super(PostComment);
  }

}

