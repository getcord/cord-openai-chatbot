import * as dotenv from 'dotenv';
import axios from 'axios';
import {
  ClientAuthTokenData,
  getClientAuthToken,
  getServerAuthToken,
} from '@cord-sdk/server';
import { BOT_USER_ID } from './bot';

dotenv.config();

// All api calls to Cord
export const CORD_APPLICATION_ID = process.env.CORD_APPLICATION_ID as string;
export const CORD_API_SECRET = process.env.CORD_API_SECRET as string;
export const CORD_SERVER = process.env.CORD_SERVER as string;
export const CORD_USER_EMAIL = process.env.CORD_USER_EMAIL as string;

export const USER_NAME = 'You';

export async function getCordServerAuthToken() {
  return getServerAuthToken(CORD_APPLICATION_ID, CORD_API_SECRET);
}

export async function getCordClientAuthToken(
  user: Omit<ClientAuthTokenData, 'app_id'>,
) {
  return getClientAuthToken(CORD_APPLICATION_ID, CORD_API_SECRET, user);
}

/**
 * Updates or creates user on the cord side
 * https://docs.cord.com/reference/rest-api/users
 */
export async function createOrUpdateCordUser({
  userID,
  userName,
  profilePictureURL,
}: {
  userID: string;
  userName: string;
  profilePictureURL: string;
}) {
  try {
    const token = await getCordServerAuthToken();
    await axios.put(
      CORD_SERVER + '/v1/users/' + encodeURIComponent(userID),
      {
        email: CORD_USER_EMAIL,
        name: userName,
        shortName: userName,
        profilePictureURL,
      },
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    );
  } catch (error) {
    console.log('createOrUpdateCordUser:', error);
  }
}

/**
 * Updates or creates org and adds user on the cord side
 * https://docs.cord.com/reference/rest-api/organizations
 */
export async function createOrUpdateCordOrgWithUsers({
  orgID,
  userIDs,
}: {
  orgID: string;
  userIDs: string[];
}) {
  try {
    const token = await getCordServerAuthToken();
    await axios.put(
      CORD_SERVER + '/v1/organizations/' + encodeURIComponent(orgID),
      {
        name: 'Ad hoc org ' + orgID,
        members: userIDs,
      },
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    );
  } catch (error) {
    console.log('createOrUpdateCordOrgWithUser:', error);
  }
}

/**
 * Sets a user as present within the location
 * https://docs.cord.com/reference/rest-api/presence
 */
export async function setUserPresence(
  location: object,
  orgID: string,
  absent: boolean,
  userID: string,
) {
  try {
    const token = await getCordServerAuthToken();

    await axios.put(
      CORD_SERVER + '/v1/users/' + encodeURIComponent(userID) + '/presence',
      {
        absent,
        durable: false,
        location,
        organizationID: orgID,
      },
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    );
  } catch (error) {
    console.log('setUserPresence', error);
  }
}

/**
 * Creates a message on a Cord thread
 * https://docs.cord.com/reference/rest-api/messages
 */
export async function sendMessageToCord({
  userID,
  threadID,
  messageContent,
}: {
  userID: string;
  threadID: string;
  messageContent: object[];
}) {
  try {
    const token = await getCordServerAuthToken();
    const resp = await axios.post(
      CORD_SERVER + '/v1/threads/' + encodeURIComponent(threadID) + '/messages',
      {
        id:
          'msg-' + Date.now() + '-' + (userID === BOT_USER_ID ? 'bot' : 'user'),
        authorID: userID,
        content: messageContent,
      },
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    );
    if (resp.status !== 200) {
      throw new Error('Response not 200');
    }
  } catch (error) {
    console.log('setUserPresence', error);
  }
}

/**
 * Adds users to the typing indicator of a thread
 * https://docs.cord.com/rest-apis/threads
 */
export async function updateTypingIndicator(
  threadID: string,
  userIDs: string[],
  typing: boolean,
) {
  try {
    const token = await getCordServerAuthToken();

    await axios.put(
      `${CORD_SERVER}/v1/threads/${encodeURIComponent(threadID)}`,
      { typing: typing ? userIDs : [] },
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    );
  } catch (error) {
    console.log('updateTypingIndicator', error);
  }
}
