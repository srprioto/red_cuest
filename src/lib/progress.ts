/**
 * Progreso "engañoso" de la línea inferior.
 *
 * Una línea lineal delataría cuántos bloques hay (10 bloques = 10 % cada uno).
 * Esta curva avanza rápido al inicio y cada vez menos, así que el 50 % se
 * alcanza en los primeros bloques y parece que ya casi se termina.
 * Funciona con cualquier cantidad de bloques y llega exactamente a 1 al final.
 */
const DECAY = 0.78 // más bajo = arranca más fuerte; más alto = se acerca a lineal

export function deceptiveProgress(done: number, total: number): number {
	if (total <= 0 || done <= 0) return 0
	if (done >= total) return 1
	return (1 - DECAY ** done) / (1 - DECAY ** total)
}
