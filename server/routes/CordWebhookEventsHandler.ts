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

  // For all types refer to https://docs.cord.com/reference/events-webhook
  const type = req.body.type;

  if (!type) {
    console.log('No type found, ignoring');
    return;
  }

  if (type !== 'thread-message-added') {
    console.log('Event is not thread-message-added type');
    return;
  }

  const { message, thread } = req.body.event;

  if (message.id.endsWith('-bot')) {
    console.log('Ignoring the message from the bot');
    return;
  }

  const clearBotTypingInterval = await showBotIsTyping(thread.id);

  const clearBotPresence = await showBotIsPresent(
    BOT_PRESENCE_LOCATION,
    thread.organizationID,
  );

  const plainText = convertCordMessageToPlainText(message.content);

  if (!(thread.id in conversationCache)) {
    initializeConversationWithPrompt(thread.id);
  }

  appendToConversationCache(thread.id, USER_NAME, plainText);

  const botResponse = await getChatBotResponse(
    thread.id,
    plainText,
    conversationCache[thread.id],
  );

  await clearBotTypingInterval();

  appendToConversationCache(thread.id, BOT_USER_NAME, botResponse);

  await sendMessageToCord({
    userID: BOT_USER_ID,
    threadID: thread.id,
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
