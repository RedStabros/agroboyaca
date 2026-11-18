import { CheckCircle2, Clock, MapPin, PackageCheck, Star, Truck, XCircle } from 'lucide-react'
import { useState } from 'react'
import { formatCOP, formatDateTime, ORDER_STATUS_META, ORDER_TRANSITIONS } from '../lib/formatters.js'

const STATUS_ICONS = {
  pendiente: Clock,
  confirmado: CheckCircle2,
  en_preparacion: PackageCheck,
  enviado: Truck,
  entregado: CheckCircle2,
  cancelado: XCircle,
}

export function OrderTimeline({
  order,
  userRole,
  reviews,
  onAdvanceStatus,
  onSubmitReview,
}) {
  const [selectedProductId, setSelectedProductId] = useState(order.items[0]?.productId || '')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [savingReview, setSavingReview] = useState(false)

  const statusMeta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pendiente
  const allowedNext = ORDER_TRANSITIONS[order.status] || []

  const existingReview = reviews.find(
    (r) => r.orderId === order.id && r.productId === selectedProductId
  )

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewError('')
    setSavingReview(true)
    try {
      await onSubmitReview({
        orderId: order.id,
        productId: selectedProductId,
        rating,
        comment,
      })
      setComment('')
    } catch (err) {
      setReviewError(err.message || 'No se pudo enviar la valoracion.')
    } finally {
      setSavingReview(false)
    }
  }

  return (
    <article className="rounded-2xl border border-[#DCE5DD] bg-white p-4 sm:p-6 shadow-xs space-y-5">
      {/* Encabezado separado para evitar solapamiento entre codigo e insignia */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F0F4F0] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-lg font-extrabold text-[#18221A] tabular-nums">
              Pedido {order.orderCode}
            </h3>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold ${statusMeta.badgeClass}`}
            >
              {statusMeta.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#4A5A4E] flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#2E7D32]" aria-hidden="true" />
              {order.farmName} ({order.municipality}) → {order.consumerCity}
            </span>
            <span>Registrado: {formatDateTime(order.createdAt)}</span>
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="block text-xs text-[#4A5A4E]">Total pedido de prueba</span>
          <span className="text-xl font-extrabold text-[#2E7D32] tabular-nums">
            {formatCOP(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Lista de productos con calculo exacto */}
      <div className="rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-3.5">
        <p className="text-xs font-bold text-[#18221A] mb-2">
          Detalle de canasta ({order.items.length} {order.items.length === 1 ? 'articulo' : 'articulos'})
        </p>
        <ul className="divide-y divide-[#DCE5DD]">
          {order.items.map((item) => (
            <li
              key={item.productId}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <div>
                <span className="font-semibold text-[#18221A]">
                  {item.quantity} {item.unit} · {item.productName}
                </span>
                <span className="block text-xs text-[#4A5A4E] tabular-nums">
                  {formatCOP(item.unitPrice)} c/u
                </span>
              </div>
              <span className="font-bold text-[#18221A] tabular-nums">
                {formatCOP(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>
        {order.deliveryNote && (
          <p className="mt-2 border-t border-[#DCE5DD] pt-2 text-xs text-[#4A5A4E]">
            Nota: {order.deliveryNote}
          </p>
        )}
      </div>

      {/* Trazabilidad cronologica */}
      <div>
        <h4 className="text-sm font-bold text-[#18221A] mb-3">Trazabilidad del pedido</h4>
        <ol className="space-y-3 border-l-2 border-[#DCE5DD] ml-2.5 pl-4">
          {order.statusHistory.map((step, index) => {
            const Icon = STATUS_ICONS[step.status] || Clock
            const meta = ORDER_STATUS_META[step.status] || ORDER_STATUS_META.pendiente
            return (
              <li key={`${step.status}-${index}`} className="relative">
                <span className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-[#2E7D32]">
                  <Icon className="h-2.5 w-2.5 text-[#2E7D32]" aria-hidden="true" />
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#18221A]">{meta.label}</span>
                  <span className="text-[11px] text-[#4A5A4E]">{formatDateTime(step.at)}</span>
                </div>
                <p className="text-xs text-[#4A5A4E]">{step.detail}</p>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Acciones de estado exclusivas del productor propietario */}
      {userRole === 'productor' && allowedNext.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[#F0F4F0] pt-4">
          <span className="text-xs font-bold text-[#4A5A4E] mr-1">Actualizar estado:</span>
          {allowedNext.map((nextKey) => (
            <button
              key={nextKey}
              type="button"
              onClick={() => onAdvanceStatus(order.id, nextKey)}
              className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                nextKey === 'cancelado'
                  ? 'border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                  : 'bg-[#2E7D32] text-white hover:bg-[#236327]'
              }`}
            >
              Marcar como {ORDER_STATUS_META[nextKey].label}
            </button>
          ))}
        </div>
      )}

      {/* Modulo de valoracion habilitado solo al entregar */}
      {userRole === 'consumidor' && (
        <div className="border-t border-[#F0F4F0] pt-4">
          {order.status !== 'entregado' ? (
            <p className="text-xs text-[#4A5A4E]">
              La valoracion del productor se habilita cuando el pedido alcance el estado Entregado.
            </p>
          ) : (
            <div className="rounded-xl border border-[#DCE5DD] bg-[#F6F8F6] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-[#18221A]">Calificar productos recibidos</h4>
                {order.items.length > 1 && (
                  <select
                    aria-label="Seleccionar producto a valorar"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="rounded-lg border border-[#DCE5DD] bg-white px-2.5 py-1.5 text-xs font-semibold"
                  >
                    {order.items.map((it) => (
                      <option key={it.productId} value={it.productId}>
                        {it.productName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {existingReview ? (
                <div className="rounded-lg bg-white p-3 border border-[#DCE5DD] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#236327]">Valoracion registrada</span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#9A5B08]">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
                      {existingReview.rating}/5
                    </span>
                  </div>
                  <p className="mt-1 text-[#4A5A4E]">{existingReview.comment}</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        aria-label={`Calificar con ${num} estrellas`}
                        className="p-1.5 rounded-lg hover:bg-white"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            num <= rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-slate-300'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-[#4A5A4E] tabular-nums">
                      {rating} de 5
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Cuentanos sobre la frescura y presentacion del producto."
                    className="w-full rounded-xl border border-[#DCE5DD] bg-white px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                  />

                  {reviewError && <p className="text-xs font-semibold text-rose-700">{reviewError}</p>}

                  <button
                    type="submit"
                    disabled={savingReview}
                    className="min-h-[42px] rounded-xl bg-[#2E7D32] px-4 py-2 text-xs font-bold text-white hover:bg-[#236327] disabled:opacity-60"
                  >
                    {savingReview ? 'Enviando...' : 'Enviar valoracion'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
