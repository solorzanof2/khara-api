import { FullPostResponse } from '../../../core/contracts/responses/PostResponse';
import { GlobalMention } from '../../../core/domain/GlobalMention';
import { Post } from '../../../core/domain/Post';
import { Dates } from '../../../core/helpers/DatesHelper';
import { LABEL } from '../../../core/helpers/LabelHelper';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { GlobalMentionRepository } from '../../persistence/GlobalMentionRepository';
import { PostRepository } from '../../persistence/PostRepository';
import { ProjectRepository } from '../../persistence/ProjectRepository';

const ReadPost: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      ref
    } = event.queryStringParameters;

    if (!ref) {
      SimpleLogger.warning(`El UID de referencia es inválido, [400] Bad Request`, 'ReadPostHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    const postRepository = new PostRepository();

    const post = await postRepository.findFullPostByUidAndStatusActive(ref);

    if (!post?.id) {
      SimpleLogger.warning(`La publicación con el ref: ${ref}, no encontrada.`, 'ReadPostHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const projectRepository = new ProjectRepository();
    const project = await projectRepository.findByIdAndStatusNotDeleted(post.projectId);

    if (!project?.id) {
      SimpleLogger.warning(`El proyecto de la publicación con el ref: ${ref}, no encontrado.`, 'ReadPostHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    const postDTO = {
      uid: post.uid,
      rawContent: post.markdownSource,
      htmlContent: post.htmlSource,
      created: post.createdAt,
      createdLabel: Dates.toUserDatetime(post.createdAt),
      updated: post.updatedAt,
      updatedLabel: Dates.toUserDatetime(post.updatedAt),
      project: {
        uid: project.uid,
        workspaceUid: project.workspace?.uid,
        name: project.name,
        key: project.projectKey,
        visibility: project.visibility,
        visibilityLabel: LABEL.parse(project.visibility),
        status: project.status,
        statusLabel: LABEL.parse(project.status),
        created: project.createdAt,
        createdLabel: Dates.millisToLocalUserDatetime(project.createdAt),
        updated: project.updatedAt,
        updatedLabel: Dates.millisToLocalUserDatetime(project.updatedAt),
      },
      totalChilds: post.postsCollection.length,
      childs: new Array<any>(),
      displayName: post.author.displayName,
      mention: post.author.mention,
    } as FullPostResponse;

    let author: GlobalMention;

    const globalMentionRepository = new GlobalMentionRepository();

    let authorsCollection = new Array<GlobalMention>();
    let authorsIdsCollection = new Array<number>();

    if (post.postsCollection?.length) {
      authorsIdsCollection = post.postsCollection.map(row => row.authorId);
    }

    if (authorsIdsCollection.length) {
      authorsCollection = await globalMentionRepository.findAllByIdIn(authorsIdsCollection);
    }

    const childCounts = await postRepository.countByParentIdIn(post.postsCollection.map(child => child.id));

    let postChild: Post;
    let postChildDTO: any;

    for (postChild of post.postsCollection) {
      author = authorsCollection.find(row => row.id === postChild.authorId) as GlobalMention;

      postChildDTO = {
        uid: postChild.uid,
        rawContent: postChild.markdownSource,
        htmlContent: postChild.htmlSource,
        created: postChild.createdAt,
        createdLabel: Dates.toUserDatetime(postChild.createdAt),
        updated: postChild.updatedAt,
        updatedLabel: Dates.toUserDatetime(postChild.updatedAt),
        totalChilds: childCounts.find(row => row.parentId === postChild.id)?.total ?? 0,
        displayName: author?.displayName ?? '',
        mention: author?.mention ?? '',
        type: 'post',
      }

      postDTO.childs.push(postChildDTO);
    }

    return ResponseEntity.ok(postDTO);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}

export const ReadPostHandler = Middlify(ReadPost, [
  ProvideLoggerMiddleware('ReadPostHandler'),
  ProvidePolicyMiddleware(),
]);

