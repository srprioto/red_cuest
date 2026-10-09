import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'
import { ApiError, authenticate, loadSurvey, saveSurvey } from '../api/client'
import { SESSION_KEY } from '../config'
import { deceptiveProgress } from '../lib/progress'
import { BLOCKS, TOTAL_BLOCKS } from '../survey'
import type { Answers, BlockAnswer, Metadata, Session, SurveyFile } from '../types'

const emptyMetadata = (): Metadata => ({
	started: false,
	finished: false,
	completedBlocks: [],
	currentBlock: 0,
	lastBlock: null,
	startedAt: null,
	updatedAt: null,
	finishedAt: null,
})

const mergeMetadata = (partial: Partial<Metadata> | undefined): Metadata => ({
	...emptyMetadata(),
	...(partial ?? {}),
})

function readStoredIpress(): string | null {
	try {
		const raw = localStorage.getItem(SESSION_KEY)
		const parsed = raw ? (JSON.parse(raw) as { ipress?: unknown }) : null
		return typeof parsed?.ipress === 'string' ? parsed.ipress : null
	} catch {
		return null
	}
}

function storeSession(session: Session | null) {
	try {
		if (session) localStorage.setItem(SESSION_KEY, JSON.stringify({ ipress: session.ipress }))
		else localStorage.removeItem(SESSION_KEY)
	} catch {
		// almacenamiento no disponible: la sesión solo dura mientras la página siga abierta
	}
}

type Status = 'loading' | 'ready' | 'error'

export type LoginResult = { ok: true; metadata: Metadata } | { ok: false; error: string }

interface SurveyContextValue {
	status: Status
	/** null = nadie ha ingresado todavía. */
	session: Session | null
	answers: Answers
	metadata: Metadata
	/** 0 a 1, curva "engañosa" para la línea inferior. */
	progress: number
	reload: () => void
	login: (codigo: string, nombre: string) => Promise<LoginResult>
	logout: () => void
	saveBlock: (blockId: string, answer: BlockAnswer) => Promise<boolean>
}

const SurveyContext = createContext<SurveyContextValue | null>(null)

export function SurveyProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<Status>('loading')
	const [session, setSession] = useState<Session | null>(null)
	const [answers, setAnswers] = useState<Answers>({})
	const [metadata, setMetadata] = useState<Metadata>(emptyMetadata)
	const [attempt, setAttempt] = useState(0)

	const applySurvey = useCallback((survey: SurveyFile) => {
		setSession({ ipress: survey.ipress, encargado: survey.encargado })
		setAnswers(survey.answers ?? {})
		setMetadata(mergeMetadata(survey.metadata))
	}, [])

	// Al abrir la app: si este navegador ya había ingresado, retoma esa encuesta.
	useEffect(() => {
		let cancelled = false
		const stored = readStoredIpress()
		if (!stored) {
			setStatus('ready')
			return
		}
		setStatus('loading')
		loadSurvey(stored)
			.then((survey) => {
				if (cancelled) return
				applySurvey(survey)
				setStatus('ready')
			})
			.catch((err) => {
				if (cancelled) return
				if (err instanceof ApiError && err.status === 404) {
					storeSession(null)
					setStatus('ready')
				} else {
					setStatus('error')
				}
			})
		return () => {
			cancelled = true
		}
	}, [attempt, applySurvey])

	const reload = useCallback(() => setAttempt((n) => n + 1), [])

	const login = useCallback(
		async (codigo: string, nombre: string): Promise<LoginResult> => {
			try {
				const { survey } = await authenticate(codigo, nombre)
				applySurvey(survey)
				storeSession({ ipress: survey.ipress, encargado: survey.encargado })
				return { ok: true, metadata: mergeMetadata(survey.metadata) }
			} catch (err) {
				return { ok: false, error: err instanceof ApiError ? err.code : 'red' }
			}
		},
		[applySurvey],
	)

	const logout = useCallback(() => {
		storeSession(null)
		setSession(null)
		setAnswers({})
		setMetadata(emptyMetadata())
	}, [])

	const persist = useCallback(
		async (nextAnswers: Answers, nextMeta: Metadata) => {
			if (!session) return false
			try {
				await saveSurvey(session.ipress, { answers: nextAnswers, metadata: nextMeta })
				setAnswers(nextAnswers)
				setMetadata(nextMeta)
				return true
			} catch {
				return false
			}
		},
		[session],
	)

	const saveBlock = useCallback(
		async (blockId: string, answer: BlockAnswer) => {
			const index = BLOCKS.findIndex((b) => b.id === blockId)
			if (index === -1) return false
			const now = new Date().toISOString()
			const currentBlock = Math.max(metadata.currentBlock, index + 1)
			const finished = currentBlock >= TOTAL_BLOCKS
			return persist(
				{ ...answers, [blockId]: answer },
				{
					...metadata,
					started: true,
					completedBlocks: Array.from(new Set([...metadata.completedBlocks, blockId])),
					currentBlock,
					finished,
					finishedAt: finished ? (metadata.finishedAt ?? now) : null,
					lastBlock: blockId,
					updatedAt: now,
				},
			)
		},
		[answers, metadata, persist],
	)

	const value = useMemo<SurveyContextValue>(
		() => ({
			status,
			session,
			answers,
			metadata,
			progress: deceptiveProgress(metadata.completedBlocks.length, TOTAL_BLOCKS),
			reload,
			login,
			logout,
			saveBlock,
		}),
		[status, session, answers, metadata, reload, login, logout, saveBlock],
	)

	return <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSurvey() {
	const ctx = useContext(SurveyContext)
	if (!ctx) throw new Error('useSurvey debe usarse dentro de <SurveyProvider>')
	return ctx
}
