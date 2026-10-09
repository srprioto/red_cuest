import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import BlockIndex from './BlockIndex'

import ProgressBar from './ProgressBar'

export default function AppShell({ children, showIndexAllowed }: { children: ReactNode; showIndexAllowed: boolean }) {
  const { pathname } = useLocation()
  const showIndex = showIndexAllowed && (pathname.startsWith('/encuesta') || pathname === '/resumen')

  return (
    <div className="shell">
      {/* <header className="topbar">
        <Logo small />
        <div className="topbar__title">
          <strong>{ORG_NAME}</strong>
          <span>{SURVEY_TITLE}</span>
        </div>
      </header> */}

      <div className={`shell__body ${showIndex ? 'shell__body--with-index' : ''}`}>
        <main className="shell__main">{children}</main>
        {showIndex && <BlockIndex />}
      </div>

      <ProgressBar />
    </div>
  )
}
