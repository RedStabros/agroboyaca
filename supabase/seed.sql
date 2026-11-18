-- Datos semilla de referencia para pruebas academicas en Supabase
-- Nota: los UUID de profiles deben corresponder a usuarios creados en Supabase Auth
-- (ej. productor.demo@agroboyaca.co y consumidor.demo@agroboyaca.co)

-- Ejemplo de insercion una vez creados ambos usuarios en Authentication > Users:
/*
INSERT INTO public.profiles (id, full_name, email, role, farm_name, municipality, city, data_consent_accepted)
VALUES
  ('UUID_PRODUCTOR_DEMO', 'Juan Carlos Mendoza', 'productor.demo@agroboyaca.co', 'productor', 'Finca La Esperanza', 'Chinavita', 'Chinavita', TRUE),
  ('UUID_CONSUMIDOR_DEMO', 'Camila Rojas', 'consumidor.demo@agroboyaca.co', 'consumidor', NULL, 'Bogota D.C.', 'Bogota D.C.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (producer_id, name, category, practice, unit, price, stock, municipality, description, image_url, active)
VALUES
  ('UUID_PRODUCTOR_DEMO', 'Papa Criolla Seleccionada', 'Tuberculos', 'Organico', 'Kg', 4200, 48, 'Chinavita', 'Papa criolla lavada y seleccionada manualmente en finca.', '/images/products/papa-criolla.jpg', TRUE),
  ('UUID_PRODUCTOR_DEMO', 'Cebolla Junca Campesina', 'Hortalizas', 'Transicion agroecologica', 'Atado 500 g', 2600, 35, 'Chinavita', 'Cebolla larga fresca cosechada el dia anterior al envio.', '/images/products/cebolla-junca.jpg', TRUE);
*/
