import { ChevronRight } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import FieldInput from '../components/fields/FieldInput'
import { IPRESS_LENGTH } from '../config'
import { useSurvey } from '../context/SurveyContext'
import { resumeTarget } from '../lib/navigation'
import type { Field, Scalar } from '../types'

const FIELD_NOMBRE: Field = {
	id: 'nombre',
	label: 'Nombre del encargado',
	type: 'text',
	placeholder: 'Nombres y apellidos',
	hint: 'Persona que responde la encuesta.',
}

const FIELD_IPRESS: Field = {
	id: 'ipress',
	label: 'Código IPRESS',
	type: 'text',
	inputMode: 'numeric',
	maxLength: IPRESS_LENGTH,
	placeholder: '00002420',
	hint: `Código de ${IPRESS_LENGTH} dígitos de tu establecimiento.`,
}

type Errors = Partial<Record<'nombre' | 'ipress', string>>

/** Pseudo-login: es un formulario más, validado contra la lista de códigos IPRESS. */
export default function LoginPage() {
	const navigate = useNavigate()
	const { login } = useSurvey()
	const [nombre, setNombre] = useState<Scalar>(null)
	const [ipress, setIpress] = useState<Scalar>(null)
	const [errors, setErrors] = useState<Errors>({})
	const [alert, setAlert] = useState('')
	const [busy, setBusy] = useState(false)

	useEffect(() => {
		document.title = 'Ingreso · Encuesta GERESA Cusco'
	}, [])

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setAlert('')

		const name = typeof nombre === 'string' ? nombre.trim() : ''
		const code = typeof ipress === 'string' ? ipress.trim() : ''
		const found: Errors = {}
		if (name.length < 3) found.nombre = 'Ingresa el nombre del encargado.'
		if (!code) found.ipress = 'Ingresa el código IPRESS.'
		else if (!/^\d+$/.test(code)) found.ipress = 'El código solo debe tener números.'
		setErrors(found)
		if (Object.keys(found).length > 0) return

		setBusy(true)
		const result = await login(code.padStart(IPRESS_LENGTH, '0'), name)
		setBusy(false)

		if (result.ok) return navigate(resumeTarget(result.metadata))
		if (result.error === 'codigo_no_registrado') {
			setErrors({ ipress: 'Este código IPRESS no está registrado. Verifica que esté bien escrito.' })
		} else if (result.error === 'red') {
			setAlert('No se pudo conectar con el servidor. Inténtalo otra vez en unos minutos.')
		} else {
			setAlert('No se pudo validar tus datos. Revisa la información e inténtalo otra vez.')
		}
	}

	return (
		<form className="block" onSubmit={onSubmit} noValidate>
			<header className="block__header">
				<p className="block__eyebrow">Identificación</p>
				<h1>Ingresa tus datos</h1>
				<p>Usaremos el código IPRESS para guardar y retomar la encuesta de tu establecimiento.</p>
			</header>

			<div className="block__card">
				<div className="fields">
					<FieldInput
						field={FIELD_NOMBRE}
						value={nombre}
						error={errors.nombre}
						domId="login-nombre"
						onChange={(v) => {
							setNombre(v)
							setErrors((p) => ({ ...p, nombre: undefined }))
						}}
					/>
					<FieldInput
						field={FIELD_IPRESS}
						value={ipress}
						error={errors.ipress}
						domId="login-ipress"
						onChange={(v) => {
							setIpress(v)
							setErrors((p) => ({ ...p, ipress: undefined }))
						}}
					/>
				</div>
			</div>

			{alert && (
				<p className="block__alert" role="alert">
					{alert}
				</p>
			)}

			<footer className="block__footer">
				<button type="submit" className="btn btn--primary btn--lg" disabled={busy}>
					{busy ? 'Validando…' : 'Ingresar'}
					{!busy && <ChevronRight size={20} />}
				</button>
			</footer>
		</form>
	)
}
