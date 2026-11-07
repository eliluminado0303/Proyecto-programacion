import { useEffect, useRef, useState } from "react";
import { NEGOCIO, TELEFONO, TELEFONO_VISIBLE, CORREO, HORARIO, LOGO, vehiculos, entregas, resenas, plantillas, DATOS_TRAMITE, tramites, otrosServicios, redes } from "./datos.js";

/* ======== HOOKS ======== */
/* Guarda el scroll en variables CSS (--scroll en px y --progreso de 0 a 1).
   Con eso el CSS mueve la moto del encabezado, gira sus ruedas y hace el parallax. */
function useScrollVars() {
  useEffect(() => {
    const raiz = document.documentElement;
    let pendiente = false;
    const actualizar = () => {
      const max = raiz.scrollHeight - window.innerHeight;
      raiz.style.setProperty("--scroll", window.scrollY);
      raiz.style.setProperty("--progreso", max > 0 ? Math.min(1, window.scrollY / max) : 0);
      pendiente = false;
    };
    const alScroll = () => {
      if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); }
    };
    actualizar();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll);
    return () => {
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alScroll);
    };
  }, []);
}

/* Devuelve [ref, visible]: visible pasa a true cuando el elemento entra en pantalla. */
function useVisible(umbral = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: umbral });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [umbral]);
  return [ref, visible];
}

/* ======== UTILIDADES ======== */
const linkWhatsApp = (mensaje) => `https://wa.me/${TELEFONO}?text=${encodeURIComponent(mensaje)}`;

// Arma el mensaje: una línea de saludo y un campo por línea ("Año: ").
const mensajeDe = (saludo, campos = []) => [saludo, ...campos.map((c) => c + ": ")].join("\n");

// Ruta de un archivo de la carpeta imagenes (sirve también para videos).
const urlArchivo = (archivo) => import.meta.env.BASE_URL + encodeURI(archivo);

/* ======== PLACA ======== */
/* La placa de moto con relieve. tamano: "sm" (encabezado) o "lg" (portada).
   Todo el efecto 3D está en el CSS (.placa). */
function Placa({ tamano = "sm", como: Etiqueta = "div", texto = NEGOCIO }) {
  return (
    <Etiqueta className={`placa placa-${tamano}`}>
      {tamano === "lg" && <span className="placa-pais">COLOMBIA</span>}
      <span className="placa-texto">{texto}</span>
    </Etiqueta>
  );
}

/* ======== MOTO ======== */
/* Moto dibujada en SVG. Las ruedas llevan la clase "rueda": el CSS las gira con el scroll. */
function Moto() {
  const Rueda = ({ cx }) => (
    <g className="rueda" style={{ transformOrigin: `${cx}px 46px` }}>
      <circle cx={cx} cy="46" r="14" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d={`M${cx - 12} 46H${cx + 12}M${cx} 34V58M${cx - 8.5} 37.5L${cx + 8.5} 54.5M${cx + 8.5} 37.5L${cx - 8.5} 54.5`} stroke="currentColor" strokeWidth="1.5" />
    </g>
  );
  return (
    <svg className="moto" viewBox="0 0 124 64" aria-hidden="true">
      <Rueda cx={24} />
      <Rueda cx={98} />
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 46L52 43" />
        <path d="M52 43L58 29L80 27L74 41" />
        <path d="M98 46L85 22M82 21L92 19" />
        <path d="M54 52L30 54" />
      </g>
      <path d="M52 41H75L72 52H54Z" fill="currentColor" opacity=".55" />
      <path d="M57 29C66 18 82 22 83 27L58 33Z" fill="currentColor" />
      <path d="M30 33C32 28 40 28 44 28L58 29L57 34Z" fill="currentColor" />
      <circle cx="91" cy="27" r="3" fill="#fff" />
    </svg>
  );
}

/* ======== REVEAL (aparece al hacer scroll) ======== */
function Reveal({ children, retraso = 0, className = "" }) {
  const [ref, visible] = useVisible();
  return (
    <div ref={ref} className={`reveal ${visible ? "visible" : ""} ${className}`} style={{ transitionDelay: `${retraso}ms` }}>
      {children}
    </div>
  );
}

/* ======== CONTADOR ANIMADO ======== */
function Contador({ valor, sufijo = "" }) {
  const [ref, visible] = useVisible(0.4);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const inicio = performance.now();
    let id;
    const paso = (t) => {
      const p = Math.min(1, (t - inicio) / 1200);
      setN(Math.round(valor * (1 - Math.pow(1 - p, 3))));
      if (p < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [visible, valor]);
  return <span ref={ref}>{n}{sufijo}</span>;
}

/* ======== PUNTERO PERSONALIZADO ======== */
/* Un punto amarillo + una "rueda" que lo sigue y gira según la velocidad.
   No necesita permisos. Solo se activa con mouse (no en celulares) y si la persona
   no tiene activada la opción de "reducir movimiento". */
function Cursor() {
  const caja = useRef(null);
  const punto = useRef(null);
  const aro = useRef(null);
  const rueda = useRef(null);

  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.body.classList.add("cursor-propio");
    let x = 0, y = 0, ax = 0, ay = 0, giro = 0, id, primero = true;

    const mover = (e) => {
      x = e.clientX; y = e.clientY;
      if (primero) { ax = x; ay = y; primero = false; caja.current.classList.add("visible"); }
      punto.current.style.transform = `translate(${x}px, ${y}px)`;
      aro.current.classList.toggle("activo", !!e.target.closest("a, button, summary, [data-cursor]"));
    };
    const bucle = () => {
      const dx = x - ax, dy = y - ay;
      ax += dx * 0.18; ay += dy * 0.18;
      giro += dx * 0.7;                      // la rueda gira según qué tan rápido mueves el mouse
      aro.current.style.transform = `translate(${ax}px, ${ay}px)`;
      rueda.current.style.transform = `rotate(${giro}deg)`;
      id = requestAnimationFrame(bucle);
    };
    const salir = () => caja.current.classList.remove("visible");
    const entrar = () => !primero && caja.current.classList.add("visible");

    window.addEventListener("mousemove", mover);
    document.addEventListener("mouseleave", salir);
    document.addEventListener("mouseenter", entrar);
    id = requestAnimationFrame(bucle);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("mousemove", mover);
      document.removeEventListener("mouseleave", salir);
      document.removeEventListener("mouseenter", entrar);
      document.body.classList.remove("cursor-propio");
    };
  }, []);

  return (
    <div className="cursor" ref={caja} aria-hidden="true">
      <div className="cursor-aro" ref={aro}><div className="cursor-rueda" ref={rueda} /></div>
      <div className="cursor-punto" ref={punto} />
    </div>
  );
}

/* ======== FOTOS, VIDEO Y CARRUSEL ======== */
// Si el nombre de la foto no trae extensión, se prueba con cada una de estas.
const EXTENSIONES = [".jpeg", ".jpg", ".png", ".webp", ".jfif"];

function Marcador() {
  return <div className="sin-foto">Foto próximamente</div>;
}

/* Imagen de la carpeta imagenes. Si no existe, muestra "Foto próximamente". */
function Imagen({ archivo, alt }) {
  const intentos = archivo ? (/\.\w+$/.test(archivo) ? [archivo] : EXTENSIONES.map((e) => archivo + e)) : [];
  const [n, setN] = useState(0);
  if (n >= intentos.length) return <Marcador />;
  return <img src={urlArchivo(intentos[n])} alt={alt} loading="lazy" onError={() => setN(n + 1)} />;
}

function Video({ archivo }) {
  return (
    <video controls preload="metadata">
      <source src={urlArchivo(archivo)} type="video/mp4" />
      Tu navegador no puede reproducir este video.
    </video>
  );
}

/* Fotos (item.fotos o item.foto) y video de una tarjeta.
   Con una sola cosa se muestra tal cual; con 2 o más, carrusel con flechas. */
function Media({ item }) {
  const [actual, setActual] = useState(0);
  const fotos = item.fotos || (item.foto ? [item.foto] : []);
  const nombre = item.nombre || item.titulo;
  const piezas = fotos.map((f) => <Imagen key={f} archivo={f} alt={nombre} />);
  if (item.video) piezas.push(<Video key="video" archivo={item.video} />);

  if (piezas.length === 0) return <div className="media"><Marcador /></div>;
  if (piezas.length === 1) return <div className="media">{piezas[0]}</div>;

  const ir = (n) => setActual((n + piezas.length) % piezas.length);   // el % da la vuelta al llegar al final
  return (
    <div className="media carrusel">
      {piezas.map((p, k) => (
        <figure key={k} className={"slide" + (k === actual ? " activa" : "")}>{p}</figure>
      ))}
      <button type="button" className="flecha ant" aria-label="Anterior" onClick={() => ir(actual - 1)}>‹</button>
      <button type="button" className="flecha sig" aria-label="Siguiente" onClick={() => ir(actual + 1)}>›</button>
      <span className="contador">{actual + 1} / {piezas.length}</span>
    </div>
  );
}

/* ======== BOTÓN DE WHATSAPP Y SECCIÓN ======== */
/* Botón que abre WhatsApp con el mensaje ya escrito. variante: "" o "claro" */
function BotonWA({ texto, mensaje, variante = "" }) {
  return (
    <a className={`boton ${variante}`.trim()} href={linkWhatsApp(mensaje)} target="_blank" rel="noreferrer">
      {texto}
    </a>
  );
}

function Seccion({ titulo, children, className = "" }) {
  return (
    <Reveal>
      <section className={`seccion ${className}`.trim()}>
        <h2>{titulo}</h2>
        {children}
      </section>
    </Reveal>
  );
}

/* ======== ENCABEZADO ======== */
/* Encabezado fijo arriba. Abajo lleva una "carretera" por donde la moto avanza al hacer scroll. */
function Cabecera({ ruta }) {
  const [movil, setMovil] = useState(false);     // ¿menú hamburguesa abierto?
  const [abierto, setAbierto] = useState(null);  // desplegable abierto: "cat", "serv" o null

  // Al cambiar de pantalla se cierra todo.
  useEffect(() => { setMovil(false); setAbierto(null); }, [ruta]);

  // Clic fuera de un desplegable = se cierra.
  useEffect(() => {
    const fuera = (e) => { if (!e.target.closest(".desplegable")) setAbierto(null); };
    document.addEventListener("click", fuera);
    return () => document.removeEventListener("click", fuera);
  }, []);

  const alternar = (k) => setAbierto((a) => (a === k ? null : k));
  const Enlace = ({ a, children }) => (
    <a href={`#/${a}`} className={ruta === a ? "activo" : ""}>{children}</a>
  );
  const Desplegable = ({ id, titulo, children }) => (
    <div className="desplegable">
      <button type="button" aria-expanded={abierto === id} onClick={() => alternar(id)}>
        {titulo} <span className="flechita">▾</span>
      </button>
      {abierto === id && <div className="submenu">{children}</div>}
    </div>
  );

  return (
    <header className="cabecera">
      <div className="barra">
        <a className="marca" href="#/inicio" aria-label="Ir al inicio">
          <img className="logo" src={urlArchivo(LOGO)} alt="Logo de Negocios con Alejo" width="46" height="46" />
          <Placa tamano="sm" />
        </a>

        <button className={"hamburguesa" + (movil ? " abierta" : "")} type="button" aria-label="Abrir menú"
          aria-expanded={movil} aria-controls="menu" onClick={() => setMovil(!movil)}>
          <span /><span /><span />
        </button>

        <nav className={"menu" + (movil ? " abierto" : "")} id="menu" aria-label="Menú principal">
          <Enlace a="inicio">Inicio</Enlace>
          <Desplegable id="cat" titulo="Catálogo">
            <Enlace a="motos">Motos</Enlace>
            <Enlace a="confianza">Vendidos y reseñas</Enlace>
            <Enlace a="vender">Vende tu moto</Enlace>
          </Desplegable>
          <Desplegable id="serv" titulo="Servicios y negocios">
            <Enlace a="tramites">Trámites</Enlace>
            <Enlace a="prestamos">Préstamos con prenda</Enlace>
            <Enlace a="otros">Financiación y pagos</Enlace>
          </Desplegable>
          <Enlace a="quienes">¿Quiénes somos?</Enlace>
          <Enlace a="contacto">Contacto y redes</Enlace>
        </nav>
      </div>

      {/* Carretera + moto: su posición y el giro de las ruedas salen del scroll (ver estilos.css) */}
      <div className="carretera" aria-hidden="true">
        <div className="moto-pista"><Moto /></div>
      </div>
    </header>
  );
}

/* ======== PIE DE PÁGINA Y BARRA DE CONTACTO ======== */
function Pie() {
  return (
    <footer className="pie">
      <div className="pie-cols">
        <div>
          <strong className="pie-marca">{NEGOCIO}</strong>
          <p>Compra y venta de motos, trámites, financiación y préstamos con prenda.</p>
        </div>
        <div>
          <strong>Contacto</strong>
          <p>{TELEFONO_VISIBLE}<br /><a href={`mailto:${CORREO}`}>{CORREO}</a><br />Horario: {HORARIO}</p>
        </div>
        <div>
          <strong>Redes</strong>
          <p>{redes.map((r) => <a key={r.texto} href={r.url} target="_blank" rel="noreferrer">{r.texto}<br /></a>)}</p>
        </div>
      </div>
      <p className="pie-copy">© 2026 {NEGOCIO}.</p>
    </footer>
  );
}

/* Barra de contacto rápido: SIEMPRE visible abajo, en todas las pantallas. */
function BarraContacto() {
  return (
    <aside className="barra-contacto" aria-label="Contacto rápido">
      <span className="barra-horario">Atención: {HORARIO}</span>
      <a className="bc-wa" href={linkWhatsApp("Hola, quiero información.")} target="_blank" rel="noreferrer">WhatsApp</a>
      <a href={`tel:+${TELEFONO}`}>Llamar</a>
      <a href={redes[0].url} target="_blank" rel="noreferrer">Instagram</a>
      <a href={redes[1].url} target="_blank" rel="noreferrer">TikTok</a>
    </aside>
  );
}

/* ======== PANTALLAS: MOTOS Y CONFIANZA ======== */
/* Tarjeta de una moto (se usa en la portada y en el catálogo). */
function TarjetaMoto({ v }) {
  const vendido = v.estado === "vendido";
  return (
    <article className={"tarjeta tarjeta-moto" + (vendido ? " es-vendida" : "")}>
      <Media item={v} />
      <div className="tarjeta-cuerpo">
        <span className={"estado " + v.estado}>{vendido ? "Vendido" : "Disponible"}</span>
        <h3>{v.nombre}</h3>
        <p className="precio">{v.precio}</p>
        <ul className="datos">
          <li><strong>Modelo:</strong> {v.modelo}</li>
          <li><strong>Kilometraje:</strong> {v.km}</li>
          <li><strong>Color:</strong> {v.color}</li>
        </ul>
        <p>{v.descripcion}</p>
        {!vendido && <BotonWA texto="Preguntar por WhatsApp" mensaje={`${plantillas.comprar[0]} ${v.nombre}`} />}
      </div>
    </article>
  );
}

function Motos() {
  // Disponibles primero, vendidas al final.
  const lista = [...vehiculos].sort((a, b) => (a.estado === "vendido") - (b.estado === "vendido"));
  return (
    <Seccion titulo="Motos">
      {lista.length ? (
        <div className="tarjetas">
          {lista.map((v, i) => <Reveal key={v.nombre} retraso={i * 90}><TarjetaMoto v={v} /></Reveal>)}
        </div>
      ) : <p>Por ahora no hay motos disponibles.</p>}
    </Seccion>
  );
}

function Confianza() {
  const vendidos = vehiculos.filter((v) => v.estado === "vendido");
  const Bloque = ({ hijos, aviso }) =>
    hijos.length ? <div className="tarjetas">{hijos}</div> : <p className="pendiente">{aviso}</p>;

  const tarjetasEntregas = [
    ...entregas.map((e) => (
      <article className="tarjeta" key={e.titulo}>
        <Media item={e} />
        <div className="tarjeta-cuerpo"><h3>{e.titulo}</h3><p>{e.texto}</p></div>
      </article>
    )),
    ...vendidos.map((v) => (
      <article className="tarjeta" key={v.nombre}>
        <div className="tarjeta-cuerpo">
          <span className="estado vendido">Vendido</span><h3>{v.nombre}</h3>
          <p className="nota">{v.modelo} · {v.precio}</p>
        </div>
      </article>
    )),
  ];
  const tarjetasResenas = resenas.map((r) => (
    <article className="tarjeta" key={r.nombre}>
      <div className="tarjeta-cuerpo"><p className="resena">“{r.texto}”</p><strong>{r.nombre}</strong></div>
    </article>
  ));

  return (
    <Seccion titulo="Vendidos y reseñas">
      <h3>Entregas a clientes</h3>
      <Bloque hijos={tarjetasEntregas} aviso="Pronto compartiremos entregas a nuestros clientes." />
      <h3>Lo que dicen nuestros clientes</h3>
      <Bloque hijos={tarjetasResenas} aviso="Pronto compartiremos opiniones de nuestros clientes." />
      <p className="nota">¿Ya fuiste cliente? Cuéntanos cómo te fue.</p>
      <BotonWA texto="Dejar una reseña" mensaje={mensajeDe(...plantillas.resena)} />
    </Seccion>
  );
}

/* ======== PANTALLAS: SERVICIOS ======== */
function Vender() {
  return (
    <Seccion titulo="Vende tu moto">
      <p>¿Quieres vender tu moto? Te ayudamos como intermediarios: la ofrecemos, atendemos a los compradores y nos encargamos de la negociación.</p>
      <p>Los detalles de la comisión se acuerdan contigo por WhatsApp.</p>
      <p>Toca el botón: se abre WhatsApp con los datos que necesitamos (año y modelo, línea, impuestos, número de dueños, ubicación y matrícula). Solo completa cada línea y envía.</p>
      <p className="pendiente">Indícanos dónde está la moto y dónde está matriculada, para confirmar que podemos atenderla.</p>
      <BotonWA texto="Quiero vender mi moto" mensaje={mensajeDe(...plantillas.vender)} />
    </Seccion>
  );
}

function Tramites() {
  return (
    <Seccion titulo="Trámites">
      <p>Te ayudamos con estos trámites. Toca el botón del que necesitas y se abre WhatsApp con los datos que te pediremos.</p>
      <div className="tarjetas">
        {tramites.map((t, i) => (
          <Reveal key={t.titulo} retraso={i * 80}>
            <article className="tarjeta">
              <div className="tarjeta-cuerpo">
                <h3>{t.titulo}</h3>
                <p>{t.texto}</p>
                <p className="nota">Documentos que necesitas:</p>
                <ul className="documentos">{t.documentos.map((d) => <li key={d}>{d}</li>)}</ul>
                <BotonWA texto={"Consultar " + t.titulo} mensaje={mensajeDe(`Hola, necesito ayuda con: ${t.titulo}.`, DATOS_TRAMITE)} />
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Seccion>
  );
}

function Prestamos() {
  return (
    <Seccion titulo="Préstamos con prenda">
      <p>Dejas en prenda un valor o artículos que valgan más de lo que te prestamos.</p>
      <p>Escríbenos con los datos del mensaje y te contamos las condiciones.</p>
      <BotonWA texto="Pedir un préstamo con prenda" mensaje={mensajeDe(...plantillas.prestamo)} />
    </Seccion>
  );
}

function Otros() {
  return (
    <Seccion titulo="Financiación y pagos">
      <div className="tarjetas">
        {otrosServicios.map((s) => (
          <article className="tarjeta" key={s.titulo}>
            <div className="tarjeta-cuerpo"><h3>{s.titulo}</h3><p>{s.texto}</p></div>
          </article>
        ))}
      </div>
    </Seccion>
  );
}

/* ======== PANTALLAS: INFORMACIÓN ======== */
function Quienes() {
  return (
    <Seccion titulo="¿Quiénes somos?">
      <p>Somos una empresa dedicada a la compraventa de motos y contamos con servicio de financiamientos, trámites y préstamos.</p>
      <p>Por ahora nos encuentras a través de redes sociales.</p>
    </Seccion>
  );
}

function Contacto() {
  return (
    <Seccion titulo="Contacto y redes">
      <p><strong>Teléfono / WhatsApp:</strong> {TELEFONO_VISIBLE}</p>
      <p><strong>Correo:</strong> <a href={`mailto:${CORREO}`}>{CORREO}</a></p>
      <p><strong>Horario de atención:</strong> {HORARIO}</p>
      <p><strong>Nuestras redes:</strong></p>
      <ul className="redes">
        {redes.map((r) => (
          <li key={r.texto}><a href={r.url} target="_blank" rel="noreferrer">{r.texto}: {r.detalle}</a></li>
        ))}
      </ul>
    </Seccion>
  );
}

/* ======== PORTADA ======== */
const SERVICIOS = [
  { titulo: "Compra tu moto", texto: "Motos revisadas y con papeles listos para el traspaso.", a: "motos" },
  { titulo: "Vende tu moto", texto: "Nosotros la ofrecemos y negociamos por ti.", a: "vender" },
  { titulo: "Trámites", texto: "Traspaso, duplicado de placas, cambio de color y prendas.", a: "tramites" },
  { titulo: "Préstamos con prenda", texto: "Dinero rápido dejando un artículo en garantía.", a: "prestamos" },
  { titulo: "Financiación y pagos", texto: "Opciones de crédito, efectivo o transferencia.", a: "otros" },
];

const PASOS = [
  { n: "1", titulo: "Escríbenos", texto: "Toca el botón de WhatsApp: el mensaje ya viene listo." },
  { n: "2", titulo: "Elige y revisa", texto: "Te mostramos la moto, sus papeles y su estado." },
  { n: "3", titulo: "Nos encargamos del resto", texto: "Acordamos el pago y te ayudamos con el traspaso." },
];

function Inicio() {
  const disponibles = vehiculos.filter((v) => v.estado !== "vendido");
  const destacada = disponibles[0];

  return (
    <>
      {/* ===== PORTADA ===== */}
      <section className="hero">
        <div className="hero-texto">
          <p className="hero-sobre">Compra y venta de motos</p>
          <Placa tamano="lg" como="h1" />
          <p className="hero-lema">Somos unos locos tratando de comernos al mundo</p>
          <div className="hero-botones">
            <a className="boton" href="#/motos">Ver motos</a>
            <BotonWA texto="Quiero vender mi moto" mensaje={mensajeDe(...plantillas.vender)} variante="claro" />
          </div>
        </div>
        {destacada && (
          <div className="hero-moto" data-cursor>
            <div className="hero-halo" />
            <div className="hero-foto"><Imagen archivo={destacada.fotos[0]} alt={destacada.nombre} /></div>
            <span className="hero-etiqueta">{destacada.nombre} · {destacada.precio}</span>
          </div>
        )}
      </section>

      {/* ===== CINTA QUE SE MUEVE ===== */}
      <div className="cinta" aria-hidden="true">
        <div className="cinta-pista">
          {[0, 1].map((k) => (
            <span key={k}>COMPRAMOS ★ VENDEMOS ★ TRÁMITES ★ FINANCIACIÓN ★ PRÉSTAMOS CON PRENDA ★ </span>
          ))}
        </div>
      </div>

      {/* ===== CIFRAS ===== */}
      <div className="cifras">
        <div><strong><Contador valor={disponibles.length} /></strong><span>motos disponibles</span></div>
        <div><strong><Contador valor={tramites.length} /></strong><span>trámites que gestionamos</span></div>
        <div><strong><Contador valor={2} /></strong><span>formas de pago</span></div>
        <div><strong><Contador valor={100} sufijo="%" /></strong><span>atención por WhatsApp</span></div>
      </div>

      {/* ===== MOTOS DESTACADAS ===== */}
      <Reveal>
        <section className="bloque">
          <h2>Motos destacadas</h2>
          <div className="tarjetas">
            {disponibles.slice(0, 3).map((v) => <TarjetaMoto key={v.nombre} v={v} />)}
          </div>
          <p className="centrado"><a className="boton claro" href="#/motos">Ver todo el catálogo</a></p>
        </section>
      </Reveal>

      {/* ===== QUÉ HACEMOS ===== */}
      <section className="bloque">
        <Reveal><h2>¿En qué te ayudamos?</h2></Reveal>
        <div className="servicios">
          {SERVICIOS.map((s, i) => (
            <Reveal key={s.a} retraso={i * 70}>
              <a className="servicio" href={`#/${s.a}`}>
                <h3>{s.titulo}</h3>
                <p>{s.texto}</p>
                <span className="servicio-ver">Ver más →</span>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="bloque">
        <Reveal><h2>Así de fácil</h2></Reveal>
        <div className="pasos">
          {PASOS.map((p, i) => (
            <Reveal key={p.n} retraso={i * 120}>
              <div className="paso"><span className="paso-n">{p.n}</span><h3>{p.titulo}</h3><p>{p.texto}</p></div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== LLAMADO FINAL ===== */}
      <Reveal>
        <section className="llamado">
          <h2>¿Tienes una moto para vender?</h2>
          <p>Cuéntanos los datos por WhatsApp y nosotros nos encargamos.</p>
          <BotonWA texto="Escríbenos ahora" mensaje={mensajeDe(...plantillas.vender)} />
        </section>
      </Reveal>
    </>
  );
}

/* ======== APP (elige la pantalla según la dirección #/...) ======== */
const PAGINAS = {
  inicio: Inicio, motos: Motos, confianza: Confianza, vender: Vender, tramites: Tramites,
  prestamos: Prestamos, otros: Otros, quienes: Quienes, contacto: Contacto,
};

const rutaActual = () => {
  const r = location.hash.replace(/^#\/?/, "") || "inicio";
  return Object.hasOwn(PAGINAS, r) ? r : "inicio";
};

export default function App() {
  const [ruta, setRuta] = useState(rutaActual);
  useScrollVars();

  useEffect(() => {
    const cambio = () => { setRuta(rutaActual()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", cambio);
    return () => window.removeEventListener("hashchange", cambio);
  }, []);

  const Pagina = PAGINAS[ruta];
  return (
    <>
      <Cursor />
      <Cabecera ruta={ruta} />
      {/* key={ruta}: al cambiar de pantalla se repite la animación de entrada */}
      <main key={ruta} className={"pagina" + (ruta === "inicio" ? " es-inicio" : "")}>
        {ruta !== "inicio" && <a className="volver" href="#/inicio">← Volver al inicio</a>}
        <Pagina />
      </main>
      <Pie />
      <BarraContacto />
    </>
  );
}