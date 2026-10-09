import { Pencil } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useSurvey } from '../context/SurveyContext'
import { BLOCKS } from '../data/preguntas'
import { computeTotales } from '../data/totales'
import { isVisible, validateBlock } from '../lib/validation'
import type { Block, Field, Item, Scalar } from '../types'

function formatValue(f: Field, v: Scalar | undefined): string {
  if (v === null || v === undefined || v === '') return '—'
  if (f.type === 'toggle') return v === 1 ? (f.yesLabel ?? 'Sí') : (f.noLabel ?? 'No')
  if (typeof v === 'number') return `${v.toLocaleString('es-PE')}${f.unit ? ` ${f.unit}` : ''}`
  return v
}

function AnswerList({ fields, values }: { fields: Field[]; values: Item }) {
  return (
    <dl className="answers">
      {fields
        .filter((f) => isVisible(f, values))
        .map((f) => (
          <div key={f.id} className="answers__row">
            <dt>{f.section ? `${f.section}: ${f.label}` : f.label}</dt>
            <dd>{formatValue(f, values[f.id])}</dd>
          </div>
        ))}
    </dl>
  )
}

function BlockSummary({ block }: { block: Block }) {
  const { answers } = useSurvey()
  const answer = answers[block.id]
  if (!answer) return null
  const repeat = block.repeat

  return (
    <section className="summary__block">
      <header>
        <h2>{block.title}</h2>
        <Link to={`/encuesta/${block.id}`} className="icon-btn">
          <Pencil size={16} />
          <span>Editar</span>
        </Link>
      </header>
      {block.fields.length > 0 && <AnswerList fields={block.fields} values={answer.values} />}
      {repeat && (
        <>
          <AnswerList fields={[repeat.gate]} values={answer.values} />
          {(answer.items ?? []).map((item, i) => (
            <div key={i} className="summary__item">
              <h3>
                {repeat.itemTitle} {i + 1}
              </h3>
              <AnswerList fields={repeat.fields} values={item} />
            </div>
          ))}
        </>
      )}
    </section>
  )
}

export default function SummaryPage() {
  const { metadata, answers } = useSurvey()
  if (!metadata.finished) {
    const target = BLOCKS[Math.min(metadata.currentBlock, BLOCKS.length - 1)]
    return <Navigate to={metadata.started ? `/encuesta/${target.id}` : '/'} replace />
  }

  const totales = computeTotales(answers)
  const invalid = BLOCKS.filter((b) => answers[b.id] && Object.keys(validateBlock(b, answers[b.id], answers)).length > 0)

  return (
    <div className="summary">
      <header className="block__header">
        <h1>Encuesta completada</h1>
        <p>Gracias por tu tiempo. Estas son tus respuestas y los totales calculados a partir de ellas.</p>
      </header>

      {invalid.length > 0 && (
        <div className="block__alert" role="alert">
          Algunas respuestas ya no son consistentes entre sí. Revisa:{' '}
          {invalid.map((b, i) => (
            <span key={b.id}>
              {i > 0 && ', '}
              <Link to={`/encuesta/${b.id}`}>{b.title}</Link>
            </span>
          ))}
          .
        </div>
      )}

      <section className="totals" aria-label="Totales actuales">
        {totales.map((t) => (
          <div key={t.id} className="totals__item">
            <span className="totals__value">{t.value.toLocaleString('es-PE')}</span>
            <span className="totals__label">{t.label}</span>
          </div>
        ))}
      </section>

      {BLOCKS.map((b) => (
        <BlockSummary key={b.id} block={b} />
      ))}
    </div>
  )
}
