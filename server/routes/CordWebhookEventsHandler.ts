import type { Request, Response } from 'express';
import jsonStableStringify = require('fast-json-stable-stringify');
import { createHmac } from 'crypto';

import { getChatBotResponse } from './../lib/openai';

import {
  BOT_PRESENCE_LOCATION,
  BOT_USER_ID,
  BOT_USER_NAME,
  showBotIsPresent,
  showBotIsTyping,
} from '../lib/bot';
import {
  appendToConversationCache,
  conversationCache,
  initializeConversationWithPrompt,
} from '../lib/cache';
import { CORD_API_SECRET, USER_NAME, sendMessageToCord } from '../lib/cord';
import {
  generateCordParagraph,
  convertCordMessageToPlainText,
} from '../lib/messageContent';

/**
 * https://docs.cord.com/reference/events-webhook
 */
export default async function CordWebhookEventsHandler(
  req: Request,
  res: Response,
) {
  res.status(200);
  res.send();

  console.log('--- Cord Webhook Firing ---');

  verifySignature(req);

  if (req.body.messageID.endsWith('-bot')) {
    console.log('Ignoring the message from the bot');
    return;
  }

  const clearBotTypingInterval = await showBotIsTyping(req.body.thread.id);

  const clearBotPresence = await showBotIsPresent(
    BOT_PRESENCE_LOCATION,
    req.body.organizationID,
  );

  const plainText = convertCordMessageToPlainText(req.body.content);

  if (!(req.body.thread.id in conversationCache)) {
    initializeConversationWithPrompt(req.body.thread.id);
  }

  appendToConversationCache(req.body.thread.id, USER_NAME, plainText);

  const botResponse = await getChatBotResponse(
    req.body.thread.id,
    plainText,
    conversationCache[req.body.thread.id],
  );

  await clearBotTypingInterval();

  appendToConversationCache(req.body.thread.id, BOT_USER_NAME, botResponse);

  await sendMessageToCord({
    userID: BOT_USER_ID,
    threadID: req.body.thread.id,
    messageContent: [generateCordParagraph(botResponse)],
  });

  await clearBotPresence();
}

function verifySignature(req: Request) {
  const cordTimestamp = req.header('X-Cord-Timestamp');
  const cordSignature = req.header('X-Cord-Signature');
  const bodyString = jsonStableStringify(req.body);
  const verifyStr = cordTimestamp + ':' + bodyString;
  const hmac = createHmac('sha256', CORD_API_SECRET);
  hmac.update(verifyStr);
  const mySignature = hmac.digest('base64');

  if (cordSignature !== mySignature) {
    throw new Error('Signatures do not match');
  }
}
