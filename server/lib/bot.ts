import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi, type CreateEmbeddingResponse } from 'openai';
import { chatbots, eventIsFromBot } from '@cord-sdk/chatbot-base';
import { openaiCompletion, messageToOpenaiMessage } from '@cord-sdk/chatbot-openai';
import { EmbeddingType } from './types';
import { computeEmbeddingScores } from './computeEmbeddings';
import embeddings from './../botKnowledge/generated/embeddings';
import { CORD_API_SECRET, CORD_APPLICATION_ID, setUserPresence } from './cord';
import { HOST, PORT } from '../server';
import { readFileSync } from 'fs';

// Customise these
export const BOT_USER_NAME = 'Cordy';
export const BOT_USER_ID = 'Cord-Blimey-2';
export const BOT_SAFE_WORD = "Well, you've got me stumped!";
export const BOT_FIRST_MESSAGE = `Hi! I'm ${BOT_USER_NAME}. How may I help?`;

export const BOT_CONTEXT = 'BOT_CONTEXT' as const;

const OPENAI_API_SECRET = process.env.OPENAI_API_SECRET as string;
const OPENAI_API_MODEL = process.env.OPENAI_API_MODEL as string;

/**
 * https://docs.cord.com/reference/location
 */
export const BOT_PRESENCE_LOCATION = { page: 'cord-ai-chatbot' } as const;

dotenv.config();

const systemPrompt = readFileSync(process.cwd() + '/botKnowledge/prompt.txt', {
  encoding: 'utf-8',
  flag: 'r',
}).replace(/BOT_USER_NAME/g, BOT_USER_NAME).replace(/BOT_ESCAPE_WORD/g, BOT_SAFE_WORD);

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
function assertIsEmbedding(thing: unknown): CreateEmbeddingResponse {
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

async function getContextForMessage(
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

export const bots = chatbots(CORD_APPLICATION_ID, CORD_API_SECRET);
bots.register(BOT_USER_ID, {
  cordUser: {
    name: BOT_USER_NAME,
    profilePictureURL: `${HOST}:${PORT}/cordy-avatar.png`,
  },
  shouldRespondToEvent(event) {
    return !eventIsFromBot(event) && event.event.message.plaintext !== BOT_FIRST_MESSAGE;
  },
  getResponse: openaiCompletion(OPENAI_API_SECRET, async (messages, thread) => {
    await setUserPresence(BOT_PRESENCE_LOCATION, thread.groupID, false, BOT_USER_ID);
    const context = await getContextForMessage(
      messages[messages.length-1].plaintext,
      messages.map(m => m.plaintext).join("\n\n"),
    );

    return {
      model: OPENAI_API_MODEL,
      messages: [
        { role: 'system', content: systemPrompt.replace(/BOT_CONTEXT/g, context) },
        ...messages.map(messageToOpenaiMessage),
      ],
    };
  }),
  async onResponseSent(response, messages, thread) {
    await setUserPresence(BOT_PRESENCE_LOCATION, thread.groupID, true, BOT_USER_ID);
  },
})
