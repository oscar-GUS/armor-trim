import { iconoArmadura, type Config } from '../lib/armadura'
import { RUTA } from '../lib/imagenes'
import { usePromesa } from '../hooks'
import type { Pieza } from '../data/generated'

/** Icono de una textura suelta de Minecraft (16×16). */
export function IconoItem({ ruta, alt, clase = '' }: { ruta: string; alt: string; clase?: string }) {
  return <img src={RUTA(ruta)} alt={alt} className={`pixel w-full h-full object-contain ${clase}`} draggable={false} />
}

/** Icono del item de armadura ya compuesto: material, tinte y trim. */
export function IconoArmadura({ pieza, cfg, alt }: { pieza: Pieza; cfg: Config; alt: string }) {
  const url = usePromesa(() => iconoArmadura(pieza, cfg), [pieza, cfg.material, cfg.tinte, cfg.patron, cfg.trim])
  if (!url) return <div className="w-full h-full" />
  return <img src={url} alt={alt} className="pixel w-full h-full object-contain" draggable={false} />
}

/** Hueco vacío: ni tinte, ni patrón, ni material de trim. */
export function Vacio({ titulo }: { titulo?: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center" title={titulo}>
      <svg viewBox="0 0 16 16" className="w-3/4 h-3/4 text-[#3F3F46]" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="2" width="12" height="12" rx="2" strokeDasharray="3 2.5" />
        <path d="M5.5 10.5L10.5 5.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}
