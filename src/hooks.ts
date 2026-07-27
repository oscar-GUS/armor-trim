import { useEffect, useState, type DependencyList } from 'react'

/** Resuelve una promesa y devuelve su valor (null mientras carga). */
export function usePromesa<T>(f: () => Promise<T>, deps: DependencyList): T | null {
  const [valor, setValor] = useState<T | null>(null)
  useEffect(() => {
    let vivo = true
    f().then((v) => { if (vivo) setValor(v) }).catch(() => { if (vivo) setValor(null) })
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return valor
}
