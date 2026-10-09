import { Fragment } from 'react'
import { isVisible } from '../../lib/validation'
import { getReference } from '../../survey'
import type { Answers, Errors, Field, Item, Scalar } from '../../types'
import FieldInput from './FieldInput'

interface Props {
	fields: Field[]
	values: Item
	errors: Errors
	/** Prefijo para ids del DOM. */
	idPrefix: string
	keyOf?: (fieldId: string) => string
	/** Respuestas de toda la encuesta, para mostrar las referencias "Actual: X". */
	answers?: Answers
	onChange: (fieldId: string, value: Scalar) => void
}

/** Pinta una lista de campos, con subtítulos cuando cambia `section`. */
export default function FieldGroup({
	fields,
	values,
	errors,
	idPrefix,
	keyOf,
	answers,
	onChange,
}: Props) {
	const visible = fields.filter((f) => isVisible(f, values))
	let lastSection: string | undefined

	return (
		<div className="fields">
			{visible.map((f) => {
				const showSection = f.section && f.section !== lastSection
				lastSection = f.section
				return (
					<Fragment key={f.id}>
						{showSection && <h3 className="fields__section">{f.section}</h3>}
						<FieldInput
							field={f}
							value={values[f.id]}
							error={errors[keyOf ? keyOf(f.id) : f.id]}
							domId={`${idPrefix}-${f.id}`}
							reference={f.ref && answers ? getReference(f.ref, answers) : null}
							hintOverride={f.dynamicHint && answers ? f.dynamicHint(answers) : undefined}
							onChange={(v) => onChange(f.id, v)}
						/>
					</Fragment>
				)
			})}
		</div>
	)
}
