import { MapPin, Minus, Plus, ShieldCheck, Sprout, Star, X } from 'lucide-react'
import { useState } from 'react'
import { formatCOP, formatDateTime } from '../lib/formatters.js'

export function ProductModal({ product, reviews, canBuy, onClose, onAdd }) {
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const outOfStock = product.stock <= 0
  const maxQty = Math.max(1, product.stock)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/10] w-full bg-[#EAF4EB]">
          <img
            src={product.imageUrl}
            alt={`${product.name} de ${product.municipality}`}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle del producto"
            className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#18221A] shadow-md hover:bg-white focus-visible:outline-2 focus-visible:outline-[#2E7D32]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#18221A] shadow-xs">
            <MapPin className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
            {product.municipality}, Boyacá
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF4EB] px-2.5 py-1 text-xs font-bold text-[#236327]">
                <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
                {product.practice} · {product.category}
              </span>
              <h2
                id="product-modal-title"
                className="mt-2 text-2xl font-extrabold text-[#18221A]"
              >
                {product.name}
              </h2>
              <p className="mt-1 text-sm text-[#4A5A4E]">
                Productor: <strong className="font-semibold text-[#18221A]">{product.producerName}</strong> ({product.farmName})
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="block text-2xl font-extrabold text-[#2E7D32] tabular-nums">
                {formatCOP(product.price)}
              </span>
              <span className="text-xs font-medium text-[#4A5A4E]">
                por {product.unit} · {outOfStock ? 'Sin existencias' : `${product.stock} disponibles`}
              </span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[#4A5A4E]">{product.description}</p>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3.5 text-xs text-[#4A5A4E]">
            <ShieldCheck className="h-4 w-4 text-[#2E7D32] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Informacion declarada por la unidad productiva en el entorno academico. No representa sello comercial ni certificacion externa emitida por terceros.
            </span>
          </div>

          {canBuy && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <div className="flex items-center justify-between rounded-xl border border-[#DCE5DD] px-2 py-1">
                <button
                  type="button"
                  disabled={quantity <= 1 || outOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Disminuir cantidad"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#18221A] hover:bg-[#F0F4F0] disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="w-12 text-center text-base font-bold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  disabled={quantity >= maxQty || outOfStock}
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  aria-label="Aumentar cantidad"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#18221A] hover:bg-[#F0F4F0] disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  onAdd(product, quantity)
                  onClose()
                }}
                className="flex-1 min-h-[46px] rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-bold text-white hover:bg-[#236327] disabled:bg-slate-200 disabled:text-slate-500 tabular-nums"
              >
                {outOfStock
                  ? 'Producto agotado'
                  : `Agregar a la canasta · ${formatCOP(product.price * quantity)}`}
              </button>
            </div>
          )}

          <div className="border-t border-[#DCE5DD] pt-4">
            <h3 className="text-sm font-bold text-[#18221A]">
              Valoraciones de compradores ({reviews.length})
            </h3>
            {reviews.length === 0 ? (
              <p className="mt-2 text-xs text-[#4A5A4E]">
                Aun no hay valoraciones registradas para este producto.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {reviews.map((rev) => (
                  <li
                    key={rev.id}
                    className="rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#18221A]">{rev.consumerName}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#9A5B08] tabular-nums">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
                        {rev.rating}/5
                      </span>
                    </div>
                    <p className="mt-1 text-[#4A5A4E]">{rev.comment}</p>
                    <span className="mt-1 block text-[11px] text-[#4A5A4E]">
                      {formatDateTime(rev.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
