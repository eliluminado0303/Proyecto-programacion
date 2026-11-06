/* ===================== 1. DATOS =====================
   Aquí se edita el contenido. Cada elemento es un bloque { ... } dentro de una lista [ ... ].
   Para AGREGAR: copia un bloque, sepáralo con coma y cambia los datos. Para QUITAR: borra el bloque.
   Fotos y videos: escribe solo el NOMBRE del archivo (ej: "ns.jpg"); el código le agrega la carpeta.
   Si el archivo todavía no existe en la carpeta, la página muestra "Foto próximamente". */

/* Las rutas se cuentan desde donde está el HTML (codigo/javascript/), NO desde donde está app.js:
   subimos dos niveles (../../) hasta la carpeta principal del proyecto. */
const RUTA_IMG = "../../imagenes/";
const RUTA_VIDEOS = "../../videos/";

const NEGOCIO = "Negocios con Alejo";
const TELEFONO = "573015602104";
const CORREO = "Battcontador@gmail.com";
const HORARIO = "8:00 a. m. a 10:00 p. m.";

/* Catálogo de motos. estado: "disponible" o "vendido".
   fotos: lista con los nombres de las fotos (carpeta imagenes). Con 2 o más aparecen las flechas ‹ ›.
          Puedes escribirlas con o sin extensión (.jpg, .jpeg, .jfif, .png, .webp); el código prueba cuál es.
   video: opcional, nombre del archivo en la carpeta videos (ej: "discover.mp4"). Se agrega como última diapositiva. */
const vehiculos = [
  { nombre: "Discover 125 morada", modelo: "2025", km: "8.300 km", precio: "$6.200.000",color: "Morada",
    descripcion: "Único dueño. Papeles hasta febrero de 2027. Lista para traspaso.",
    fotos: ["discoverMperfil", "discoverMfrontal", "discoverMLado"], video: "", estado: "disponible" },
  { nombre: "Discover 125 negra", modelo: "2024", km: "13.000 km", precio: "$5.400.000",color: "Negra",
    descripcion: "Segundo dueño. Papeles nuevos. Lista para traspaso. Matriculada en Soacha.",
    fotos: ["discoverNperfil", "discoverNfrontal", "discoverNlado"], video: "", estado: "disponible" },
  { nombre: "NS", modelo: "2022", km: "41.000 km", precio: "$8.400.000",color: "Negra",
    descripcion: "Tercer dueño. Papeles nuevos. Impuestos al día. Matriculada en Soacha.",
    fotos: ["NSperfil", "NSfrontal", "NSlado"], video: "", estado: "disponible" }
];

/* Remate temporal de inventario (audífonos, parlantes, joyería en plata, tenis).
   Cada artículo tiene su espacio de foto: pon la imagen en la carpeta imagenes con el nombre de "foto".
   Mientras el archivo no exista se muestra "Foto próximamente".
   porLlegar: true = artículo de ejemplo (muestra el aviso "Inventario por llegar"). Bórralo cuando el artículo sea real.
   Para AGREGAR un artículo: copia un bloque, pon una coma y cambia los datos. Para QUITARLO: borra el bloque. */
const remate = [
  { nombre: "Audífonos", precio: "Por definir", descripcion: "Foto y detalles por llegar.", foto: "remate-audifonos.jpg", porLlegar: true },
  { nombre: "Parlantes", precio: "Por definir", descripcion: "Foto y detalles por llegar.", foto: "remate-parlantes.jpg", porLlegar: true },
  { nombre: "Joyería en plata", precio: "Por definir", descripcion: "Foto y detalles por llegar.", foto: "remate-joyeria.jpg", porLlegar: true },
  { nombre: "Tenis", precio: "Por definir", descripcion: "Foto y detalles por llegar.", foto: "remate-tenis.jpg", porLlegar: true }
];

/* Entregas: videos o fotos de motos entregadas. Reseñas: opiniones de clientes (EJEMPLOS: reemplazar por reales). */
const entregas = [
  { titulo: "Entrega de ejemplo", texto: "Aquí va la foto o el video de la entrega a un cliente.", foto: "", video: "" }
];
const resenas = [
  { nombre: "Cliente de ejemplo", texto: "Reseña de ejemplo: buena atención y todo claro desde el principio." },
  { nombre: "Otro cliente", texto: "Reseña de ejemplo: la moto estaba tal como la mostraron." }
];

/* Plantillas: el cliente recibe estos campos en WhatsApp y solo los completa. */
const plantillas = {
  vender: ["Hola, quiero que me ayuden a vender mi moto.", ["Marca y línea", "Año / modelo", "Kilometraje", "Número de dueños", "¿Impuestos al día?", "¿Papeles (SOAT y técnico-mecánica) al día?", "¿Tiene prenda o embargo?", "Ciudad donde está matriculada", "Ubicación de la moto (ciudad y barrio)", "Precio que espero", "(Adjunto fotos)"]],
  prestamo: ["Hola, quiero hacer un préstamo con prenda.", ["Valor que necesito", "Qué dejaría en prenda (artículo o valor)", "Valor aproximado de lo que dejaría", "Ciudad o barrio"]],
  inventario: ["Hola, quiero información del remate de inventario.", ["Qué artículo busco (audífonos, parlantes, joyería en plata, tenis)"]],
  resena: ["Hola, quiero dejar una reseña.", ["Mi nombre", "Servicio o moto", "Mi opinión"]],
  comprar: ["Hola, quiero información de esta moto:", []]
};

/* Trámites. "documentos" = lo que debe tener el cliente. Los datos de abajo se piden en el mensaje de WhatsApp. */
const DATOS_TRAMITE = ["Placa", "Marca y línea", "Ciudad de matrícula"];
const DOCS_NOTARIA = ["Formulario", "Contrato de mandato autenticado en notaría"];
const tramites = [
  { titulo: "Traspaso", texto: "Cambio de propietario de la moto.",
    documentos: ["Contrato de compraventa", "Contrato de mandato", "Ambos firmados con huellas, autenticados en notaría y con improntas", "Fotocopias de la cédula del comprador y del vendedor"] },
  { titulo: "Duplicado de placas", texto: "Trámite para obtener un duplicado de las placas.",
    documentos: ["Contrato de mandato", "Formulario", "Foto de la tarjeta de propiedad por ambos lados", "Foto de la cédula", "Foto de las improntas"] },
  { titulo: "Cambio de color", texto: "Trámite de cambio de color de la moto.", documentos: DOCS_NOTARIA },
  { titulo: "Levantamiento de prenda", texto: "Trámite para levantar la prenda que tiene la moto.", documentos: DOCS_NOTARIA },
  { titulo: "Inscripción de prenda", texto: "Trámite para inscribir una prenda sobre la moto.", documentos: DOCS_NOTARIA }
];

const otrosServicios = [
  { titulo: "Financiación", texto: "Opción de crédito para tu moto." },
  { titulo: "Métodos de pago", texto: "Efectivo y transferencia." }
];

/* Redes: cambia el "#" por el link real cuando lo tengas. */
const redes = [
  { texto: "Instagram: Negocios con Alejo", url: "https://www.instagram.com/lasmotosdealejo?utm_source=ig_web_button_share_sheet&psln=ZDNlZDc0MzIxNw==" },
  { texto: "TikTok: Negocios con Alejo", url: "https://www.tiktok.com/@alejandroparizados" },
  { texto: "WhatsApp: +57 301 5602104", url: `https://wa.me/${TELEFONO}` }
];

/* ===================== 2. FUNCIONES AYUDANTES ===================== */
function el(etiqueta, propiedades = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [nombre, valor] of Object.entries(propiedades)) {
    if (nombre === "class") nodo.className = valor;
    else if (nombre === "text") nodo.textContent = valor;
    else nodo.setAttribute(nombre, valor);
  }
  hijos.flat().forEach(hijo => nodo.append(hijo));
  return nodo;
}

function linkWhatsApp(mensaje) {
  return `https://wa.me/${TELEFONO}?text=${encodeURIComponent(mensaje)}`;
}

// Arma el mensaje: una línea de saludo y un campo por línea ("Año: ").
function mensajeDe(saludo, campos) {
  return [saludo, ...campos.map(c => c + ": ")].join("\n");
}

const botonWA = (texto, mensaje, extra = "") => el("a", { class: ("boton " + extra).trim(), href: linkWhatsApp(mensaje), text: texto });
const seccion = (id, titulo, ...hijos) => el("section", { id }, el("h2", { text: titulo }), ...hijos);

// Extensiones que se prueban cuando el nombre de la foto no trae ninguna.
const EXTENSIONES = [".jpg", ".jpeg", ".jfif", ".png", ".webp"];

// Imagen de la carpeta imagenes. Si no hay nombre, o el archivo no existe, muestra el cuadro "Foto próximamente".
function crearImagen(archivo, alt) {
  const marcador = () => el("div", { class: "sin-video", text: "Foto próximamente" });
  if (!archivo) return marcador();

  // Si el nombre ya trae extensión se usa tal cual; si no, se prueba con cada extensión de la lista.
  const intentos = /\.\w+$/.test(archivo) ? [archivo] : EXTENSIONES.map(ext => archivo + ext);
  let n = 0;
  const img = el("img", { src: RUTA_IMG + intentos[0], alt });
  img.addEventListener("error", () => {         // "error" = el navegador no encontró el archivo
    n++;
    if (n < intentos.length) img.setAttribute("src", RUTA_IMG + intentos[n]);   // prueba la siguiente extensión
    else img.replaceWith(marcador());                                           // ya no quedan: muestra el marcador
  });
  return img;
}

function crearVideo(archivo) {
  return el("video", { controls: "", preload: "metadata" },
    el("source", { src: RUTA_VIDEOS + archivo, type: "video/mp4" }), "Tu navegador no puede reproducir este video.");
}

// Multimedia de una tarjeta: sus fotos (item.fotos, o item.foto si es una sola) y su video, si lo tiene.
// Una sola cosa se muestra tal cual; con 2 o más se arma un carrusel con flechas.
function crearMedia(item) {
  const fotos = item.fotos || (item.foto ? [item.foto] : []);
  const nombre = item.nombre || item.titulo;
  const contenidos = fotos.map(f => crearImagen(f, nombre));
  if (item.video) contenidos.push(crearVideo(item.video));   // el video va al final; para que vaya primero usa unshift
  if (contenidos.length === 0) return crearImagen("", nombre);
  if (contenidos.length === 1) return contenidos[0];

  let actual = 0;
  const slides = contenidos.map(c => el("figure", { class: "slide" }, c));
  const contador = el("span", { class: "contador" });
  const mostrar = n => {
    actual = (n + slides.length) % slides.length;           // el % hace que después de la última vuelva a la primera
    slides.forEach((sl, k) => {
      sl.classList.toggle("activa", k === actual);          // solo la diapositiva actual lleva la clase "activa"
      const v = sl.querySelector("video");
      if (v && k !== actual) v.pause();                     // si te vas de un video, se pausa
    });
    contador.textContent = `${actual + 1} / ${slides.length}`;
  };
  const ant = el("button", { type: "button", "aria-label": "Anterior", text: "‹" });
  const sig = el("button", { type: "button", "aria-label": "Siguiente", text: "›" });
  ant.addEventListener("click", () => mostrar(actual - 1));
  sig.addEventListener("click", () => mostrar(actual + 1));
  mostrar(0);
  return el("div", { class: "carrusel" }, slides, el("div", { class: "carrusel-controles" }, ant, contador, sig));
}

/* ===================== 3. PIEZAS DE LA PÁGINA ===================== */
function crearCabecera() {
  const enlace = (texto, url) => el("a", { href: url, text: texto });
  const menu = el("nav", { class: "menu", id: "menu", "aria-label": "Menú principal" },
    enlace("Inicio", "#/inicio"),
    el("details", {}, el("summary", { text: "Catálogo" }),
      enlace("Motos", "#/motos"), enlace("Vendidos y reseñas", "#/confianza"), enlace("Vende tu moto", "#/vender")),
    el("details", {}, el("summary", { text: "Servicios y negocios" }),
      enlace("Trámites", "#/tramites"), enlace("Préstamos con prenda", "#/prestamos"),
      enlace("Remate de inventario", "#/remate"), enlace("Financiación y pagos", "#/otros")),
    enlace("¿Quiénes somos?", "#/quienes"),
    enlace("Contacto y redes", "#/contacto")
  );

  const boton = el("button", { class: "hamburguesa", type: "button", "aria-label": "Abrir menú", "aria-expanded": "false", "aria-controls": "menu" },
    el("span"), el("span"), el("span"));
  const alternar = abrir => {
    menu.classList.toggle("abierto", abrir);
    boton.setAttribute("aria-expanded", String(abrir));
  };
  boton.addEventListener("click", () => alternar(!menu.classList.contains("abierto")));
  menu.addEventListener("click", e => {
    if (!e.target.closest("a")) return;
    alternar(false);                                                        // se cierra el menú
    menu.querySelectorAll("details").forEach(d => { d.open = false; });     // y los desplegables
  });

  return el("header", { class: "cabecera", id: "inicio" },
    boton,
    el("img", { class: "logo", src: RUTA_IMG + "mi tio xdxdxd.jpeg", alt: "Logo de " + NEGOCIO, width: "200", height: "200" }),
    el("h1", { class: "placa", text: NEGOCIO }),
    el("p", { class: "lema", text: "Somos unos locos tratando de comernos al mundo" }),
    menu
  );
}

function crearInicio() {
  const enlace = (texto, url, extra = "") => el("a", { class: ("boton " + extra).trim(), href: url, text: texto });
  return seccion("bienvenida", "Bienvenido",
    el("p", { text: "Te ayudamos con la compraventa de motos, financiación, trámites y préstamos con prenda." }),
    el("div", { class: "accesos" },
      enlace("Ver motos", "#/motos"), enlace("Trámites", "#/tramites", "claro"),
      enlace("Préstamos con prenda", "#/prestamos", "claro"), enlace("Remate de inventario", "#/remate", "claro"),
      botonWA("Quiero vender mi moto", mensajeDe(...plantillas.vender), "claro")
    )
  );
}

function crearTarjetaVehiculo(v) {
  const dato = (titulo, valor) => el("li", {}, el("strong", { text: titulo + ":" }), " " + valor);
  const tarjeta = el("article", { class: "tarjeta" },
    crearMedia(v),
    el("span", { class: "estado " + v.estado, text: v.estado === "vendido" ? "Vendido" : "Disponible" }),
    el("h3", { text: v.nombre }),
    el("ul", { class: "datos" }, dato("Modelo", v.modelo), dato("Kilometraje", v.km), dato("Precio", v.precio), dato("color", v.color)),
    el("p", { text: v.descripcion })
  );
  // Solo las disponibles tienen botón. El mensaje lleva el nombre de la moto.
  if (v.estado !== "vendido") tarjeta.append(botonWA("Preguntar por WhatsApp", `${plantillas.comprar[0]} ${v.nombre}`));
  return tarjeta;
}

function crearMotos() {
  // Disponibles primero, vendidas al final.
  const lista = [...vehiculos].sort((a, b) => (a.estado === "vendido") - (b.estado === "vendido"));
  return seccion("motos", "Motos",
    lista.length ? el("div", { class: "tarjetas" }, lista.map(crearTarjetaVehiculo)) : el("p", { text: "Por ahora no hay motos disponibles." })
  );
}

function crearConfianza() {
  const vendidos = vehiculos.filter(v => v.estado === "vendido");
  const tarjetasEntregas = [
    ...entregas.map(e => el("article", { class: "tarjeta" }, crearMedia(e), el("h3", { text: e.titulo }), el("p", { text: e.texto }))),
    ...vendidos.map(v => el("article", { class: "tarjeta" }, el("span", { class: "estado vendido", text: "Vendido" }), el("h3", { text: v.nombre }), el("p", { class: "nota", text: v.modelo + " · " + v.precio })))
  ];
  const tarjetasResenas = resenas.map(r => el("article", { class: "tarjeta" }, el("p", { class: "resena", text: "“" + r.texto + "”" }), el("strong", { text: r.nombre })));

  // Si una lista está vacía se muestra un aviso en vez de un hueco.
  const bloque = (tarjetas, aviso) => tarjetas.length ? el("div", { class: "tarjetas" }, tarjetas) : el("p", { class: "pendiente", text: aviso });

  return seccion("confianza", "Vendidos y reseñas",
    el("h3", { text: "Entregas a clientes" }),
    bloque(tarjetasEntregas, "Pronto compartiremos entregas a nuestros clientes."),
    el("h3", { text: "Lo que dicen nuestros clientes" }),
    bloque(tarjetasResenas, "Pronto compartiremos opiniones de nuestros clientes."),
    el("p", { class: "nota", text: "¿Ya fuiste cliente? Cuéntanos cómo te fue." }),
    botonWA("Dejar una reseña", mensajeDe(...plantillas.resena))
  );
}

function crearVender() {
  return seccion("vender", "Vende tu moto",
    el("p", { text: "¿Quieres vender tu moto? Te ayudamos como intermediarios: la ofrecemos, atendemos a los compradores y nos encargamos de la negociación." }),
    el("p", { text: "Los detalles de la comisión se acuerdan contigo por WhatsApp." }),
    el("p", { text: "Toca el botón: se abre WhatsApp con los datos que necesitamos (año y modelo, línea, impuestos, número de dueños, ubicación y matrícula). Solo completa cada línea y envía." }),
    el("p", { class: "pendiente", text: "Indícanos dónde está la moto y dónde está matriculada, para confirmar que podemos atenderla." }),
    botonWA("Quiero vender mi moto", mensajeDe(...plantillas.vender))
  );
}

function crearTramites() {
  return seccion("tramites", "Trámites",
    el("p", { text: "Te ayudamos con estos trámites. Toca el botón del que necesitas y se abre WhatsApp con los datos que te pediremos." }),
    el("div", { class: "tarjetas" }, tramites.map(t =>
      el("article", { class: "tarjeta" },
        el("h3", { text: t.titulo }),
        el("p", { text: t.texto }),
        el("p", { class: "nota", text: "Documentos que necesitas:" }),
        el("ul", { class: "documentos" }, t.documentos.map(d => el("li", { text: d }))),
        botonWA("Consultar " + t.titulo, mensajeDe(`Hola, necesito ayuda con: ${t.titulo}.`, DATOS_TRAMITE))
      )))
  );
}

function crearPrestamos() {
  return seccion("prestamos", "Préstamos con prenda",
    el("p", { text: "Dejas en prenda un valor o artículos que valgan más de lo que te prestamos." }),
    el("p", { text: "Escríbenos con los datos del mensaje y te contamos las condiciones." }),
    botonWA("Pedir un préstamo con prenda", mensajeDe(...plantillas.prestamo))
  );
}

function crearRemate() {
  const tarjetas = remate.map(p => el("article", { class: "tarjeta" },
    crearImagen(p.foto, p.nombre),
    el("h3", { text: p.nombre }),
    el("ul", { class: "datos" }, el("li", {}, el("strong", { text: "Precio:" }), " " + p.precio)),
    el("p", { text: p.descripcion })
  ));
  return seccion("remate", "Remate de inventario",
    el("p", { text: "Remate temporal: audífonos, parlantes, joyería en plata y tenis." }),
    remate.some(p => p.porLlegar) ? el("p", { class: "pendiente", text: "Inventario por llegar: las fotos y los precios se irán actualizando." }) : [],
    tarjetas.length ? el("div", { class: "tarjetas" }, tarjetas)
                    : el("p", { class: "pendiente", text: "El inventario está por llegar. Escríbenos y te avisamos cuando esté disponible." }),
    botonWA("Preguntar por el inventario", mensajeDe(...plantillas.inventario))
  );
}

function crearOtros() {
  return seccion("otros", "Financiación y pagos",
    el("div", { class: "tarjetas" }, otrosServicios.map(s => el("article", { class: "tarjeta" }, el("h3", { text: s.titulo }), el("p", { text: s.texto }))))
  );
}

function crearContacto() {
  const linea = (titulo, contenido) => el("p", {}, el("strong", { text: titulo + ":" }), " ", contenido);
  return seccion("contacto", "Contacto y redes",
    linea("Teléfono / WhatsApp", "+57 301 5602104"),
    linea("Correo", el("a", { href: "mailto:" + CORREO, text: CORREO })),
    linea("Horario de atención", HORARIO),
    el("p", {}, el("strong", { text: "Nuestras redes:" })),
    el("ul", { class: "redes" }, redes.map(r => el("li", {}, el("a", { href: r.url, text: r.texto }))))
  );
}

function crearPie() {
  return el("footer", { class: "pie" }, el("p", { text: "© 2026 " + NEGOCIO + "." }));
}

/* ===================== 4. PANTALLAS (cada opción del menú abre la suya) =====
   La dirección cambia a #/motos, #/tramites, etc. Solo se muestra una pantalla a la vez. */
const pantallas = {
  inicio: () => [crearInicio()],
  motos: () => [crearMotos()],
  confianza: () => [crearConfianza()],
  vender: () => [crearVender()],
  tramites: () => [crearTramites()],
  prestamos: () => [crearPrestamos()],
  remate: () => [crearRemate()],
  otros: () => [crearOtros()],
  quienes: () => [seccion("quienes", "¿Quiénes somos?",
    el("p", { text: "Somos una empresa dedicada a la compraventa de motos y contamos con servicio de financiamientos, trámites y préstamos." }),
    el("p", { text: "Por ahora nos encuentras a través de redes sociales." }))],
  contacto: () => [crearContacto()]
};

const principal = el("main");

function mostrarPantalla() {
  const ruta = location.hash.replace(/^#\/?/, "") || "inicio";
  const nombre = Object.hasOwn(pantallas, ruta) ? ruta : "inicio";
  const volver = nombre === "inicio" ? [] : [el("p", {}, el("a", { href: "#/inicio", text: "← Volver al inicio" }))];
  principal.replaceChildren(...volver, ...pantallas[nombre]());
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", mostrarPantalla);

document.getElementById("app").append(crearCabecera(), principal, crearPie());
mostrarPantalla();
