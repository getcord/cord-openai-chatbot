import { useEffect, useRef, useState } from 'react';
import { CordProvider, PresenceObserver } from '@cord-sdk/react';
import { v4 as uuidv4 } from 'uuid';

import './App.css';
import { CordChatbot } from './components/CordChatbot';
import { Header } from './components/Header';

const CORD_LOCATION = { page: 'cord-ai-chatbot' };

function App() {
  const [cordAuthToken, setCordAuthToken] = useState<string | null>();
  const [showHighlightComponents, setShowHighlightComponents] = useState(false);
  const threadIDRef = useRef<string>(uuidv4());

  useEffect(() => {
    async function initializeCord() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_SERVER_HOST}/initialize-chatbot`,
          {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              threadID: threadIDRef.current,
            }),
          },
        );
        const data = await response.json();
        setCordAuthToken(data.clientAuthToken);
      } catch (error) {
        console.log('Something went wrong with initializing Cord: ', error);
      }
    }
    initializeCord();
  }, []);

  return (
    <CordProvider clientAuthToken={cordAuthToken}>
      <PresenceObserver location={CORD_LOCATION}>
        <Header
          location={CORD_LOCATION}
          showHighlightComponents={showHighlightComponents}
          setShowHighlightComponents={setShowHighlightComponents}
        />
        <CordChatbot threadID={threadIDRef.current} />
        <a
          id="cord-presence-observer-label"
          className="highlight-text hidden"
          href="https://docs.cord.com/components/cord-presence-observer?utm_source=GitHub&utm_medium=referral&utm_campaign=ai_chatbot"
          target="_blank"
        >
          Cord Presence Observer
        </a>
      </PresenceObserver>
    </CordProvider>
  );
}

export default App;
