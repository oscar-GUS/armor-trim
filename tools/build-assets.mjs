// Descarga los assets vanilla que necesita el generador desde misode/mcmeta y
// genera src/data/generated.ts con las listas, colores y nombres en español.
//
//   node tools/build-assets.mjs            (no vuelve a bajar lo que ya existe)
//   node tools/build-assets.mjs --force    (rehace todo)
//
// Mismo origen de datos que el pipeline de atlas de MineLite.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'mc')
const FORCE = process.argv.includes('--force')

const ASSETS = 'https://raw.githubusercontent.com/misode/mcmeta/assets/assets/minecraft'
const DATA = 'https://raw.githubusercontent.com/misode/mcmeta/data/data/minecraft'

// ── Catálogo ────────────────────────────────────────────────────────────────
const PIEZAS = ['helmet', 'chestplate', 'leggings', 'boots']

// id → equipment asset, prefijo del item, piezas disponibles y nombre visible.
const MATERIALES = [
  { id: 'leather',   equipment: 'leather',      item: 'leather',   nombre: 'Cuero',      piezas: PIEZAS },
  { id: 'chainmail', equipment: 'chainmail',    item: 'chainmail', nombre: 'Malla',      piezas: PIEZAS },
  { id: 'copper',    equipment: 'copper',       item: 'copper',    nombre: 'Cobre',      piezas: PIEZAS },
  { id: 'iron',      equipment: 'iron',         item: 'iron',      nombre: 'Hierro',     piezas: PIEZAS },
  { id: 'golden',    equipment: 'gold',         item: 'golden',    nombre: 'Oro',        piezas: PIEZAS },
  { id: 'diamond',   equipment: 'diamond',      item: 'diamond',   nombre: 'Diamante',   piezas: PIEZAS },
  { id: 'netherite', equipment: 'netherite',    item: 'netherite', nombre: 'Netherita',  piezas: PIEZAS },
  { id: 'turtle',    equipment: 'turtle_scute', item: 'turtle',    nombre: 'Caparazón',  piezas: ['helmet'] },
]

const PATRONES = [
  'bolt', 'coast', 'dune', 'eye', 'flow', 'host', 'raiser', 'rib', 'sentry',
  'shaper', 'silence', 'snout', 'spire', 'tide', 'vex', 'ward', 'wayfinder', 'wild',
]

// Material del trim → item con el que se aplica en la mesa de forja.
const TRIM_MATERIALES = [
  { id: 'quartz',    item: 'quartz' },
  { id: 'iron',      item: 'iron_ingot' },
  { id: 'netherite', item: 'netherite_ingot' },
  { id: 'redstone',  item: 'redstone' },
  { id: 'copper',    item: 'copper_ingot' },
  { id: 'gold',      item: 'gold_ingot' },
  { id: 'emerald',   item: 'emerald' },
  { id: 'diamond',   item: 'diamond' },
  { id: 'lapis',     item: 'lapis_lazuli' },
  { id: 'amethyst',  item: 'amethyst_shard' },
  { id: 'resin',     item: 'resin_brick' },
]

// Skins por defecto de Minecraft, cada una en su variante canónica.
const SKINS = [
  { id: 'steve', nombre: 'Steve', slim: false },
  { id: 'alex', nombre: 'Alex', slim: true },
  { id: 'ari', nombre: 'Ari', slim: false },
  { id: 'efe', nombre: 'Efe', slim: false },
  { id: 'kai', nombre: 'Kai', slim: false },
  { id: 'makena', nombre: 'Makena', slim: true },
  { id: 'noor', nombre: 'Noor', slim: true },
  { id: 'sunny', nombre: 'Sunny', slim: false },
  { id: 'zuri', nombre: 'Zuri', slim: false },
]

const TINTES = [
  'white', 'light_gray', 'gray', 'black', 'brown', 'red', 'orange', 'yellow',
  'lime', 'green', 'cyan', 'light_blue', 'blue', 'purple', 'magenta', 'pink',
]

// Color del tinte aplicado a la armadura de cuero (item color de cada tinte).
const COLOR_TINTE = {
  white: '#F9FFFE', light_gray: '#9D9D97', gray: '#474F52', black: '#1D1D21',
  brown: '#835432', red: '#B02E26', orange: '#F9801D', yellow: '#FED83D',
  lime: '#80C71F', green: '#5E7C16', cyan: '#169C9C', light_blue: '#3AB3DA',
  blue: '#3C44AA', purple: '#8932B8', magenta: '#C74EBD', pink: '#F38BAA',
}

// ── Descarga ────────────────────────────────────────────────────────────────
let bajados = 0
let cacheados = 0

async function bin(url, dest) {
  const abs = join(OUT, dest)
  if (!FORCE && existsSync(abs)) { cacheados++; return }
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, Buffer.from(await r.arrayBuffer()))
  bajados++
}

const jsonCache = new Map()
async function json(url) {
  if (jsonCache.has(url)) return jsonCache.get(url)
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  const j = await r.json()
  jsonCache.set(url, j)
  return j
}

// Tandas para no abrir 200 conexiones a la vez.
async function lotes(items, fn, n = 12) {
  for (let i = 0; i < items.length; i += n) {
    await Promise.all(items.slice(i, i + n).map(fn))
  }
}

const descargas = []
const push = (url, dest) => descargas.push({ url, dest })

// Capas de armadura (64×32, layout legado) + overlay del cuero sin teñir.
for (const m of MATERIALES) {
  push(`${ASSETS}/textures/entity/equipment/humanoid/${m.equipment}.png`, `equipment/humanoid/${m.equipment}.png`)
  if (m.piezas.includes('leggings')) {
    push(`${ASSETS}/textures/entity/equipment/humanoid_leggings/${m.equipment}.png`, `equipment/humanoid_leggings/${m.equipment}.png`)
  }
}
push(`${ASSETS}/textures/entity/equipment/humanoid/leather_overlay.png`, 'equipment/humanoid/leather_overlay.png')
push(`${ASSETS}/textures/entity/equipment/humanoid_leggings/leather_overlay.png`, 'equipment/humanoid_leggings/leather_overlay.png')

// Trims sobre el modelo y sobre el icono del item.
for (const p of PATRONES) {
  push(`${ASSETS}/textures/trims/entity/humanoid/${p}.png`, `trims/humanoid/${p}.png`)
  push(`${ASSETS}/textures/trims/entity/humanoid_leggings/${p}.png`, `trims/humanoid_leggings/${p}.png`)
}
for (const pieza of PIEZAS) {
  push(`${ASSETS}/textures/trims/items/${pieza}_trim.png`, `trims/items/${pieza}_trim.png`)
}

// Paletas: la base (clave) y una por material, con sus variantes oscuras.
push(`${ASSETS}/textures/palettes/trim_base.png`, 'palettes/trim_base.png')
const PALETAS = [
  ...TRIM_MATERIALES.map((t) => t.id),
  'copper_darker', 'diamond_darker', 'gold_darker', 'iron_darker', 'netherite_darker',
]
for (const p of PALETAS) push(`${ASSETS}/textures/palettes/trim/${p}.png`, `palettes/trim/${p}.png`)

// Iconos de item.
for (const m of MATERIALES) {
  for (const pieza of m.piezas) {
    push(`${ASSETS}/textures/item/${m.item}_${pieza}.png`, `items/${m.item}_${pieza}.png`)
    if (m.id === 'leather') {
      push(`${ASSETS}/textures/item/leather_${pieza}_overlay.png`, `items/leather_${pieza}_overlay.png`)
    }
  }
}
for (const p of PATRONES) {
  push(`${ASSETS}/textures/item/${p}_armor_trim_smithing_template.png`, `items/${p}_armor_trim_smithing_template.png`)
}
for (const t of TRIM_MATERIALES) push(`${ASSETS}/textures/item/${t.item}.png`, `items/${t.item}.png`)
for (const s of SKINS) {
  push(`${ASSETS}/textures/entity/player/${s.slim ? 'slim' : 'wide'}/${s.id}.png`, `skins/${s.id}.png`)
}
for (const d of TINTES) push(`${ASSETS}/textures/item/${d}_dye.png`, `items/${d}_dye.png`)

console.log(`Descargando ${descargas.length} texturas...`)
await lotes(descargas, (d) => bin(d.url, d.dest))
console.log(`  ${bajados} nuevas, ${cacheados} ya estaban`)

// ── Metadatos ───────────────────────────────────────────────────────────────
console.log('Leyendo equipment/, trim_material/ y lang/es_es.json...')

const lang = await json(`${ASSETS}/lang/es_es.json`)
const es = (k, fallback) => lang[k] ?? fallback

const materiales = []
for (const m of MATERIALES) {
  const eq = await json(`${ASSETS}/equipment/${m.equipment}.json`)
  const capa = eq.layers?.humanoid?.[0]
  const undyed = capa?.dyeable?.color_when_undyed
  materiales.push({
    id: m.id,
    equipment: m.equipment,
    item: m.item,
    nombre: m.nombre,
    piezas: m.piezas,
    // El color base del cuero sin teñir viene firmado (ARGB) en el JSON vanilla.
    colorBase: undyed == null ? null : '#' + ((undyed >>> 0) & 0xffffff).toString(16).padStart(6, '0').toUpperCase(),
    // { 'minecraft:trim/iron': 'minecraft:trim/iron_darker' } → { iron: 'iron_darker' }
    paletasOscuras: Object.fromEntries(
      Object.entries(eq.trim_palette_replacements ?? {}).map(([k, v]) => [
        k.replace('minecraft:trim/', ''),
        v.replace('minecraft:trim/', ''),
      ]),
    ),
  })
}

const trimMateriales = []
for (const t of TRIM_MATERIALES) {
  const d = await json(`${DATA}/trim_material/${t.id}.json`)
  trimMateriales.push({
    id: t.id,
    item: t.item,
    nombre: es(d.description.translate, t.id),
    color: d.description.color,
  })
}

const patrones = []
for (const p of PATRONES) {
  const d = await json(`${DATA}/trim_pattern/${p}.json`)
  patrones.push({ id: p, nombre: es(d.description.translate, p) })
}

const tintes = TINTES.map((d) => ({
  id: d,
  nombre: es(`item.minecraft.${d}_dye`, d),
  color: COLOR_TINTE[d],
}))

const nombresPieza = {
  helmet: es('item.minecraft.iron_helmet', 'Casco').replace(/ de hierro$/i, ''),
  chestplate: es('item.minecraft.iron_chestplate', 'Peto').replace(/ de hierro$/i, ''),
  leggings: es('item.minecraft.iron_leggings', 'Grebas').replace(/ de hierro$/i, ''),
  boots: es('item.minecraft.iron_boots', 'Botas').replace(/ de hierro$/i, ''),
}

const ts = `// GENERADO por tools/build-assets.mjs — no editar a mano.
// Fuente: misode/mcmeta (assets + data de la última versión de Minecraft).

export interface MaterialArmadura {
  id: string
  equipment: string
  item: string
  nombre: string
  piezas: Pieza[]
  colorBase: string | null
  paletasOscuras: Record<string, string>
}
export interface TrimMaterial { id: string; item: string; nombre: string; color: string }
export interface Patron { id: string; nombre: string }
export interface Tinte { id: string; nombre: string; color: string }
export interface SkinDefecto { id: string; nombre: string; slim: boolean }
export type Pieza = 'helmet' | 'chestplate' | 'leggings' | 'boots'

export const PIEZAS: Pieza[] = ${JSON.stringify(PIEZAS)}
export const NOMBRE_PIEZA: Record<Pieza, string> = ${JSON.stringify(nombresPieza, null, 2)}
export const MATERIALES: MaterialArmadura[] = ${JSON.stringify(materiales, null, 2)}
export const TRIM_MATERIALES: TrimMaterial[] = ${JSON.stringify(trimMateriales, null, 2)}
export const PATRONES: Patron[] = ${JSON.stringify(patrones, null, 2)}
export const TINTES: Tinte[] = ${JSON.stringify(tintes, null, 2)}
export const SKINS: SkinDefecto[] = ${JSON.stringify(SKINS, null, 2)}
`

const destTs = join(ROOT, 'src', 'data', 'generated.ts')
mkdirSync(dirname(destTs), { recursive: true })
writeFileSync(destTs, ts)
console.log(`✔ ${destTs}`)
console.log(`  ${materiales.length} materiales, ${patrones.length} patrones, ${trimMateriales.length} trim materials, ${tintes.length} tintes`)
