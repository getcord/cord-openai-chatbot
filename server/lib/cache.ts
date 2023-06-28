// This would be equivalent to your database

import { readFileSync } from 'fs';
import { BOT_SAFE_WORD, BOT_USER_NAME, CONTENT_START } from './bot';

export const conversationCache: { [threadID: string]: string } = {};
export const threadOrgCache: { [threadID: string]: string } = {};

export function appendToConversationCache(
  threadID: string,
  userName: string,
  message: string,
) {
  conversationCache[threadID] += userName + ': ' + message + '\n\n';
}

export function initializeConversationWithPrompt(threadID: string) {
  let content = readFileSync(process.cwd() + '/botKnowledge/prompt.txt', {
    encoding: 'utf-8',
    flag: 'r',
  });

  content = content.replace(/BOT_USER_NAME/g, BOT_USER_NAME);
  content = content.replace(/BOT_ESCAPE_WORD/g, BOT_SAFE_WORD);
  content += CONTENT_START;

  conversationCache[threadID] = content;
}
