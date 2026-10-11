import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Field, Scalar } from '../types'
import { registroEstado } from './api'
import { useAdmin } from './AdminContext'
import AuthForm from './AuthForm'

const FIELD_USUARIO: Field = { id: 'usuario', label: 'Usuario', type: 'text', placeholder: 'admin' }
const FIELD_PASSWORD: Field = {
	id: 'password',
	label: 'Contraseña',
	type: 'text',
	secret: true,
	placeholder: '••••••••',
}

const MESSAGES: Record<string, string> = {
	credenciales_invalidas: 'Usuario o contraseña incorrectos.',
	demasiados_intentos: 'Demasiados intentos fallidos. Espera un minuto e inténtalo otra vez.',
	servidor_no_disponible: 'No se pudo comunicar con el servidor. Inténtalo otra vez en unos minutos.',
}

export default function AdminLoginPage() {
	const { login } = useAdmin()
	const [usuario, setUsuario] = useState<Scalar>(null)
	const [password, setPassword] = useState<Scalar>(null)
	const [alert, setAlert] = useState('')
	const [busy, setBusy] = useState(false)
	const [sinUsuarios, setSinUsuarios] = useState(false)

	useEffect(() => {
		document.title = 'Panel de administración · Encuesta GERESA Cusco'
		registroEstado()
			.then((r) => setSinUsuarios(!r.hayUsuarios))
			.catch(() => undefined)
	}, [])

	const onSubmit = async () => {
		setAlert('')
		if (typeof usuario !== 'string' || !usuario.trim() || typeof password !== 'string' || !password) {
			return setAlert('Ingresa tu usuario y contraseña.')
		}
		setBusy(true)
		const res = await login(usuario, password)
		setBusy(false)
		if (!res.ok) setAlert(MESSAGES[res.error] ?? 'No se pudo iniciar sesión.')
	}

	return (
		<AuthForm
			eyebrow="Acceso restringido"
			title="Panel de administración"
			description="Ingresa con tu usuario para ver el avance de los establecimientos."
			fields={[
				{ field: FIELD_USUARIO, value: usuario, onChange: setUsuario },
				{ field: FIELD_PASSWORD, value: password, onChange: setPassword },
			]}
			alert={alert}
			submitLabel="Ingresar"
			busy={busy}
			onSubmit={onSubmit}
			footer={
				sinUsuarios && (
					<p>
						Aún no hay usuarios. <Link to="/register">Crea el primer administrador</Link>.
					</p>
				)
			}
		/>
	)
}
