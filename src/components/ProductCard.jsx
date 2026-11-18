import { MapPin, Plus, Star, UserCheck } from 'lucide-react'
import { formatCOP } from '../lib/formatters.js'

export function ProductCard({ product, ratingStats, onSelect, onAdd, canBuy }) {
  const outOfStock = product.stock <= 0

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#DCE5DD] bg-white shadow-xs transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#EAF4EB] text-left focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2E7D32]"
      >
        <img
          src={product.imageUrl}
          alt={`${product.name} cultivado en ${product.municipality}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#18221A] shadow-xs">
          <MapPin className="h-3.5 w-3.5 text-rose-600 shrink-0" aria-hidden="true" />
          <span>{product.municipality}</span>
        </span>
        <span className="absolute right-2.5 bottom-2.5 rounded-full bg-[#18221A]/80 px-2.5 py-0.5 text-[11px] font-semibold text-white">
          {product.practice}
        </span>
      </button>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-[#4A5A4E]">
          <span className="inline-flex items-center gap-1 font-medium truncate">
            <UserCheck className="h-3.5 w-3.5 text-[#2E7D32] shrink-0" aria-hidden="true" />
            <span className="truncate">{product.farmName}</span>
          </span>
          {ratingStats.count > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-[#9A5B08] shrink-0 tabular-nums">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
              {ratingStats.average}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect(product)}
          className="mt-1.5 text-left text-base font-bold leading-snug text-[#18221A] hover:text-[#2E7D32] focus-visible:outline-2 focus-visible:outline-[#2E7D32] rounded"
        >
          {product.name}
        </button>

        <p className="mt-1 text-xs font-medium text-[#4A5A4E] tabular-nums">
          {outOfStock ? 'Agotado temporalmente' : `Disponibles: ${product.stock} ${product.unit}`}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-[#F0F4F0]">
          <div>
            <span className="block text-lg font-extrabold text-[#18221A] tabular-nums">
              {formatCOP(product.price)}
            </span>
            <span className="block text-xs text-[#4A5A4E]">por {product.unit}</span>
          </div>

          {canBuy && (
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => onAdd(product, 1)}
              aria-label={`Agregar ${product.name} a la canasta`}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2E7D32] text-white shadow-xs transition-colors hover:bg-[#236327] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32]"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
