-- Permitir al nuevo administrador (Marjory) editar todos los perfiles de la base de datos
CREATE POLICY "SuperAdmin puede actualizar perfiles"
ON public.perfiles
FOR UPDATE
USING (
  auth.jwt() ->> 'email' = 'carrillomarjory7@gmail.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'carrillomarjory7@gmail.com'
);

-- (Opcional) Si quieres que también aplique a insertar o borrar, puedes usar:
-- FOR ALL
