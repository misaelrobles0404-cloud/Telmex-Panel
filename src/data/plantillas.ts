import { PlantillaWhatsApp } from '@/types';

// ============================================
// PLANTILLAS DE WHATSAPP
// ============================================

export const PLANTILLAS_WHATSAPP: PlantillaWhatsApp[] = [
    // PROSPECCIÓN
    {
        id: 'bienvenida-cobertura',
        nombre: 'Bienvenida y Solicitud de Cobertura',
        categoria: 'prospeccion',
        contenido: `¡Hola! 👋 Gracias por contactar a TELMEX.

Para poder decirte exactamente qué promociones y qué velocidad de Fibra Óptica llegan a tu casa, ¿me podrías proporcionar estos dos datos?

📍 **Código Postal:** 
🏠 **Calle y Número:**

En cuanto me los pases, verifico tu cobertura en el sistema y te doy respuesta inmediata. 😊`,
        variables: []
    },
    {
        id: 'prosp-inicial',
        nombre: 'Mensaje Inicial de Prospección',
        categoria: 'prospeccion',
        contenido: `¡Hola {nombre}! 👋

Soy {tu_nombre} de TELMEX. Vi que podrías estar interesado en mejorar tu servicio de internet.

Actualmente tenemos promociones increíbles con velocidades desde 80 Mbps hasta 1 Giga, ¡con Netflix incluido! 🚀

¿Te gustaría conocer más detalles?`,
        variables: ['nombre', 'tu_nombre']
    },
    {
        id: 'prosp-portabilidad',
        nombre: 'Prospección - Portabilidad',
        categoria: 'prospeccion',
        tipoServicio: 'portabilidad',
        contenido: `Hola {nombre}! 😊

¿Sabías que puedes cambiar tu internet de {proveedor} a TELMEX y mantener tu número de teléfono fijo?

Con TELMEX obtienes:
✅ Velocidades más rápidas
✅ Netflix incluido
✅ Mejor precio: desde {precioPromo}
✅ Sin cambiar tu número

¿Te interesa una cotización personalizada?`,
        variables: ['nombre', 'proveedor', 'precioPromo']
    },
    {
        id: 'prosp-linea-nueva',
        nombre: 'Prospección - Línea Nueva',
        categoria: 'prospeccion',
        tipoServicio: 'linea_nueva',
        contenido: `¡Hola {nombre}! 🌟

¿Buscas internet rápido y confiable para tu hogar?

TELMEX tiene la solución perfecta:
🚀 {velocidad} Mbps
📺 Netflix incluido
💰 Solo {precio}/mes
📞 Llamadas ilimitadas

¡Contrata hoy y disfruta de la mejor conexión!`,
        variables: ['nombre', 'velocidad', 'precio']
    },

    // SEGUIMIENTO
    {
        id: 'seg-recordatorio',
        nombre: 'Seguimiento - Recordatorio',
        categoria: 'seguimiento',
        contenido: `Hola {nombre}! 👋

Te escribo para dar seguimiento a la información que te compartí sobre TELMEX.

¿Tuviste oportunidad de revisarla? ¿Tienes alguna duda que pueda resolver?

Estoy aquí para ayudarte 😊`,
        variables: ['nombre']
    },
    {
        id: 'seg-respuesta-dudas',
        nombre: 'Seguimiento - Respuesta a Dudas',
        categoria: 'seguimiento',
        contenido: `¡Claro {nombre}! Con gusto te aclaro:

{respuesta_personalizada}

¿Hay algo más que quieras saber? Estoy para ayudarte 😊`,
        variables: ['nombre', 'respuesta_personalizada']
    },

    // COTIZACIÓN
    {
        id: 'cot-personalizada',
        nombre: 'Cotización Personalizada',
        categoria: 'cotizacion',
        contenido: `¡Hola {nombre}! 📊

Aquí está tu cotización personalizada de TELMEX:

📦 Paquete: {velocidad} Mbps
💰 Precio promocional: {precioPromo}/mes
📺 Incluye: Netflix + Claro Video + Antivirus
📞 Llamadas ilimitadas

🎁 AHORRO vs {proveedor}: {ahorro}/mes

¿Listo para hacer el cambio?`,
        variables: ['nombre', 'velocidad', 'precioPromo', 'proveedor', 'ahorro']
    },
    {
        id: 'cot-comparativa',
        nombre: 'Cotización con Comparativa',
        categoria: 'cotizacion',
        contenido: `{nombre}, mira esta comparación:

{proveedor} actual:
❌ {velocidad_actual} Mbps
❌ {precio_actual}/mes
❌ Sin Netflix

TELMEX:
✅ {velocidad_telmex} Mbps
✅ {precio_telmex}/mes
✅ Netflix + Claro Video incluidos

💰 TE AHORRAS: {ahorro}/mes
📈 MÁS VELOCIDAD: +{diferencia_velocidad} Mbps

¿Hacemos el cambio?`,
        variables: ['nombre', 'proveedor', 'velocidad_actual', 'precio_actual', 'velocidad_telmex', 'precio_telmex', 'ahorro', 'diferencia_velocidad']
    },

    // CIERRE
    {
        id: 'cierre-requisitos',
        nombre: 'Cierre - Solicitar Requisitos',
        categoria: 'cierre',
        contenido: `¡Excelente {nombre}! 🎉

Para proceder con tu contratación necesito los siguientes documentos:

{requisitos}

¿Cuándo podrías enviarme esta información?`,
        variables: ['nombre', 'requisitos']
    },
    {
        id: 'cierre-linea-nueva',
        nombre: 'Cierre - Requisitos Línea Nueva',
        categoria: 'cierre',
        tipoServicio: 'linea_nueva',
        contenido: `¡Perfecto {nombre}! 🎉

Para tu línea nueva de TELMEX necesito:

📄 Identificación Oficial (INE, CURP, Pasaporte)
🏠 Comprobante de domicilio (Luz, Agua, Gas o Teléfono)
📧 Correo electrónico
📞 Número de celular
👤 2 Números de referencia (adicionales)

¿Me ayudas con estos datos?`,
        variables: ['nombre']
    },
    {
        id: 'cierre-portabilidad',
        nombre: 'Cierre - Requisitos Portabilidad',
        categoria: 'cierre',
        tipoServicio: 'portabilidad',
        contenido: `¡Genial {nombre}! 🎉

Para tu portabilidad de {proveedor} a TELMEX necesito:

📄 Identificación Oficial (INE, CURP, Pasaporte)
🏠 Comprobante de domicilio
📞 Número a portar (fijo de la competencia)
🔑 NIP de portabilidad (marca 051 desde tu teléfono)
📅 Fecha de vigencia del NIP
📋 Formato de portabilidad (llenado por el promotor)
📝 Carta de baja (opcional)

¿Cuándo podemos agendar la instalación?`,
        variables: ['nombre', 'proveedor']
    },

    // POSTVENTA
    {
        id: 'post-bienvenida',
        nombre: 'Postventa - Bienvenida',
        categoria: 'postventa',
        contenido: `¡Bienvenido a TELMEX, {nombre}! 🎉

Gracias por confiar en nosotros. Tu servicio ya está activo.

Si tienes cualquier duda o necesitas ayuda, no dudes en contactarme.

¡Disfruta tu nueva conexión! 🚀`,
        variables: ['nombre']
    },
    {
        id: 'post-seguimiento',
        nombre: 'Postventa - Seguimiento',
        categoria: 'postventa',
        contenido: `Hola {nombre}! 😊

¿Cómo va todo con tu servicio de TELMEX?

¿La velocidad es la esperada? ¿Algún problema o duda?

Estoy aquí para ayudarte en lo que necesites.`,
        variables: ['nombre']
    },
    {
        id: 'post-referidos',
        nombre: 'Postventa - Solicitar Referidos',
        categoria: 'postventa',
        contenido: `¡Hola {nombre}! 🌟

Espero que estés disfrutando tu nuevo internet TELMEX.

Quería pedirte un pequeño favor:
¿Conoces a algún amigo, vecino o familiar que esté batallando con su internet? 🤔

Si me pasas su contacto y contrata, ¡te lo agradeceré muchísimo! Mi trabajo depende de recomendaciones de clientes felices como tú. 🙏

¡Gracias por tu apoyo!`,
        variables: ['nombre']
    }
];

// ============================================
// FUNCIÓN PARA REEMPLAZAR VARIABLES
// ============================================

export function reemplazarVariables(
    plantilla: string,
    variables: Record<string, string>
): string {
    let resultado = plantilla;

    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g');
        resultado = resultado.replace(regex, value);
    });

    return resultado;
}

// ============================================
// FUNCIÓN PARA OBTENER PLANTILLAS POR CATEGORÍA
// ============================================

export function obtenerPlantillasPorCategoria(
    categoria: PlantillaWhatsApp['categoria']
): PlantillaWhatsApp[] {
    return PLANTILLAS_WHATSAPP.filter(p => p.categoria === categoria);
}

// ============================================
// FUNCIÓN PARA OBTENER PLANTILLAS POR TIPO DE SERVICIO
// ============================================

export function obtenerPlantillasPorTipoServicio(
    tipoServicio: 'linea_nueva' | 'portabilidad' | 'winback'
): PlantillaWhatsApp[] {
    return PLANTILLAS_WHATSAPP.filter(
        p => !p.tipoServicio || p.tipoServicio === tipoServicio
    );
}
