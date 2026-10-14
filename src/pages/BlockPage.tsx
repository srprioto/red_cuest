import { ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import FieldGroup from '../components/fields/FieldGroup'
import RepeatSection from '../components/fields/RepeatSection'
import { useSurvey } from '../context/SurveyContext'
import { emptyItem } from '../lib/utils'
import { resumeTarget } from '../lib/navigation'
import { cleanAnswer, validateBlock } from '../lib/validation'
import { BLOCKS, PHASES } from '../survey'
import type { Block, Errors, Item, Scalar, Session } from '../types'

/** Valida que el bloque exista y que el usuario ya pueda verlo. */
export default function BlockPage() {
	const { blockId } = useParams()
	const { session, metadata } = useSurvey()
	const index = BLOCKS.findIndex((b) => b.id === blockId)

	if (!session) return <Navigate to="/ingreso" replace />
	if (index === -1 || index > metadata.currentBlock) {
		return <Navigate to={resumeTarget(metadata)} replace />
	}
	return <BlockForm key={BLOCKS[index].id} block={BLOCKS[index]} index={index} />
}

/** Respuestas guardadas + campos que se autocompletan (solo si nunca se respondieron). */
function initialValues(block: Block, saved: Item | undefined, session: Session | null): Item {
	const values: Item = { ...saved }
	if (!session) return values
	for (const f of block.fields) {
		if (f.prefill && values[f.id] === undefined) values[f.id] = f.prefill(session)
	}
	return values
}

function BlockForm({ block, index }: { block: Block; index: number }) {
	const navigate = useNavigate()
	const { session, answers, metadata, saveBlock } = useSurvey()
	const saved = answers[block.id]

	const [values, setValues] = useState<Item>(() => initialValues(block, saved?.values, session))
	const [items, setItems] = useState<Item[]>(saved?.items ?? [])
	const [errors, setErrors] = useState<Errors>({})
	const [saving, setSaving] = useState(false)
	const [saveError, setSaveError] = useState('')

	// Valores que se muestran y se guardan: incluye los campos calculados
	const effective = useMemo<Item>(() => {
		const out: Item = { ...values }
		for (const f of block.fields) if (f.computed) out[f.id] = f.computed(values, answers)
		return out
	}, [values, answers, block.fields])

	const repeat = block.repeat
	const isLast = index === BLOCKS.length - 1
	const wasFinished = metadata.finished

	useEffect(() => {
		window.scrollTo({ top: 0 })
		document.title = `${block.title} · Encuesta GERESA Cusco`
	}, [block.title])

	const clearError = (key: string) =>
		setErrors((prev) => {
			if (!(key in prev) && !('_items' in prev)) return prev
			const next = { ...prev }
			delete next[key]
			delete next._items
			return next
		})

	const setValue = (id: string, v: Scalar) => {
		setValues((prev) => ({ ...prev, [id]: v }))
		clearError(id)
	}

	const setGate = (v: Scalar) => {
		if (!repeat) return
		setValue(repeat.gate.id, v)
		if (v === 1 && items.length === 0) {
			setItems([emptyItem(repeat.fields.map((f) => f.id))])
		}
	}

	const setItemValue = (i: number, id: string, v: Scalar) => {
		setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [id]: v } : it)))
		clearError(`item:${i}:${id}`)
	}

	const addItem = () =>
		repeat && setItems((prev) => [...prev, emptyItem(repeat.fields.map((f) => f.id))])

	const removeItem = (i: number) => {
		setItems((prev) => prev.filter((_, idx) => idx !== i))
		setErrors({})
	}

	const focusFirstError = () =>
		window.setTimeout(() => {
			const el = document.querySelector<HTMLElement>(
				'.field--error input, .field--error select, .field--error button, .repeat > .field__error',
			)
			el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
			el?.focus({ preventScroll: true })
		}, 30)

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setSaveError('')
		const answer = cleanAnswer(block, { values: effective, items: repeat ? items : undefined })
		const found = validateBlock(block, answer, answers)
		if (Object.keys(found).length > 0) {
			setErrors(found)
			focusFirstError()
			return
		}
		setSaving(true)
		const ok = await saveBlock(block.id, answer)
		setSaving(false)
		if (!ok) {
			setSaveError('No se pudo guardar. Revisa tu conexión e inténtalo otra vez.')
			return
		}

		const next = BLOCKS[index + 1]
		if (wasFinished || !next) navigate('/resumen')
		// Primera vez que se termina una parte: pantalla de transición hacia la siguiente
		else if (next.phase !== block.phase && metadata.currentBlock <= index) navigate(`/parte/${next.phase}`)
		else navigate(`/encuesta/${next.id}`)
	}

	const buttonLabel = wasFinished ? 'Guardar y volver al resumen' : isLast ? 'Finalizar' : 'Siguiente'

	return (
		<form className="block" onSubmit={onSubmit} noValidate>
			<header className="block__header">
				<p className="block__eyebrow">{PHASES[block.phase].title}</p>
				<h1>{block.title}</h1>
				{block.subtitle && <p>{block.subtitle}</p>}
			</header>

			<div className="block__card">
				{block.fields.length > 0 && (
					<FieldGroup
						fields={block.fields}
						values={effective}
						errors={errors}
						idPrefix="f"
						answers={answers}
						onChange={setValue}
					/>
				)}
				{repeat && (
					<RepeatSection
						config={repeat}
						gateValue={values[repeat.gate.id]}
						items={items}
						errors={errors}
						onGateChange={setGate}
						onItemChange={setItemValue}
						onAdd={addItem}
						onRemove={removeItem}
					/>
				)}
			</div>

			{Object.keys(errors).length > 0 && (
				<p className="block__alert" role="alert">
					Hay respuestas por completar o corregir. Revisa los campos marcados.
				</p>
			)}
			{saveError && (
				<p className="block__alert" role="alert">
					{saveError}
				</p>
			)}

			<footer className="block__footer">
				<button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
					{saving ? 'Guardando…' : buttonLabel}
					{!saving && <ChevronRight size={20} />}
				</button>
			</footer>
		</form>
	)
}
