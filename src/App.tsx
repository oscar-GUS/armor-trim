import { useEffect, useRef, useState, type ReactNode } from 'react'
import Rejilla, { CAMPO, type Columna, type Fila } from './components/Rejilla'
import Visor from './components/Visor'
import { PIEZAS } from './data/generated'
import { admite, aURL, comandos, desdeURL, estadoInicial, material, type Estado } from './lib/armadura'
import type { Escena } from './lib/escena'

function estadoDeLaURL(): Estado {
  const cod = new URLSearchParams(window.location.search).get('trim')
  return (cod && desdeURL(cod)) || estadoInicial()
}

export default function App() {
  const [estado, setEstado] = useState<Estado>(estadoDeLaURL)
  const [copiado, setCopiado] = useState<'comando' | null>(null)
  const [verComando, setVerComando] = useState(false)
  const escenaRef = useRef<Escena | null>(null)

  // La configuración vive en la URL: recargar o compartir mantiene el diseño.
  useEffect(() => {
    window.history.replaceState(null, '', `?trim=${aURL(estado)}`)
  }, [estado])

  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(null), 1800)
    return () => clearTimeout(t)
  }, [copiado])

  function cambiar(fila: Fila, columna: Columna, valor: string | null) {
    setEstado((prev) => {
      const sig = { ...prev }
      for (const pieza of fila === 'todas' ? PIEZAS : [fila]) {
        // Un material que no tiene esa pieza (el caparazón solo es casco) se ignora.
        if (columna === 'material' && valor && !admite(valor, pieza)) continue
        sig[pieza] = { ...sig[pieza], [CAMPO[columna]]: valor }
        // Solo el cuero se tiñe: al cambiar a otro material, el tinte se va con
        // él. Si no, se quedaba el icono del tinte puesto en una armadura de
        // hierro, que no significa nada.
        if (columna === 'material' && valor && !material(valor).colorBase) {
          sig[pieza] = { ...sig[pieza], tinte: null }
        }
      }
      return sig
    })
  }

  function capturar() {
    const url = escenaRef.current?.captura()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = 'armor-trim.png'
    a.click()
  }

  async function copiar(texto: string, que: 'comando') {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(que)
    } catch {
      /* sin portapapeles: el usuario puede copiar a mano */
    }
  }

  return (
    <div className="h-full w-full p-3 sm:p-4 grid gap-3 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] lg:h-full overflow-y-auto lg:overflow-hidden scroll-fino">
      <Visor estado={estado} escenaRef={escenaRef} />

      <div className="flex flex-col gap-3 min-h-0 lg:overflow-y-auto scroll-fino">
        <Rejilla estado={estado} onCambio={cambiar} />

        {/* Dos acciones y ya: hacer la foto y llevarse los comandos. El enlace
            compartido sigue estando en la barra del navegador (el estado vive en
            la URL), y el Discord ya está en el resto de la web. */}
        <div className="rounded-2xl border border-[#2A2A2E] bg-[#161618] p-3 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Accion onClick={capturar} icono={<IconoCaptura />}>Capturar</Accion>
            <Accion onClick={() => copiar(comandos(estado), 'comando')} icono={<IconoComando />}>
              {copiado === 'comando' ? '¡Copiado!' : 'Comando'}
            </Accion>
          </div>

          <button
            type="button"
            onClick={() => setVerComando((v) => !v)}
            className="text-[11px] font-semibold text-[#52525B] hover:text-[#A1A1AA] py-1 transition-colors text-left"
          >
            {verComando ? '▾' : '▸'} Ver el comando
          </button>

          {verComando && (
            <div className="flex flex-col gap-2">
              <pre className="text-[10px] leading-relaxed text-[#A1A1AA] bg-[#111113] border border-[#2A2A2E] rounded-lg p-2.5 overflow-x-auto scroll-fino whitespace-pre">
                {comandos(estado)}
              </pre>
              <p className="text-[11px] text-[#52525B]">
                Sintaxis de componentes (Minecraft 1.21.5 o superior).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Accion({
  children, onClick, href, icono,
}: {
  children: ReactNode
  onClick?: () => void
  href?: string
  icono: ReactNode
}) {
  const clase =
    'flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#2A2A2E] bg-[#1C1C1F] text-[11px] font-semibold text-[#A1A1AA] hover:border-[rgba(244,129,31,0.5)] hover:text-[#F5F5F0] transition-colors'
  const contenido = (
    <>
      <span className="w-5 h-5 text-[#F4811F]">{icono}</span>
      {children}
    </>
  )
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" className={clase}>{contenido}</a>
    : <button type="button" onClick={onClick} className={clase}>{contenido}</button>
}

const IconoCaptura = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M3 7h4l2-2h6l2 2h4v12H3z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)

const IconoComando = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 9l3 3-3 3M13 15h4" />
  </svg>
)
