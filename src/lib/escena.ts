// Escena 3D: jugador con su skin y las cuatro capas de armadura encima.
//
// Las armaduras usan el layout legado de 64×32 (los miembros izquierdos van
// reflejados) y el mismo inflado que el juego: 1.0 para casco, peto y botas y
// 0.5 para las grebas.

import * as THREE from 'three'
import { partesArmadura, partesJugador, type Caras, type Parte, type SkinCargada } from './skin'
import type { Pieza } from '../data/generated'

export type ModoCamara = 'quieto' | 'girar' | 'frente' | 'espalda'

// Orden de grupos de BoxGeometry: px, nx, py, ny, pz, nz.
const CARAS: (keyof Caras)[] = ['left', 'right', 'top', 'bottom', 'front', 'back']
const CARAS_ESPEJO: (keyof Caras)[] = ['right', 'left', 'top', 'bottom', 'front', 'back']

function ponerUV(uv: THREE.BufferAttribute, cara: number, r: { x: number; y: number; w: number; h: number }, tw: number, th: number, espejo: boolean) {
  const x0 = (espejo ? r.x + r.w : r.x) / tw
  const x1 = (espejo ? r.x : r.x + r.w) / tw
  const y0 = 1 - r.y / th
  const y1 = 1 - (r.y + r.h) / th
  const i = cara * 4
  uv.setXY(i + 0, x0, y0)
  uv.setXY(i + 1, x1, y0)
  uv.setXY(i + 2, x0, y1)
  uv.setXY(i + 3, x1, y1)
}

function caja(parte: Parte, caras: Caras, inflado: number, tw: number, th: number, recorteInferior = 0): THREE.BoxGeometry {
  const [w, h, d] = parte.size
  const g = new THREE.BoxGeometry(w + inflado * 2, h + inflado * 2 - recorteInferior, d + inflado * 2)
  if (recorteInferior) g.translate(0, recorteInferior / 2, 0)
  const uv = g.attributes.uv as THREE.BufferAttribute
  const orden = parte.espejo ? CARAS_ESPEJO : CARAS
  orden.forEach((k, i) => ponerUV(uv, i, caras[k], tw, th, !!parte.espejo))
  uv.needsUpdate = true
  return g
}

// Partes que dibuja cada pieza y cuánto se infla, como en el juego.
//
// El casco lleva además `recorteInferior`: se infla hacia arriba y a los lados,
// pero no por debajo, para que la cáscara se apoye en la base de la cabeza en
// vez de bajarle una unidad por detrás del cuello.
const PIEZA_PARTES: Record<Pieza, { partes: string[]; inflado: number; recorteInferior?: number }> = {
  helmet:     { partes: ['head'], inflado: 1, recorteInferior: 1 },
  chestplate: { partes: ['body', 'rightArm', 'leftArm'], inflado: 1 },
  leggings:   { partes: ['body', 'rightLeg', 'leftLeg'], inflado: 0.5 },
  boots:      { partes: ['rightLeg', 'leftLeg'], inflado: 1 },
}

// Micro-desfases para que dos cajas coplanares (brazo/torso, pierna/pierna) no
// parpadeen entre sí.
const EPSILON: Record<string, number> = { rightArm: 0.01, leftArm: 0.014, leftLeg: 0.008 }

export interface Escena {
  setSkin(skin: SkinCargada): void
  setArmadura(pieza: Pieza, textura: HTMLCanvasElement | null): void
  setModo(modo: ModoCamara): void
  setFondo(color: string): void
  captura(): string
  destruir(): void
}

export function crearEscena(contenedor: HTMLElement): Escena {
  const escena = new THREE.Scene()
  escena.background = new THREE.Color('#7FC3F5')

  const camara = new THREE.PerspectiveCamera(38, 1, 0.1, 500)
  // Con la armadura puesta el muñeco va de y=-1 (suela de las botas) a y=33
  // (cresta del casco): el centro está en 16, no en 17.
  // (16.4 y no 16: la cámara mira un pelo desde arriba y eso sube el muñeco en
  // el encuadre; con esto los márgenes de arriba y abajo quedan parejos.)
  const objetivo = new THREE.Vector3(0, 16.4, 0)

  const render = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  render.setPixelRatio(Math.min(2, window.devicePixelRatio))
  render.domElement.style.display = 'block'
  render.domElement.style.width = '100%'
  render.domElement.style.height = '100%'
  render.domElement.style.touchAction = 'none'
  contenedor.appendChild(render.domElement)

  escena.add(new THREE.AmbientLight(0xffffff, 1.15))
  const luz = new THREE.DirectionalLight(0xffffff, 0.55)
  luz.position.set(0.6, 1, 1.2)
  escena.add(luz)
  const contraluz = new THREE.DirectionalLight(0xffffff, 0.3)
  contraluz.position.set(-0.6, 0.4, -1.2)
  escena.add(contraluz)

  const raiz = new THREE.Group()
  escena.add(raiz)

  // ── Cámara ────────────────────────────────────────────────────────────────
  let modo: ModoCamara = 'girar'
  let thetaBase = 0
  let thetaAuto = 0
  let phi = Math.PI / 2 - 0.12
  // 34 unidades de muñeco en 41 de encuadre: entra entero con aire arriba y
  // abajo en vez de rozar los bordes.
  let radio = 60

  function colocarCamara() {
    const t = thetaBase + thetaAuto
    camara.position.set(
      objetivo.x + radio * Math.sin(phi) * Math.sin(t),
      objetivo.y + radio * Math.cos(phi),
      objetivo.z + radio * Math.sin(phi) * Math.cos(t),
    )
    camara.lookAt(objetivo)
  }

  let arrastrando = false
  let ultimo = { x: 0, y: 0 }
  const lienzo = render.domElement

  const onDown = (e: PointerEvent) => {
    arrastrando = true
    ultimo = { x: e.clientX, y: e.clientY }
    lienzo.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent) => {
    if (!arrastrando) return
    thetaBase -= (e.clientX - ultimo.x) * 0.01
    phi = Math.min(Math.PI - 0.15, Math.max(0.15, phi - (e.clientY - ultimo.y) * 0.01))
    ultimo = { x: e.clientX, y: e.clientY }
  }
  const onUp = (e: PointerEvent) => {
    arrastrando = false
    if (lienzo.hasPointerCapture(e.pointerId)) lienzo.releasePointerCapture(e.pointerId)
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    radio = Math.min(110, Math.max(24, radio * (1 + Math.sign(e.deltaY) * 0.1)))
  }
  lienzo.addEventListener('pointerdown', onDown)
  lienzo.addEventListener('pointermove', onMove)
  lienzo.addEventListener('pointerup', onUp)
  lienzo.addEventListener('pointercancel', onUp)
  lienzo.addEventListener('wheel', onWheel, { passive: false })

  // ── Materiales y mallas ───────────────────────────────────────────────────
  const texSkin = new THREE.CanvasTexture(document.createElement('canvas'))
  texSkin.magFilter = THREE.NearestFilter
  texSkin.minFilter = THREE.NearestFilter
  texSkin.colorSpace = THREE.SRGBColorSpace

  // Cuerpo y segunda capa van con una sola cara, como el juego: son cajas
  // cerradas y dibujar el interior solo mete costuras en los codos y el cuello.
  const matBase = new THREE.MeshStandardMaterial({ map: texSkin, roughness: 1, metalness: 0, alphaTest: 0.5 })
  const matOverlay = new THREE.MeshStandardMaterial({ map: texSkin, roughness: 1, metalness: 0, alphaTest: 0.5 })

  let grupoJugador: THREE.Group | null = null
  const basura: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [matBase, matOverlay, texSkin]

  function construirJugador(slim: boolean) {
    if (grupoJugador) {
      raiz.remove(grupoJugador)
      grupoJugador.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose()
      })
    }
    const g = new THREE.Group()
    for (const parte of partesJugador(slim)) {
      const base = new THREE.Mesh(caja(parte, parte.base, 0, 64, 64), matBase)
      base.position.set(...parte.pos)
      g.add(base)
      if (parte.overlay) {
        const capa = new THREE.Mesh(caja(parte, parte.overlay, 0.25, 64, 64), matOverlay)
        capa.position.set(...parte.pos)
        g.add(capa)
      }
    }
    raiz.add(g)
    grupoJugador = g
  }

  /**
   * Color del forro: la media de la textura, oscurecida. La armadura queda una
   * unidad separada del cuerpo, así que por los huecos de la textura (la cara
   * del casco, el cuello del peto) se cuela la vista por el anillo que queda
   * entre medias, y por las esquinas se veía el fondo de lado a lado. El forro
   * tapa ese anillo con el interior de la propia pieza.
   */
  function colorForro(textura: HTMLCanvasElement): THREE.Color {
    const d = textura.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, textura.width, textura.height).data
    let r = 0, g = 0, b = 0, n = 0
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue
      r += d[i]; g += d[i + 1]; b += d[i + 2]; n++
    }
    if (!n) return new THREE.Color(0x101010)
    const k = 0.32 / 255
    return new THREE.Color(r * k / n, g * k / n, b * k / n)
  }

  const armaduras = new Map<Pieza, {
    grupo: THREE.Group
    material: THREE.MeshStandardMaterial
    forro: THREE.MeshBasicMaterial
    textura: THREE.CanvasTexture
  }>()

  function setArmadura(pieza: Pieza, textura: HTMLCanvasElement | null) {
    const previo = armaduras.get(pieza)
    if (previo) {
      raiz.remove(previo.grupo)
      previo.grupo.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose()
      })
      previo.material.dispose()
      previo.forro.dispose()
      previo.textura.dispose()
      armaduras.delete(pieza)
    }
    if (!textura) return

    const tex = new THREE.CanvasTexture(textura)
    tex.magFilter = THREE.NearestFilter
    tex.minFilter = THREE.NearestFilter
    tex.colorSpace = THREE.SRGBColorSpace
    // Doble cara: una pieza de armadura es una cáscara con huecos (el visor del
    // casco, el hombro abierto...). Con una sola cara se vería el interior
    // transparente al mirar desde abajo o desde dentro.
    const mat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 1, metalness: 0, alphaTest: 0.5, side: THREE.DoubleSide,
    })

    const forro = new THREE.MeshBasicMaterial({ color: colorForro(textura), side: THREE.BackSide })

    const { partes, inflado, recorteInferior } = PIEZA_PARTES[pieza]
    const grupo = new THREE.Group()
    for (const parte of partesArmadura()) {
      if (!partes.includes(parte.nombre)) continue
      const geo = caja(parte, parte.base, inflado + (EPSILON[parte.nombre] ?? 0), 64, 32, recorteInferior)
      const malla = new THREE.Mesh(geo, mat)
      malla.position.set(...parte.pos)
      grupo.add(malla)

      // Cara interna lisa, un pelo por dentro de la cáscara para no pelearse
      // con ella en el z-buffer. Solo se ve por los huecos de la textura, y
      // siempre por detrás del cuerpo, que va más cerca de la cámara.
      const dentro = new THREE.Mesh(caja(parte, parte.base, inflado - 0.02 + (EPSILON[parte.nombre] ?? 0), 64, 32, recorteInferior), forro)
      dentro.position.set(...parte.pos)
      grupo.add(dentro)
    }
    raiz.add(grupo)
    armaduras.set(pieza, { grupo, material: mat, forro, textura: tex })
  }

  // ── Bucle ─────────────────────────────────────────────────────────────────
  let slimActual = false
  let anim = 0
  let t0 = performance.now()

  function bucle(ahora: number) {
    anim = requestAnimationFrame(bucle)
    const dt = Math.min(0.1, (ahora - t0) / 1000)
    t0 = ahora
    if (modo === 'girar') thetaAuto += dt * 0.55
    else if (modo === 'frente' || modo === 'espalda') thetaAuto = Math.sin(ahora / 1400) * 0.6
    colocarCamara()
    render.render(escena, camara)
  }
  anim = requestAnimationFrame(bucle)

  const medir = () => {
    const { clientWidth: w, clientHeight: h } = contenedor
    if (!w || !h) return
    render.setSize(w, h, false)
    camara.aspect = w / h
    camara.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(medir)
  ro.observe(contenedor)
  medir()

  construirJugador(false)

  return {
    setSkin(skin) {
      if (skin.slim !== slimActual) {
        slimActual = skin.slim
        construirJugador(skin.slim)
      }
      texSkin.image = skin.canvas
      texSkin.needsUpdate = true
    },
    setArmadura,
    setModo(m) {
      if (m === 'quieto') {
        thetaBase += thetaAuto
      } else if (m === 'frente') {
        thetaBase = 0
      } else if (m === 'espalda') {
        thetaBase = Math.PI
      }
      thetaAuto = 0
      modo = m
    },
    setFondo(color) {
      escena.background = new THREE.Color(color)
    },
    captura() {
      // La cámara la coloca el bucle, que el navegador suspende si la pestaña no
      // está visible: se recoloca aquí para que la captura nunca salga vacía.
      colocarCamara()
      render.render(escena, camara)
      return render.domElement.toDataURL('image/png')
    },
    destruir() {
      cancelAnimationFrame(anim)
      ro.disconnect()
      lienzo.removeEventListener('pointerdown', onDown)
      lienzo.removeEventListener('pointermove', onMove)
      lienzo.removeEventListener('pointerup', onUp)
      lienzo.removeEventListener('pointercancel', onUp)
      lienzo.removeEventListener('wheel', onWheel)
      for (const a of armaduras.values()) {
        a.material.dispose()
        a.forro.dispose()
        a.textura.dispose()
      }
      escena.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose()
      })
      for (const b of basura) b.dispose()
      render.dispose()
      render.domElement.remove()
    },
  }
}
