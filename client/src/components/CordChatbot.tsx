import { Thread } from '@cord-sdk/react';
import './CordChatbot.css';

export function CordChatbot({ threadID }: { threadID: string }) {
  return (
    <main className="chatbot-container">
      <a
        id="cord-thread-label"
        className="highlight-text hidden"
        href="https://docs.cord.com/components/cord-thread?utm_source=GitHub&utm_medium=referral&utm_campaign=ai_chatbot"
        target="_blank"
      >
        Cord Thread
      </a>
      <div className="thread-container">
        {threadID && (
          <Thread threadId={threadID} style={{ minHeight: 'auto' }} />
        )}
      </div>
    </main>
  );
}
