// Layout de la skin (64×64) y de las capas de armadura (64×32, layout legado),
// más la carga de skins por nick, archivo o skin por defecto.

import { RUTA, cargarImagen, lienzo } from './imagenes'

export type Rect = { x: number; y: number; w: number; h: number }
export type Caras = { top: Rect; bottom: Rect; right: Rect; front: Rect; left: Rect; back: Rect }

/** Despliegue estándar de una caja en el atlas, desde su esquina superior izquierda. */
export function cajaCaras(ox: number, oy: number, w: number, h: number, d: number): Caras {
  return {
    top:    { x: ox + d,         y: oy,     w,    h: d },
    bottom: { x: ox + d + w,     y: oy,     w,    h: d },
    right:  { x: ox,             y: oy + d, w: d, h },
    front:  { x: ox + d,         y: oy + d, w,    h },
    left:   { x: ox + d + w,     y: oy + d, w: d, h },
    back:   { x: ox + d + w + d, y: oy + d, w,    h },
  }
}

export type NombreParte = 'head' | 'body' | 'rightArm' | 'leftArm' | 'rightLeg' | 'leftLeg'

export interface Parte {
  nombre: NombreParte
  size: [number, number, number]
  pos: [number, number, number]
  base: Caras
  overlay: Caras | null
  /** La textura de esta caja va reflejada (miembros izquierdos en el layout legado). */
  espejo?: boolean
}

/** Partes del jugador en una skin 64×64. */
export function partesJugador(slim: boolean): Parte[] {
  const aw = slim ? 3 : 4
  const ax = slim ? 5.5 : 6
  return [
    { nombre: 'head',     size: [8, 8, 8],   pos: [0, 28, 0],   base: cajaCaras(0, 0, 8, 8, 8),     overlay: cajaCaras(32, 0, 8, 8, 8) },
    { nombre: 'body',     size: [8, 12, 4],  pos: [0, 18, 0],   base: cajaCaras(16, 16, 8, 12, 4),  overlay: cajaCaras(16, 32, 8, 12, 4) },
    { nombre: 'rightArm', size: [aw, 12, 4], pos: [-ax, 18, 0], base: cajaCaras(40, 16, aw, 12, 4), overlay: cajaCaras(40, 32, aw, 12, 4) },
    { nombre: 'leftArm',  size: [aw, 12, 4], pos: [ax, 18, 0],  base: cajaCaras(32, 48, aw, 12, 4), overlay: cajaCaras(48, 48, aw, 12, 4) },
    { nombre: 'rightLeg', size: [4, 12, 4],  pos: [-2, 6, 0],   base: cajaCaras(0, 16, 4, 12, 4),   overlay: cajaCaras(0, 32, 4, 12, 4) },
    { nombre: 'leftLeg',  size: [4, 12, 4],  pos: [2, 6, 0],    base: cajaCaras(16, 48, 4, 12, 4),  overlay: cajaCaras(0, 48, 4, 12, 4) },
  ]
}

/**
 * Partes de una capa de armadura (textura 64×32): los miembros izquierdos no
 * tienen zona propia, reutilizan la del derecho reflejada, igual que en el juego.
 */
export function partesArmadura(): Parte[] {
  return [
    { nombre: 'head',     size: [8, 8, 8],  pos: [0, 28, 0], base: cajaCaras(0, 0, 8, 8, 8),    overlay: null },
    { nombre: 'body',     size: [8, 12, 4], pos: [0, 18, 0], base: cajaCaras(16, 16, 8, 12, 4), overlay: null },
    { nombre: 'rightArm', size: [4, 12, 4], pos: [-6, 18, 0], base: cajaCaras(40, 16, 4, 12, 4), overlay: null },
    { nombre: 'leftArm',  size: [4, 12, 4], pos: [6, 18, 0],  base: cajaCaras(40, 16, 4, 12, 4), overlay: null, espejo: true },
    { nombre: 'rightLeg', size: [4, 12, 4], pos: [-2, 6, 0],  base: cajaCaras(0, 16, 4, 12, 4),  overlay: null },
    { nombre: 'leftLeg',  size: [4, 12, 4], pos: [2, 6, 0],   base: cajaCaras(0, 16, 4, 12, 4),  overlay: null, espejo: true },
  ]
}

// ── Carga de skins ──────────────────────────────────────────────────────────

export interface SkinCargada {
  canvas: HTMLCanvasElement   // siempre 64×64
  slim: boolean
}

/** Normaliza a 64×64: las skins antiguas (64×32) no tienen miembros izquierdos. */
function a64(img: HTMLImageElement): HTMLCanvasElement {
  const ancho = img.naturalWidth
  const alto = img.naturalHeight
  const escala = ancho / 64                       // skins HD (128, 256…) se reducen a 64
  const legacy = Math.round(alto / escala) === 32

  const c = lienzo(64, 64)
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, ancho, alto, 0, 0, 64, legacy ? 32 : 64)

  if (legacy) {
    // Copia reflejada del brazo y la pierna derechos a las zonas izquierdas.
    const espejar = (sx: number, sy: number, w: number, h: number, dx: number, dy: number) => {
      const tmp = lienzo(w, h)
      const t = tmp.getContext('2d')!
      t.imageSmoothingEnabled = false
      t.translate(w, 0)
      t.scale(-1, 1)
      t.drawImage(c, sx, sy, w, h, 0, 0, w, h)
      ctx.drawImage(tmp, dx, dy)
    }
    espejar(0, 16, 16, 16, 16, 48)   // pierna derecha → izquierda
    espejar(40, 16, 16, 16, 32, 48)  // brazo derecho → izquierdo
  }
  return c
}

/** Pista para el modelo fino: la columna extra del brazo derecho vacía. */
function pareceSlim(c: HTMLCanvasElement): boolean {
  const d = c.getContext('2d', { willReadFrequently: true })!.getImageData(47, 20, 1, 13).data
  for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) return false
  return true
}

export async function skinDesdeImagen(img: HTMLImageElement, slim?: boolean): Promise<SkinCargada> {
  const canvas = a64(img)
  return { canvas, slim: slim ?? pareceSlim(canvas) }
}

export async function skinPorDefecto(id: string, slim: boolean): Promise<SkinCargada> {
  const img = await cargarImagen(RUTA(`skins/${id}.png`))
  return { canvas: a64(img), slim }
}

export async function skinDesdeArchivo(file: File): Promise<SkinCargada> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('No se pudo leer la imagen.'))
      i.src = url
    })
    if (img.naturalWidth % 64 !== 0) throw new Error('La skin debe ser de 64×64 (o 64×32).')
    return skinDesdeImagen(img)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Skin de un jugador por su nick. Resuelve contra la API de MineLite
 * (`/api/skin/usuario/<nick>`), que devuelve la textura servida desde el mismo
 * origen para que el canvas no quede contaminado y se pueda capturar.
 */
export async function skinPorNick(nick: string): Promise<SkinCargada & { nombre: string }> {
  const r = await fetch(`/api/skin/usuario/${encodeURIComponent(nick.trim())}`)
  if (r.status === 404) throw new Error('No existe ningún jugador con ese nombre.')
  if (!r.ok) throw new Error('No se pudo consultar la skin ahora mismo.')
  const datos = (await r.json()) as { nombre: string; textura: string; slim: boolean }
  const img = await cargarImagen(datos.textura)
  return { canvas: a64(img), slim: datos.slim, nombre: datos.nombre }
}
