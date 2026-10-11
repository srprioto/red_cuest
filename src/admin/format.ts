export const formatDate = (iso: string | null) =>
	iso ? new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—'
