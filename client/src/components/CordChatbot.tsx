import { Thread } from '@cord-sdk/react';
import type { ThreadWebComponentEvents } from '@cord-sdk/types';
import { useCallback } from 'react';
import './CordChatbot.css';

export function CordChatbot({ threadID }: { threadID: string }) {
  const onThreadChange = useCallback(
    async (threadInfo: ThreadWebComponentEvents['threadinfochange'][0]) => {
      if (threadInfo.messageCount === 0) {
        setTimeout(async () => {
          const response = await fetch(
            `${import.meta.env.VITE_APP_SERVER_HOST}/send-first-message`,
            {
              method: 'POST',
              mode: 'cors',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ threadID }),
            },
          );
          if (response.status !== 200) {
            console.log('Uh oh something went wrong');
          }
        }, 2000);
      }
    },
    [threadID],
  );
  return (
    <main className="cord-chatbot-container">
      <a
        id="cord-thread-label"
        className="highlight-text hidden"
        href="https://docs.cord.com/components/cord-thread?utm_source=GitHub&utm_medium=referral&utm_campaign=ai_chatbot"
        target="_blank"
      >
        Cord Thread
      </a>
      <div className="cord-thread-container">
        {threadID && (
          <Thread
            threadId={threadID}
            onThreadInfoChange={onThreadChange}
            style={{ minHeight: 'auto' }}
          />
        )}
      </div>
    </main>
  );
}
