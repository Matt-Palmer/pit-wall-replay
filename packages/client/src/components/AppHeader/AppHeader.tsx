import { Link, NavLink } from 'react-router-dom';
import './app-header.css';

export function AppHeader() {
  return (
    <header className="app-header">
      <Link to="/" className="app-header__brand" aria-label="Pit Wall Replay home">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M4 22 L4 6 L14 6 L14 14 L24 14 L24 22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="22" r="1.6" fill="currentColor" />
        </svg>
        <span className="app-header__wordmark">
          Pit Wall <span>Replay</span>
        </span>
      </Link>

      <nav className="app-header__nav" aria-label="Main">
        <NavLink to="/" end>Races</NavLink>
        <a href="#about">About</a>
        <a href="https://github.com/Matt-Palmer/pit-wall-replay" target="_blank" rel="noreferrer">GitHub</a>
      </nav>
    </header>
  );
}
