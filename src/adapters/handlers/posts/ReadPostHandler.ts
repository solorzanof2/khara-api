import { FullPostResponse } from '../../../core/contracts/responses/PostResponse';
import { GlobalMention } from '../../../core/domain/GlobalMention';
import { InsightComment } from '../../../core/domain/InsightComment';
import { PostComment } from '../../../core/domain/PostComment';
import { PostInsight } from '../../../core/domain/PostInsight';
import { Dates } from '../../../core/helpers/DatesHelper';
import { LABEL } from '../../../core/helpers/LabelHelper';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { GlobalMentionRepository } from '../../persistence/GlobalMentionRepository';
import { PostInsightRepository } from '../../persistence/PostInsightRepository';
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
      totalComments: post.comments.length,
      totalInsights: 0,
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
      insights: new Array<any>(),
      comments: new Array<any>(),
      displayName: post.author.displayName,
      mention: post.author.mention,
    } as FullPostResponse;

    let insight: PostInsight;
    let comment: PostComment;
    let insightComment: InsightComment;
    let insightDTO: any;
    let commentDTO: any;
    let insightCommentDTO: any;
    let author: GlobalMention;

    const globalMentionRepository = new GlobalMentionRepository();

    let authorsCollection = new Array<GlobalMention>();
    let authorsIdsCollection = new Array<number>();

    const insightRepository = new PostInsightRepository();
    const insightsCollection = await insightRepository.findByParentId(post.id);
    postDTO.totalInsights = insightsCollection.length;

    if (insightsCollection?.length) {
      authorsIdsCollection = insightsCollection.map(row => row.authorId);
    }

    if (post.comments?.length) {
      authorsIdsCollection = [
        ...authorsIdsCollection,
        ...post.comments.map(row => row.authorId),
      ];
    }

    if (authorsIdsCollection.length) {
      authorsCollection = await globalMentionRepository.findAllByIdIn(authorsIdsCollection);
    }

    for (insight of insightsCollection) {
      author = authorsCollection.find(row => row.id === insight.authorId) as GlobalMention;

      insightDTO = {
        uid: insight.uid,
        rawContent: insight.markdownSource,
        htmlContent: insight.htmlSource,
        created: insight.createdAt,
        createdLabel: Dates.toUserDatetime(insight.createdAt),
        updated: insight.updatedAt,
        updatedLabel: Dates.toUserDatetime(insight.updatedAt),
        displayName: author.displayName,
        mention: author.mention,
        type: 'insight',
      }

      if (insight.comments?.length) {
        if (!insightDTO.comments?.length) {
          insightDTO.comments = new Array<any>();
        }

        for (insightComment of insight.comments) {
          insightCommentDTO = {
            uid: insightComment.uid,
            rawContent: insightComment.markdownSource,
            htmlContent: insightComment.htmlSource,
            created: insightComment.createdAt,
            createdLabel: Dates.toUserDatetime(insightComment.createdAt),
            updated: insightComment.updatedAt,
            updatedLabel: Dates.toUserDatetime(insightComment.updatedAt),
            displayName: author.displayName,
            mention: author.mention,
          }

          insightDTO.comments.push(insightCommentDTO);
        }
      }

      postDTO.insights.push(insightDTO);
    }

    for (comment of post.comments) {
      author = authorsCollection.find(row => row.id === comment.authorId) as GlobalMention;

      commentDTO = {
        uid: comment.uid,
        rawContent: comment.markdownSource,
        htmlContent: comment.htmlSource,
        created: comment.createdAt,
        createdLabel: Dates.toUserDatetime(comment.createdAt),
        updated: comment.updatedAt,
        updatedLabel: Dates.toUserDatetime(comment.updatedAt),
        displayName: author.displayName,
        mention: author.mention,
        type: 'comment',
      }

      postDTO.comments.push(commentDTO);
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

