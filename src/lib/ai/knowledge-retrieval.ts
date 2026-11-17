import { db } from '@/lib/db';

export interface RetrievedChunk {
  chunkId: string;
  knowledgeBaseId: string;
  title: string;
  category?: string | null;
  content: string;
  score: number;
}

export interface KnowledgeMatchResult {
  chunks: RetrievedChunk[];
  bestScore: number;
  matchStatus: 'STRONG_MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH';
}

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'cannot',
  'could', 'did', 'do', 'does', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'were', 'weren\'t', 'what', 'when', 'where', 'which', 'while',
  'who', 'whom', 'why', 'with', 'won\'t', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves', 'please',
  'tell', 'want', 'know', 'give', 'need'
]);

/**
 * Tokenizes text into normalized keywords
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

/**
 * Splits text into chunks of ~150-250 words with a 30-word overlap
 */
export function chunkText(content: string, chunkSizeWords = 200, overlapWords = 30): string[] {
  if (!content) return [];
  const words = content.trim().split(/\s+/);
  if (words.length <= chunkSizeWords) {
    return [content.trim()];
  }

  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSizeWords);
    chunks.push(chunkWords.join(' '));
    i += (chunkSizeWords - overlapWords);
  }

  return chunks;
}

/**
 * Index a knowledge base item into individual searchable chunks
 */
export async function indexKnowledgeBaseItem(knowledgeBaseId: string, companyId: string) {
  const item = await db.aiKnowledgeBase.findFirst({
    where: { id: knowledgeBaseId, companyId },
  });

  if (!item) throw new Error('Knowledge base item not found or company mismatch');

  // Deactivate old chunks
  await db.aiKnowledgeChunk.deleteMany({
    where: { knowledgeBaseId },
  });

  const textChunks = chunkText(item.content);

  for (let idx = 0; idx < textChunks.length; idx++) {
    const content = textChunks[idx];
    const tokenCount = Math.round(content.length / 4);

    await db.aiKnowledgeChunk.create({
      data: {
        knowledgeBaseId: item.id,
        companyId,
        chunkIndex: idx,
        content,
        metadata: JSON.stringify({
          title: item.title,
          category: item.category,
          sourceType: item.sourceType,
          version: item.version,
        }),
        tokenCount,
        isActive: item.status === 'ACTIVE',
      },
    });
  }

  // Update item sync status and chunk count
  await db.aiKnowledgeBase.update({
    where: { id: item.id },
    data: {
      totalChunks: textChunks.length,
      syncStatus: 'READY',
    },
  });
}

/**
 * STRICTLY TENANT-ISOLATED KNOWLEDGE RETRIEVAL
 * Company A query will NEVER inspect or return Company B chunks.
 */
export async function retrieveRelevantKnowledge(options: {
  companyId: string;
  query: string;
  maxChunks?: number;
}): Promise<KnowledgeMatchResult> {
  const { companyId, query, maxChunks = 3 } = options;

  if (!companyId) {
    throw new Error('Security Error: companyId is required for knowledge retrieval');
  }

  const queryKeywords = extractKeywords(query);
  if (queryKeywords.length === 0) {
    return { chunks: [], bestScore: 0, matchStatus: 'NO_MATCH' };
  }

  // Strict tenant scoping in MySQL query
  const chunks = await db.aiKnowledgeChunk.findMany({
    where: {
      companyId: companyId,
      isActive: true,
      knowledgeBase: {
        status: 'ACTIVE',
      },
    },
    include: {
      knowledgeBase: {
        select: {
          title: true,
          category: true,
          priority: true,
        },
      },
    },
  });

  if (!chunks || chunks.length === 0) {
    return { chunks: [], bestScore: 0, matchStatus: 'NO_MATCH' };
  }

  const queryLower = query.toLowerCase();
  const scoredChunks: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    const chunkLower = chunk.content.toLowerCase();
    const titleLower = chunk.knowledgeBase.title.toLowerCase();

    let score = 0;

    // 1. Exact phrase match bonus
    if (chunkLower.includes(queryLower)) {
      score += 0.5;
    } else if (titleLower.includes(queryLower)) {
      score += 0.4;
    }

    // 2. Keyword overlap scoring
    let matchedKeywords = 0;
    for (const kw of queryKeywords) {
      if (titleLower.includes(kw)) {
        matchedKeywords++;
        score += 0.25; // Title keyword matches are high value
      } else if (chunkLower.includes(kw)) {
        matchedKeywords++;
        score += 0.15;
      }
    }

    // Normalized overlap fraction
    const overlapRatio = queryKeywords.length > 0 ? matchedKeywords / queryKeywords.length : 0;
    score += overlapRatio * 0.3;

    // Knowledge base priority weight
    const priorityWeight = (chunk.knowledgeBase.priority || 10) / 20; // 0.5 default
    score = score * (0.8 + priorityWeight * 0.4);

    if (score > 0.15) {
      scoredChunks.push({
        chunkId: chunk.id,
        knowledgeBaseId: chunk.knowledgeBaseId,
        title: chunk.knowledgeBase.title,
        category: chunk.knowledgeBase.category,
        content: chunk.content,
        score: Math.min(1.0, score),
      });
    }
  }

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);
  const topChunks = scoredChunks.slice(0, maxChunks);
  const bestScore = topChunks.length > 0 ? topChunks[0].score : 0;

  let matchStatus: 'STRONG_MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH' = 'NO_MATCH';
  if (bestScore >= 0.55) {
    matchStatus = 'STRONG_MATCH';
  } else if (bestScore >= 0.25) {
    matchStatus = 'PARTIAL_MATCH';
  }

  return {
    chunks: topChunks,
    bestScore,
    matchStatus,
  };
}
