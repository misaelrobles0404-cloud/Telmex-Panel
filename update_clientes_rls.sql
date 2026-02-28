-- Permitir al nuevo administrador (Marjory) ver, crear, actualizar y eliminar TODOS los clientes
CREATE POLICY "SuperAdmin puede gestionar todos los clientes"
ON public.clientes
FOR ALL
USING (
  auth.jwt() ->> 'email' = 'carrillomarjory7@gmail.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'carrillomarjory7@gmail.com'
);

-- Si deseas eliminar la regla del anterior administrador, puedes correr:
-- DROP POLICY IF EXISTS "Nombre exacto de la política anterior" ON public.clientes;
