import type { Session } from '@pitwall/shared';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import './race-card.css';

type RaceCardProps = {
  session: Session;
  round: number;
  onPrefetch?: () => void;
};

export function RaceCard({ session, round, onPrefetch }: RaceCardProps) {
  return (
    <Link
      to={`/race/${session.session_key}`}
      className="race-card"
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
    >
      <div className="race-card__top">
        <span className="race-card__round">R{String(round).padStart(2, '0')}</span>
        {/* TODO: sprint weekends get <span className="race-card__tag">Sprint</span> here */}
      </div>

      <div className="race-card__title">
        <span className="race-card__name">{session.country_name}</span>
        <span className="race-card__circuit">
          {session.circuit_short_name} · {format(new Date(session.date_start), 'd MMM')}
        </span>
      </div>

      <div className="race-card__sectors" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="race-card__bottom">
        <span className="race-card__status">Ready</span>
        <span className="race-card__cta">
          Replay
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
