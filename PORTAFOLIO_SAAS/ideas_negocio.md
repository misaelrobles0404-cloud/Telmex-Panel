# Blueprints Técnicos para Aplicaciones SaaS (Guía de Implementación)

Esta guía detalla la estructura de base de datos y funcionalidades clave para que puedas clonar la arquitectura de **INFINITUM** en nuevos modelos de negocio.

---

## 📅 1. MediControl (Citas y Expedientes)
**Nicho:** Dentistas, Psicólogos, Consultorios.

### 🗄️ Base de Datos (Supabase)
*   `pacientes`: id, nombre, telefono, email, fecha_nacimiento, historial_medico (text).
*   `citas`: id, paciente_id, fecha_hora (timestamp), motivo, estado (pendiente, completada, cancelada).
*   `notas_evolucion`: id, paciente_id, doctor_id, contenido, fotos (array de URLs de storage).

### 🚀 Funcionalidad Pro
*   **WhatsApp Reminder:** Al crear la cita, generar un link de WhatsApp con el texto: *"Hola [Nombre], confirmamos tu cita el [Fecha] a las [Hora]. Para cancelar favor de avisar 24hrs antes."*

---

## 💰 2. LoteMaster (Comisiones Inmobiliarias)
**Nicho:** Venta de terrenos/lotes a plazos.

### 🗄️ Base de Datos (Supabase)
*   `lotes`: id, manzana, numero, precio_total, estado (disponible, apartado, vendido).
*   `ventas`: id, lote_id, vendedor_id, cliente_id, precio_final, enganche, mensualidades_total.
*   `comisiones`: id, venta_id, vendedor_id, monto, estado (pendiente, pagada).

### 🚀 Funcionalidad Pro
*   **Pipeline de Venta:** Igual que el de Infinitum pero con estados: `Interesado` -> `Apartado` -> `Enganche Pagado` -> `Contrato Firmado`.

---

## 🍔 3. KitchenStock (Inventarios Gastronómicos)
**Nicho:** Dark Kitchens, Hamburgueserías, Cafeterías.

### 🗄️ Base de Datos (Supabase)
*   `insumos`: id, nombre, unidad (gr, kg, pza), stock_actual, stock_minimo (para alertas).
*   `recetas`: id, nombre_platillo, insumos_json (ej: `{"carne": 150, "pan": 1}`).
*   `pedidos`: id, platillos_list, total, fecha.

### 🚀 Funcionalidad Pro
*   **Auto-Descuento:** Un "Trigger" en la base de datos que, al insertar un `pedido`, busque la receta y reste los gramos/piezas del `stock_actual`.

---

## 🛠️ 4. TaskAudit (Checklist con Evidencia)
**Nicho:** Limpieza de hoteles, Mantenimiento de plantas.

### 🗄️ Base de Datos (Supabase)
*   `rutinas`: id, nombre, descripcion (ej: "Limpieza Habitación Estándar").
*   `tareas`: id, rutina_id, instruccion, requiere_foto (boolean).
*   `auditorias_realizadas`: id, rutina_id, empleado_id, fecha, fotos_evidencia (jsonb), completado (boolean).

### 🚀 Funcionalidad Pro
*   **Modo Offline:** Usar PWA para que el empleado pueda tomar las fotos en zonas sin Wi-Fi y la app las suba automáticamente cuando detecte conexión.

---

## 🚗 5. WashFlow (Control de Turnos)
**Nicho:** Car Wash, Talleres Rápidos.

### 🗄️ Base de Datos (Supabase)
*   `servicios`: id, nombre (Lavar, Encerar, Pulido), precio, tiempo_estimado.
*   `cola_espera`: id, vehiculo_placas, cliente_nombre, estado (espera, proceso, listo, entregado), servicio_id.

### 🚀 Funcionalidad Pro
*   **Pantalla de Cliente:** Una página pública `/status/[placas]` donde el cliente ve desde su celular una barra de progreso: `Esperando` -> `En Jabón` -> `Secado` -> `Listo para Entrega`.

---

## �️ 6. GymPulse (Control de Membrecías)
**Nicho:** Gimnasios, Escuelas de Baile/Box.

### 🗄️ Base de Datos (Supabase)
*   `clientes`: id, nombre, fecha_inicio, plan_id (mensual, anual).
*   `pagos`: id, cliente_id, monto, fecha_pago, proximo_vencimiento (date).
*   `accesos`: id, cliente_id, fecha_hora.

### 🚀 Funcionalidad Pro
*   **Semáforo de Acceso:** Una vista simple para el recepcionista. Al poner el nombre, si `hoy > proximo_vencimiento`, la pantalla se pone ROJA y suena una alerta de "Pago Vencido".

---

## �️ Estructura Técnica Sugerida (Para todas)

1.  **Frontend:** Next.js (App Router).
2.  **Auth:** Supabase Auth (Email/Password).
3.  **Base de Datos:** Supabase (PostgreSQL).
4.  **UI:** Tailwind CSS + Lucide React (Iconos) + Radix UI (Componentes).
5.  **Despliegue:** Vercel.

**Estrategia de Desarrollo:**
Usa el mismo `Sidebar.tsx` y `ClientLayout.tsx` que ya tenemos en Infinitum. Solo cambia el array de `navigation` y los iconos. La lógica de "Realtime" de Supabase es ideal para los Dashboards de Dueño.

*Documento técnico para uso exclusivo del desarrollador - PORTAFOLIO SAAS.*
