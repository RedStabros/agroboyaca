import { beforeEach, describe, expect, it } from 'vitest'
import {
  advanceOrderStatus,
  createTestOrders,
  listCatalogProducts,
  listOrdersForUser,
  loginDemoRole,
  registerUser,
  resetDemoDatabase,
  saveProduct,
  submitReview,
  toggleProductActive,
  updateProductStock,
} from '../services/agroService.js'

describe('Validacion de laboratorio TRL 4 - AgroBoyaca', () => {
  beforeEach(async () => {
    await resetDemoDatabase()
  })

  it('RF-01 y RNF-03: registra usuario con consentimiento y sin exponer clave', async () => {
    const user = await registerUser({
      fullName: 'Carlos Perez',
      email: 'carlos.perez@test.co',
      password: 'Password2026*',
      role: 'consumidor',
      city: 'Bogota D.C.',
      dataConsentAccepted: true,
    })

    expect(user.email).toBe('carlos.perez@test.co')
    expect(user.passwordHash).toBeUndefined()
  })

  it('RF-02 y RNF-05: impide que un consumidor cree o modifique productos', async () => {
    const consumer = await loginDemoRole('consumidor')
    await expect(
      saveProduct(consumer, {
        name: 'Papa ilegal',
        category: 'Tuberculos',
        practice: 'Organico',
        unit: 'Kg',
        price: 3000,
        stock: 10,
        municipality: 'Chinavita',
        description: 'Intento sin permiso de rol.',
      })
    ).rejects.toThrow()
  })

  it('RF-04 y RNF-05: bloquea edicion de productos ajenos y stock negativo', async () => {
    const juan = await loginDemoRole('productor')
    await expect(updateProductStock(juan, 'prod-tomate-chonto', 50)).rejects.toThrow()
    await expect(updateProductStock(juan, 'prod-papa-criolla', -1)).rejects.toThrow()
  })

  it('RF-05: descuenta stock al confirmar pedido de prueba y rechaza sobreventa', async () => {
    const consumer = await loginDemoRole('consumidor')
    const catalogBefore = await listCatalogProducts()
    const papaBefore = catalogBefore.find((p) => p.id === 'prod-papa-criolla')

    const orders = await createTestOrders(
      consumer,
      [{ productId: 'prod-papa-criolla', quantity: 3 }],
      'Pedido de prueba Vitest'
    )
    expect(orders).toHaveLength(1)
    expect(orders[0].totalAmount).toBe(papaBefore.price * 3)

    const catalogAfter = await listCatalogProducts()
    const papaAfter = catalogAfter.find((p) => p.id === 'prod-papa-criolla')
    expect(papaAfter.stock).toBe(papaBefore.stock - 3)

    await expect(
      createTestOrders(consumer, [{ productId: 'prod-papa-criolla', quantity: 500 }])
    ).rejects.toThrow()
  })

  it('RF-06 y RF-07: controla estados, restaura inventario al cancelar y restringe valoraciones', async () => {
    const consumer = await loginDemoRole('consumidor')
    const [order] = await createTestOrders(consumer, [
      { productId: 'prod-zanahoria-dulce', quantity: 2 },
    ])

    await expect(
      submitReview(consumer, {
        orderId: order.id,
        productId: 'prod-zanahoria-dulce',
        rating: 5,
        comment: 'No deberia dejar valorar un pedido pendiente.',
      })
    ).rejects.toThrow()

    const producer = await loginDemoRole('productor')
    await advanceOrderStatus(producer, order.id, 'cancelado')
    const catalog = await listCatalogProducts()
    const zanahoria = catalog.find((p) => p.id === 'prod-zanahoria-dulce')
    expect(zanahoria.stock).toBe(54)

    await submitReview(consumer, {
      orderId: 'ord-1039',
      productId: 'prod-arveja-verde',
      rating: 5,
      comment: 'Producto fresco y en buen estado.',
    })

    await expect(
      submitReview(consumer, {
        orderId: 'ord-1039',
        productId: 'prod-arveja-verde',
        rating: 4,
        comment: 'Intento duplicado.',
      })
    ).rejects.toThrow()
  })

  it('RF-03 y RF-04: ocultar producto desactivado del catalogo conserva pedidos historicos', async () => {
    const producer = await loginDemoRole('productor')
    await toggleProductActive(producer, 'prod-cebolla-junca')

    const catalog = await listCatalogProducts()
    expect(catalog.some((p) => p.id === 'prod-cebolla-junca')).toBe(false)

    const orders = await listOrdersForUser(producer)
    const kept = orders.some((o) => o.items.some((i) => i.productId === 'prod-cebolla-junca'))
    expect(kept).toBe(true)
  })
})
