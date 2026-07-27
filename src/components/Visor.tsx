import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { PIEZAS, SKINS } from '../data/generated'
import { admite, texturaArmadura, type Estado } from '../lib/armadura'
import { crearEscena, type Escena, type ModoCamara } from '../lib/escena'
import { RUTA } from '../lib/imagenes'
import { skinDesdeArchivo, skinPorDefecto, skinPorNick, type SkinCargada } from '../lib/skin'

const MODOS: { id: ModoCamara; nombre: string }[] = [
  { id: 'quieto', nombre: 'Quieto' },
  { id: 'girar', nombre: 'Girar' },
  { id: 'frente', nombre: 'De frente' },
  { id: 'espalda', nombre: 'De espaldas' },
]

const FONDOS = ['#7FC3F5', '#0D0D0F', '#F5F5F0', '#1B4332', '#2E1065', '#F4811F']

export default function Visor({
  estado,
  escenaRef,
}: {
  estado: Estado
  escenaRef: MutableRefObject<Escena | null>
}) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [pestana, setPestana] = useState<'camara' | 'skin'>('camara')
  const [modo, setModo] = useState<ModoCamara>('girar')
  const [fondo, setFondo] = useState(FONDOS[0])
  const [skin, setSkin] = useState<SkinCargada | null>(null)
  const claves = useRef<Record<string, string>>({})

  // Escena: se crea una vez y se destruye al desmontar.
  useEffect(() => {
    if (!contenedor.current) return
    const escena = crearEscena(contenedor.current)
    escenaRef.current = escena
    claves.current = {}
    return () => {
      escena.destruir()
      escenaRef.current = null
    }
  }, [escenaRef])

  // Skin inicial.
  useEffect(() => {
    skinPorDefecto('steve', false).then(setSkin).catch(() => {})
  }, [])

  useEffect(() => {
    if (skin) escenaRef.current?.setSkin(skin)
  }, [skin, escenaRef])

  useEffect(() => { escenaRef.current?.setModo(modo) }, [modo, escenaRef])
  useEffect(() => { escenaRef.current?.setFondo(fondo) }, [fondo, escenaRef])

  // Texturas de la armadura: solo se recalcula la pieza que ha cambiado.
  useEffect(() => {
    let vivo = true
    for (const pieza of PIEZAS) {
      const cfg = estado[pieza]
      const clave = `${cfg.material}|${cfg.tinte}|${cfg.patron}|${cfg.trim}`
      if (claves.current[pieza] === clave) continue
      claves.current[pieza] = clave

      if (!admite(cfg.material, pieza)) {
        escenaRef.current?.setArmadura(pieza, null)
        continue
      }
      texturaArmadura(pieza, cfg).then((tex) => {
        if (vivo) escenaRef.current?.setArmadura(pieza, tex)
      })
    }
    return () => { vivo = false }
  }, [estado, escenaRef])

  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div
        ref={contenedor}
        className="relative flex-1 min-h-[320px] rounded-2xl border border-[#2A2A2E] overflow-hidden bg-[#0D0D0F] cursor-grab active:cursor-grabbing"
      />

      <div className="rounded-2xl border border-[#2A2A2E] bg-[#161618] p-3">
        {/* Pestañas */}
        <div className="flex gap-1 p-1 rounded-xl bg-[#111113] mb-3">
          {(['camara', 'skin'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPestana(p)}
              className={[
                'flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors',
                pestana === p ? 'bg-[#232327] text-[#F5F5F0]' : 'text-[#71717A] hover:text-[#A1A1AA]',
              ].join(' ')}
            >
              {p === 'camara' ? 'Cámara' : 'Skin'}
            </button>
          ))}
        </div>

        {pestana === 'camara'
          ? <PanelCamara modo={modo} setModo={setModo} fondo={fondo} setFondo={setFondo} />
          : <PanelSkin skin={skin} setSkin={setSkin} />}
      </div>
    </div>
  )
}

function PanelCamara({
  modo, setModo, fondo, setFondo,
}: {
  modo: ModoCamara
  setModo: (m: ModoCamara) => void
  fondo: string
  setFondo: (c: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {MODOS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModo(m.id)}
            className={[
              'text-xs font-semibold py-1.5 rounded-lg border transition-colors',
              modo === m.id
                ? 'border-[#F4811F] bg-[#211a13] text-[#F4811F]'
                : 'border-[#2A2A2E] bg-[#1C1C1F] text-[#A1A1AA] hover:border-[rgba(244,129,31,0.5)]',
            ].join(' ')}
          >
            {m.nombre}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[#71717A] shrink-0">Fondo</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FONDOS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFondo(c)}
              aria-label={`Fondo ${c}`}
              style={{ background: c }}
              className={`w-6 h-6 rounded-md border ${fondo === c ? 'border-[#F4811F]' : 'border-[#3A3A40]'}`}
            />
          ))}
          <label className="w-6 h-6 rounded-md border border-[#3A3A40] overflow-hidden cursor-pointer" title="Color personalizado">
            <input
              type="color"
              value={fondo}
              onChange={(e) => setFondo(e.target.value)}
              className="w-8 h-8 -m-1 cursor-pointer bg-transparent"
            />
          </label>
        </div>
      </div>

      <p className="text-[11px] text-[#52525B]">Arrastra sobre el modelo para girarlo y usa la rueda para acercarte.</p>
    </div>
  )
}

function PanelSkin({ skin, setSkin }: { skin: SkinCargada | null; setSkin: (s: SkinCargada) => void }) {
  const [nick, setNick] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function buscar() {
    if (!nick.trim() || cargando) return
    setCargando(true)
    setError(null)
    try {
      setSkin(await skinPorNick(nick))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la skin.')
    } finally {
      setCargando(false)
    }
  }

  async function subir(file: File | undefined) {
    if (!file) return
    setError(null)
    try {
      setSkin(await skinDesdeArchivo(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el archivo.')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        <input
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') buscar() }}
          placeholder="Nick de Minecraft"
          className="flex-1 min-w-0 text-xs bg-[#111113] border border-[#2A2A2E] rounded-lg px-2.5 py-2 text-[#F5F5F0] placeholder:text-[#52525B] focus:outline-none focus:border-[#F4811F]"
        />
        <button
          type="button"
          onClick={buscar}
          disabled={cargando}
          className="text-xs font-semibold px-3 rounded-lg bg-[#F4811F] text-[#0D0D0F] hover:bg-[#F2AF0D] disabled:opacity-50 transition-colors"
        >
          {cargando ? '…' : 'Cargar'}
        </button>
      </div>

      <div className="flex gap-1.5">
        <label className="flex-1 text-xs font-semibold text-center py-2 rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] text-[#A1A1AA] hover:border-[rgba(244,129,31,0.5)] cursor-pointer transition-colors">
          Subir PNG
          <input type="file" accept="image/png" className="hidden" onChange={(e) => subir(e.target.files?.[0])} />
        </label>
        <button
          type="button"
          onClick={() => skin && setSkin({ ...skin, slim: !skin.slim })}
          className="flex-1 text-xs font-semibold py-2 rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] text-[#A1A1AA] hover:border-[rgba(244,129,31,0.5)] transition-colors"
        >
          Brazos: {skin?.slim ? 'finos' : 'normales'}
        </button>
      </div>

      {error && <p className="text-[11px] text-[#F87171]">{error}</p>}

      <div className="grid grid-cols-9 gap-1">
        {SKINS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => skinPorDefecto(s.id, s.slim).then(setSkin).catch(() => {})}
            title={s.nombre}
            className="aspect-square rounded-md border border-[#2A2A2E] bg-[#1C1C1F] hover:border-[rgba(244,129,31,0.5)] overflow-hidden transition-colors"
          >
            {/* Recorte de la cara (8×8 desde 8,8 en la textura de 64×64). */}
            <span
              className="block w-full h-full pixel"
              style={{
                backgroundImage: `url(${RUTA(`skins/${s.id}.png`)})`,
                backgroundSize: '800% 800%',
                backgroundPosition: '14.2857% 14.2857%',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
