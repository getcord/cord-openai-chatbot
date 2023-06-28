import { PresenceFacepile } from '@cord-sdk/react';
import { Location as CordLocation } from '@cord-sdk/types';
import './Header.css';

type HeaderProps = {
  location: CordLocation;
};
export function Header({ location }: HeaderProps) {
  return (
    <header>
      <img src="/cord-logo.png" />
      <PresenceFacepile location={location} />
    </header>
  );
}
