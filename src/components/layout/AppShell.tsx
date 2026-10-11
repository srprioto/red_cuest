import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import { useSurvey } from '../../context/SurveyContext'
import { ORG_NAME, SURVEY_TITLE } from '../../config'
import { BLOCKS, isPhase } from '../../survey'
import BlockIndex from './BlockIndex'
import Logo from './Logo'
import ProgressBar from './ProgressBar'

export default function AppShell({ children }: { children: ReactNode }) {
	const { status, session, logout } = useSurvey()
	const navigate = useNavigate()

	const blockMatch = useMatch('/encuesta/:blockId')
	const partMatch = useMatch('/parte/:phase')
	const summaryMatch = useMatch('/resumen')

	// La fase define el color de acento: verde (Parte 1) o naranja (Parte 2).
	const phaseParam = partMatch?.params.phase
	const phase = blockMatch
		? BLOCKS.find((b) => b.id === blockMatch.params.blockId)?.phase
		: isPhase(phaseParam)
			? phaseParam
			: undefined

	const showIndex = status === 'ready' && !!session && !!(blockMatch || partMatch || summaryMatch)

	const onLogout = () => {
		logout()
		navigate('/')
	}

	return (
		<div className="shell" data-phase={phase}>
			<header className="topbar">
				<Logo small />
				<div className="topbar__title">
					<strong>{ORG_NAME}</strong>
					<span>{SURVEY_TITLE}</span>
				</div>
				{session && (
					<div className="topbar__session">
						<span className="topbar__code">
								IPRESS {session.ipress}
								{session.establecimiento ? ` · ${session.establecimiento}` : ''}
							</span>
						<button type="button" className="icon-btn" onClick={onLogout}>
							<LogOut size={16} />
							<span>Salir</span>
						</button>
					</div>
				)}
			</header>

			<div className={`shell__body ${showIndex ? 'shell__body--with-index' : ''}`}>
				<main className="shell__main">{children}</main>
				{showIndex && <BlockIndex />}
			</div>

			<ProgressBar />
		</div>
	)
}
