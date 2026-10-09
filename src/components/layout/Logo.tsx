/** Logo provisional: un cuadrado rojo de 80 x 80. Reemplazar por la imagen oficial. */
export default function Logo({ small = false }: { small?: boolean }) {
	return <img
		className={`logo ${small ? 'logo--sm' : ''}`} 
        src="/images/logoGeresa.jpg" 
        alt="Logo de Geresa" 
    />
}
