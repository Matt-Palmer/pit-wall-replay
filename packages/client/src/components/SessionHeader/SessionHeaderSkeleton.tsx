import { Skeleton } from '../Skeleton/Skeleton';
import './session-header.css';

export function SessionHeaderSkeleton() {
  return (
    <header className="session-header" aria-busy="true" aria-label="Loading session">
      <div className="session-header__left">
        <Skeleton width={114} height={64} />
        <div className="session-header__official-title">
          <Skeleton width="20ch" height="2em" />
          <Skeleton width="14ch" />
        </div>
      </div>
      <div className="session-header__right">
        <Skeleton width="22ch" />
      </div>
    </header>
  );
}
