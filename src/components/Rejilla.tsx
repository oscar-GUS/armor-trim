import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  MATERIALES, NOMBRE_PIEZA, PATRONES, PIEZAS, TINTES, TRIM_MATERIALES, type Pieza,
} from '../data/generated'
import { PATRON_CORTO, TINTE_CORTO, TRIM_CORTO } from '../data/nombres'
import { admite, material, type Config, type Estado } from '../lib/armadura'
import { IconoArmadura, IconoItem, Vacio } from './Icono'

export type Columna = 'material' | 'tinte' | 'patron' | 'trim'
export type Fila = 'todas' | Pieza

export const CAMPO: Record<Columna, keyof Config> = {
  material: 'material', tinte: 'tinte', patron: 'patron', trim: 'trim',
}
const TITULO: Record<Columna, string> = {
  material: 'Armadura', tinte: 'Tinte', patron: 'Patrón', trim: 'Material',
}

interface Opcion {
  id: string | null
  nombre: string
  icono: ReactNode
}

/** Valor compartido por todas las piezas, o undefined si difieren. */
function comun(estado: Estado, campo: keyof Config): string | null | undefined {
  const vals = PIEZAS.map((p) => estado[p][campo])
  return vals.every((v) => v === vals[0]) ? vals[0] : undefined
}

/** Pieza que se usa para previsualizar la fila del set completo. */
const piezaMuestra = (idMaterial: string | null): Pieza =>
  admite(idMaterial, 'chestplate') ? 'chestplate' : 'helmet'

/** Config de la fila del set completo: lo que comparten las cuatro piezas. */
const configDelSet = (estado: Estado): Config => ({
  material: comun(estado, 'material') ?? null,
  tinte: comun(estado, 'tinte') ?? null,
  patron: comun(estado, 'patron') ?? null,
  trim: comun(estado, 'trim') ?? null,
})

export default function Rejilla({
  estado,
  onCambio,
}: {
  estado: Estado
  onCambio: (fila: Fila, columna: Columna, valor: string | null) => void
}) {
  const [abierto, setAbierto] = useState<{ fila: Fila; columna: Columna } | null>(null)
  const listado = useRef<HTMLDivElement>(null)

  const filas: Fila[] = ['todas', ...PIEZAS]

  // El menú se cierra al pulsar fuera de la rejilla o con Escape. Los clics en
  // otra celda no entran aquí: los recoge su propio onClick, que lo cambia.
  useEffect(() => {
    if (!abierto) return
    const fuera = (e: PointerEvent) => {
      if (!listado.current?.contains(e.target as Node)) setAbierto(null)
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(null)
    }
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  // La columna de tinte solo existe si hay cuero puesto: es la única armadura
  // que se tiñe, y si no hay ninguna la columna entera son cuadros vacíos que
  // solo confunden.
  const hayCuero = PIEZAS.some((p) => material(estado[p].material)?.colorBase != null)
  const columnas = (Object.keys(TITULO) as Columna[]).filter((c) => c !== 'tinte' || hayCuero)

  return (
    <div className="rounded-2xl border border-[#2A2A2E] bg-[#161618] p-3 sm:p-4">
      {/* Cabecera de columnas: mismas medidas que las celdas para que cada
          título caiga justo encima de su columna. */}
      <div className="flex items-center gap-2 pb-2">
        <div className="w-[4.25rem] shrink-0" />
        {columnas.map((c) => (
          <div
            key={c}
            className="flex-1 max-w-[60px] text-center text-[10px] font-semibold uppercase tracking-wider text-[#71717A]"
          >
            {TITULO[c]}
          </div>
        ))}
      </div>

      <div ref={listado} className="flex flex-col gap-2">
        {filas.map((fila, i) => (
          <div key={fila} className="relative">
            <FilaArmadura
              fila={fila}
              estado={estado}
              hayCuero={hayCuero}
              abierto={abierto}
              onAbrir={(columna) =>
                setAbierto((a) => (a && a.fila === fila && a.columna === columna ? null : { fila, columna }))
              }
            />
            {abierto?.fila === fila && (
              // Superpuesto, no empuja la rejilla. Las dos últimas filas lo abren
              // hacia arriba para no salirse por abajo de la tarjeta.
              <div
                className={[
                  'absolute left-0 right-0 z-30 drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]',
                  i >= filas.length - 2 ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
                ].join(' ')}
              >
                <Selector
                  fila={fila}
                  columna={abierto.columna}
                  estado={estado}
                  onElegir={(valor) => {
                    onCambio(fila, abierto.columna, valor)
                    setAbierto(null)
                  }}
                  onCerrar={() => setAbierto(null)}
                />
              </div>
            )}
            {fila === 'todas' && <div className="h-px bg-[#2A2A2E] mt-2" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function FilaArmadura({
  fila, estado, hayCuero, abierto, onAbrir,
}: {
  fila: Fila
  estado: Estado
  hayCuero: boolean
  abierto: { fila: Fila; columna: Columna } | null
  onAbrir: (c: Columna) => void
}) {
  const esSet = fila === 'todas'
  const cfg: Config = esSet ? configDelSet(estado) : estado[fila]

  const mezcla = (c: Columna) => esSet && comun(estado, CAMPO[c]) === undefined
  const pieza: Pieza = esSet ? piezaMuestra(cfg.material) : fila
  const esCuero = material(cfg.material)?.colorBase != null
  const puesta = esSet ? !!cfg.material : admite(cfg.material, fila)

  return (
    <div className="flex items-center gap-2">
      <div className="w-[4.25rem] shrink-0 text-xs font-semibold text-[#A1A1AA] leading-tight">
        {esSet ? <span className="text-[#F5F5F0]">Set completo</span> : NOMBRE_PIEZA[fila]}
      </div>

      <Celda
        activa={abierto?.columna === 'material' && abierto.fila === fila}
        titulo={material(cfg.material)?.nombre ?? 'Sin armadura'}
        onClick={() => onAbrir('material')}
      >
        {mezcla('material') ? <Mixto /> : puesta
          ? <IconoArmadura pieza={pieza} cfg={cfg} alt={material(cfg.material)!.nombre} />
          : <Vacio titulo="Sin armadura" />}
      </Celda>

      {hayCuero && (
        <Celda
          activa={abierto?.columna === 'tinte' && abierto.fila === fila}
          titulo={esCuero ? (cfg.tinte ? TINTE_CORTO[cfg.tinte] : 'Sin teñir') : 'Solo se puede teñir el cuero'}
          deshabilitada={!esCuero}
          onClick={() => onAbrir('tinte')}
        >
          {mezcla('tinte') ? <Mixto /> : cfg.tinte
            ? <IconoItem ruta={`items/${cfg.tinte}_dye.png`} alt={TINTE_CORTO[cfg.tinte]} />
            : <Vacio />}
        </Celda>
      )}

      <Celda
        activa={abierto?.columna === 'patron' && abierto.fila === fila}
        titulo={cfg.patron ? PATRON_CORTO[cfg.patron] : 'Sin patrón'}
        onClick={() => onAbrir('patron')}
      >
        {mezcla('patron') ? <Mixto /> : cfg.patron
          ? <IconoItem ruta={`items/${cfg.patron}_armor_trim_smithing_template.png`} alt={PATRON_CORTO[cfg.patron]} />
          : <Vacio />}
      </Celda>

      <Celda
        activa={abierto?.columna === 'trim' && abierto.fila === fila}
        titulo={cfg.trim ? TRIM_CORTO[cfg.trim] : 'Sin material'}
        onClick={() => onAbrir('trim')}
      >
        {mezcla('trim') ? <Mixto /> : cfg.trim
          ? <IconoItem ruta={`items/${TRIM_MATERIALES.find((t) => t.id === cfg.trim)!.item}.png`} alt={TRIM_CORTO[cfg.trim]} />
          : <Vacio />}
      </Celda>
    </div>
  )
}

function Celda({
  children, onClick, titulo, activa, deshabilitada,
}: {
  children: ReactNode
  onClick: () => void
  titulo: string
  activa: boolean
  deshabilitada?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitada}
      title={titulo}
      aria-label={titulo}
      className={[
        'flex-1 aspect-square max-w-[60px] rounded-xl border p-1.5 transition-colors',
        deshabilitada
          ? 'border-[#232327] bg-[#141416] opacity-40 cursor-not-allowed'
          : activa
            ? 'border-[#F4811F] bg-[#211a13]'
            : 'border-[#2A2A2E] bg-[#1C1C1F] hover:border-[rgba(244,129,31,0.5)] hover:bg-[#232327]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Mixto() {
  return (
    <div className="w-full h-full flex items-center justify-center text-[#71717A] text-sm font-bold" title="Cada pieza tiene un valor distinto">
      ≠
    </div>
  )
}

// ── Panel de selección ──────────────────────────────────────────────────────
function Selector({
  fila, columna, estado, onElegir, onCerrar,
}: {
  fila: Fila
  columna: Columna
  estado: Estado
  onElegir: (valor: string | null) => void
  onCerrar: () => void
}) {
  const cfg: Config = fila === 'todas' ? configDelSet(estado) : estado[fila]
  const pieza: Pieza = fila === 'todas' ? piezaMuestra(cfg.material) : fila

  const opciones = construirOpciones(columna, pieza, cfg)
  const actual = cfg[CAMPO[columna]]

  return (
    <div className="rounded-xl border border-[#2A2A2E] bg-[#131315] p-2.5">
      <div className="flex items-center justify-between pb-2">
        <p className="text-xs font-semibold text-[#F5F5F0]">
          {TITULO[columna]}
          <span className="text-[#71717A] font-normal"> · {fila === 'todas' ? 'todo el set' : NOMBRE_PIEZA[fila]}</span>
        </p>
        <button type="button" onClick={onCerrar} className="text-[#71717A] hover:text-[#F5F5F0] text-xs px-1.5" aria-label="Cerrar">✕</button>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-64 overflow-y-auto scroll-fino">
        {opciones.map((o) => (
          <button
            key={o.id ?? 'ninguno'}
            type="button"
            onClick={() => onElegir(o.id)}
            title={o.nombre}
            className={[
              'flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors',
              o.id === actual
                ? 'border-[#F4811F] bg-[#211a13]'
                : 'border-[#242428] bg-[#1A1A1D] hover:border-[rgba(244,129,31,0.5)] hover:bg-[#232327]',
            ].join(' ')}
          >
            <span className="w-7 h-7">{o.icono}</span>
            <span className="text-[10px] leading-tight text-center text-[#A1A1AA] line-clamp-2">{o.nombre}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function construirOpciones(columna: Columna, pieza: Pieza, cfg: Config): Opcion[] {
  switch (columna) {
    case 'material':
      return [
        { id: null, nombre: 'Sin armadura', icono: <Vacio /> },
        ...MATERIALES.filter((m) => m.piezas.includes(pieza)).map((m) => ({
          id: m.id,
          nombre: m.nombre,
          icono: <IconoArmadura pieza={pieza} cfg={{ ...cfg, material: m.id }} alt={m.nombre} />,
        })),
      ]
    case 'tinte':
      return [
        { id: null, nombre: 'Sin teñir', icono: <Vacio /> },
        ...TINTES.map((t) => ({
          id: t.id,
          nombre: TINTE_CORTO[t.id],
          icono: <IconoItem ruta={`items/${t.id}_dye.png`} alt={t.nombre} />,
        })),
      ]
    case 'patron':
      return [
        { id: null, nombre: 'Sin patrón', icono: <Vacio /> },
        ...PATRONES.map((p) => ({
          id: p.id,
          nombre: PATRON_CORTO[p.id],
          icono: <IconoItem ruta={`items/${p.id}_armor_trim_smithing_template.png`} alt={p.nombre} />,
        })),
      ]
    case 'trim':
      return [
        { id: null, nombre: 'Sin material', icono: <Vacio /> },
        ...TRIM_MATERIALES.map((t) => ({
          id: t.id,
          nombre: TRIM_CORTO[t.id],
          icono: <IconoItem ruta={`items/${t.item}.png`} alt={t.nombre} />,
        })),
      ]
  }
}
