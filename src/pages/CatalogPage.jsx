import { ArrowUpDown, Filter, Search, ShieldCheck, Sprout } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProductCard } from '../components/ProductCard.jsx'
import { ProductModal } from '../components/ProductModal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { PRODUCT_CATEGORIES, PRODUCT_PRACTICES } from '../lib/formatters.js'

export function CatalogPage() {
  const { user, products, reviews, addToCart, loading } = useApp()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [practice, setPractice] = useState('Todas')
  const [sortBy, setSortBy] = useState('recent')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const activeProducts = useMemo(
    () => products.filter((p) => p.active),
    [products]
  )

  const ratingByProduct = useMemo(() => {
    const map = new Map()
    for (const rev of reviews) {
      if (!map.has(rev.productId)) map.set(rev.productId, [])
      map.get(rev.productId).push(rev)
    }
    return map
  }, [reviews])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const list = activeProducts.filter((p) => {
      if (category !== 'Todos' && p.category !== category) return false
      if (practice !== 'Todas' && p.practice !== practice) return false
      if (!query) return true
      return (
        p.name.toLowerCase().includes(query) ||
        p.municipality.toLowerCase().includes(query) ||
        p.farmName.toLowerCase().includes(query) ||
        p.producerName.toLowerCase().includes(query)
      )
    })

    const sorted = [...list]
    if (sortBy === 'price-asc') sorted.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') sorted.sort((a, b) => b.price - a.price)
    else if (sortBy === 'stock') sorted.sort((a, b) => b.stock - a.stock)
    else sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return sorted
  }, [activeProducts, category, practice, search, sortBy])

  const getRatingStats = (productId) => {
    const list = ratingByProduct.get(productId) || []
    if (list.length === 0) return { count: 0, average: 0 }
    const avg = list.reduce((acc, item) => acc + item.rating, 0) / list.length
    return { count: list.length, average: avg.toFixed(1) }
  }

  const canBuy = user?.role !== 'productor'

  return (
    <div className="space-y-6">
      {/* Banner principal inspirado en AgroBoyaca */}
      <section className="rounded-2xl bg-[#2E7D32] p-5 sm:p-7 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <Sprout className="h-4 w-4" aria-hidden="true" />
              <span>Comercializacion directa Boyacá - Bogotá</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Cosecha fresca con origen verificado en finca
            </h1>
            <p className="text-sm sm:text-base text-emerald-50">
              Consulta precios directos, existencias reales y procedencia de pequeños productores de Chinavita y municipios cercanos.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-xs sm:text-sm backdrop-blur-xs">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-200" aria-hidden="true" />
            <span>
              Prototipo académico TRL 4. Pedidos de prueba sin cobros reales.
            </span>
          </div>
        </div>
      </section>

      {/* Buscador y controles de filtrado */}
      <section aria-label="Filtros del catalogo" className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-6">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5A4E]"
              aria-hidden="true"
            />
            <label htmlFor="catalog-search" className="sr-only">
              Buscar productos, municipio o finca
            </label>
            <input
              id="catalog-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar papa, tomate, Chinavita, finca..."
              className="min-h-[46px] w-full rounded-xl border border-[#DCE5DD] bg-white pl-10 pr-4 text-sm text-[#18221A] placeholder:text-[#4A5A4E]/70 focus:border-[#2E7D32] focus:outline-none"
            />
          </div>

          <div className="relative md:col-span-3">
            <Filter
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5A4E]"
              aria-hidden="true"
            />
            <label htmlFor="practice-filter" className="sr-only">
              Filtrar por practica
            </label>
            <select
              id="practice-filter"
              value={practice}
              onChange={(e) => setPractice(e.target.value)}
              className="min-h-[46px] w-full rounded-xl border border-[#DCE5DD] bg-white pl-10 pr-3 text-sm font-medium text-[#18221A] focus:border-[#2E7D32] focus:outline-none"
            >
              <option value="Todas">Todas las practicas</option>
              {PRODUCT_PRACTICES.map((pr) => (
                <option key={pr} value={pr}>
                  {pr}
                </option>
              ))}
            </select>
          </div>

          <div className="relative md:col-span-3">
            <ArrowUpDown
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A5A4E]"
              aria-hidden="true"
            />
            <label htmlFor="catalog-sort" className="sr-only">
              Ordenar catalogo
            </label>
            <select
              id="catalog-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="min-h-[46px] w-full rounded-xl border border-[#DCE5DD] bg-white pl-10 pr-3 text-sm font-medium text-[#18221A] focus:border-[#2E7D32] focus:outline-none"
            >
              <option value="recent">Mas recientes</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="stock">Mayor disponibilidad</option>
            </select>
          </div>
        </div>

        {/* Chips horizontales sin recorte vertical */}
        <div className="flex items-center justify-between gap-3">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
            {['Todos', ...PRODUCT_CATEGORIES].map((cat) => {
              const active = category === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`min-h-[42px] shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'border-[#2E7D32] bg-[#EAF4EB] text-[#236327]'
                      : 'border-[#DCE5DD] bg-white text-[#4A5A4E] hover:bg-[#F0F4F0]'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          <span className="hidden sm:inline-block shrink-0 text-xs font-bold text-[#4A5A4E] tabular-nums">
            {filteredProducts.length} disponibles
          </span>
        </div>
      </section>

      {/* Grilla de productos */}
      <section aria-label="Listado de cosecha fresca">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-80 animate-pulse rounded-2xl border border-[#DCE5DD] bg-white"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DCE5DD] bg-white p-10 text-center">
            <p className="text-base font-bold text-[#18221A]">
              No encontramos productos con esos filtros
            </p>
            <p className="mt-1 text-sm text-[#4A5A4E]">
              Prueba limpiar la busqueda o seleccionar otra categoria de cultivo.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setCategory('Todos')
                setPractice('Todas')
              }}
              className="mt-4 min-h-[42px] rounded-xl bg-[#EAF4EB] px-4 py-2 text-sm font-bold text-[#236327] hover:bg-[#d7ecd9]"
            >
              Ver todo el catalogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                ratingStats={getRatingStats(product.id)}
                canBuy={canBuy}
                onSelect={setSelectedProduct}
                onAdd={addToCart}
              />
            ))}
          </div>
        )}
      </section>

      <ProductModal
        product={selectedProduct}
        reviews={selectedProduct ? ratingByProduct.get(selectedProduct.id) || [] : []}
        canBuy={canBuy}
        onClose={() => setSelectedProduct(null)}
        onAdd={addToCart}
      />
    </div>
  )
}
