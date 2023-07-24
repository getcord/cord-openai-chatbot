import { setUserPresence, updateTypingIndicator } from './cord';

// Customise these
export const BOT_USER_NAME = 'Cordy';
export const BOT_USER_ID = 'Cord-Blimey-2';
export const BOT_SAFE_WORD = "Well, you've got me stumped!";
export const BOT_FIRST_MESSAGE = `Hi! I'm ${BOT_USER_NAME}. How may I help?`;

export const BOT_CONTEXT = 'BOT_CONTEXT' as const;
export const CONTENT_START = '\n!*_~*~_*!\n' as const;
/**
 * https://docs.cord.com/reference/location
 */
export const BOT_PRESENCE_LOCATION = { page: 'cord-ai-chatbot' } as const;

export async function showBotIsTyping(threadID: string) {
  // We leave some time before they see the typing indicator
  setTimeout(() => updateTypingIndicator(threadID, [BOT_USER_ID], true), 1000);

  // Want to constantly show the typing indicator
  const interval = setInterval(
    () => updateTypingIndicator(threadID, [BOT_USER_ID], true),
    2500,
  );

  function stopBotTyping() {
    clearInterval(interval);
    updateTypingIndicator(threadID, [BOT_USER_ID], false);
  }
  return stopBotTyping;
}

export async function showBotIsPresent(
  location: { page: string },
  orgID: string,
) {
  // Initially make the bot appear
  setUserPresence(location, orgID, false, BOT_USER_ID);

  // Ephemeral presence lasts for 30 seconds so we set an interval incase
  // the chat bot takes longer
  const botPresenceInterval = setInterval(() => {
    setUserPresence(location, orgID, false, BOT_USER_ID);
  }, 25 * 1000);

  function removeBotPresence() {
    clearInterval(botPresenceInterval);
    // Want to give it a second before it dissappears
    setTimeout(async () => {
      await setUserPresence(location, orgID, true, BOT_USER_ID);
    }, 1000);
  }

  return removeBotPresence;
}
