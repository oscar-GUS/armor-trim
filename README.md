# Armor Trim Generator

Generador de trims de armadura de Minecraft con vista 3D sobre tu propia skin.
Es una de las herramientas de [MineLite](https://minelite.es/herramientas), donde
se sirve desde `/tools/armor-trim/` y se embebe por iframe en
`/herramientas/generador-trims`.

- Las 4 piezas por separado (o el set completo de golpe): material de armadura,
  tinte del cuero, patrón del trim y material del trim.
- Vista 3D con la armadura montada sobre la skin: por nick de Minecraft, subiendo
  un PNG o con las skins por defecto del juego.
- Comando `/give` listo para copiar (sintaxis de componentes, 1.21.5+) y enlace
  para compartir el diseño.

## Desarrollo

```bash
npm install
npm run dev
```

La búsqueda de skins por nick va contra `/api/skin/usuario/<nick>` de MineLite;
en desarrollo el `server.proxy` de Vite la redirige a `http://localhost:3010`.

## Assets

Las texturas vanilla (capas de armadura, trims, paletas, iconos de item y skins
por defecto) las descarga de [misode/mcmeta](https://github.com/misode/mcmeta) el
script de assets, y quedan commiteadas en `public/mc/`:

```bash
npm run assets           # solo baja lo que falte
npm run assets -- --force  # rehace todo (nueva versión de Minecraft)
```

Ese script genera también `src/data/generated.ts` con las listas, colores,
nombres oficiales en español y las paletas oscuras de cada material.

## Publicar en MineLite

Desde la raíz del repo de minelite:

```bash
npm run tools:armor-trim
```

Reconstruye este proyecto y copia `dist/` a `public/tools/armor-trim/`.
