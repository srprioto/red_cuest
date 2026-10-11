/** Guarda un archivo recibido del servidor (Excel) en la computadora del usuario. */
export function saveBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	document.body.append(link)
	link.click()
	link.remove()
	window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const today = () => new Date().toISOString().slice(0, 10)
