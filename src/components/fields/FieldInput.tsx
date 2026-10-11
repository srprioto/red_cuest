import type { ChangeEvent, ReactNode } from 'react'
import { NA_VALUE } from '../../config'
import type { Field, Scalar } from '../../types'

interface Props {
	field: Field
	value: Scalar | undefined
	error?: string
	/** Id único del input en el DOM. */
	domId: string
	/** Texto de referencia (lo declarado en la Parte 1). */
	reference?: string | null
	/** Reemplaza al hint del campo (hints que dependen de otras respuestas). */
	hintOverride?: string
	onChange: (value: Scalar) => void
}

export default function FieldInput({
	field,
	value,
	error,
	domId,
	reference,
	hintOverride,
	onChange,
}: Props) {
	const labelId = `${domId}-label`
	const errorId = `${domId}-error`
	const isNA = field.allowNA && value === NA_VALUE
	// Campo calculado: visible, pero solo lectura
	const isAuto = !!field.computed
	const hint = hintOverride ?? field.hint

	const describedBy = error ? errorId : undefined

	let control: ReactNode = null

	if (field.type === 'toggle') {
		const options: { v: 0 | 1; label: string }[] = [
			{ v: 1, label: field.yesLabel ?? 'Sí' },
			{ v: 0, label: field.noLabel ?? 'No' },
		]
		control = (
			<div className="toggle" role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy}>
				{options.map((o) => (
					<button
						key={o.v}
						type="button"
						role="radio"
						aria-checked={value === o.v}
						className={`toggle__option ${value === o.v ? 'is-selected' : ''}`}
						onClick={() => onChange(field.optional && value === o.v ? null : o.v)}
					>
						{o.label}
					</button>
				))}
			</div>
		)
	} else if (field.type === 'select') {
		control = (
			<select
				id={domId}
				className="input"
				value={typeof value === 'string' ? value : ''}
				aria-invalid={!!error}
				aria-describedby={describedBy}
				onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
			>
				<option value="" disabled>
					Selecciona una opción
				</option>
				{field.options?.map((o) => (
					<option key={o} value={o}>
						{o}
					</option>
				))}
			</select>
		)
	} else if (field.type === 'number') {
		control = (
			<div className={`input-wrap ${isAuto ? 'input-wrap--auto' : ''}`}>
				<input
					id={domId}
					className={`input ${isAuto ? 'input--auto' : ''}`}
					type="number"
					inputMode={field.decimal ? 'decimal' : 'numeric'}
					min={field.min ?? 0}
					max={field.max}
					step={field.decimal ? 'any' : 1}
					placeholder={isAuto ? 'Se calcula solo' : (field.placeholder ?? '0')}
					value={typeof value === 'number' ? value : ''}
					readOnly={isAuto}
					tabIndex={isAuto ? -1 : undefined}
					aria-readonly={isAuto || undefined}
					aria-invalid={!!error}
					aria-describedby={describedBy}
					onWheel={(e) => e.currentTarget.blur()}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						onChange(e.target.value === '' ? null : Number(e.target.value))
					}
				/>
				{isAuto ? (
					<span className="input-wrap__unit input-wrap__unit--auto">Automático</span>
				) : (
					field.unit && <span className="input-wrap__unit">{field.unit}</span>
				)}
			</div>
		)
	} else {
		// text | ip | mask
		control = (
			<>
				<input
					id={domId}
					className="input"
					type={field.secret ? 'password' : 'text'}
					autoComplete={field.secret ? 'current-password' : 'off'}
					inputMode={field.inputMode ?? (field.type === 'text' ? 'text' : 'decimal')}
					maxLength={field.maxLength}
					placeholder={field.placeholder}
					disabled={isNA}
					value={isNA ? '' : typeof value === 'string' ? value : ''}
					aria-invalid={!!error}
					aria-describedby={describedBy}
					onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
				/>
				{field.allowNA && (
					<label className="check">
						<input
							type="checkbox"
							checked={!!isNA}
							onChange={(e) => onChange(e.target.checked ? NA_VALUE : null)}
						/>
						<span>No aplica</span>
					</label>
				)}
			</>
		)
	}

	return (
		<div className={`field ${error ? 'field--error' : ''}`}>
			<div className="field__text">
				{field.type === 'toggle' ? (
					<span id={labelId} className="field__label">
						{field.label}
						{field.optional && <span className="field__optional">Opcional</span>}
					</span>
				) : (
					<label id={labelId} htmlFor={domId} className="field__label">
						{field.label}
						{field.optional && <span className="field__optional">Opcional</span>}
					</label>
				)}
				{hint && (
					<p className="field__hint">
						{hint}{' '}
						{field.helpLink && (
							<a href={field.helpLink.href} target="_blank" rel="noopener noreferrer">
								{field.helpLink.label}
							</a>
						)}
					</p>
				)}
				{reference && <span className="field__ref">Actual: {reference}</span>}
			</div>
			<div className="field__control">
				{control}
				{error && (
					<p id={errorId} className="field__error" role="alert">
						{error}
					</p>
				)}
			</div>
		</div>
	)
}
