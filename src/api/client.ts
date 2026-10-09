import { API_BASE } from '../config'
import type { Answers, Metadata, SurveyPayload } from '../types'

export async function loadSurvey(
  id: string,
): Promise<{ answers: Answers; metadata: Metadata | null }> {
  const res = await fetch(`${API_BASE}/survey/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error(`Error ${res.status} al cargar la encuesta`)
  return res.json()
}

export async function saveSurvey(id: string, payload: SurveyPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/survey/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Error ${res.status} al guardar la encuesta`)
}
