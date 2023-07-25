import { PresenceFacepile } from '@cord-sdk/react';
import { Location as CordLocation } from '@cord-sdk/types';
import './Header.css';

type HeaderProps = {
  location: CordLocation;
};
export function Header({ location }: HeaderProps) {
  return (
    <header>
      <a href="https://cord.com" target="_blank">
        <img src="/cord-logo.png" alt="cord-logo" />
      </a>
      <PresenceFacepile location={location} />
    </header>
  );
}
