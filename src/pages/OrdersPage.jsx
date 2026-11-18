import { ClipboardList, Lock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { OrderTimeline } from '../components/OrderTimeline.jsx'
import { useApp } from '../context/AppContext.jsx'
import { ORDER_STATUS_META } from '../lib/formatters.js'

export function OrdersPage() {
  const { user, orders, reviews, handleAdvanceOrder, handleSubmitReview, notify } = useApp()
  const [statusFilter, setStatusFilter] = useState('todos')

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'todos') return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  if (!user) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#DCE5DD] bg-white p-8 text-center shadow-xs space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF4EB] text-[#2E7D32]">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-extrabold text-[#18221A]">
          Inicia sesion para consultar pedidos
        </h1>
        <p className="text-sm text-[#4A5A4E]">
          Cada consumidor consulta unicamente sus propios pedidos de prueba y cada productor gestiona los pedidos de su finca.
        </p>
        <Link
          to="/ingresar"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#2E7D32] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#236327]"
        >
          Ir a ingresar o usar cuenta demo
        </Link>
      </div>
    )
  }

  const onAdvance = async (orderId, nextStatus) => {
    try {
      await handleAdvanceOrder(orderId, nextStatus)
    } catch (err) {
      notify(err.message || 'No fue posible actualizar el estado.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#18221A]">
            {user.role === 'productor' ? 'Pedidos recibidos en finca' : 'Mis pedidos y trazabilidad'}
          </h1>
          <p className="text-sm text-[#4A5A4E]">
            {user.role === 'productor'
              ? `Mostrando solicitudes vinculadas exclusivamente a ${user.farmName}.`
              : 'Consulta el avance de tus pedidos de prueba y califica los productos entregados.'}
          </p>
        </div>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
          {['todos', ...Object.keys(ORDER_STATUS_META)].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`min-h-[40px] shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold whitespace-nowrap ${
                statusFilter === key
                  ? 'border-[#2E7D32] bg-[#EAF4EB] text-[#236327]'
                  : 'border-[#DCE5DD] bg-white text-[#4A5A4E] hover:bg-[#F0F4F0]'
              }`}
            >
              {key === 'todos' ? 'Todos' : ORDER_STATUS_META[key].label}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DCE5DD] bg-white p-10 text-center space-y-3">
          <ClipboardList className="mx-auto h-10 w-10 text-[#4A5A4E]" aria-hidden="true" />
          <p className="text-base font-bold text-[#18221A]">
            No hay pedidos registrados en este filtro
          </p>
          {user.role === 'consumidor' && (
            <Link
              to="/"
              className="inline-flex min-h-[42px] items-center rounded-xl bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white hover:bg-[#236327]"
            >
              Explorar catalogo
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => (
            <OrderTimeline
              key={order.id}
              order={order}
              userRole={user.role}
              reviews={reviews}
              onAdvanceStatus={onAdvance}
              onSubmitReview={handleSubmitReview}
            />
          ))}
        </div>
      )}
    </div>
  )
}
