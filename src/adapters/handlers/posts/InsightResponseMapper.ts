import { BrickService } from '../../../core/services/BrickService';
import { BasePostResponse } from '../../../core/contracts/responses/PostResponse';
import { GlobalMention } from '../../../core/domain/GlobalMention';
import { InsightBrick } from '../../../core/domain/InsightBrick';
import { InsightComment } from '../../../core/domain/InsightComment';
import { PostInsight } from '../../../core/domain/PostInsight';
import { Dates } from '../../../core/helpers/DatesHelper';

export function mapInsightResponse(entity: PostInsight | InsightComment | InsightBrick, author: GlobalMention | undefined,
  type: 'insight' | 'insight-comment' | 'insight-brick'): BasePostResponse {
  const attributes = type === 'insight-brick' ? BrickService.attributes(entity.attributes, entity.createdAt) : undefined;
  return {
    ...(attributes ? { attributes, category: (entity as InsightBrick).category } : {}),
    uid: entity.uid, type,
    rawContent: type === 'insight-brick' ? BrickService.description(entity as InsightBrick) : entity.markdownSource || '', htmlContent: entity.htmlSource || '',
    created: entity.createdAt, createdLabel: Dates.toUserDatetime(entity.createdAt),
    updated: entity.updatedAt, updatedLabel: Dates.toUserDatetime(entity.updatedAt),
    displayName: author?.displayName || '', mention: author?.mention || '',
    totalComments: 0, totalInsights: 0,
  };
}
