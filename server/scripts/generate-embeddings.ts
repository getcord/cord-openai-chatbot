#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Configuration, OpenAIApi } from 'openai';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { CachedInitialEmbeddingType } from '../lib/types';

import parseDownToPlaintextStrings from './lib/parseDownToPlaintext';

dotenv.config();

// This script grabs the list of urls from server/botKnowledge/urls.txt and
// makes a cURL request to each url to get the html content and parses it
// to get text content. It then feeds this to openAI to get embeddings.

const MAX_EMBEDDING_TEXT_LENGTH = 20000;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_SECRET,
});

const openai = new OpenAIApi(configuration);

async function createEmbedding(input: string) {
  const response = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input,
  });
  return response.data;
}

function getTitleByFuglyRegex(txt: string): string {
  const titleTag = txt.match(/<title[^>]*>([^<]*)<\/title>/);
  if (!titleTag) {
    throw new Error('Could not find any title tags in the sitemap?');
  }

  return titleTag[1];
}

async function getChunkedSitePages(
  urls: string[],
): Promise<{ url: string; title: string; plaintext: string }[]> {
  const chunks: { url: string; title: string; plaintext: string }[] = [];

  async function fetchUrl(url: string) {
    if (url.length === 0) {
      return;
    }

    let txt = '';
    try {
      const pageResponse = await axios.get(url);
      txt = await pageResponse.data;
      const plaintexts = parseDownToPlaintextStrings(txt);
      let title = getTitleByFuglyRegex(txt) || 'Cord.com';
      if (title.includes('Cord | Make the internet multiplayer | ')) {
        title = title.replace(
          'Cord | Make the internet multiplayer | ',
          '',
        );
      }
      for (const plaintext of plaintexts) {
        chunks.push({
          url,
          title,
          plaintext,
        });
      }
    } catch (error) {
      console.log('page fetch failed', url, error);
    }
  }

  await Promise.all(urls.map(fetchUrl));
  return chunks;
}

function getUrls() {
  const urlTextDocContent = readFileSync(
    join(process.cwd(), 'botKnowledge/urls.txt'),
    'utf-8',
  );
  return urlTextDocContent.split('\n').map((url) => url.trim());
}

const main = async () => {
  const urls = getUrls();
  const chunks = await getChunkedSitePages(urls);
  const embeddings: CachedInitialEmbeddingType[] = [];
  const promises: Array<Promise<void>> = [];
  let timeoutLength = 0;
  for (const chunk of chunks) {
    const embedding: CachedInitialEmbeddingType = {
      url: chunk.url,
      embedding: undefined,
      plaintext: chunk.plaintext,
      title: chunk.title,
    };
    embeddings.push(embedding);
    promises.push(
      new Promise((res) => {
        setTimeout(async () => {
          if (chunk.plaintext.length > MAX_EMBEDDING_TEXT_LENGTH) {
            console.error(
              'Truncating very long plaintext chunk for page: ' + chunk.url,
            );
            console.error('Plaintext chunk is: ' + chunk.plaintext);
            process.exit(1);
          }
          try {
            const data = await createEmbedding(chunk.plaintext);
            embedding.embedding = data;
            res();
          } catch (e) {
            console.error('Failed to fetch embedding for chunk: ');
            console.error((e as Error).message);
          }
        }, (timeoutLength += 100));
      }),
    );
  }
  await Promise.all(promises);

  const embeddingsFile = `// @generated by build/scripts/generate-embeddings.js
  import type { CachedEmbeddingType } from './../../lib/types';

  const embeddings: CachedEmbeddingType[] = ${JSON.stringify(
    embeddings,
    null,
    2,
  )};

  export default embeddings;\n`;
  writeFileSync(
    join(process.cwd(), '/botKnowledge/generated/embeddings.ts'),
    embeddingsFile,
  );
};

Promise.all([main()]).catch((err) => {
  console.error(err);
  process.exit(1);
});
