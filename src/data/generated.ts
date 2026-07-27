// GENERADO por tools/build-assets.mjs — no editar a mano.
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

export const PIEZAS: Pieza[] = ["helmet","chestplate","leggings","boots"]
export const NOMBRE_PIEZA: Record<Pieza, string> = {
  "helmet": "Casco",
  "chestplate": "Peto",
  "leggings": "Grebas",
  "boots": "Botas"
}
export const MATERIALES: MaterialArmadura[] = [
  {
    "id": "leather",
    "equipment": "leather",
    "item": "leather",
    "nombre": "Cuero",
    "piezas": [
      "helmet",
      "chestplate",
      "leggings",
      "boots"
    ],
    "colorBase": "#A06540",
    "paletasOscuras": {}
  },
  {
    "id": "chainmail",
    "equipment": "chainmail",
    "item": "chainmail",
    "nombre": "Malla",
    "piezas": [
      "helmet",
      "chestplate",
      "leggings",
      "boots"
    ],
    "colorBase": null,
    "paletasOscuras": {}
  },
  {
    "id": "copper",
    "equipment": "copper",
    "item": "copper",
    "nombre": "Cobre",
    "piezas": [
      "helmet",
      "chestplate",
      "leggings",
      "boots"
    ],
    "colorBase": null,
    "paletasOscuras": {
      "copper": "copper_darker"
    }
  },
  {
    "id": "iron",
    "equipment": "iron",
    "item": "iron",
    "nombre": "Hierro",
    "piezas": [
      "helmet",
      "chestplate",
      "leggings",
      "boots"
    ],
    "colorBase": null,
    "paletasOscuras": {
      "iron": "iron_darker"
    }
  },
  {
    "id": "golden",
    "equipment": "gold",
    "item": "golden",
    "nombre": "Oro",
    "piezas": [
      "helmet",
      "chestplate",
      "leggings",
      "boots"
    ],
    "colorBase": null,
    "paletasOscuras": {
      "gold": "gold_darker"
    }
  },
  {
    "id": "diamond",
    "equipment": "diamond",
    "item": "diamond",
    "nombre": "Diamante",
    "piezas": [
      "helmet",
      "chestplate",
      "leggings",
      "boots"
    ],
    "colorBase": null,
    "paletasOscuras": {
      "diamond": "diamond_darker"
    }
  },
  {
    "id": "netherite",
    "equipment": "netherite",
    "item": "netherite",
    "nombre": "Netherita",
    "piezas": [
      "helmet",
      "chestplate",
      "leggings",
      "boots"
    ],
    "colorBase": null,
    "paletasOscuras": {
      "netherite": "netherite_darker"
    }
  },
  {
    "id": "turtle",
    "equipment": "turtle_scute",
    "item": "turtle",
    "nombre": "Caparazón",
    "piezas": [
      "helmet"
    ],
    "colorBase": null,
    "paletasOscuras": {}
  }
]
export const TRIM_MATERIALES: TrimMaterial[] = [
  {
    "id": "quartz",
    "item": "quartz",
    "nombre": "Incrustaciones de cuarzo",
    "color": "#E3D4C4"
  },
  {
    "id": "iron",
    "item": "iron_ingot",
    "nombre": "Incrustaciones de hierro",
    "color": "#ECECEC"
  },
  {
    "id": "netherite",
    "item": "netherite_ingot",
    "nombre": "Incrustaciones de netherita",
    "color": "#625859"
  },
  {
    "id": "redstone",
    "item": "redstone",
    "nombre": "Incrustaciones de redstone",
    "color": "#971607"
  },
  {
    "id": "copper",
    "item": "copper_ingot",
    "nombre": "Incrustaciones de cobre",
    "color": "#B4684D"
  },
  {
    "id": "gold",
    "item": "gold_ingot",
    "nombre": "Incrustaciones de oro",
    "color": "#DEB12D"
  },
  {
    "id": "emerald",
    "item": "emerald",
    "nombre": "Incrustaciones de esmeralda",
    "color": "#11A036"
  },
  {
    "id": "diamond",
    "item": "diamond",
    "nombre": "Incrustaciones de diamante",
    "color": "#6EECD2"
  },
  {
    "id": "lapis",
    "item": "lapis_lazuli",
    "nombre": "Incrustaciones de lapislázuli",
    "color": "#416E97"
  },
  {
    "id": "amethyst",
    "item": "amethyst_shard",
    "nombre": "Incrustaciones de amatista",
    "color": "#9A5CC6"
  },
  {
    "id": "resin",
    "item": "resin_brick",
    "nombre": "Incrustaciones de resina",
    "color": "#FC7812"
  }
]
export const PATRONES: Patron[] = [
  {
    "id": "bolt",
    "nombre": "Diseño de armadura de remaches"
  },
  {
    "id": "coast",
    "nombre": "Diseño de armadura costera"
  },
  {
    "id": "dune",
    "nombre": "Diseño de armadura de las dunas"
  },
  {
    "id": "eye",
    "nombre": "Diseño de armadura de ojos"
  },
  {
    "id": "flow",
    "nombre": "Diseño de armadura de espiral"
  },
  {
    "id": "host",
    "nombre": "Diseño de armadura de anfitrión"
  },
  {
    "id": "raiser",
    "nombre": "Diseño de armadura de elevación"
  },
  {
    "id": "rib",
    "nombre": "Diseño de armadura de costillas"
  },
  {
    "id": "sentry",
    "nombre": "Diseño de armadura de centinela"
  },
  {
    "id": "shaper",
    "nombre": "Diseño de armadura de modelador"
  },
  {
    "id": "silence",
    "nombre": "Diseño de armadura de silencio"
  },
  {
    "id": "snout",
    "nombre": "Diseño de armadura de hocico"
  },
  {
    "id": "spire",
    "nombre": "Diseño de armadura de agujas"
  },
  {
    "id": "tide",
    "nombre": "Diseño de armadura de la marea"
  },
  {
    "id": "vex",
    "nombre": "Diseño de armadura de vex"
  },
  {
    "id": "ward",
    "nombre": "Diseño de armadura de warden"
  },
  {
    "id": "wayfinder",
    "nombre": "Diseño de armadura de buscacaminos"
  },
  {
    "id": "wild",
    "nombre": "Diseño de armadura salvaje"
  }
]
export const TINTES: Tinte[] = [
  {
    "id": "white",
    "nombre": "Tinte blanco",
    "color": "#F9FFFE"
  },
  {
    "id": "light_gray",
    "nombre": "Tinte gris claro",
    "color": "#9D9D97"
  },
  {
    "id": "gray",
    "nombre": "Tinte gris",
    "color": "#474F52"
  },
  {
    "id": "black",
    "nombre": "Tinte negro",
    "color": "#1D1D21"
  },
  {
    "id": "brown",
    "nombre": "Tinte marrón",
    "color": "#835432"
  },
  {
    "id": "red",
    "nombre": "Tinte rojo",
    "color": "#B02E26"
  },
  {
    "id": "orange",
    "nombre": "Tinte naranja",
    "color": "#F9801D"
  },
  {
    "id": "yellow",
    "nombre": "Tinte amarillo",
    "color": "#FED83D"
  },
  {
    "id": "lime",
    "nombre": "Tinte verde lima",
    "color": "#80C71F"
  },
  {
    "id": "green",
    "nombre": "Tinte verde",
    "color": "#5E7C16"
  },
  {
    "id": "cyan",
    "nombre": "Tinte cian",
    "color": "#169C9C"
  },
  {
    "id": "light_blue",
    "nombre": "Tinte azul claro",
    "color": "#3AB3DA"
  },
  {
    "id": "blue",
    "nombre": "Tinte azul",
    "color": "#3C44AA"
  },
  {
    "id": "purple",
    "nombre": "Tinte morado",
    "color": "#8932B8"
  },
  {
    "id": "magenta",
    "nombre": "Tinte magenta",
    "color": "#C74EBD"
  },
  {
    "id": "pink",
    "nombre": "Tinte rosa",
    "color": "#F38BAA"
  }
]
export const SKINS: SkinDefecto[] = [
  {
    "id": "steve",
    "nombre": "Steve",
    "slim": false
  },
  {
    "id": "alex",
    "nombre": "Alex",
    "slim": true
  },
  {
    "id": "ari",
    "nombre": "Ari",
    "slim": false
  },
  {
    "id": "efe",
    "nombre": "Efe",
    "slim": false
  },
  {
    "id": "kai",
    "nombre": "Kai",
    "slim": false
  },
  {
    "id": "makena",
    "nombre": "Makena",
    "slim": true
  },
  {
    "id": "noor",
    "nombre": "Noor",
    "slim": true
  },
  {
    "id": "sunny",
    "nombre": "Sunny",
    "slim": false
  },
  {
    "id": "zuri",
    "nombre": "Zuri",
    "slim": false
  }
]
