import { useEffect, useRef, useState, type ReactNode } from 'react'
import Rejilla, { CAMPO, type Columna, type Fila } from './components/Rejilla'
import Visor from './components/Visor'
import { PIEZAS } from './data/generated'
import { admite, aURL, comandos, desdeURL, estadoInicial, type Estado } from './lib/armadura'
import type { Escena } from './lib/escena'

const DISCORD = 'https://discord.gg/hmKpBDrMju'

function estadoDeLaURL(): Estado {
  const cod = new URLSearchParams(window.location.search).get('trim')
  return (cod && desdeURL(cod)) || estadoInicial()
}

export default function App() {
  const [estado, setEstado] = useState<Estado>(estadoDeLaURL)
  const [copiado, setCopiado] = useState<'enlace' | 'comando' | null>(null)
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

  async function copiar(texto: string, que: 'enlace' | 'comando') {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(que)
    } catch {
      /* sin portapapeles: el usuario puede copiar a mano */
    }
  }

  /** Enlace a la página que embebe la herramienta, con el diseño codificado. */
  function enlace(): string {
    const cod = aURL(estado)
    try {
      const p = window.parent !== window ? window.parent.location : window.location
      return `${p.origin}${p.pathname}?trim=${cod}`
    } catch {
      return `${window.location.origin}${window.location.pathname}?trim=${cod}`
    }
  }

  return (
    <div className="h-full w-full p-3 sm:p-4 grid gap-3 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] lg:h-full overflow-y-auto lg:overflow-hidden scroll-fino">
      <Visor estado={estado} escenaRef={escenaRef} />

      <div className="flex flex-col gap-3 min-h-0 lg:overflow-y-auto scroll-fino">
        <Rejilla estado={estado} onCambio={cambiar} />

        <div className="rounded-2xl border border-[#2A2A2E] bg-[#161618] p-3 flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <Accion onClick={capturar} icono={<IconoCaptura />}>Capturar</Accion>
            <Accion onClick={() => copiar(enlace(), 'enlace')} icono={<IconoCompartir />}>
              {copiado === 'enlace' ? '¡Copiado!' : 'Compartir'}
            </Accion>
            <Accion href={DISCORD} icono={<IconoDiscord />}>Discord</Accion>
          </div>

          <button
            type="button"
            onClick={() => setVerComando((v) => !v)}
            className="text-xs font-semibold text-[#A1A1AA] hover:text-[#F4811F] py-1.5 transition-colors text-left"
          >
            {verComando ? '▾' : '▸'} Comando /give
          </button>

          {verComando && (
            <div className="flex flex-col gap-2">
              <pre className="text-[10px] leading-relaxed text-[#A1A1AA] bg-[#111113] border border-[#2A2A2E] rounded-lg p-2.5 overflow-x-auto scroll-fino whitespace-pre">
                {comandos(estado)}
              </pre>
              <button
                type="button"
                onClick={() => copiar(comandos(estado), 'comando')}
                className="text-xs font-semibold py-2 rounded-lg bg-[#1C1C1F] border border-[#2A2A2E] text-[#A1A1AA] hover:border-[rgba(244,129,31,0.5)] transition-colors"
              >
                {copiado === 'comando' ? '¡Copiado!' : 'Copiar los 4 comandos'}
              </button>
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

const IconoCompartir = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
  </svg>
)

const IconoDiscord = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M19.3 5.6A16 16 0 0015.4 4.4l-.2.4a12 12 0 013.3 1.7 11 11 0 00-9-.4l-.6.4a12 12 0 013.4-1.7l-.3-.4a16 16 0 00-3.9 1.2C3.7 9.4 3 13 3.3 16.6a16 16 0 004.8 2.4l.6-1a11 11 0 01-1.8-.9l.4-.3a11 11 0 009.4 0l.4.3a11 11 0 01-1.8.9l.6 1a16 16 0 004.8-2.4c.4-4.2-.6-7.8-2.4-11zM9.5 14.5c-.9 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9 1.7.8 1.7 1.9-.8 1.9-1.7 1.9zm5 0c-.9 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9 1.7.8 1.7 1.9-.8 1.9-1.7 1.9z" />
  </svg>
)
