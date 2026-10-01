import type { Meeting } from '@pitwall/shared';
import { format } from 'date-fns';
import './session-header.css';

export function SessionHeader({ meeting }: { meeting: Meeting }) {
  return (
    <header className="session-header">
      <div className="session-header__left">
        <img src={meeting.country_flag} alt={meeting.country_name} className="session-header__country-flag" />
        <div className="session-header__official-title">
          <h1>{meeting.meeting_name}</h1>
          <p>{meeting.country_name}, {meeting.location}</p>
        </div>
      </div>
      <div className="session-header__right">
        <p className="session-header__date">{format(new Date(meeting.date_start), 'PPP')} - {format(new Date(meeting.date_end), 'PPP')}</p>
      </div>
    </header>
  );
}