-- Esquema relacional para AgroBoyaca (Supabase PostgreSQL)
-- Incluye restricciones de integridad y politicas RLS por rol

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Perfiles de usuario asociados a auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 3),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('productor', 'consumidor')),
  farm_name TEXT,
  municipality TEXT NOT NULL,
  city TEXT,
  data_consent_accepted BOOLEAN NOT NULL DEFAULT FALSE CHECK (data_consent_accepted = TRUE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Catalogo de productos publicados por productores
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 3),
  category TEXT NOT NULL CHECK (category IN ('Tuberculos', 'Hortalizas', 'Frutas', 'Granos y otros')),
  practice TEXT NOT NULL CHECK (practice IN ('Organico', 'Transicion agroecologica')),
  unit TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  municipality TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pedidos de prueba (un pedido por productor para aislar gestion entre fincas)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT NOT NULL UNIQUE,
  consumer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'confirmado', 'en_preparacion', 'enviado', 'entregado', 'cancelado')),
  total_amount INTEGER NOT NULL CHECK (total_amount > 0),
  delivery_note TEXT,
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Detalle de productos de cada pedido (conserva nombre y precio historico)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_price INTEGER NOT NULL CHECK (unit_price > 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal INTEGER NOT NULL CHECK (subtotal > 0)
);

-- Valoraciones permitidas unicamente sobre pedidos propios entregados
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(trim(comment)) >= 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, product_id, consumer_id)
);

-- Habilitacion obligatoria de Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Politicas para profiles
CREATE POLICY "Perfiles visibles para lectura de origen"
  ON public.profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Usuario edita solo su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuario crea su propio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Politicas para products
CREATE POLICY "Catalogo visible para productos activos o del propietario"
  ON public.products FOR SELECT
  USING (active = TRUE OR auth.uid() = producer_id);

CREATE POLICY "Solo productores crean sus productos"
  ON public.products FOR INSERT
  WITH CHECK (
    auth.uid() = producer_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'productor'
    )
  );

CREATE POLICY "Solo el productor propietario actualiza sus productos"
  ON public.products FOR UPDATE
  USING (auth.uid() = producer_id)
  WITH CHECK (auth.uid() = producer_id);

-- Politicas para orders
CREATE POLICY "Consumidor y productor ven solo sus propios pedidos"
  ON public.orders FOR SELECT
  USING (auth.uid() = consumer_id OR auth.uid() = producer_id);

CREATE POLICY "Consumidor crea pedido a su nombre"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = consumer_id);

CREATE POLICY "Solo productor propietario actualiza estado del pedido"
  ON public.orders FOR UPDATE
  USING (auth.uid() = producer_id)
  WITH CHECK (auth.uid() = producer_id);

-- Politicas para order_items
CREATE POLICY "Participantes del pedido consultan sus items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.consumer_id = auth.uid() OR o.producer_id = auth.uid())
    )
  );

-- Politicas para reviews
CREATE POLICY "Valoraciones publicas para consulta en catalogo"
  ON public.reviews FOR SELECT
  USING (TRUE);

CREATE POLICY "Solo consumidor con pedido entregado puede valorar"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = consumer_id
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      WHERE o.id = order_id
        AND o.consumer_id = auth.uid()
        AND o.status = 'entregado'
        AND oi.product_id = product_id
    )
  );

-- Funcion atomica para crear pedido de prueba descontando stock de forma segura
CREATE OR REPLACE FUNCTION public.create_test_order(
  p_items JSONB,
  p_delivery_note TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_item JSONB;
  v_product RECORD;
  v_qty INTEGER;
  v_producer_id UUID;
  v_total INTEGER := 0;
  v_order_id UUID;
  v_order_code TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Debe iniciar sesion para confirmar un pedido';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido no puede estar vacio';
  END IF;

  -- Validar existencias y bloquear filas para evitar sobreventa simultanea
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::INTEGER;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID AND active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Uno de los productos no esta disponible';
    END IF;

    IF v_product.producer_id = v_user_id THEN
      RAISE EXCEPTION 'No puede realizar pedidos sobre sus propios productos';
    END IF;

    IF v_product.stock < v_qty THEN
      RAISE EXCEPTION 'Existencias insuficientes para %', v_product.name;
    END IF;

    IF v_producer_id IS NULL THEN
      v_producer_id := v_product.producer_id;
    ELSIF v_producer_id <> v_product.producer_id THEN
      RAISE EXCEPTION 'Cada pedido de prueba agrupa productos de un mismo productor';
    END IF;

    v_total := v_total + (v_product.price * v_qty);
  END LOOP;

  v_order_code := 'AB-' || floor(1000 + random() * 9000)::TEXT;

  INSERT INTO public.orders (order_code, consumer_id, producer_id, status, total_amount, delivery_note, status_history)
  VALUES (
    v_order_code,
    v_user_id,
    v_producer_id,
    'pendiente',
    v_total,
    COALESCE(p_delivery_note, ''),
    jsonb_build_array(
      jsonb_build_object(
        'status', 'pendiente',
        'at', NOW(),
        'detail', 'Pedido de prueba registrado en plataforma academica.'
      )
    )
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::INTEGER;
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'product_id')::UUID;

    UPDATE public.products
    SET stock = stock - v_qty, updated_at = NOW()
    WHERE id = v_product.id;

    INSERT INTO public.order_items (order_id, product_id, product_name, unit, unit_price, quantity, subtotal)
    VALUES (v_order_id, v_product.id, v_product.name, v_product.unit, v_product.price, v_qty, v_product.price * v_qty);
  END LOOP;

  RETURN jsonb_build_object('order_id', v_order_id, 'order_code', v_order_code, 'total_amount', v_total);
END;
$$;
