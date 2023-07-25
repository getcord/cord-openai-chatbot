import { OpenAIApi, type CreateEmbeddingResponse, Configuration } from 'openai';
import * as dotenv from 'dotenv';
import { computeEmbeddingScores } from './computeEmbeddings';
import {
  BOT_CONTEXT,
  BOT_SAFE_WORD,
  BOT_USER_NAME,
  CONTENT_START,
} from './bot';
import {
  appendToConversationCache,
  conversationCache,
  initializeConversationWithPrompt,
} from './cache';
import embeddings from './../botKnowledge/generated/embeddings';
import { EmbeddingType } from './types';
dotenv.config();

const OPENAI_API_SECRET = process.env.OPENAI_API_SECRET as string;
const OPENAI_API_MODEL = process.env.OPENAI_API_MODEL as string;

const configuration = new Configuration({
  apiKey: OPENAI_API_SECRET,
});

const openai = new OpenAIApi(configuration);

function dot(a: number[], b: number[]) {
  return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
}

function norm(v: number[]) {
  return Math.sqrt(dot(v, v));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  return dot(a, b) / (norm(a) * norm(b));
}

// Strong-handing the types from the network to make sure we're not
// accepting garbage.
export function assertIsEmbedding(thing: unknown): CreateEmbeddingResponse {
  if (
    thing &&
    typeof thing === 'object' &&
    'data' in thing &&
    Array.isArray(thing.data) &&
    thing.data[0] &&
    typeof thing.data[0] === 'object' &&
    'embedding' in thing.data[0] &&
    Array.isArray(thing.data[0].embedding)
  ) {
    return thing as CreateEmbeddingResponse;
  }
  throw new Error('Invalid CreateEmbeddingResponse');
}

async function createEmbedding(
  openai: OpenAIApi,
  input: string,
): Promise<number[]> {
  const response = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input,
  });

  const res = assertIsEmbedding(response.data);

  return res.data[0].embedding as number[];
}

export async function getContextForMessage(
  mostRecentMessage: string,
  convo: string,
): Promise<string> {
  const [mostRecentMessageVector, convoVector] = await Promise.all([
    createEmbedding(openai, mostRecentMessage),
    createEmbedding(openai, convo),
  ]);

  const sourceData: EmbeddingType[] = embeddings.filter((embedding) => {
    if (embedding && 'embedding' && embedding) {
      return embedding;
    }
  });

  const mostRecentMessageScores = computeEmbeddingScores(
    mostRecentMessageVector,
    sourceData,
  );
  const convVectorScores = computeEmbeddingScores(convoVector, sourceData);
  const context: string[] = [];
  let charCount = 0;
  const seen = new Set<string>([]);
  const both = [...mostRecentMessageScores, ...convVectorScores];
  for (let s of both) {
    if (seen.has(s.plainText)) {
      continue;
    }
    seen.add(s.plainText);
    if (charCount + s.plainText.length < 8000) {
      context.push('\n');
      let url = s.url;
      if (url.startsWith('/')) {
        url = 'https://docs.cord.com' + url;
      }
      if (s.url !== '') {
        // context.push(`\n\nURL: ${CORD_DOCS_ORIGIN}` + s.url + '\n');
      }
      console.log(s.similarity, s.url);
      context.push('\n\n');
      context.push(s.plainText);
      charCount += s.plainText.length;
    } else {
      break;
    }
  }

  return context.join(' ');
}

export async function getChatBotResponse(
  threadID: string,
  mostRecentMessage: string,
  convo: string,
  isRetry = false,
): Promise<string> {
  let contentForOpenAI = convo;
  const convoWithoutPrompt = convo.substring(convo.indexOf(CONTENT_START));
  let context = '';
  try {
    context = await getContextForMessage(mostRecentMessage, convoWithoutPrompt);
  } catch (e) {
    console.log('Failed to get context for string');
  }

  if (context === '') {
    try {
      context = await getContextForMessage(
        mostRecentMessage,
        convoWithoutPrompt,
      );
    } catch (e) {
      console.log('Failed to get context for string twice');
    }
  }
  contentForOpenAI = contentForOpenAI.replace(BOT_CONTEXT, context);
  contentForOpenAI += '\n' + BOT_USER_NAME + ': ';
  let reply = '';
  try {
    console.log('Calling OpenAI: ');
    console.log('-------------------------------------');
    const r = await openai.createChatCompletion({
      model: OPENAI_API_MODEL,
      messages: [
        {
          role: 'user',
          content: contentForOpenAI,
        },
      ],
    });

    if (!r.data.choices[0].message) {
      conversationCache[threadID] += '\n\n';
      return '';
    }

    console.log('_______________');
    reply = r.data.choices[0].message.content ?? '';
    console.log('Reply:', reply);
    console.log('_______________');
  } catch (e) {
    console.log(e);
    initializeConversationWithPrompt(threadID);
    reply =
      "Sorry -- I had a little brainfart. I've probably forgotten everything we talked about.";
  }

  // This is probably dead code now, effectively, since we're being smarter about context.
  if (reply.includes(BOT_SAFE_WORD) && !isRetry) {
    console.log('Could not answer the question, trying again from scratch');
    delete conversationCache[threadID];
    return getChatBotResponse(threadID, mostRecentMessage, convo, true);
  }

  appendToConversationCache(threadID, BOT_USER_NAME, reply);
  conversationCache[threadID] += reply + '\n\n';
  return reply;
}
