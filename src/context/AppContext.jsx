import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  advanceOrderStatus,
  createTestOrders,
  getCurrentUser,
  listCatalogProducts,
  listOrdersForUser,
  listReviews,
  loginDemoRole,
  loginUser,
  logoutUser,
  registerUser,
  resetDemoDatabase,
  saveProduct,
  submitReview,
  toggleProductActive,
  updateProductStock,
} from '../services/agroService.js'

const CART_STORAGE_KEY = 'agroboyaca_cart_v1'
const AppContext = createContext(null)

function readInitialCart() {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [reviews, setReviews] = useState([])
  const [cart, setCart] = useState(readInitialCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const notify = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type })
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // Ignora restricciones de almacenamiento privado
    }
  }, [cart])

  const refreshAll = useCallback(async (overrideUser = undefined) => {
    const activeUser = overrideUser !== undefined ? overrideUser : await getCurrentUser()
    setUser(activeUser)

    const [catalogList, reviewList, orderList] = await Promise.all([
      listCatalogProducts({ includeInactive: activeUser?.role === 'productor' }),
      listReviews(),
      activeUser ? listOrdersForUser(activeUser) : Promise.resolve([]),
    ])

    setProducts(catalogList)
    setReviews(reviewList)
    setOrders(orderList)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadInitial() {
      const activeUser = await getCurrentUser()
      const [catalogList, reviewList, orderList] = await Promise.all([
        listCatalogProducts({ includeInactive: activeUser?.role === 'productor' }),
        listReviews(),
        activeUser ? listOrdersForUser(activeUser) : Promise.resolve([]),
      ])
      if (cancelled) return
      setUser(activeUser)
      setProducts(catalogList)
      setReviews(reviewList)
      setOrders(orderList)
      setLoading(false)
    }
    loadInitial()
    return () => {
      cancelled = true
    }
  }, [])

  const addToCart = useCallback(
    (product, quantity = 1) => {
      if (!product.active || product.stock <= 0) {
        notify('Este producto no tiene existencias disponibles.', 'error')
        return
      }
      if (user && user.id === product.producerId) {
        notify('No puedes agregar productos de tu propia finca al carrito.', 'error')
        return
      }

      setCart((prev) => {
        const existing = prev.find((item) => item.productId === product.id)
        const nextQty = (existing?.quantity || 0) + quantity
        if (nextQty > product.stock) {
          notify(`Solo hay ${product.stock} unidades disponibles de ${product.name}.`, 'error')
          return prev
        }
        notify(`${product.name} agregado a tu canasta.`)
        if (existing) {
          return prev.map((item) =>
            item.productId === product.id ? { ...item, quantity: nextQty } : item
          )
        }
        return [...prev, { productId: product.id, quantity }]
      })
    },
    [notify, user]
  )

  const updateCartQuantity = useCallback(
    (productId, nextQuantity) => {
      const product = products.find((p) => p.id === productId)
      if (nextQuantity <= 0) {
        setCart((prev) => prev.filter((item) => item.productId !== productId))
        return
      }
      if (product && nextQuantity > product.stock) {
        notify(`Maximo disponible: ${product.stock} ${product.unit}.`, 'error')
        return
      }
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity: nextQuantity } : item
        )
      )
    },
    [notify, products]
  )

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const handleLogin = async (credentials) => {
    const logged = await loginUser(credentials)
    await refreshAll(logged)
    notify(`Bienvenido, ${logged.fullName}.`)
    return logged
  }

  const handleDemoLogin = async (role) => {
    const logged = await loginDemoRole(role)
    await refreshAll(logged)
    notify(`Sesion demo activa como ${logged.role}.`)
    return logged
  }

  const handleRegister = async (payload) => {
    const created = await registerUser(payload)
    await refreshAll(created)
    notify('Cuenta creada correctamente.')
    return created
  }

  const handleLogout = async () => {
    await logoutUser()
    setCart([])
    await refreshAll(null)
    notify('Sesion cerrada.')
  }

  const handleSaveProduct = async (input, existingId = null) => {
    const saved = await saveProduct(user, input, existingId)
    await refreshAll(user)
    notify(existingId ? 'Producto actualizado.' : 'Producto publicado en el catalogo.')
    return saved
  }

  const handleToggleProduct = async (productId) => {
    await toggleProductActive(user, productId)
    await refreshAll(user)
    notify('Estado del producto actualizado.')
  }

  const handleUpdateStock = async (productId, newStock) => {
    await updateProductStock(user, productId, newStock)
    await refreshAll(user)
    notify('Inventario actualizado.')
  }

  const handleConfirmOrder = async (deliveryNote) => {
    const created = await createTestOrders(user, cart, deliveryNote)
    clearCart()
    setCartOpen(false)
    await refreshAll(user)
    notify(`Pedido de prueba ${created.map((o) => o.orderCode).join(', ')} registrado.`)
    return created
  }

  const handleAdvanceOrder = async (orderId, nextStatus) => {
    await advanceOrderStatus(user, orderId, nextStatus)
    await refreshAll(user)
    notify('Estado del pedido actualizado.')
  }

  const handleSubmitReview = async (payload) => {
    await submitReview(user, payload)
    await refreshAll(user)
    notify('Valoracion guardada correctamente.')
  }

  const handleResetDemo = async () => {
    await resetDemoDatabase()
    setCart([])
    await refreshAll(null)
    notify('Datos de prueba restablecidos al estado inicial.')
  }

  // Enriquecemos el carrito con la informacion vigente del catalogo
  const detailedCart = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId && p.active)
      if (!product) return null
      return {
        ...item,
        product,
        subtotal: product.price * item.quantity,
      }
    })
    .filter(Boolean)

  const cartCount = detailedCart.reduce((acc, item) => acc + item.quantity, 0)
  const cartTotal = detailedCart.reduce((acc, item) => acc + item.subtotal, 0)

  return (
    <AppContext.Provider
      value={{
        user,
        products,
        orders,
        reviews,
        cart: detailedCart,
        cartCount,
        cartTotal,
        cartOpen,
        setCartOpen,
        loading,
        toast,
        dismissToast: () => setToast(null),
        notify,
        refreshAll,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        handleLogin,
        handleDemoLogin,
        handleRegister,
        handleLogout,
        handleSaveProduct,
        handleToggleProduct,
        handleUpdateStock,
        handleConfirmOrder,
        handleAdvanceOrder,
        handleSubmitReview,
        handleResetDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
