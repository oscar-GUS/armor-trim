// Carga de texturas vanilla y composición en canvas: recoloreado de trims por
// paleta, tinte del cuero e iconos de item.

export const RUTA = (p: string) => `${import.meta.env.BASE_URL}mc/${p}`

const imgCache = new Map<string, Promise<HTMLImageElement>>()

export function cargarImagen(src: string): Promise<HTMLImageElement> {
  let p = imgCache.get(src)
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
      img.src = src
    })
    // Un fallo puntual de red no puede envenenar la caché para toda la sesión:
    // si sale mal se olvida y el siguiente intento vuelve a pedirla.
    p.catch(() => imgCache.delete(src))
    imgCache.set(src, p)
  }
  return p
}

export function lienzo(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = false
  return ctx
}

async function pixeles(src: string): Promise<ImageData> {
  const img = await cargarImagen(src)
  const c = lienzo(img.width, img.height)
  const ctx = ctx2d(c)
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, img.width, img.height)
}

// ── Paletas ─────────────────────────────────────────────────────────────────
// El trim se guarda «palettizado»: sus colores son exactamente los de
// trim_base.png. Para pintarlo con un material se sustituye cada color por el
// de la misma posición en la paleta de ese material.

const paletaCache = new Map<string, Promise<number[]>>()

function leerPaleta(nombre: string): Promise<number[]> {
  let p = paletaCache.get(nombre)
  if (!p) {
    p = pixeles(RUTA(nombre)).then((d) => {
      const out: number[] = []
      for (let i = 0; i < d.data.length; i += 4) {
        out.push((d.data[i] << 16) | (d.data[i + 1] << 8) | d.data[i + 2])
      }
      return out
    })
    paletaCache.set(nombre, p)
  }
  return p
}

const trimCache = new Map<string, Promise<HTMLCanvasElement>>()

/** Posición en la paleta base del color más parecido a uno dado. */
function masParecido(base: number[], r: number, g: number, b: number): number {
  let mejor = 0
  let cerca = Infinity
  for (let i = 0; i < base.length; i++) {
    const dr = ((base[i] >> 16) & 0xff) - r
    const dg = ((base[i] >> 8) & 0xff) - g
    const db = (base[i] & 0xff) - b
    const d = dr * dr + dg * dg + db * db
    if (d < cerca) {
      cerca = d
      mejor = i
    }
  }
  return mejor
}

/** Devuelve la textura del trim recoloreada con la paleta del material. */
export function trimRecoloreado(textura: string, paleta: string): Promise<HTMLCanvasElement> {
  const clave = `${textura}|${paleta}`
  let p = trimCache.get(clave)
  if (!p) {
    p = (async () => {
      const [base, destino, datos] = await Promise.all([
        leerPaleta('palettes/trim_base.png'),
        leerPaleta(`palettes/trim/${paleta}.png`),
        pixeles(RUTA(textura)),
      ])

      // Se busca la entrada MÁS PARECIDA, no la idéntica. Los colores no salen
      // del PNG: salen de leerlos con `getImageData`, y eso no devuelve siempre
      // el mismo número. Firefox, con la protección antihuella puesta (modo
      // estricto o ventana privada), le mete ruido a la lectura para que no se
      // pueda fichar al usuario por el canvas; los perfiles de color de
      // pantallas anchas también desplazan valores. Da igual que sea poco: con
      // una comparación exacta, un solo punto de diferencia deja el píxel sin
      // recolorear. Y como la paleta base son 8 píxeles, ahí el ruido se lleva
      // por delante media tabla: el trim salía en gris, que es justo el color
      // que tiene la textura sin tocar. Entre tonos que van de 32 en 32, «el
      // más parecido» acierta aunque los dos lados vengan movidos.
      const memoria = new Map<number, number>()

      const d = datos.data
      for (let i = 0; i < d.length; i += 4) {
        // El ruido también puede subir un poco el alfa de un píxel vacío.
        if (d[i + 3] < 8) continue
        const leido = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]
        let nuevo = memoria.get(leido)
        if (nuevo === undefined) {
          nuevo = destino[masParecido(base, d[i], d[i + 1], d[i + 2])] ?? leido
          memoria.set(leido, nuevo)
        }
        d[i] = (nuevo >> 16) & 0xff
        d[i + 1] = (nuevo >> 8) & 0xff
        d[i + 2] = nuevo & 0xff
      }
      const c = lienzo(datos.width, datos.height)
      ctx2d(c).putImageData(datos, 0, 0)
      return c
    })()
    trimCache.set(clave, p)
  }
  return p
}

// ── Tinte ───────────────────────────────────────────────────────────────────
const tinteCache = new Map<string, Promise<HTMLCanvasElement>>()

/** Multiplica la textura por un color (así tiñe Minecraft el cuero). */
export function tenido(textura: string, color: string): Promise<HTMLCanvasElement> {
  const clave = `${textura}|${color}`
  let p = tinteCache.get(clave)
  if (!p) {
    p = (async () => {
      const datos = await pixeles(RUTA(textura))
      const r = parseInt(color.slice(1, 3), 16) / 255
      const g = parseInt(color.slice(3, 5), 16) / 255
      const b = parseInt(color.slice(5, 7), 16) / 255
      const d = datos.data
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.round(d[i] * r)
        d[i + 1] = Math.round(d[i + 1] * g)
        d[i + 2] = Math.round(d[i + 2] * b)
      }
      const c = lienzo(datos.width, datos.height)
      ctx2d(c).putImageData(datos, 0, 0)
      return c
    })()
    tinteCache.set(clave, p)
  }
  return p
}

/** Apila capas (imágenes o canvas ya resueltos) sobre un lienzo del tamaño de la primera. */
export function apilar(capas: CanvasImageSource[], w: number, h: number): HTMLCanvasElement {
  const c = lienzo(w, h)
  const ctx = ctx2d(c)
  for (const capa of capas) ctx.drawImage(capa, 0, 0)
  return c
}
