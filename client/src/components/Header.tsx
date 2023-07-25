import { PresenceFacepile } from '@cord-sdk/react';
import { Location as CordLocation } from '@cord-sdk/types';
import './Header.css';
import { useCallback } from 'react';

type HeaderProps = {
  location: CordLocation;
  showHighlightComponents: boolean;
  setShowHighlightComponents: (showHighlightComponents: boolean) => void;
};
export function Header({
  location,
  showHighlightComponents,
  setShowHighlightComponents,
}: HeaderProps) {
  const toggleHighlightCordComponents: React.MouseEventHandler<HTMLButtonElement> =
    useCallback(
      (e) => {
        e.preventDefault();
        const cordThread = document.querySelector('cord-thread');
        const cordThreadLabel = document.querySelector('#cord-thread-label');
        const cordPresenceFacepile = document.querySelector(
          'cord-presence-facepile',
        );
        const cordPresenceFacepileLabel = document.querySelector(
          '#cord-presence-facepile-label',
        );
        const cordPresenceObserver = document.querySelector(
          'cord-presence-observer',
        );
        const cordPresenceObserverLabel = document.querySelector(
          '#cord-presence-observer-label',
        );
        if (showHighlightComponents) {
          cordThread?.classList.remove('highlight-cord-components');
          cordPresenceFacepile?.classList.remove('highlight-cord-components');
          cordPresenceObserver?.classList.remove(
            'inset-highlight-cord-components',
          );
          cordThreadLabel?.classList.add('hidden');
          cordPresenceFacepileLabel?.classList.add('hidden');
          cordPresenceObserverLabel?.classList.add('hidden');
        } else {
          cordThread?.classList.add('highlight-cord-components');
          cordPresenceFacepile?.classList.add('highlight-cord-components');
          cordPresenceObserver?.classList.add(
            'inset-highlight-cord-components',
          );
          cordThreadLabel?.classList.remove('hidden');
          cordPresenceFacepileLabel?.classList.remove('hidden');
          cordPresenceObserverLabel?.classList.remove('hidden');
        }
        setShowHighlightComponents(!showHighlightComponents);
      },
      [setShowHighlightComponents, showHighlightComponents],
    );
  return (
    <header>
      <a
        href="https://cord.com/?utm_source=GitHub&utm_medium=referral&utm_campaign=ai_chatbot"
        target="_blank"
      >
        <img src="/cord-logo.png" alt="cord-logo" />
      </a>
      <button onClick={toggleHighlightCordComponents}>
        {showHighlightComponents
          ? 'Turn off highlight'
          : 'Highlight Cord Components'}
      </button>
      <div className="presence-facepile-container">
        <PresenceFacepile location={location} />
        <a
          id="cord-presence-facepile-label"
          className="highlight-text hidden"
          href="https://docs.cord.com/components/cord-presence-facepile?utm_source=GitHub&utm_medium=referral&utm_campaign=ai_chatbot"
          target="_blank"
        >
          Cord Presence Facepile
        </a>
      </div>
    </header>
  );
}
