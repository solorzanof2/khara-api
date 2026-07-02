import { GlobalMention } from '../../../core/domain/GlobalMention';
import { PostInsight } from '../../../core/domain/PostInsight';
import { Dates } from '../../../core/helpers/DatesHelper';
import { SimpleLogger } from '../../../deepcore/application/helpers/SimpleLogger';
import { ApiEvent, ApiProxyHandler, ApiProxyResult } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { GlobalMentionRepository } from '../../persistence/GlobalMentionRepository';
import { PostRepository } from '../../persistence/PostRepository';


const ReadInsightsCollection: ApiProxyHandler = async (event: ApiEvent): Promise<ApiProxyResult> => {
  try {
    const {
      ref,
    } = event.queryStringParameters;

    if (!ref) {
      SimpleLogger.warning(`No se recibió un UID ${ref} de publicación válido para leer los insights. [400] Bad Request`, 'ReadInsightsCollectionHandler', event.requestId);
      return ResponseEntity.badRequest();
    }

    const postRepository = new PostRepository();
    const post = await postRepository.findFullPostByUidAndStatusActive(ref);

    if (!post?.id) {
      SimpleLogger.warning(`La publicación principal no se encontró con el UID: ${ref}. [404] Not Found`, 'ReadInsightsCollectionHandler', event.requestId);
      return ResponseEntity.notFound();
    }

    let insight: PostInsight;
    let insightDTO: any;
    const collector = new Array<any>();

    const globalMentionRepository = new GlobalMentionRepository();
    let globalMention: GlobalMention;

    for (insight of post.insights) {
      globalMention = await globalMentionRepository.findById(post.authorId);

      insightDTO = {
        uid: insight.uid,
        rawContent: insight.markdownSource,
        htmlContent: insight.htmlSource,
        created: insight.createdAt,
        createdLabel: Dates.toUserDatetime(insight.createdAt),
        updated: insight.updatedAt,
        updatedLabel: Dates.toUserDatetime(insight.updatedAt),
        displayName: globalMention.displayName,
        mentions: globalMention.mention,
      };

      collector.push(insightDTO);
    }

    return ResponseEntity.ok(collector);
  }
  catch (error) {
    return ResponseEntity.error(error);
  }
}


export const ReadInsightsCollectionHandler = Middlify(ReadInsightsCollection, [
  ProvideLoggerMiddleware('ReadInsightsCollectionHandler'),
  ProvidePolicyMiddleware(),
]);

