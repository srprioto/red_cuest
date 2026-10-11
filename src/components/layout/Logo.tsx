/** Logo provisional: un cuadrado rojo de 80 x 80. Reemplazar por la imagen oficial. */
export default function Logo({ small = false }: { small?: boolean }) {
	return <div className={`logo ${small ? 'logo--sm' : ''}`} role="img" aria-label="Logo de GERESA Cusco" />
}
