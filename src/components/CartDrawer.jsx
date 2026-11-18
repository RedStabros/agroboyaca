import { Info, Minus, Plus, ShoppingBasket, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { formatCOP } from '../lib/formatters.js'

export function CartDrawer() {
  const {
    user,
    cart,
    cartTotal,
    cartOpen,
    setCartOpen,
    updateCartQuantity,
    removeFromCart,
    handleConfirmOrder,
    notify,
  } = useApp()

  const [deliveryNote, setDeliveryNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  if (!cartOpen) return null

  const onConfirm = async () => {
    if (!user) {
      setCartOpen(false)
      navigate('/ingresar')
      return
    }
    setSubmitting(true)
    try {
      await handleConfirmOrder(deliveryNote)
      setDeliveryNote('')
      navigate('/pedidos')
    } catch (err) {
      notify(err.message || 'No fue posible registrar el pedido.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      onClick={() => setCartOpen(false)}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#DCE5DD] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBasket className="h-5 w-5 text-[#2E7D32]" aria-hidden="true" />
            <h2 id="cart-drawer-title" className="text-lg font-extrabold text-[#18221A]">
              Canasta de pedido
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Cerrar canasta"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#4A5A4E] hover:bg-[#F0F4F0]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCE5DD] bg-[#F6F8F6] p-8 text-center">
              <ShoppingBasket className="mx-auto h-10 w-10 text-[#4A5A4E]" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-[#18221A]">Tu canasta esta vacia</p>
              <p className="mt-1 text-xs text-[#4A5A4E]">
                Agrega productos frescos de Boyaca desde el catalogo para simular un pedido de prueba.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                <Info className="h-4 w-4 shrink-0 text-amber-800 mt-0.5" aria-hidden="true" />
                <span>
                  Pedido academico de prueba: valida disponibilidad y descuenta inventario en tiempo real sin procesar cobros ni pagos reales.
                </span>
              </div>

              <ul className="space-y-3">
                {cart.map(({ product, quantity, subtotal }) => (
                  <li
                    key={product.id}
                    className="flex gap-3 rounded-xl border border-[#DCE5DD] p-3"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-16 w-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#18221A] truncate">{product.name}</p>
                      <p className="text-xs text-[#4A5A4E]">
                        {product.farmName} · {formatCOP(product.price)} / {product.unit}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-lg border border-[#DCE5DD]">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(product.id, quantity - 1)}
                            aria-label={`Restar uno de ${product.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center text-[#18221A] hover:bg-[#F0F4F0]"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(product.id, quantity + 1)}
                            aria-label={`Sumar uno de ${product.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center text-[#18221A] hover:bg-[#F0F4F0]"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[#18221A] tabular-nums">
                            {formatCOP(subtotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            aria-label={`Quitar ${product.name}`}
                            className="rounded-lg p-1.5 text-[#4A5A4E] hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div>
                <label
                  htmlFor="delivery-note"
                  className="block text-xs font-bold text-[#18221A] mb-1.5"
                >
                  Nota de entrega (opcional)
                </label>
                <textarea
                  id="delivery-note"
                  rows={2}
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Ej. Barrio Chapinero, entrega en horas de la tarde."
                  className="w-full rounded-xl border border-[#DCE5DD] px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
                />
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-[#DCE5DD] bg-[#F6F8F6] p-5 space-y-3">
            <div className="flex items-center justify-between text-base font-extrabold text-[#18221A]">
              <span>Total estimado</span>
              <span className="text-xl text-[#2E7D32] tabular-nums">{formatCOP(cartTotal)}</span>
            </div>

            {!user ? (
              <Link
                to="/ingresar"
                onClick={() => setCartOpen(false)}
                className="flex min-h-[46px] w-full items-center justify-center rounded-xl bg-[#2E7D32] px-4 py-3 text-sm font-bold text-white hover:bg-[#236327]"
              >
                Inicia sesion para confirmar pedido
              </Link>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={onConfirm}
                className="min-h-[46px] w-full rounded-xl bg-[#2E7D32] px-4 py-3 text-sm font-bold text-white hover:bg-[#236327] disabled:opacity-60"
              >
                {submitting ? 'Registrando pedido...' : 'Confirmar pedido de prueba'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
