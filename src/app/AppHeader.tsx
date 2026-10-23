import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useHeaderHeight } from '../lib/useHeaderHeight';

/**
 * The one quiet top bar. It only arranges its slots: logo, name and day summary on the left, status
 * tabs in the middle, then tools and Settings on the right.
 */
export function AppHeader({
  day,
  tabs,
  tools,
  devTools,
  settings,
}: {
  /** Date and progress, beside the logo. */
  day: ReactNode;
  /** Status tabs, centred. */
  tabs: ReactNode;
  /** Search, filters and projects, before Settings. */
  tools: ReactNode;
  /** The Dev button, only in development builds. */
  devTools: ReactNode;
  /** The Settings button and menu. */
  settings: ReactNode;
}) {
  const headerRef = useRef<HTMLElement>(null);
  useHeaderHeight(headerRef);
  return (
    <header ref={headerRef}>
      <div className="brand">
        <span className="logo" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="wordmark">Clearspace</span>
        {day}
      </div>
      <div className="header-tabs">{tabs}</div>
      <div className="header-right">
        {tools}
        {devTools}
        {settings}
      </div>
    </header>
  );
}
