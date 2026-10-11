import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import type { Field, Scalar } from '../types'
import { adminRegister, registroEstado } from './api'
import { useAdmin } from './AdminContext'
import AuthForm from './AuthForm'

const FIELDS: Record<'usuario' | 'password' | 'repetir', Field> = {
	usuario: {
		id: 'usuario',
		label: 'Usuario',
		type: 'text',
		placeholder: 'nombre.apellido',
		hint: 'De 3 a 32 caracteres: letras, números, punto, guion o guion bajo.',
	},
	password: {
		id: 'password',
		label: 'Contraseña',
		type: 'text',
		secret: true,
		hint: 'Mínimo 8 caracteres.',
	},
	repetir: { id: 'repetir', label: 'Repite la contraseña', type: 'text', secret: true },
}

type Errors = Partial<Record<keyof typeof FIELDS, string>>

/**
 * Registro de administradores. Es abierto solo mientras no exista ningún usuario;
 * después solo puede crear cuentas quien ya inició sesión.
 */
export default function RegisterPage() {
	const navigate = useNavigate()
	const { status, token, usuario: sesion, startSession } = useAdmin()
	const [hayUsuarios, setHayUsuarios] = useState<boolean | null>(null)
	const [usuario, setUsuario] = useState<Scalar>(null)
	const [password, setPassword] = useState<Scalar>(null)
	const [repetir, setRepetir] = useState<Scalar>(null)
	const [errors, setErrors] = useState<Errors>({})
	const [alert, setAlert] = useState('')
	const [creado, setCreado] = useState('')
	const [busy, setBusy] = useState(false)

	useEffect(() => {
		document.title = 'Crear usuario · Panel de administración'
		registroEstado()
			.then((r) => setHayUsuarios(r.hayUsuarios))
			.catch(() => setHayUsuarios(null))
	}, [])

	if (status === 'checking' || hayUsuarios === null) {
		return (
			<div className="state" role="status">
				<span className="spinner" aria-hidden="true" />
				Cargando…
			</div>
		)
	}

	// Ya hay usuarios y quien entra no es administrador: registro cerrado
	if (hayUsuarios && !sesion) {
		return (
			<AuthForm
				eyebrow="Acceso restringido"
				title="Registro cerrado"
				description="Solo un administrador puede crear nuevas cuentas. Inicia sesión y usa la opción «Crear usuario» del menú."
				fields={[]}
				submitLabel="Ir al panel"
				busy={false}
				onSubmit={() => navigate('/panel_admin')}
			/>
		)
	}

	const onSubmit = async () => {
		setAlert('')
		setCreado('')
		const user = typeof usuario === 'string' ? usuario.trim().toLowerCase() : ''
		const pass = typeof password === 'string' ? password : ''
		const found: Errors = {}
		if (!/^[a-z0-9._-]{3,32}$/.test(user)) found.usuario = 'Usa de 3 a 32 caracteres: letras, números, punto, guion o guion bajo.'
		if (pass.length < 8) found.password = 'La contraseña debe tener al menos 8 caracteres.'
		if (repetir !== pass) found.repetir = 'Las contraseñas no coinciden.'
		setErrors(found)
		if (Object.keys(found).length > 0) return

		setBusy(true)
		try {
			const res = await adminRegister(user, pass, token)
			if (res.token && res.usuario) {
				// Primer administrador: queda con la sesión iniciada
				startSession(res.token, res.usuario)
				navigate('/panel_admin')
				return
			}
			setCreado(user)
			setUsuario(null)
			setPassword(null)
			setRepetir(null)
		} catch (err) {
			const code = err instanceof ApiError ? err.code : ''
			if (code === 'usuario_existe') setErrors({ usuario: 'Ese usuario ya existe.' })
			else if (code === 'registro_restringido') setAlert('Tu sesión venció. Inicia sesión otra vez.')
			else setAlert('No se pudo crear el usuario. Inténtalo otra vez.')
		} finally {
			setBusy(false)
		}
	}

	return (
		<AuthForm
			eyebrow={hayUsuarios ? 'Administradores' : 'Primer uso'}
			title="Crear usuario"
			description={
				hayUsuarios
					? 'Crea una cuenta para otra persona que administrará el panel.'
					: 'Aún no hay usuarios. Esta cuenta será la primera administradora.'
			}
			fields={[
				{ field: FIELDS.usuario, value: usuario, error: errors.usuario, onChange: setUsuario },
				{ field: FIELDS.password, value: password, error: errors.password, onChange: setPassword },
				{ field: FIELDS.repetir, value: repetir, error: errors.repetir, onChange: setRepetir },
			]}
			alert={alert}
			submitLabel="Crear usuario"
			busy={busy}
			onSubmit={onSubmit}
			footer={
				<>
					{creado && <p className="admin-auth__ok">Usuario «{creado}» creado correctamente.</p>}
					{sesion && <Link to="/panel_admin">Volver al panel</Link>}
				</>
			}
		/>
	)
}
