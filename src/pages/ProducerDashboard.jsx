import {
  AlertTriangle,
  Archive,
  ClipboardList,
  Edit3,
  Info,
  Minus,
  Package,
  Plus,
  Power,
  ShieldAlert,
  Truck,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import {
  BOYACA_MUNICIPALITIES,
  formatCOP,
  PRODUCT_CATEGORIES,
  PRODUCT_PRACTICES,
} from '../lib/formatters.js'

const IMAGE_PRESETS = [
  { label: 'Papa Criolla', url: '/images/products/papa-criolla.jpg' },
  { label: 'Tomate Chonto', url: '/images/products/tomate-chonto.jpg' },
  { label: 'Fresa Silvestre', url: '/images/products/fresa-silvestre.jpg' },
  { label: 'Zanahoria', url: '/images/products/zanahoria-dulce.jpg' },
  { label: 'Cebolla Junca', url: '/images/products/cebolla-junca.jpg' },
  { label: 'Arveja Verde', url: '/images/products/arveja-verde.jpg' },
  { label: 'Curuba', url: '/images/products/curuba-organica.jpg' },
  { label: 'Miel de Abejas', url: '/images/products/miel-boyaca.jpg' },
]

export function ProducerDashboard() {
  const {
    user,
    products,
    orders,
    handleSaveProduct,
    handleToggleProduct,
    handleUpdateStock,
    notify,
  } = useApp()

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmToggleId, setConfirmToggleId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    category: 'Tuberculos',
    practice: 'Organico',
    unit: 'Kg',
    price: 3500,
    stock: 20,
    municipality: user?.municipality || 'Chinavita',
    description: '',
    imageUrl: IMAGE_PRESETS[0].url,
  })

  const myProducts = useMemo(() => {
    if (!user) return []
    return products.filter((p) => p.producerId === user.id)
  }, [products, user])

  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'pendiente' || o.status === 'confirmado').length,
    [orders]
  )

  const totalStockUnits = useMemo(
    () => myProducts.filter((p) => p.active).reduce((acc, p) => acc + p.stock, 0),
    [myProducts]
  )

  const lowStockCount = useMemo(
    () => myProducts.filter((p) => p.active && p.stock <= 5).length,
    [myProducts]
  )

  if (!user || user.role !== 'productor') {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#DCE5DD] bg-white p-8 text-center shadow-xs space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-extrabold text-[#18221A]">
          Panel exclusivo para productores
        </h1>
        <p className="text-sm text-[#4A5A4E]">
          El control de acceso restringe la administracion de fincas e inventario a cuentas registradas con rol Productor.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/ingresar"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-[#2E7D32] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#236327]"
          >
            Ingresar como productor
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-[#DCE5DD] px-5 py-2.5 text-sm font-bold text-[#18221A] hover:bg-[#F6F8F6]"
          >
            Volver al catalogo
          </Link>
        </div>
      </div>
    )
  }

  const openCreateForm = () => {
    setEditingId(null)
    setFormError('')
    setForm({
      name: '',
      category: 'Tuberculos',
      practice: 'Organico',
      unit: 'Kg',
      price: 3500,
      stock: 20,
      municipality: user.municipality || 'Chinavita',
      description: '',
      imageUrl: IMAGE_PRESETS[0].url,
    })
    setFormOpen(true)
  }

  const openEditForm = (product) => {
    setEditingId(product.id)
    setFormError('')
    setForm({
      name: product.name,
      category: product.category,
      practice: product.practice,
      unit: product.unit,
      price: product.price,
      stock: product.stock,
      municipality: product.municipality,
      description: product.description,
      imageUrl: product.imageUrl,
    })
    setFormOpen(true)
  }

  const onSubmitProduct = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await handleSaveProduct(form, editingId)
      setFormOpen(false)
    } catch (err) {
      setFormError(err.message || 'No fue posible guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  const onAdjustStock = async (product, delta) => {
    const next = product.stock + delta
    if (next < 0) {
      notify('Las existencias no pueden ser negativas.', 'error')
      return
    }
    try {
      await handleUpdateStock(product.id, next)
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  const onConfirmToggle = async (productId) => {
    try {
      await handleToggleProduct(productId)
      setConfirmToggleId(null)
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Saludo y tarjeta principal de atencion del dia */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-2xl border border-[#DCE5DD] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-block rounded-full bg-[#EAF4EB] px-3 py-1 text-xs font-bold text-[#236327] uppercase tracking-wide">
                {user.farmName}
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-[#18221A]">
                Hola, {user.fullName} ({user.municipality})
              </h1>
              <p className="mt-1 text-sm text-[#4A5A4E]">
                Administra tus productos publicados, existencias disponibles y solicitudes recibidas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3.5">
              <span className="text-xs font-semibold text-[#4A5A4E]">Productos activos</span>
              <span className="mt-1 block text-2xl font-extrabold text-[#18221A] tabular-nums">
                {myProducts.filter((p) => p.active).length}
              </span>
            </div>
            <div className="rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3.5">
              <span className="text-xs font-semibold text-[#4A5A4E]">Existencias totales</span>
              <span className="mt-1 block text-2xl font-extrabold text-[#2E7D32] tabular-nums">
                {totalStockUnits} uds
              </span>
            </div>
            <div className="rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3.5">
              <span className="text-xs font-semibold text-[#4A5A4E]">Inventario bajo</span>
              <span className="mt-1 block text-2xl font-extrabold text-[#9A5B08] tabular-nums">
                {lowStockCount}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border-2 border-[#2E7D32] bg-[#EAF4EB]/50 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#236327]">
                Atencion hoy
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-[#18221A] tabular-nums">
                Pedidos pendientes: {pendingOrdersCount}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9A5B08] px-3 py-1 text-xs font-bold text-white">
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
              Por despachar
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/pedidos"
              className="flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#236327]"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Ver pedidos
            </Link>
            <button
              type="button"
              onClick={openCreateForm}
              className="flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#2E7D32] bg-white px-4 py-2.5 text-sm font-bold text-[#236327] hover:bg-[#EAF4EB]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar producto
            </button>
          </div>
        </div>
      </section>

      {/* Nota informativa de referencia */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#DCE5DD] bg-white p-4 text-xs sm:text-sm text-[#4A5A4E]">
        <Info className="h-5 w-5 text-[#2E7D32] shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong className="text-[#18221A]">Referencia regional Boyacá:</strong> La papa criolla y cebolla junca mantienen demanda estable en pedidos de prueba hacia Bogotá. Mantener el inventario actualizado evita rechazos al confirmar canastas.
        </p>
      </div>

      {/* Inventario del productor */}
      <section aria-label="Inventario de mi finca" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-[#18221A] flex items-center gap-2">
            <Package className="h-5 w-5 text-[#2E7D32]" aria-hidden="true" />
            Mi inventario ({myProducts.length})
          </h2>
          <button
            type="button"
            onClick={openCreateForm}
            className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white hover:bg-[#236327]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo producto
          </button>
        </div>

        {myProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DCE5DD] bg-white p-10 text-center">
            <p className="text-base font-bold text-[#18221A]">Aun no has publicado productos</p>
            <p className="mt-1 text-sm text-[#4A5A4E]">
              Agrega tu primer cultivo para que aparezca en el catalogo de consumidores.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myProducts.map((product) => (
              <article
                key={product.id}
                className={`rounded-2xl border p-4 shadow-xs transition-colors ${
                  product.active
                    ? 'border-[#DCE5DD] bg-white'
                    : 'border-slate-200 bg-slate-50 opacity-85'
                }`}
              >
                <div className="flex gap-4">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-24 w-24 rounded-xl object-cover shrink-0 bg-[#EAF4EB]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          product.active
                            ? 'bg-[#EAF4EB] text-[#236327]'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {product.active ? 'Publicado en catalogo' : 'Desactivado'}
                      </span>
                      <span className="text-xs font-semibold text-[#4A5A4E]">
                        {product.municipality}
                      </span>
                    </div>

                    <h3 className="mt-1 text-base font-extrabold text-[#18221A] truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm font-bold text-[#2E7D32] tabular-nums">
                      {formatCOP(product.price)} / {product.unit}
                    </p>

                    {product.stock <= 5 && product.active && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#9A5B08]">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        Stock bajo
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F4F0] pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#4A5A4E]">Existencias:</span>
                    <div className="inline-flex items-center rounded-xl border border-[#DCE5DD] bg-white">
                      <button
                        type="button"
                        onClick={() => onAdjustStock(product, -1)}
                        aria-label={`Restar existencia de ${product.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center hover:bg-[#F0F4F0]"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="min-w-10 px-2 text-center text-sm font-extrabold tabular-nums">
                        {product.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAdjustStock(product, 1)}
                        aria-label={`Sumar existencia de ${product.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center hover:bg-[#F0F4F0]"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(product)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#DCE5DD] bg-white px-3 text-xs font-bold text-[#18221A] hover:bg-[#F6F8F6]"
                    >
                      <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                      Editar
                    </button>

                    {confirmToggleId === product.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onConfirmToggle(product.id)}
                          className="min-h-[38px] rounded-xl bg-rose-700 px-3 text-xs font-bold text-white hover:bg-rose-800"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmToggleId(null)}
                          className="min-h-[38px] rounded-xl border border-[#DCE5DD] px-2.5 text-xs font-bold text-[#4A5A4E]"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          product.active
                            ? setConfirmToggleId(product.id)
                            : onConfirmToggle(product.id)
                        }
                        className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 text-xs font-bold ${
                          product.active
                            ? 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {product.active ? (
                          <>
                            <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Power className="h-3.5 w-3.5" aria-hidden="true" />
                            Reactivar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal para crear o editar producto */}
      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-form-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#DCE5DD] pb-3">
              <h2 id="product-form-title" className="text-lg font-extrabold text-[#18221A]">
                {editingId ? 'Editar producto' : 'Publicar nuevo producto'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Cerrar formulario"
                className="rounded-lg p-2 text-[#4A5A4E] hover:bg-[#F0F4F0]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-900"
              >
                {formError}
              </div>
            )}

            <form onSubmit={onSubmitProduct} className="mt-4 space-y-4">
              <div>
                <label htmlFor="prod-name" className="block text-xs font-bold text-[#18221A] mb-1">
                  Nombre del producto *
                </label>
                <input
                  id="prod-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Papa Pastusa Lavada"
                  className="min-h-[44px] w-full rounded-xl border border-[#DCE5DD] px-3.5 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prod-cat" className="block text-xs font-bold text-[#18221A] mb-1">
                    Categoria *
                  </label>
                  <select
                    id="prod-cat"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-[#DCE5DD] bg-white px-3 text-sm"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="prod-practice" className="block text-xs font-bold text-[#18221A] mb-1">
                    Tipo de cultivo *
                  </label>
                  <select
                    id="prod-practice"
                    value={form.practice}
                    onChange={(e) => setForm({ ...form, practice: e.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-[#DCE5DD] bg-white px-3 text-sm"
                  >
                    {PRODUCT_PRACTICES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="prod-price" className="block text-xs font-bold text-[#18221A] mb-1">
                    Precio COP *
                  </label>
                  <input
                    id="prod-price"
                    type="number"
                    min={100}
                    step={100}
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="min-h-[44px] w-full rounded-xl border border-[#DCE5DD] px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="prod-unit" className="block text-xs font-bold text-[#18221A] mb-1">
                    Unidad *
                  </label>
                  <input
                    id="prod-unit"
                    type="text"
                    required
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="Kg, Libra, Atado"
                    className="min-h-[44px] w-full rounded-xl border border-[#DCE5DD] px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="prod-stock" className="block text-xs font-bold text-[#18221A] mb-1">
                    Existencias *
                  </label>
                  <input
                    id="prod-stock"
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className="min-h-[44px] w-full rounded-xl border border-[#DCE5DD] px-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prod-muni" className="block text-xs font-bold text-[#18221A] mb-1">
                    Municipio de origen *
                  </label>
                  <select
                    id="prod-muni"
                    value={form.municipality}
                    onChange={(e) => setForm({ ...form, municipality: e.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-[#DCE5DD] bg-white px-3 text-sm"
                  >
                    {BOYACA_MUNICIPALITIES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="prod-img" className="block text-xs font-bold text-[#18221A] mb-1">
                    Fotografia del producto
                  </label>
                  <select
                    id="prod-img"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-[#DCE5DD] bg-white px-3 text-sm"
                  >
                    {IMAGE_PRESETS.map((img) => (
                      <option key={img.url} value={img.url}>
                        {img.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="prod-desc" className="block text-xs font-bold text-[#18221A] mb-1">
                  Descripcion y practica en finca *
                </label>
                <textarea
                  id="prod-desc"
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe cosecha, presentacion y manejo en finca."
                  className="w-full rounded-xl border border-[#DCE5DD] px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="min-h-[44px] rounded-xl border border-[#DCE5DD] px-4 text-sm font-bold text-[#4A5A4E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] rounded-xl bg-[#2E7D32] px-5 text-sm font-bold text-white hover:bg-[#236327] disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Publicar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
