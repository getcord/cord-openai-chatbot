import { CreateEmbeddingResponse } from 'openai';

export type EmbeddingType = {
  url: string;
  plaintext: string;
  embedding: {
    data: {
      embedding: number[];
    }[];
  };
};

export type CachedEmbeddingType = Omit<EmbeddingType, 'embedding'> & {
  title: string;
  embedding: CreateEmbeddingResponse;
};

export type CachedInitialEmbeddingType = {
  title: string;
  embedding: CreateEmbeddingResponse | undefined;
  url: string;
  plaintext: string;
};
