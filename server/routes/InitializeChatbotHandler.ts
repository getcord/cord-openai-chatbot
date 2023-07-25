import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { BOT_PRESENCE_LOCATION, BOT_USER_ID, BOT_USER_NAME } from '../lib/bot';
import {
  USER_NAME,
  createOrUpdateCordOrgWithUsers,
  createOrUpdateCordUser,
  getCordClientAuthToken,
  setUserPresence,
} from '../lib/cord';
import { HOST, PORT } from '../server';
import { threadOrgCache } from '../lib/cache';

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
  await createOrUpdateCordUser({
    userID: BOT_USER_ID,
    userName: BOT_USER_NAME,
    profilePictureURL: `${HOST}:${PORT}/cordy-avatar.png`,
  });
  await createOrUpdateCordOrgWithUsers({
    userIDs: [userID, BOT_USER_ID],
    orgID,
  });

  // Want to show the bot as present before it sends a message
  await setUserPresence(BOT_PRESENCE_LOCATION, orgID, false, BOT_USER_ID);

  // Store threadID and orgID realation
  threadOrgCache[threadID] = orgID;

  const user = {
    user_id: userID,
    organization_id: orgID,
  };

  const clientAuthToken = await getCordClientAuthToken(user);

  res.status(200);
  res.send(JSON.stringify({ clientAuthToken }));
}
