export function formatCOP(value) {
  const numeric = Number(value) || 0
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numeric)
}

export function formatDateTime(isoString) {
  if (!isoString) return 'Sin registro'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return 'Sin registro'
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export const ORDER_STATUS_META = {
  pendiente: {
    label: 'Pendiente',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
    description: 'Pedido de prueba registrado y enviado al productor.',
  },
  confirmado: {
    label: 'Confirmado',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-200',
    description: 'El productor reviso existencias y acepto el pedido.',
  },
  en_preparacion: {
    label: 'En preparacion',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-200',
    description: 'Cosecha y embalaje en finca de origen.',
  },
  enviado: {
    label: 'En camino a Bogota',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    description: 'Despacho en ruta desde Boyaca hacia Bogota.',
  },
  entregado: {
    label: 'Entregado',
    badgeClass: 'bg-green-200 text-green-950 border-green-300',
    description: 'Pedido recibido por el consumidor. Valoracion habilitada.',
  },
  cancelado: {
    label: 'Cancelado',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-200',
    description: 'Pedido cancelado; inventario devuelto al productor.',
  },
}

// Reglas de transicion valida para evitar saltos inconsistentes en los pedidos
export const ORDER_TRANSITIONS = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['en_preparacion', 'cancelado'],
  en_preparacion: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
}

export const BOYACA_MUNICIPALITIES = [
  'Chinavita',
  'Garagoa',
  'Sutamarchan',
  'Villa de Leyva',
  'Ventaquemada',
  'Tenza',
  'Pachavita',
  'Aquitania',
]

export const PRODUCT_CATEGORIES = [
  'Tuberculos',
  'Hortalizas',
  'Frutas',
  'Granos y otros',
]

export const PRODUCT_PRACTICES = [
  'Organico',
  'Transicion agroecologica',
]
