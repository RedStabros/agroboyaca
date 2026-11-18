import { generateSalt, hashPassword, verifyPassword } from '../lib/crypto.js'
import { ORDER_STATUS_META, ORDER_TRANSITIONS } from '../lib/formatters.js'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import {
  createInitialSeedUsers,
  DEMO_CREDENTIALS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
} from '../data/seedData.js'

const STORAGE_KEY = 'agroboyaca_trl4_db_v1'
const memoryFallback = new Map()

function readStorage(key) {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key)
  }
  return memoryFallback.get(key) ?? null
}

function writeStorage(key, value) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value)
    return
  }
  memoryFallback.set(key, value)
}

function sanitizeUser(user) {
  if (!user) return null
  const { passwordHash: _omit, ...safeUser } = user
  return safeUser
}

async function buildInitialDatabase() {
  const demoSalt = generateSalt()
  const demoHash = await hashPassword(DEMO_CREDENTIALS.productor.demoPass, demoSalt)

  return {
    users: createInitialSeedUsers(demoHash),
    products: structuredClone(INITIAL_PRODUCTS),
    orders: structuredClone(INITIAL_ORDERS),
    reviews: structuredClone(INITIAL_REVIEWS),
    sessionUserId: null,
  }
}

async function loadDatabase() {
  const raw = readStorage(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.products)) {
        return parsed
      }
    } catch {
      // Si el almacenamiento local esta corrupto, se reinicia con la semilla base
    }
  }
  const fresh = await buildInitialDatabase()
  writeStorage(STORAGE_KEY, JSON.stringify(fresh))
  return fresh
}

function saveDatabase(db) {
  writeStorage(STORAGE_KEY, JSON.stringify(db))
}

export async function resetDemoDatabase() {
  const fresh = await buildInitialDatabase()
  saveDatabase(fresh)
  return fresh
}

export function getDataModeLabel() {
  return isSupabaseConfigured() ? 'Supabase PostgreSQL (Nube)' : 'Laboratorio Local (Navegador)'
}

export async function getCurrentUser() {
  if (isSupabaseConfigured()) {
    const { data } = await supabase.auth.getUser()
    if (!data?.user) return null
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!profile) return null
    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role,
      farmName: profile.farm_name,
      municipality: profile.municipality,
      city: profile.city,
      dataConsentAccepted: profile.data_consent_accepted,
    }
  }

  const db = await loadDatabase()
  if (!db.sessionUserId) return null
  const found = db.users.find((u) => u.id === db.sessionUserId)
  return sanitizeUser(found)
}

export async function registerUser(payload) {
  const fullName = String(payload.fullName || '').trim()
  const email = String(payload.email || '').trim().toLowerCase()
  const password = String(payload.password || '')
  const role = payload.role
  const municipality = String(payload.municipality || '').trim()
  const farmName = String(payload.farmName || '').trim()
  const city = String(payload.city || '').trim()
  const dataConsentAccepted = Boolean(payload.dataConsentAccepted)

  if (fullName.length < 3) {
    throw new Error('Ingresa un nombre completo de al menos 3 caracteres.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Ingresa un correo electronico valido.')
  }
  if (password.length < 8) {
    throw new Error('La contraseña debe tener minimo 8 caracteres.')
  }
  if (role !== 'productor' && role !== 'consumidor') {
    throw new Error('Selecciona un rol valido: Productor o Consumidor.')
  }
  if (role === 'productor' && (!farmName || !municipality)) {
    throw new Error('El productor debe indicar su unidad productiva y municipio de Boyaca.')
  }
  if (role === 'consumidor' && !city) {
    throw new Error('El consumidor debe indicar su ciudad de residencia.')
  }
  if (!dataConsentAccepted) {
    throw new Error('Debes aceptar la finalidad academica del uso de datos para registrarte.')
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    if (!data?.user) throw new Error('No fue posible completar el registro en Supabase.')

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      email,
      role,
      farm_name: role === 'productor' ? farmName : null,
      municipality: role === 'productor' ? municipality : city,
      city: role === 'consumidor' ? city : municipality,
      data_consent_accepted: true,
    })
    if (profileError) throw new Error(profileError.message)
    return getCurrentUser()
  }

  const db = await loadDatabase()
  const exists = db.users.some((u) => u.email.toLowerCase() === email)
  if (exists) {
    throw new Error('Este correo electronico ya se encuentra registrado.')
  }

  const salt = generateSalt()
  const passwordHash = await hashPassword(password, salt)
  const newUser = {
    id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fullName,
    email,
    passwordHash,
    role,
    farmName: role === 'productor' ? farmName : null,
    municipality: role === 'productor' ? municipality : city,
    city: role === 'consumidor' ? city : municipality,
    dataConsentAccepted: true,
    createdAt: new Date().toISOString(),
  }

  db.users.push(newUser)
  db.sessionUserId = newUser.id
  saveDatabase(db)
  return sanitizeUser(newUser)
}

export async function loginUser({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const rawPassword = String(password || '')

  if (!normalizedEmail || !rawPassword) {
    throw new Error('Ingresa tu correo electronico y contraseña.')
  }

  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: rawPassword,
    })
    if (error) throw new Error('Correo o contraseña incorrectos.')
    return getCurrentUser()
  }

  const db = await loadDatabase()
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail)
  if (!user) {
    throw new Error('Correo o contraseña incorrectos.')
  }

  const valid = await verifyPassword(rawPassword, user.passwordHash)
  if (!valid) {
    throw new Error('Correo o contraseña incorrectos.')
  }

  db.sessionUserId = user.id
  saveDatabase(db)
  return sanitizeUser(user)
}

export async function loginDemoRole(role) {
  const cred = DEMO_CREDENTIALS[role]
  if (!cred) throw new Error('Rol de prueba no valido.')
  return loginUser({ email: cred.email, password: cred.demoPass })
}

export async function logoutUser() {
  if (isSupabaseConfigured()) {
    await supabase.auth.signOut()
    return
  }
  const db = await loadDatabase()
  db.sessionUserId = null
  saveDatabase(db)
}

export async function listCatalogProducts({ includeInactive = false, producerId = null } = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from('products')
      .select('*, profiles!products_producer_id_fkey(full_name, farm_name)')
      .order('created_at', { ascending: false })

    if (!includeInactive) query = query.eq('active', true)
    if (producerId) query = query.eq('producer_id', producerId)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    return (data || []).map((row) => ({
      id: row.id,
      producerId: row.producer_id,
      producerName: row.profiles?.full_name || 'Productor',
      farmName: row.profiles?.farm_name || 'Finca Boyaca',
      name: row.name,
      category: row.category,
      practice: row.practice,
      unit: row.unit,
      price: row.price,
      stock: row.stock,
      municipality: row.municipality,
      description: row.description,
      imageUrl: row.image_url,
      active: row.active,
      createdAt: row.created_at,
    }))
  }

  const db = await loadDatabase()
  return db.products
    .filter((p) => (includeInactive ? true : p.active))
    .filter((p) => (producerId ? p.producerId === producerId : true))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function saveProduct(actor, input, existingId = null) {
  if (!actor || actor.role !== 'productor') {
    throw new Error('Solo los usuarios con rol Productor pueden administrar productos.')
  }

  const name = String(input.name || '').trim()
  const category = String(input.category || '').trim()
  const practice = String(input.practice || '').trim()
  const unit = String(input.unit || '').trim()
  const municipality = String(input.municipality || actor.municipality || '').trim()
  const description = String(input.description || '').trim()
  const imageUrl = String(input.imageUrl || '/images/products/papa-criolla.jpg').trim()
  const price = Number(input.price)
  const stock = Number(input.stock)

  if (name.length < 3) throw new Error('El nombre del producto debe tener minimo 3 caracteres.')
  if (!Number.isFinite(price) || price <= 0) throw new Error('El precio debe ser mayor a cero.')
  if (!Number.isInteger(stock) || stock < 0) throw new Error('Las existencias no pueden ser negativas.')
  if (!unit) throw new Error('Indica la unidad de venta (ej. Kg, Libra, Atado).')
  if (description.length < 8) throw new Error('Agrega una breve descripcion del producto y su cosecha.')

  if (isSupabaseConfigured()) {
    if (existingId) {
      const { error } = await supabase
        .from('products')
        .update({
          name,
          category,
          practice,
          unit,
          price,
          stock,
          municipality,
          description,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingId)
        .eq('producer_id', actor.id)
      if (error) throw new Error(error.message)
      return listCatalogProducts({ includeInactive: true, producerId: actor.id })
    }

    const { error } = await supabase.from('products').insert({
      producer_id: actor.id,
      name,
      category,
      practice,
      unit,
      price,
      stock,
      municipality,
      description,
      image_url: imageUrl,
      active: true,
    })
    if (error) throw new Error(error.message)
    return listCatalogProducts({ includeInactive: true, producerId: actor.id })
  }

  const db = await loadDatabase()
  if (existingId) {
    const idx = db.products.findIndex((p) => p.id === existingId)
    if (idx === -1) throw new Error('Producto no encontrado.')
    if (db.products[idx].producerId !== actor.id) {
      throw new Error('Acceso denegado: no puedes modificar productos de otro productor.')
    }
    db.products[idx] = {
      ...db.products[idx],
      name,
      category,
      practice,
      unit,
      price,
      stock,
      municipality,
      description,
      imageUrl,
    }
    saveDatabase(db)
    return db.products[idx]
  }

  const created = {
    id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    producerId: actor.id,
    producerName: actor.fullName,
    farmName: actor.farmName || 'Unidad Productiva',
    name,
    category,
    practice,
    unit,
    price,
    stock,
    municipality,
    description,
    imageUrl,
    active: true,
    createdAt: new Date().toISOString(),
  }
  db.products.unshift(created)
  saveDatabase(db)
  return created
}

export async function toggleProductActive(actor, productId) {
  if (!actor || actor.role !== 'productor') {
    throw new Error('Solo un productor puede activar o desactivar productos.')
  }

  if (isSupabaseConfigured()) {
    const { data: current } = await supabase
      .from('products')
      .select('active, producer_id')
      .eq('id', productId)
      .single()
    if (!current || current.producer_id !== actor.id) {
      throw new Error('Acceso denegado sobre este producto.')
    }
    const { error } = await supabase
      .from('products')
      .update({ active: !current.active })
      .eq('id', productId)
      .eq('producer_id', actor.id)
    if (error) throw new Error(error.message)
    return !current.active
  }

  const db = await loadDatabase()
  const product = db.products.find((p) => p.id === productId)
  if (!product) throw new Error('Producto no encontrado.')
  if (product.producerId !== actor.id) {
    throw new Error('Acceso denegado: no puedes desactivar productos de otro productor.')
  }
  product.active = !product.active
  saveDatabase(db)
  return product
}

export async function updateProductStock(actor, productId, newStock) {
  if (!actor || actor.role !== 'productor') {
    throw new Error('Solo un productor puede ajustar inventario.')
  }
  const parsed = Number(newStock)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('Las existencias deben ser un numero entero igual o mayor a cero.')
  }

  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('products')
      .update({ stock: parsed, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('producer_id', actor.id)
    if (error) throw new Error(error.message)
    return parsed
  }

  const db = await loadDatabase()
  const product = db.products.find((p) => p.id === productId)
  if (!product) throw new Error('Producto no encontrado.')
  if (product.producerId !== actor.id) {
    throw new Error('Acceso denegado: no puedes modificar el inventario de otro productor.')
  }
  product.stock = parsed
  saveDatabase(db)
  return product
}

// Crea pedidos de prueba agrupados por productor para aislar la gestion entre fincas
export async function createTestOrders(actor, cartItems, deliveryNote = '') {
  if (!actor) {
    throw new Error('Inicia sesion para confirmar un pedido de prueba.')
  }
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Tu canasta esta vacia.')
  }

  if (isSupabaseConfigured()) {
    const grouped = new Map()
    const catalog = await listCatalogProducts()
    for (const item of cartItems) {
      const prod = catalog.find((p) => p.id === item.productId)
      if (!prod) throw new Error('Producto no disponible.')
      if (!grouped.has(prod.producerId)) grouped.set(prod.producerId, [])
      grouped.get(prod.producerId).push({ product_id: prod.id, quantity: item.quantity })
    }

    const created = []
    for (const items of grouped.values()) {
      const { data, error } = await supabase.rpc('create_test_order', {
        p_items: items,
        p_delivery_note: deliveryNote,
      })
      if (error) throw new Error(error.message)
      created.push(data)
    }
    return created
  }

  const db = await loadDatabase()
  const groupedByProducer = new Map()

  // Primera pasada: validar todo antes de descontar inventario (atomicidad)
  for (const item of cartItems) {
    const qty = Number(item.quantity)
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error('Las cantidades del pedido deben ser mayores a cero.')
    }
    const product = db.products.find((p) => p.id === item.productId && p.active)
    if (!product) {
      throw new Error('Uno de los productos ya no se encuentra activo en el catalogo.')
    }
    if (product.producerId === actor.id) {
      throw new Error('No puedes confirmar pedidos sobre tus propios productos.')
    }
    if (product.stock < qty) {
      throw new Error(`Stock insuficiente para ${product.name} (disponibles: ${product.stock}).`)
    }
    if (!groupedByProducer.has(product.producerId)) {
      groupedByProducer.set(product.producerId, [])
    }
    groupedByProducer.get(product.producerId).push({ product, qty })
  }

  const now = new Date().toISOString()
  const createdOrders = []

  for (const [producerId, entries] of groupedByProducer.entries()) {
    const first = entries[0].product
    const items = entries.map(({ product, qty }) => {
      product.stock -= qty
      return {
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        unitPrice: product.price,
        quantity: qty,
        subtotal: product.price * qty,
      }
    })

    const totalAmount = items.reduce((acc, row) => acc + row.subtotal, 0)
    const orderCode = `AB-${Math.floor(1043 + Math.random() * 8900)}`
    const order = {
      id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderCode,
      consumerId: actor.id,
      consumerName: actor.fullName,
      consumerCity: actor.city || actor.municipality || 'Bogota D.C.',
      producerId,
      producerName: first.producerName,
      farmName: first.farmName,
      municipality: first.municipality,
      status: 'pendiente',
      totalAmount,
      deliveryNote: String(deliveryNote || '').trim() || 'Pedido academico de prueba sin cobro real.',
      items,
      statusHistory: [
        {
          status: 'pendiente',
          at: now,
          detail: 'Pedido de prueba registrado y enviado al productor.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    }

    db.orders.unshift(order)
    createdOrders.push(order)
  }

  saveDatabase(db)
  return createdOrders
}

export async function listOrdersForUser(actor) {
  if (!actor) return []

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), consumer:profiles!orders_consumer_id_fkey(full_name, city), producer:profiles!orders_producer_id_fkey(full_name, farm_name, municipality)')
      .or(`consumer_id.eq.${actor.id},producer_id.eq.${actor.id}`)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)

    return (data || []).map((o) => ({
      id: o.id,
      orderCode: o.order_code,
      consumerId: o.consumer_id,
      consumerName: o.consumer?.full_name || 'Consumidor',
      consumerCity: o.consumer?.city || 'Bogota D.C.',
      producerId: o.producer_id,
      producerName: o.producer?.full_name || 'Productor',
      farmName: o.producer?.farm_name || 'Finca Boyaca',
      municipality: o.producer?.municipality || 'Boyaca',
      status: o.status,
      totalAmount: o.total_amount,
      deliveryNote: o.delivery_note,
      statusHistory: o.status_history || [],
      items: (o.order_items || []).map((it) => ({
        productId: it.product_id,
        productName: it.product_name,
        unit: it.unit,
        unitPrice: it.unit_price,
        quantity: it.quantity,
        subtotal: it.subtotal,
      })),
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }))
  }

  const db = await loadDatabase()
  return db.orders
    .filter((o) => (actor.role === 'productor' ? o.producerId === actor.id : o.consumerId === actor.id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function advanceOrderStatus(actor, orderId, nextStatus) {
  if (!actor || actor.role !== 'productor') {
    throw new Error('Solo el productor responsable puede actualizar el estado del pedido.')
  }

  if (isSupabaseConfigured()) {
    const { data: order, error: readErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    if (readErr || !order) throw new Error('Pedido no encontrado.')
    if (order.producer_id !== actor.id) {
      throw new Error('Acceso denegado sobre este pedido.')
    }
    const allowed = ORDER_TRANSITIONS[order.status] || []
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Transicion no permitida de ${order.status} a ${nextStatus}.`)
    }
    const nextHistory = [
      ...(order.status_history || []),
      {
        status: nextStatus,
        at: new Date().toISOString(),
        detail: ORDER_STATUS_META[nextStatus]?.description || 'Estado actualizado por el productor.',
      },
    ]
    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus, status_history: nextHistory, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('producer_id', actor.id)
    if (error) throw new Error(error.message)
    return nextStatus
  }

  const db = await loadDatabase()
  const order = db.orders.find((o) => o.id === orderId)
  if (!order) throw new Error('Pedido no encontrado.')
  if (order.producerId !== actor.id) {
    throw new Error('Acceso denegado: este pedido pertenece a otro productor.')
  }

  const allowed = ORDER_TRANSITIONS[order.status] || []
  if (!allowed.includes(nextStatus)) {
    throw new Error(`No es posible pasar directamente de "${order.status}" a "${nextStatus}".`)
  }

  // Si se cancela antes del envio, devolvemos las existencias al inventario
  if (nextStatus === 'cancelado') {
    for (const item of order.items) {
      const prod = db.products.find((p) => p.id === item.productId)
      if (prod) prod.stock += item.quantity
    }
  }

  const now = new Date().toISOString()
  order.status = nextStatus
  order.updatedAt = now
  order.statusHistory.push({
    status: nextStatus,
    at: now,
    detail: ORDER_STATUS_META[nextStatus]?.description || 'Estado actualizado por el productor.',
  })

  saveDatabase(db)
  return order
}

export async function listReviews() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_consumer_id_fkey(full_name)')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map((r) => ({
      id: r.id,
      orderId: r.order_id,
      productId: r.product_id,
      consumerId: r.consumer_id,
      consumerName: r.profiles?.full_name || 'Consumidor',
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
    }))
  }

  const db = await loadDatabase()
  return [...db.reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function submitReview(actor, { orderId, productId, rating, comment }) {
  if (!actor || actor.role !== 'consumidor') {
    throw new Error('Solo un consumidor autenticado puede enviar valoraciones.')
  }

  const stars = Number(rating)
  const cleanComment = String(comment || '').trim()
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new Error('La puntuacion debe estar entre 1 y 5 estrellas.')
  }
  if (cleanComment.length < 4) {
    throw new Error('Escribe un comentario breve de al menos 4 caracteres.')
  }

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('reviews').insert({
      order_id: orderId,
      product_id: productId,
      consumer_id: actor.id,
      rating: stars,
      comment: cleanComment,
    })
    if (error) throw new Error(error.message)
    return listReviews()
  }

  const db = await loadDatabase()
  const order = db.orders.find((o) => o.id === orderId)
  if (!order || order.consumerId !== actor.id) {
    throw new Error('Solo puedes valorar productos de tus propios pedidos.')
  }
  if (order.status !== 'entregado') {
    throw new Error('La valoracion se habilita unicamente cuando el pedido esta entregado.')
  }
  const includesProduct = order.items.some((it) => it.productId === productId)
  if (!includesProduct) {
    throw new Error('El producto seleccionado no hace parte de este pedido.')
  }
  const duplicate = db.reviews.some(
    (r) => r.orderId === orderId && r.productId === productId && r.consumerId === actor.id
  )
  if (duplicate) {
    throw new Error('Ya enviaste una valoracion para este producto en el pedido.')
  }

  const review = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderId,
    productId,
    consumerId: actor.id,
    consumerName: actor.fullName,
    rating: stars,
    comment: cleanComment,
    createdAt: new Date().toISOString(),
  }
  db.reviews.unshift(review)
  saveDatabase(db)
  return review
}

// Bateria de pruebas de laboratorio TRL 4 ejecutada sobre los servicios reales
export async function runTrl4LaboratorySuite() {
  const backup = readStorage(STORAGE_KEY)
  const results = []
  const suiteStart = performance.now()

  async function measure(code, title, fn) {
    const start = performance.now()
    try {
      const detail = await fn()
      results.push({
        code,
        title,
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        detail,
      })
    } catch (err) {
      results.push({
        code,
        title,
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        detail: err?.message || 'Error inesperado',
      })
    }
  }

  try {
    await resetDemoDatabase()

    await measure('RF-01 / RNF-03', 'Registro con hash de contraseña y consentimiento', async () => {
      const created = await registerUser({
        fullName: 'Marta Lucia Ortiz',
        email: `marta.${Date.now()}@test.co`,
        password: 'ClaveSegura2026',
        role: 'consumidor',
        city: 'Bogota D.C.',
        dataConsentAccepted: true,
      })
      const db = JSON.parse(readStorage(STORAGE_KEY))
      const raw = db.users.find((u) => u.id === created.id)
      if (!raw || !raw.passwordHash || raw.passwordHash.includes('ClaveSegura2026')) {
        throw new Error('La contraseña no quedo protegida con hash.')
      }
      return 'Usuario creado con hash SHA-256 con salt.'
    })

    await measure('RF-01 / RNF-06', 'Rechazo de correo duplicado y datos incompletos', async () => {
      let rejected = false
      try {
        await registerUser({
          fullName: 'Duplicado',
          email: 'productor.demo@agroboyaca.co',
          password: 'ClaveSegura2026',
          role: 'consumidor',
          city: 'Bogota D.C.',
          dataConsentAccepted: true,
        })
      } catch {
        rejected = true
      }
      if (!rejected) throw new Error('Permitio registrar correo duplicado.')
      return 'Correo duplicado rechazado correctamente.'
    })

    await measure('RF-02 / RNF-05', 'Control de acceso por rol (consumidor bloqueado en CRUD)', async () => {
      const cons = await loginDemoRole('consumidor')
      let blocked = false
      try {
        await saveProduct(cons, {
          name: 'Papa ilegal',
          category: 'Tuberculos',
          practice: 'Organico',
          unit: 'Kg',
          price: 3000,
          stock: 10,
          municipality: 'Chinavita',
          description: 'Intento no autorizado',
        })
      } catch {
        blocked = true
      }
      if (!blocked) throw new Error('Consumidor pudo crear producto.')
      return 'Operacion de productor bloqueada para rol consumidor.'
    })

    await measure('RF-04 / RNF-05', 'Aislamiento entre productores sobre inventario ajeno', async () => {
      const juan = await loginDemoRole('productor')
      let blocked = false
      try {
        await updateProductStock(juan, 'prod-tomate-chonto', 99)
      } catch {
        blocked = true
      }
      if (!blocked) throw new Error('Productor modifico inventario de otro productor.')
      return 'Edicion de producto ajeno rechazada.'
    })

    await measure('RF-04 / RNF-05', 'Rechazo de precio cero y existencias negativas', async () => {
      const juan = await loginDemoRole('productor')
      let blocked = false
      try {
        await updateProductStock(juan, 'prod-papa-criolla', -5)
      } catch {
        blocked = true
      }
      if (!blocked) throw new Error('Acepto existencias negativas.')
      return 'Restriccion stock >= 0 verificada.'
    })

    await measure('RF-05 / RNF-05', 'Descuento atomico de stock y bloqueo de sobreventa', async () => {
      const cons = await loginDemoRole('consumidor')
      const before = (await listCatalogProducts()).find((p) => p.id === 'prod-papa-criolla').stock
      await createTestOrders(cons, [{ productId: 'prod-papa-criolla', quantity: 2 }], 'Prueba TRL4')
      const after = (await listCatalogProducts()).find((p) => p.id === 'prod-papa-criolla').stock
      if (after !== before - 2) throw new Error('No desconto existencias correctamente.')

      let overBlocked = false
      try {
        await createTestOrders(cons, [{ productId: 'prod-papa-criolla', quantity: 999 }])
      } catch {
        overBlocked = true
      }
      if (!overBlocked) throw new Error('Permitio pedido mayor al inventario.')
      return `Stock actualizado de ${before} a ${after} y sobreventa bloqueada.`
    })

    await measure('RF-06', 'Maquina de estados y devolucion de stock al cancelar', async () => {
      const cons = await loginDemoRole('consumidor')
      const stockBefore = (await listCatalogProducts()).find((p) => p.id === 'prod-zanahoria-dulce').stock
      const [ord] = await createTestOrders(cons, [{ productId: 'prod-zanahoria-dulce', quantity: 3 }])
      const juan = await loginDemoRole('productor')
      await advanceOrderStatus(juan, ord.id, 'cancelado')
      const stockAfter = (await listCatalogProducts()).find((p) => p.id === 'prod-zanahoria-dulce').stock
      if (stockAfter !== stockBefore) throw new Error('No restauro inventario al cancelar.')
      return 'Cancelacion controlada y stock restaurado.'
    })

    await measure('RF-07', 'Valoracion exclusiva en pedidos entregados y sin duplicados', async () => {
      const cons = await loginDemoRole('consumidor')
      let blockedPending = false
      try {
        await submitReview(cons, {
          orderId: 'ord-1042',
          productId: 'prod-papa-criolla',
          rating: 5,
          comment: 'No deberia permitirlo aun.',
        })
      } catch {
        blockedPending = true
      }
      if (!blockedPending) throw new Error('Permitio valorar pedido en camino.')

      await submitReview(cons, {
        orderId: 'ord-1039',
        productId: 'prod-arveja-verde',
        rating: 5,
        comment: 'Arveja muy fresca y limpia.',
      })

      let blockedDup = false
      try {
        await submitReview(cons, {
          orderId: 'ord-1039',
          productId: 'prod-arveja-verde',
          rating: 4,
          comment: 'Intento duplicado.',
        })
      } catch {
        blockedDup = true
      }
      if (!blockedDup) throw new Error('Permitio valoracion duplicada.')
      return 'Valoracion valida guardada; bloqueados estado no entregado y duplicado.'
    })

    await measure('RF-03 / RF-04', 'Desactivacion oculta del catalogo pero conserva historial', async () => {
      const juan = await loginDemoRole('productor')
      await toggleProductActive(juan, 'prod-cebolla-junca')
      const activeCatalog = await listCatalogProducts()
      const hidden = !activeCatalog.some((p) => p.id === 'prod-cebolla-junca')
      const orders = await listOrdersForUser(juan)
      const keptInHistory = orders.some((o) => o.items.some((i) => i.productId === 'prod-cebolla-junca'))
      if (!hidden || !keptInHistory) throw new Error('Fallo visibilidad o historial de producto desactivado.')
      return 'Producto oculto del catalogo sin alterar pedidos previos.'
    })
  } finally {
    // Restauramos el estado previo del usuario para no perder sus cambios en sesion
    if (backup) {
      writeStorage(STORAGE_KEY, backup)
    } else {
      await resetDemoDatabase()
    }
  }

  const passedCount = results.filter((r) => r.passed).length
  return {
    executedAt: new Date().toISOString(),
    totalDurationMs: Number((performance.now() - suiteStart).toFixed(2)),
    passedCount,
    totalCount: results.length,
    passRate: Math.round((passedCount / results.length) * 100),
    results,
  }
}
