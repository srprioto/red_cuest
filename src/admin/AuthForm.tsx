import { ChevronRight } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import FieldInput from '../components/fields/FieldInput'
import Logo from '../components/layout/Logo'
import { ORG_NAME } from '../config'
import type { Field, Scalar } from '../types'

interface AuthField {
	field: Field
	value: Scalar
	error?: string
	onChange: (v: Scalar) => void
}

interface Props {
	eyebrow: string
	title: string
	description: string
	fields: AuthField[]
	alert?: string
	submitLabel: string
	busy: boolean
	onSubmit: () => void
	/** Enlaces o textos debajo del botón. */
	footer?: ReactNode
}

/** Formulario centrado que usan el ingreso y el registro del panel. */
export default function AuthForm({
	eyebrow,
	title,
	description,
	fields,
	alert,
	submitLabel,
	busy,
	onSubmit,
	footer,
}: Props) {
	const handle = (e: FormEvent) => {
		e.preventDefault()
		onSubmit()
	}

	return (
		<div className="admin-auth">
			<div className="admin-auth__brand">
				<Logo small />
				<strong>{ORG_NAME}</strong>
			</div>
			<form className="block" onSubmit={handle} noValidate>
				<header className="block__header">
					<p className="block__eyebrow">{eyebrow}</p>
					<h1>{title}</h1>
					<p>{description}</p>
				</header>

				{fields.length > 0 && (
					<div className="block__card">
						<div className="fields">
							{fields.map((f) => (
								<FieldInput
									key={f.field.id}
									field={f.field}
									value={f.value}
									error={f.error}
									domId={`auth-${f.field.id}`}
									onChange={f.onChange}
								/>
							))}
						</div>
					</div>
				)}

				{alert && (
					<p className="block__alert" role="alert">
						{alert}
					</p>
				)}

				<footer className="block__footer">
					<button type="submit" className="btn btn--primary btn--lg" disabled={busy}>
						{busy ? 'Un momento…' : submitLabel}
						{!busy && <ChevronRight size={20} />}
					</button>
				</footer>
				{footer && <div className="admin-auth__footer">{footer}</div>}
			</form>
		</div>
	)
}
