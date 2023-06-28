import type { Request, Response } from 'express';
import { sendMessageToCord, setUserPresence } from './../lib/cord';
import {
  BOT_FIRST_MESSAGE,
  BOT_PRESENCE_LOCATION,
  BOT_USER_ID,
} from '../lib/bot';
import { generateCordParagraph } from '../lib/messageContent';
import { threadOrgCache } from '../lib/cache';

export default async function SendFirstMessageHandler(
  req: Request,
  res: Response,
) {
  const threadID = req.body.threadID;
  try {
    await sendMessageToCord({
      threadID,
      userID: BOT_USER_ID,
      messageContent: [generateCordParagraph(BOT_FIRST_MESSAGE)],
    });
    res.status(200).send();

    // Want to show the bot as not present after it sends a message
    setTimeout(() => {
      setUserPresence(
        BOT_PRESENCE_LOCATION,
        threadOrgCache[threadID],
        true,
        BOT_USER_ID,
      );
    }, 1000);

    return;
  } catch (e) {
    console.log('SendFirstMessageHandler', e);
    return res.status(401).send();
  }
}
