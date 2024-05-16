import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MessageNodeType } from '@cord-sdk/types';
import { BOT_FIRST_MESSAGE, BOT_PRESENCE_LOCATION, BOT_USER_ID, BOT_USER_NAME } from '../lib/bot';
import {
  USER_NAME,
  createOrUpdateCordOrgWithUsers,
  createOrUpdateCordUser,
  getCordClientAuthToken,
  sendMessageToCord,
  setUserPresence,
} from '../lib/cord';
import { HOST, PORT } from '../server';

export default async function InitializeChatbotHandler(
  req: Request,
  res: Response,
) {
  const userID = uuidv4();
  const orgID = uuidv4();
  const threadID = req.body.threadID;

  await createOrUpdateCordUser({
    userID,
    userName: USER_NAME,
    profilePictureURL: `${HOST}:${PORT}/user-avatar.png`,
  });
  await createOrUpdateCordOrgWithUsers({
    userIDs: [userID, BOT_USER_ID],
    orgID,
  });

  // Want to show the bot as present before it sends a message
  await setUserPresence(BOT_PRESENCE_LOCATION, orgID, false, BOT_USER_ID);
  const url = `${HOST}:${PORT}`;
  setTimeout(async () => {
    await sendMessageToCord({
      userID: BOT_USER_ID,
      threadID,
      messageContent: [{
        type: MessageNodeType.PARAGRAPH,
        children: [{
          text: BOT_FIRST_MESSAGE,
        }],
      }],
      createThread: {
        name: 'Cord and OpenAI Chatbot',
        groupID: orgID,
        location: { url },
        url,
      }
    });
  }, 1000);

  const user = {
    user_id: userID,
    organization_id: orgID,
  };

  const clientAuthToken = await getCordClientAuthToken(user);

  res.status(200);
  res.send(JSON.stringify({ clientAuthToken }));
}
