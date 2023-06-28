import { cosineSimilarity } from './openai';
import { EmbeddingType } from './types';

export type EmbeddingScore = {
  similarity: number;
  plainText: string;
  url: string;
};

export function computeEmbeddingScores(
  searchEmbedding: number[],
  embeddings: EmbeddingType[],
): EmbeddingScore[] {
  const scores: EmbeddingScore[] = [];

  for (const embedding of embeddings) {
    const similarity = cosineSimilarity(
      searchEmbedding,
      embedding.embedding.data[0].embedding, // major major major major
    );
    scores.push({
      similarity,
      url: embedding.url,
      plainText: embedding.plaintext,
    });
  }

  scores.sort((a, b) => b.similarity - a.similarity);

  return scores;
}
