# Encuesta de brechas tecnológicas · GERESA Cusco

Aplicación web (React + TypeScript + Vite) con un servidor local (Express) que guarda todo en archivos JSON.
No usa base de datos.

## Cómo ejecutarla

```bash
pnpm install
pnpm dev
```

| Dirección | Para qué sirve |
| --- | --- |
| `http://localhost:5173/` | Encuesta (se ingresa con el código IPRESS) |
| `http://localhost:5173/panel_admin` | Panel de administración (requiere usuario) |
| `http://localhost:5173/register` | Crear usuarios del panel |

El servidor (API) corre en el puerto 3001 y Vite lo usa como proxy en `/api`.

**Primer uso del panel:** entra a `/register` y crea el primer administrador. Mientras no exista ningún usuario, ese
registro es abierto; después solo puede crear cuentas quien ya inició sesión.

## Scripts (`package.json`)

```json
"dev": "concurrently -n web,api -c cyan,magenta \"vite\" \"tsx watch backend/index.ts\"",
"api": "tsx backend/index.ts"
```

## Estructura

```
├── index.html                 Página base (fuentes, idioma)
├── vite.config.ts             Vite: proxy de /api y exclusión de backend/ del recargado
├── tsconfig.node.json         TypeScript del backend y de Vite
├── .editorconfig              Indentación con tabulaciones
│
├── backend/                   TODO lo del servidor
│   ├── index.ts               Arranque de Express (puerto 3001)
│   ├── routes.ts              API de la encuesta: /api/auth, /api/encuesta/:codigo
│   ├── admin.ts               API del panel: /api/admin/*
│   ├── auth.ts                Contraseñas (scrypt), sesiones firmadas y freno de intentos
│   ├── storage.ts             Lectura y escritura de los JSON
│   ├── seguimiento.ts         Cruza establecimientos con encuestas y calcula el avance
│   ├── excel.ts               Generación de los Excel (exceljs)
│   └── data/
│       ├── establecimientos.json   Lista maestra (se llena a mano)  ← tú la creas
│       ├── establecimientos.example.json   Ejemplo del formato
│       ├── encuestas/<codigo>.json  Una encuesta por establecimiento (automático)
│       ├── users.json               Usuarios del panel (automático)
│       └── .secret                  Clave para firmar sesiones (automático)
│
└── src/
    ├── main.tsx · App.tsx     Entrada y rutas
    ├── config.ts · types.ts   Constantes y tipos compartidos
    ├── survey/                Las preguntas
    │   ├── fields.ts          Atajos para escribir preguntas y listas de opciones
    │   ├── parte1.ts          Parte 1: cantidad actual
    │   ├── parte2.ts          Parte 2: cantidad faltante
    │   ├── index.ts           Orden de los bloques, partes y referencias "Actual: X"
    │   ├── totales.ts         Totales calculados
    │   ├── progreso.ts        Avance real de una encuesta
    │   └── comparacion.ts     Comparación Actual | Faltante por área
    ├── lib/                   validation.ts · format.ts · progress.ts (línea inferior) · navigation.ts · utils.ts
    ├── api/client.ts          Llamadas al servidor
    ├── context/               Estado de la encuesta (sesión, respuestas, progreso)
    ├── components/            layout/ (barra, índice, progreso) · fields/ (campos) · summary/ (resumen)
    ├── pages/                 Bienvenida, ingreso, datos del establecimiento, bloques, transición, resumen
    ├── admin/                 Panel: ingreso, registro, seguimiento, detalle
    └── styles/                main.scss importa app.scss (todos los estilos, por secciones)
```

## Datos

`backend/data/establecimientos.json` es una lista de objetos. Se agregan a mano; el sistema escribe `ESTADO` y
`ACTUALIZADO EN` solo.

```json
{
	"CODIGO IPRESS": 2420,
	"NOMBRE DEL ESTABLECIMIENTO": "ACCOCUNCA",
	"PROVINCIA": "ESPINAR",
	"DISTRITO": "ALTO PICHIGUA",
	"RED": "CANAS-CANCHIS-ESPINAR",
	"MICRORED": "YAURI",
	"CATEGORIA": "I-1"
}
```

Si empiezas de cero, copia `establecimientos.example.json` como `establecimientos.json`.

## Editar las preguntas

Todo está en `src/survey/`. Cada bloque es un objeto con sus campos; los tipos son `number`, `text`, `toggle`
(Sí/No), `select`, `ip` y `mask`. Un campo puede ser opcional (`optional`), calculado (`computed`),
autocompletarse (`prefill`) o mostrar lo respondido en otro bloque (`ref`). Para repetir registros con el botón "+"
(como los servidores) se usa `repeat`.

## Notas

- `backend/data/.gitignore` evita subir a git los usuarios, la clave de sesiones y las encuestas.
- Cualquiera que conozca un código IPRESS puede abrir y editar la encuesta de ese establecimiento.
