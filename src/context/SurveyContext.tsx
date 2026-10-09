import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadSurvey, saveSurvey } from '../api/client'
import { RESPONDENT_ID } from '../config'
import { BLOCKS, TOTAL_BLOCKS } from '../data/preguntas'
import type { Answers, BlockAnswer, Metadata } from '../types'

const emptyMetadata = (id: string): Metadata => ({
  respondentId: id,
  started: false,
  finished: false,
  completedBlocks: [],
  currentBlock: 0,
  lastBlock: null,
  startedAt: null,
  updatedAt: null,
  finishedAt: null,
})

type Status = 'loading' | 'ready' | 'error'

interface SurveyContextValue {
  status: Status
  answers: Answers
  metadata: Metadata
  /** 0 a 1, para la barra de progreso. */
  progress: number
  reload: () => void
  start: () => Promise<boolean>
  saveBlock: (blockId: string, answer: BlockAnswer) => Promise<boolean>
}

const SurveyContext = createContext<SurveyContextValue | null>(null)

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [answers, setAnswers] = useState<Answers>({})
  const [metadata, setMetadata] = useState<Metadata>(() => emptyMetadata(RESPONDENT_ID))
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    loadSurvey(RESPONDENT_ID)
      .then((data) => {
        if (cancelled) return
        setAnswers(data.answers ?? {})
        setMetadata({ ...emptyMetadata(RESPONDENT_ID), ...(data.metadata ?? {}) })
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  const persist = useCallback(async (nextAnswers: Answers, nextMeta: Metadata) => {
    try {
      await saveSurvey(RESPONDENT_ID, { answers: nextAnswers, metadata: nextMeta })
      setAnswers(nextAnswers)
      setMetadata(nextMeta)
      return true
    } catch {
      return false
    }
  }, [])

  const start = useCallback(async () => {
    if (metadata.started) return true
    const now = new Date().toISOString()
    return persist(answers, { ...metadata, started: true, startedAt: now, updatedAt: now })
  }, [answers, metadata, persist])

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
      answers,
      metadata,
      progress: Math.min(metadata.completedBlocks.length / TOTAL_BLOCKS, 1),
      reload,
      start,
      saveBlock,
    }),
    [status, answers, metadata, reload, start, saveBlock],
  )

  return <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSurvey() {
  const ctx = useContext(SurveyContext)
  if (!ctx) throw new Error('useSurvey debe usarse dentro de <SurveyProvider>')
  return ctx
}
