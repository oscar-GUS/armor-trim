// Estado de la armadura y composición de sus texturas (modelo 3D e iconos).

import { MATERIALES, TRIM_MATERIALES, PATRONES, TINTES, PIEZAS, type Pieza } from '../data/generated'
import { RUTA, apilar, cargarImagen, tenido, trimRecoloreado } from './imagenes'

export type { Pieza }

export interface Config {
  material: string           // id de MATERIALES
  tinte: string | null       // id de TINTES (solo cuero)
  patron: string | null      // id de PATRONES
  trim: string | null        // id de TRIM_MATERIALES
}

export type Estado = Record<Pieza, Config>

export const material = (id: string) => MATERIALES.find((m) => m.id === id) ?? MATERIALES[0]
export const tinte = (id: string | null) => TINTES.find((t) => t.id === id) ?? null
export const patron = (id: string | null) => PATRONES.find((p) => p.id === id) ?? null
export const trimMaterial = (id: string | null) => TRIM_MATERIALES.find((t) => t.id === id) ?? null

export const CONFIG_INICIAL: Config = { material: 'netherite', tinte: null, patron: null, trim: null }

export function estadoInicial(): Estado {
  return {
    helmet: { ...CONFIG_INICIAL },
    chestplate: { ...CONFIG_INICIAL },
    leggings: { ...CONFIG_INICIAL },
    boots: { ...CONFIG_INICIAL },
  }
}

/** Piezas que ese material puede llevar (el caparazón solo es casco). */
export const admite = (idMaterial: string, pieza: Pieza) => material(idMaterial).piezas.includes(pieza)

const capaDe = (pieza: Pieza) => (pieza === 'leggings' ? 'humanoid_leggings' : 'humanoid')

/** Paleta con la que se pinta el trim: la oscura si choca con el material de la armadura. */
function paletaTrim(idMaterial: string, idTrim: string): string {
  return material(idMaterial).paletasOscuras[idTrim] ?? idTrim
}

// ── Textura del modelo 3D (64×32, layout legado) ────────────────────────────
const texCache = new Map<string, Promise<HTMLCanvasElement>>()

const claveTextura = (pieza: Pieza, c: Config) =>
  `${pieza}|${c.material}|${c.tinte ?? '-'}|${c.patron ?? '-'}|${c.trim ?? '-'}`

export function texturaArmadura(pieza: Pieza, cfg: Config): Promise<HTMLCanvasElement> {
  const clave = claveTextura(pieza, cfg)
  let p = texCache.get(clave)
  if (!p) {
    p = (async () => {
      const m = material(cfg.material)
      const capa = capaDe(pieza)
      const capas: CanvasImageSource[] = []

      if (m.colorBase) {
        // Cuero: la capa base se tiñe y encima va el overlay sin teñir (hebillas).
        const color = tinte(cfg.tinte)?.color ?? m.colorBase
        capas.push(await tenido(`equipment/${capa}/${m.equipment}.png`, color))
        capas.push(await cargarImagen(RUTA(`equipment/${capa}/leather_overlay.png`)))
      } else {
        capas.push(await cargarImagen(RUTA(`equipment/${capa}/${m.equipment}.png`)))
      }

      if (cfg.patron && cfg.trim) {
        capas.push(await trimRecoloreado(`trims/${capa}/${cfg.patron}.png`, paletaTrim(cfg.material, cfg.trim)))
      }
      return apilar(capas, 64, 32)
    })()
    texCache.set(clave, p)
  }
  return p
}

// ── Icono del item (16×16) ──────────────────────────────────────────────────
const iconoCache = new Map<string, Promise<string>>()

/** Icono del item con su tinte y su trim, como se vería en el inventario. */
export function iconoArmadura(pieza: Pieza, cfg: Config): Promise<string> {
  const clave = claveTextura(pieza, cfg)
  let p = iconoCache.get(clave)
  if (!p) {
    p = (async () => {
      const m = material(cfg.material)
      const capas: CanvasImageSource[] = []

      if (m.colorBase) {
        const color = tinte(cfg.tinte)?.color ?? m.colorBase
        capas.push(await tenido(`items/leather_${pieza}.png`, color))
        capas.push(await cargarImagen(RUTA(`items/leather_${pieza}_overlay.png`)))
      } else {
        capas.push(await cargarImagen(RUTA(`items/${m.item}_${pieza}.png`)))
      }

      if (cfg.patron && cfg.trim) {
        capas.push(await trimRecoloreado(`trims/items/${pieza}_trim.png`, paletaTrim(cfg.material, cfg.trim)))
      }
      return apilar(capas, 16, 16).toDataURL()
    })()
    iconoCache.set(clave, p)
  }
  return p
}

// ── Comando ─────────────────────────────────────────────────────────────────
export const itemDe = (cfg: Config, pieza: Pieza) => `${material(cfg.material).item}_${pieza}`

/** Comando /give de una pieza (sintaxis de componentes, 1.21.5+). */
export function comando(pieza: Pieza, cfg: Config): string {
  const comps: string[] = []
  if (cfg.patron && cfg.trim) {
    comps.push(`trim={pattern:"minecraft:${cfg.patron}",material:"minecraft:${cfg.trim}"}`)
  }
  const t = tinte(cfg.tinte)
  if (t && material(cfg.material).colorBase) {
    comps.push(`dyed_color=${parseInt(t.color.slice(1), 16)}`)
  }
  const sufijo = comps.length ? `[${comps.join(',')}]` : ''
  return `/give @p minecraft:${itemDe(cfg, pieza)}${sufijo}`
}

export const comandos = (estado: Estado) =>
  PIEZAS.filter((p) => admite(estado[p].material, p))
    .map((p) => comando(p, estado[p]))
    .join('\n')

// ── Estado en la URL ────────────────────────────────────────────────────────
// Formato compacto: material.tinte.patron.trim por pieza, separado por «_».
const cod = (c: Config) => [c.material, c.tinte ?? '', c.patron ?? '', c.trim ?? ''].join('.')

export function aURL(estado: Estado): string {
  return PIEZAS.map((p) => cod(estado[p])).join('_')
}

export function desdeURL(s: string): Estado | null {
  const partes = s.split('_')
  if (partes.length !== PIEZAS.length) return null
  const estado = estadoInicial()
  for (let i = 0; i < PIEZAS.length; i++) {
    const [mat, tin, pat, tri] = partes[i].split('.')
    if (!MATERIALES.some((m) => m.id === mat)) return null
    estado[PIEZAS[i]] = {
      // Un enlace manipulado podría pedir una pieza que ese material no tiene.
      material: admite(mat, PIEZAS[i]) ? mat : CONFIG_INICIAL.material,
      tinte: TINTES.some((t) => t.id === tin) ? tin : null,
      patron: PATRONES.some((p) => p.id === pat) ? pat : null,
      trim: TRIM_MATERIALES.some((t) => t.id === tri) ? tri : null,
    }
  }
  return estado
}
