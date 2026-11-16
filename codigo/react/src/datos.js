/* ===================== DATOS DEL NEGOCIO =====================
   Aquí se edita el contenido (igual que en el app.js anterior).
   Fotos y videos: escribe solo el NOMBRE del archivo; deben estar en la carpeta "imagenes".
   Si el archivo no existe, la página muestra "Foto próximamente". */

export const NEGOCIO = "Negocios con Alejo";
export const TELEFONO = "573015602104";
export const TELEFONO_VISIBLE = "+57 301 5602104";
export const CORREO = "Battcontador@gmail.com";
export const HORARIO = "8:00 a. m. a 10:00 p. m.";
export const LOGO = "mi tio xdxdxd.jpeg";

/* MOTOS INICIALES: se cargan la primera vez. Después las motos se agregan y editan desde el panel de administrador (#/admin).
   estado: "disponible" o "vendido". fotos: con 2 o más aparecen las flechas ‹ ›.
   video: opcional (ej: "discover.mp4", guardado también en la carpeta imagenes). */
export const vehiculos = [
  { nombre: "Discover 125 morada", modelo: "2025", km: "8.300 km", precio: "$6.200.000", color: "Morada",
    descripcion: "Único dueño. Papeles hasta febrero de 2027. Lista para traspaso.",
    fotos: ["discoverMperfil", "discoverMfrontal", "discoverMLado"], video: "", estado: "disponible" },
  { nombre: "Discover 125 negra", modelo: "2024", km: "13.000 km", precio: "$5.400.000", color: "Negra",
    descripcion: "Segundo dueño. Papeles nuevos. Lista para traspaso. Matriculada en Soacha.",
    fotos: ["discoverNperfil", "discoverNfrontal", "discoverNlado"], video: "", estado: "disponible" },
  { nombre: "NS", modelo: "2022", km: "41.000 km", precio: "$8.400.000", color: "Negra",
    descripcion: "Tercer dueño. Papeles nuevos. Impuestos al día. Matriculada en Soacha.",
    fotos: ["NSperfil", "NSfrontal", "NSlado"], video: "", estado: "disponible" },
];

/* Entregas: es un EJEMPLO, reemplazar por entregas reales. */
export const entregas = [
  { titulo: "Entrega de ejemplo", texto: "Aquí va la foto o el video de la entrega a un cliente.", foto: "", video: "" },
];

/* Plantillas de WhatsApp: [saludo, [campos que el cliente completa]] */
export const plantillas = {
  vender: ["Hola, quiero que me ayuden a vender mi moto.", ["Marca y línea", "Año / modelo", "Kilometraje", "Número de dueños", "¿Impuestos al día?", "¿Papeles (SOAT y técnico-mecánica) al día?", "¿Tiene prenda o embargo?", "Ciudad donde está matriculada", "Ubicación de la moto (ciudad y barrio)", "Precio que espero", "(Adjunto fotos)"]],
  prestamo: ["Hola, quiero hacer un préstamo con prenda.", ["Valor que necesito", "Qué dejaría en prenda (artículo o valor)", "Valor aproximado de lo que dejaría", "Ciudad o barrio"]],
  comprar: ["Hola, quiero información de esta moto:", []],
};

export const DATOS_TRAMITE = ["Placa", "Marca y línea", "Ciudad de matrícula"];
const DOCS_NOTARIA = ["Formulario", "Contrato de mandato autenticado en notaría"];
export const tramites = [
  { titulo: "Traspaso", texto: "Cambio de propietario de la moto.",
    documentos: ["Contrato de compraventa", "Contrato de mandato", "Ambos firmados con huellas, autenticados en notaría y con improntas", "Fotocopias de la cédula del comprador y del vendedor"] },
  { titulo: "Duplicado de placas", texto: "Trámite para obtener un duplicado de las placas.",
    documentos: ["Contrato de mandato", "Formulario", "Foto de la tarjeta de propiedad por ambos lados", "Foto de la cédula", "Foto de las improntas"] },
  { titulo: "Cambio de color", texto: "Trámite de cambio de color de la moto.", documentos: DOCS_NOTARIA },
  { titulo: "Levantamiento de prenda", texto: "Trámite para levantar la prenda que tiene la moto.", documentos: DOCS_NOTARIA },
  { titulo: "Inscripción de prenda", texto: "Trámite para inscribir una prenda sobre la moto.", documentos: DOCS_NOTARIA },
];

/* Formas de pago que se muestran en la pantalla "Financiación y pagos" */
export const metodosPago = [
  { titulo: "Financiación", texto: "Opción de crédito para tu moto." },
  { titulo: "Nequi", texto: "Pago desde tu cuenta Nequi." },
  { titulo: "Davivienda", texto: "Pago con Davivienda." },
  { titulo: "Transferencia bancaria", texto: "Pago por transferencia a nuestra cuenta." },
];

export const redes = [
  { texto: "Instagram", detalle: "Negocios con Alejo", url: "https://www.instagram.com/lasmotosdealejo?utm_source=ig_web_button_share_sheet&psln=ZDNlZDc0MzIxNw==" },
  { texto: "TikTok", detalle: "Negocios con Alejo", url: "https://www.tiktok.com/@alejandroparizados" },
  { texto: "WhatsApp", detalle: TELEFONO_VISIBLE, url: `https://wa.me/${TELEFONO}` },
];

/* Pantalla "¿Quiénes somos?". Son textos sugeridos: ajústalos con el cliente. */
export const quienesSomos = {
  intro: [
    "Somos una empresa dedicada a la compraventa de motos y contamos con servicio de financiamientos, trámites y préstamos.",
    "Por ahora nos encuentras a través de redes sociales.",
  ],
  mision: "Acompañar a las personas en la compra, venta y trámite de su moto de forma clara y segura, con información honesta sobre el estado y los papeles de cada vehículo.",
  vision: "Ser un negocio de motos en el que la gente confíe por su buen trato y su cumplimiento, y crecer poco a poco junto a nuestros clientes.",
  objetivo: "Que cada cliente salga con su moto o su trámite resuelto, con los papeles en regla y sin sorpresas.",
  valores: [
    { titulo: "Honestidad", texto: "Contamos el estado real de cada moto y de sus papeles." },
    { titulo: "Transparencia", texto: "Los precios y las condiciones se hablan claros desde el principio." },
    { titulo: "Cumplimiento", texto: "Hacemos lo que acordamos, en el tiempo que acordamos." },
    { titulo: "Cercanía", texto: "Te atendemos por WhatsApp y resolvemos tus dudas sin rodeos." },
  ],
};

/* Qué puede reseñar un cliente. fotoObligatoria: true = no se puede publicar sin al menos una foto. */
export const TIPOS_RESENA = [
  { id: "compra", nombre: "Compra de una moto", fotoObligatoria: true },
  { id: "venta", nombre: "Venta de mi moto", fotoObligatoria: false },
  { id: "tramites", nombre: "Trámites", fotoObligatoria: false },
  { id: "prestamo", nombre: "Préstamo con prenda", fotoObligatoria: false },
  { id: "financiacion", nombre: "Financiación", fotoObligatoria: false },
  { id: "otro", nombre: "Otro", fotoObligatoria: false },
];
export const MAX_FOTOS_RESENA = 3;

/* Clave INICIAL del panel de administrador. El dueño puede cambiarla desde el propio panel.
   SOLO sirve en el modo de prueba local; al publicar se reemplaza por un inicio de sesión real. */
export const CLAVE_ADMIN_LOCAL = "alejo2026";