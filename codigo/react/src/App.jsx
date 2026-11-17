import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { almacen } from "./almacen.js";
import { NEGOCIO, TELEFONO, TELEFONO_VISIBLE, CORREO, HORARIO, LOGO, entregas, plantillas, DATOS_TRAMITE, tramites, metodosPago, quienesSomos, TIPOS_RESENA, MAX_FOTOS_RESENA, redes } from "./datos.js";
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

// Fotos que vienen de internet o subidas desde el panel de administrador (no están en la carpeta imagenes).
const esExterna = (a) => /^(data:|https?:|blob:)/.test(a);

// Ruta de un archivo de la carpeta imagenes (sirve también para videos).
const urlArchivo = (archivo) => (esExterna(archivo) ? archivo : import.meta.env.BASE_URL + encodeURI(archivo));

// Datos compartidos por toda la página (motos y reseñas). Los carga App y los lee cualquier pantalla.
const Datos = createContext({ motos: [], resenas: [], recargar: async () => {} });
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
function Imagen({ archivo, alt, alCargar }) {
  const intentos = archivo
    ? (esExterna(archivo) || /\.\w+$/.test(archivo) ? [archivo] : EXTENSIONES.map((e) => archivo + e))
    : [];
  const [n, setN] = useState(0);
  if (n >= intentos.length) return <Marcador />;
  return (
    <img src={urlArchivo(intentos[n])} alt={alt} loading="lazy"
      onLoad={alCargar ? (e) => alCargar(e.currentTarget) : undefined}
      onError={() => setN(n + 1)} />
  );
}

function Video({ archivo }) {
  return (
    <video controls preload="metadata">
      <source src={urlArchivo(archivo)} type="video/mp4" />
      Tu navegador no puede reproducir este video.
    </video>
  );
}

/* Pantalla completa para ver las fotos grandes. Se cierra con la X, con Esc o tocando el fondo. */
function Visor({ fotos, inicio, nombre, cerrar }) {
  const [i, setI] = useState(inicio);
  const ir = (n) => setI((n + fotos.length) % fotos.length);

  useEffect(() => {
    const tecla = (e) => {
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowLeft") ir(i - 1);
      if (e.key === "ArrowRight") ir(i + 1);
    };
    window.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";   // evita que la página se mueva por detrás
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
    };
  });

  const parar = (fn) => (e) => { e.stopPropagation(); fn(); };
  return (
    <div className="visor" role="dialog" aria-modal="true" aria-label={"Fotos de " + nombre} onClick={cerrar}>
      <button type="button" className="visor-cerrar" aria-label="Cerrar" onClick={parar(cerrar)}>✕</button>
      <div className="visor-img" onClick={(e) => e.stopPropagation()}>
        <Imagen archivo={fotos[i]} alt={nombre} />
      </div>
      {fotos.length > 1 && (
        <>
          <button type="button" className="flecha ant" aria-label="Anterior" onClick={parar(() => ir(i - 1))}>‹</button>
          <button type="button" className="flecha sig" aria-label="Siguiente" onClick={parar(() => ir(i + 1))}>›</button>
          <span className="contador">{i + 1} / {fotos.length}</span>
        </>
      )}
    </div>
  );
}

function Media({ item }) {
  const [actual, setActual] = useState(0);
  const [visor, setVisor] = useState(false);          // ¿está abierta la foto en grande?
  const fotos = item.fotos || (item.foto ? [item.foto] : []);
  // La caja toma la forma de la primera foto: así no se recorta y no quedan franjas negras.
  const [proporcion, setProporcion] = useState(fotos.length ? 3 / 4 : 16 / 9);
  const medir = (img) => setProporcion(Math.min(1.6, Math.max(0.6, img.naturalWidth / img.naturalHeight)));
  const nombre = item.nombre || item.titulo;
  const piezas = fotos.map((f, k) => (
    <Imagen key={f.slice(-40)} archivo={f} alt={nombre} alCargar={k === 0 ? medir : undefined} />
  ));
  if (item.video) piezas.push(<Video key="video" archivo={item.video} />);

  if (piezas.length === 0) return <div className="media" style={{ aspectRatio: 4 / 3 }}><Marcador /></div>;

  const ir = (n) => setActual((n + piezas.length) % piezas.length);   // el % da la vuelta al llegar al final
  const ampliar = (k) => { if (k < fotos.length) setVisor(true); };    // el video no se amplía, ya tiene su pantalla completa
  const icono = fotos.length > 0 && (
    <span className="icono-ampliar" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      </svg>
    </span>
  );

  return (
    <>
      {piezas.length === 1 ? (
        <div className={"media" + (fotos.length ? " ampliable" : "")} style={{ aspectRatio: proporcion }} onClick={() => ampliar(0)}>
          {piezas[0]}{icono}
        </div>
      ) : (
        <div className="media carrusel ampliable" style={{ aspectRatio: proporcion }} onClick={() => ampliar(actual)}>
          {piezas.map((p, k) => (
            <figure key={k} className={"slide" + (k === actual ? " activa" : "")}>{p}</figure>
          ))}
          <button type="button" className="flecha ant" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); ir(actual - 1); }}>‹</button>
          <button type="button" className="flecha sig" aria-label="Siguiente" onClick={(e) => { e.stopPropagation(); ir(actual + 1); }}>›</button>
          <span className="contador">{actual + 1} / {piezas.length}</span>
          {actual < fotos.length && icono}
        </div>
      )}
      {/* createPortal lo dibuja encima de toda la página, no dentro de la tarjeta */}
      {visor && createPortal(
        <Visor fotos={fotos} inicio={Math.min(actual, fotos.length - 1)} nombre={nombre} cerrar={() => setVisor(false)} />,
        document.body
      )}
    </>
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

  const esInicio = ruta === "inicio";
  return (
    <header className={"cabecera" + (esInicio ? " sin-marca" : "")}>
      <div className="barra">
        {/* En la portada el logo y el nombre ya salen en grande, así que aquí solo se muestran en las demás pantallas */}
        {!esInicio && (
          <a className="marca" href="#/inicio" aria-label="Ir al inicio">
            <img className="logo" src={urlArchivo(LOGO)} alt="Logo de Negocios con Alejo" width="46" height="46" />
            <Placa tamano="sm" />
          </a>
        )}

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
/* Íconos sencillos de cada red (dibujos SVG). "nombre" debe coincidir con el texto de la red en datos.js */
function IconoRed({ nombre }) {
  const dibujos = {
    Instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    TikTok: <path d="M15 3v9.5a4 4 0 1 1-4-4M15 3c.4 2.6 2.1 4.2 5 4.5" />,
    WhatsApp: (
      <>
        <path d="M3.5 20.5l1.4-4.3A8.5 8.5 0 1 1 8 19.3l-4.5 1.2z" />
        <path d="M9 8.5c.2 3 2.6 5.8 6 6.5l1.2-1.4-2-1-.9.9c-1-.4-2-1.4-2.4-2.4l.9-.9-1-2L9 8.5z" />
      </>
    ),
  };
  return (
    <svg className="icono-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dibujos[nombre]}
    </svg>
  );
}

/* Pie de página: aquí vive toda la información de contacto (ya no hay pantalla de contacto aparte) */
function Pie() {
  return (
    <footer className="pie">
      <div className="pie-cols">
        <div className="pie-bloque pie-marca">
          <div className="pie-marca-fila">
            <img className="logo logo-pie" src={urlArchivo(LOGO)} alt="Logo de Negocios con Alejo" width="52" height="52" />
            <Placa tamano="sm" />
          </div>
          <p>Compra y venta de motos, trámites, financiación y préstamos con prenda.</p>
        </div>

        <div className="pie-bloque">
          <h4>Contacto</h4>
          <ul className="pie-lista">
            <li><span>Teléfono y WhatsApp</span><a href={`tel:+${TELEFONO}`}>{TELEFONO_VISIBLE}</a></li>
            <li><span>Correo</span><a href={`mailto:${CORREO}`}>{CORREO}</a></li>
            <li><span>Horario de atención</span><b>{HORARIO}</b></li>
          </ul>
        </div>

        <div className="pie-bloque">
          <h4>Nuestras redes</h4>
          <ul className="pie-redes">
            {redes.map((r) => (
              <li key={r.texto}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  <IconoRed nombre={r.texto} />
                  <span><strong>{r.texto}</strong><small>{r.detalle}</small></span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="pie-copy">© 2026 {NEGOCIO}</p>
    </footer>
  );
}
/* Versión compacta de una moto para la portada: foto pequeña, nombre y precio. El detalle completo está en el catálogo. */
function TarjetaMini({ v }) {
  return (
    <a className="mini" href="#/motos">
      <div className="mini-foto"><Imagen archivo={(v.fotos || [])[0]} alt={v.nombre} /></div>
      <div className="mini-info">
        <span className={"estado " + v.estado}>{v.estado === "vendido" ? "Vendido" : "Disponible"}</span>
        <h3>{v.nombre}</h3>
        <p className="mini-datos">{[v.modelo, v.km, v.color].filter(Boolean).join(" · ")}</p>
        <p className="precio">{v.precio}</p>
        <span className="mini-ver">Ver en el catálogo →</span>
      </div>
    </a>
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
  const { motos } = useContext(Datos);
  // Disponibles primero, vendidas al final.
  const lista = [...motos].sort((a, b) => (a.estado === "vendido") - (b.estado === "vendido"));
  return (
    <Seccion titulo="Motos">
      {lista.length ? (
        <div className="tarjetas">
          {lista.map((v, i) => <Reveal key={v.id} retraso={i * 90}><TarjetaMoto v={v} /></Reveal>)}
        </div>
      ) : <p>Por ahora no hay motos disponibles.</p>}
    </Seccion>
  );
}

/* ======== ESTRELLAS Y FORMULARIO DE RESEÑAS ======== */
// Color según la nota: 1-2 rojo, 3 amarillo/naranja, 4-5 verde (los colores están en estilos.css).
const nivelDe = (n) => (n <= 2 ? "malo" : n === 3 ? "medio" : "bueno");

/* Muestra una calificación fija: círculos con estrella, del color de la nota */
function Estrellas({ valor, tam = "" }) {
  const llenas = Math.round(valor);
  return (
    <span className={`estrellas ${tam} nivel-${nivelDe(llenas)}`} role="img" aria-label={`${valor.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={"estrella" + (n <= llenas ? " llena" : "")}>★</span>
      ))}
    </span>
  );
}

/* Los 5 círculos que la persona toca para calificar; se pintan según la nota elegida */
function SelectorEstrellas({ valor, onChange }) {
  const [sobre, setSobre] = useState(0);   // círculo sobre el que está el mouse
  const textos = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];
  const activa = sobre || valor;
  return (
    <div className="selector" data-nivel={activa ? nivelDe(activa) : ""} role="radiogroup" aria-label="Calificación"
      onMouseLeave={() => setSobre(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={valor === n}
          aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
          className={n <= activa ? "llena" : ""}
          onMouseEnter={() => setSobre(n)} onClick={() => onChange(n)}>★</button>
      ))}
      <span className="selector-texto">{textos[activa]}</span>
    </div>
  );
}

function FormularioResena({ alEnviar }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");              // id de lo que se reseña (ver TIPOS_RESENA en datos.js)
  const [estrellas, setEstrellas] = useState(0);
  const [texto, setTexto] = useState("");
  const [fotos, setFotos] = useState([]);            // fotos en forma de texto (ya reducidas)
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const tipoElegido = TIPOS_RESENA.find((t) => t.id === tipo);
  const fotoObligatoria = !!tipoElegido?.fotoObligatoria;

  const anadirFotos = async (e) => {
    const archivos = [...e.target.files].slice(0, MAX_FOTOS_RESENA - fotos.length);
    e.target.value = "";
    if (!archivos.length) return;
    try {
      const nuevas = [];
      for (const a of archivos) nuevas.push(await almacen.subirFoto(a));
      setFotos((f) => [...f, ...nuevas]);
      setAviso(null);
    } catch (err) {
      setAviso({ tipo: "error", texto: err.message });
    }
  };
  const quitarFoto = (i) => setFotos(fotos.filter((_, k) => k !== i));

  const enviar = async (e) => {
    e.preventDefault();
    if (nombre.trim().length < 2) return setAviso({ tipo: "error", texto: "Escribe tu nombre." });
    if (!tipoElegido) return setAviso({ tipo: "error", texto: "Elige qué vas a reseñar." });
    if (!estrellas) return setAviso({ tipo: "error", texto: "Elige una calificación de 1 a 5 estrellas." });
    if (texto.trim().length < 10) return setAviso({ tipo: "error", texto: "Cuéntanos un poco más (mínimo 10 letras)." });
    if (fotoObligatoria && fotos.length === 0) {
      return setAviso({ tipo: "error", texto: "Para reseñar la compra de una moto necesitas subir al menos una foto." });
    }
    setEnviando(true);
    try {
      await almacen.crearResena({ nombre: nombre.trim(), tipo: tipoElegido.nombre, estrellas, texto: texto.trim(), fotos });
      setNombre(""); setTipo(""); setEstrellas(0); setTexto(""); setFotos([]);
      setAviso({ tipo: "ok", texto: "¡Gracias por dejar tu reseña!" });
      alEnviar();
    } catch (err) {
      setAviso({ tipo: "error", texto: err.message });
    }
    setEnviando(false);
  };

  return (
    <form className="formulario panel-resena" onSubmit={enviar}>
      <div className="fila-form">
        <label>Tu nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={40} placeholder="Ej: Carlos" />
        </label>
        <label>¿Qué vas a reseñar?
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Elige una opción</option>
            {TIPOS_RESENA.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </label>
      </div>
      <div>
        <span className="etiqueta">Tu calificación</span>
        <SelectorEstrellas valor={estrellas} onChange={setEstrellas} />
      </div>
      <label>Tu opinión
        <textarea rows="4" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={500}
          placeholder="Cuéntanos cómo fue tu experiencia" />
      </label>
      <div>
        <span className="etiqueta">
          {fotoObligatoria ? "Foto de tu moto (obligatoria)" : "Fotos (opcional)"}
        </span>
        {fotos.length < MAX_FOTOS_RESENA && (
          <label className="subir">
            <span className="boton claro chico">Elegir fotos</span>
            <small>Hasta {MAX_FOTOS_RESENA} fotos</small>
            <input type="file" accept="image/*" multiple onChange={anadirFotos} />
          </label>
        )}
        {fotos.length > 0 && (
          <div className="miniaturas">
            {fotos.map((f, i) => (
              <div className="miniatura" key={i}>
                <div className="caja"><Imagen archivo={f} alt={`Foto ${i + 1}`} /></div>
                <button type="button" onClick={() => quitarFoto(i)}>Quitar</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {aviso && <p className={"aviso " + aviso.tipo}>{aviso.texto}</p>}
      <div className="fila-botones">
        <button className="boton" type="submit" disabled={enviando}>{enviando ? "Enviando..." : "Publicar reseña"}</button>
      </div>
    </form>
  );
}

function Confianza() {
  const { motos, resenas, recargar } = useContext(Datos);
  const vendidos = motos.filter((v) => v.estado === "vendido");
  const promedio = resenas.length ? resenas.reduce((suma, r) => suma + r.estrellas, 0) / resenas.length : 0;
  const Bloque = ({ hijos, aviso }) =>
    hijos.length ? <div className="tarjetas">{hijos}</div> : aviso ? <p className="pendiente">{aviso}</p> : null;

  const tarjetasEntregas = [
    ...entregas.map((e) => (
      <article className="tarjeta" key={e.titulo}>
        <Media item={e} />
        <div className="tarjeta-cuerpo"><h3>{e.titulo}</h3><p>{e.texto}</p></div>
      </article>
    )),
    ...vendidos.map((v) => (
      <article className="tarjeta" key={v.id}>
        <div className="tarjeta-cuerpo">
          <span className="estado vendido">Vendido</span><h3>{v.nombre}</h3>
          <p className="nota">{v.modelo} · {v.precio}</p>
        </div>
      </article>
    )),
  ];
  const tarjetasResenas = resenas.map((r) => (
    <article className="tarjeta resena-tarjeta" key={r.id}>
      {r.fotos && r.fotos.length > 0 && <Media item={{ fotos: r.fotos, nombre: `Foto de ${r.nombre}` }} />}
      <div className="tarjeta-cuerpo">
        <div className="resena-cabecera">
          <Estrellas valor={r.estrellas} />
          {r.tipo && <span className="pildora chica">{r.tipo}</span>}
        </div>
        <p className="resena">“{r.texto}”</p>
        <strong>{r.nombre}</strong>
        <span className="nota">{new Date(r.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>
      </div>
    </article>
  ));

  return (
    <Seccion titulo="Vendidos y reseñas">
      <h3>Entregas a clientes</h3>
      <Bloque hijos={tarjetasEntregas} aviso="Pronto compartiremos entregas a nuestros clientes." />

      {resenas.length > 0 && (
        <>
          <h3>Lo que dicen nuestros clientes</h3>
          <p className="resumen-estrellas">
            <Estrellas valor={promedio} tam="grande" />
            <span><strong>{promedio.toFixed(1)}</strong> de 5 · {resenas.length} {resenas.length === 1 ? "reseña" : "reseñas"}</span>
          </p>
          <Bloque hijos={tarjetasResenas} />
        </>
      )}

      <h3>Deja tu reseña</h3>
      <p className="nota">¿Ya fuiste cliente? Cuéntanos cómo te fue; tu opinión ayuda a otras personas.</p>
      <FormularioResena alEnviar={recargar} />
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
      <p>Estas son las formas de pago que manejamos. Si te interesa financiar tu moto, escríbenos y te contamos las condiciones.</p>
      <div className="tarjetas tarjetas-chicas">
        {metodosPago.map((m) => (
          <article className="tarjeta" key={m.titulo}>
            <div className="tarjeta-cuerpo"><h3>{m.titulo}</h3><p>{m.texto}</p></div>
          </article>
        ))}
      </div>
    </Seccion>
  );
}

function Quienes() {
  const { intro, mision, vision, objetivo, valores } = quienesSomos;
  return (
    <>
      <Seccion titulo="¿Quiénes somos?">
        {intro.map((t) => <p key={t}>{t}</p>)}
        <div className="tarjetas tarjetas-chicas">
          {[["Misión", mision], ["Visión", vision], ["Objetivo", objetivo]].map(([titulo, texto]) => (
            <article className="tarjeta" key={titulo}>
              <div className="tarjeta-cuerpo"><span className="pildora chica">{titulo}</span><p>{texto}</p></div>
            </article>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Nuestros valores">
        <div className="valores">
          {valores.map((v) => (
            <div className="valor" key={v.titulo}><h3>{v.titulo}</h3><p>{v.texto}</p></div>
          ))}
        </div>
      </Seccion>
    </>
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
/* ======== PANEL DEL ADMINISTRADOR (no aparece en el menú: se entra por  #/admin ) ======== */
const MOTO_VACIA = { nombre: "", modelo: "", km: "", precio: "", color: "", descripcion: "", estado: "disponible", fotos: [], video: "" };
const soloNumeros = (t) => String(t || "").replace(/\D/g, "");
const dinero = (n) => "$" + Number(n).toLocaleString("es-CO");
const kilometros = (n) => Number(n).toLocaleString("es-CO") + " km";

function Admin() {
  const [dentro, setDentro] = useState(almacen.haySesion());
  if (!dentro) return <Ingreso entrar={() => setDentro(true)} />;
  return <Panel salir={() => { almacen.cerrarSesion(); setDentro(false); }} />;
}

function Ingreso({ entrar }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const enviar = async (e) => {
    e.preventDefault();
    try { await almacen.iniciarSesion(clave); entrar(); }
    catch (err) { setError(err.message); }
  };
  return (
    <Seccion titulo="Administrador">
      <p>Esta zona es solo para el dueño del negocio.</p>
      <form className="formulario" onSubmit={enviar} autoComplete="off">
        <label>Clave de administrador
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="new-password" />
        </label>
        {error && <p className="aviso error">{error}</p>}
        <div className="fila-botones"><button className="boton" type="submit">Entrar</button></div>
      </form>
    </Seccion>
  );
}
/* Formulario para que el dueño cambie la clave del panel */
function CambiarClave() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [aviso, setAviso] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    if (nueva.length < 10) return setAviso({ tipo: "error", texto: "La clave nueva debe tener al menos 10 caracteres." });
    if (nueva !== repetir) return setAviso({ tipo: "error", texto: "Las dos claves nuevas no son iguales." });
    try {
      await almacen.cambiarClave(actual, nueva);
      setActual(""); setNueva(""); setRepetir("");
      setAviso({ tipo: "ok", texto: "Clave actualizada. Úsala la próxima vez que entres." });
    } catch (err) {
      setAviso({ tipo: "error", texto: err.message });
    }
  };

  return (
    <Seccion titulo="Cambiar la clave del administrador">
      <form className="formulario" onSubmit={enviar} autoComplete="off">
        <label>Clave actual
          <input type="password" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="new-password" />
        </label>
        <div className="fila-form">
          <label>Clave nueva
            <input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" />
          </label>
          <label>Repite la clave nueva
            <input type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" />
          </label>
        </div>
        {aviso && <p className={"aviso " + aviso.tipo}>{aviso.texto}</p>}
        <div className="fila-botones"><button className="boton" type="submit">Guardar clave</button></div>
      </form>
    </Seccion>
  );
}
function Panel({ salir }) {
  const { motos, recargar } = useContext(Datos);
  const [form, setForm] = useState(MOTO_VACIA);
  const [editando, setEditando] = useState(null);      // id de la moto que se está editando
  const [mensaje, setMensaje] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [todasResenas, setTodasResenas] = useState([]);

  const cargarResenas = async () => setTodasResenas(await almacen.listarResenas());
  useEffect(() => { almacen.refrescar(); recargar(); cargarResenas(); }, []);   // el panel siempre arranca con datos frescos

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const anadirFotos = async (e) => {
    const archivos = [...e.target.files];
    e.target.value = "";
    if (!archivos.length) return;
    setSubiendo(true);
    try {
      const nuevas = [];
      for (const a of archivos) nuevas.push(await almacen.subirFoto(a));
      setForm((f) => ({ ...f, fotos: [...f.fotos, ...nuevas] }));
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    }
    setSubiendo(false);
  };
  const quitarFoto = (i) => setForm({ ...form, fotos: form.fotos.filter((_, k) => k !== i) });
  const ponerPortada = (i) => setForm({ ...form, fotos: [form.fotos[i], ...form.fotos.filter((_, k) => k !== i)] });

  const cancelar = () => { setForm(MOTO_VACIA); setEditando(null); setMensaje(null); };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !soloNumeros(form.precio)) {
      return setMensaje({ tipo: "error", texto: "El nombre y el precio son obligatorios." });
    }
    const moto = {
      id: editando || undefined,
      nombre: form.nombre.trim(),
      modelo: form.modelo.trim(),
      km: form.km ? kilometros(soloNumeros(form.km)) : "",
      precio: dinero(soloNumeros(form.precio)),
      color: form.color.trim(),
      descripcion: form.descripcion.trim(),
      fotos: form.fotos,
      video: form.video,
      estado: form.estado,
    };
    try {
      await almacen.guardarMoto(moto);
      await recargar();
      setMensaje({ tipo: "ok", texto: editando ? "Moto actualizada." : "Moto agregada al catálogo." });
      setForm(MOTO_VACIA); setEditando(null);
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    }
  };

  const editar = (m) => {
    setForm({ nombre: m.nombre, modelo: m.modelo || "", km: soloNumeros(m.km), precio: soloNumeros(m.precio), color: m.color || "",
      descripcion: m.descripcion || "", estado: m.estado, fotos: m.fotos || [], video: m.video || "" });
    setEditando(m.id); setMensaje(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cambiarEstado = async (m) => {
    await almacen.guardarMoto({ ...m, estado: m.estado === "vendido" ? "disponible" : "vendido" });
    recargar();
  };
  const borrar = async (m) => {
    if (!window.confirm(`¿Eliminar "${m.nombre}" del catálogo? Esta acción no se puede deshacer.`)) return;
    await almacen.borrarMoto(m.id);
    recargar();
  };

  const borrarResena = async (r) => {
    if (!window.confirm("¿Eliminar esta reseña?")) return;
    await almacen.borrarResena(r.id); await cargarResenas(); recargar();
  };
  const restablecer = async () => {
    if (!window.confirm("Se borrarán TODAS las motos y reseñas guardadas y volverán los datos de ejemplo. ¿Continuar?")) return;
    await almacen.restablecer(); await recargar(); await cargarResenas();
  };

  const FilaResena = ({ r }) => (
    <div className="admin-fila resena-fila">
      <div className="admin-info">
        <span><Estrellas valor={r.estrellas} /> <strong>{r.nombre}</strong></span>
        <span>{r.texto}</span>
      </div>
      <div className="admin-botones">
        <button type="button" className="boton chico peligro" onClick={() => borrarResena(r)}>Eliminar</button>
      </div>
    </div>
  );

  return (
    <>
      <Seccion titulo="Panel del administrador">
        {almacen.modo === "local" && (
          <p className="aviso prueba">Modo de prueba: lo que guardes aquí se queda solo en este navegador. Al publicar la página se conectará a una base de datos real.</p>
        )}
        <div className="fila-botones">
          <button type="button" className="boton claro chico" onClick={salir}>Cerrar sesión</button>
          {almacen.modo === "local" && (
            <button type="button" className="boton peligro chico" onClick={restablecer}>Restablecer datos de ejemplo</button>
          )}
        </div>
      </Seccion>

      <Seccion titulo={editando ? "Editar moto" : "Agregar moto"}>
        <form className="formulario" onSubmit={guardar}>
          <label>Nombre de la moto *
            <input value={form.nombre} onChange={cambiar("nombre")} placeholder="Ej: Discover 125 roja" />
          </label>
          <div className="fila-form">
            <label>Modelo (año)
              <input inputMode="numeric" value={form.modelo} onChange={cambiar("modelo")} placeholder="Ej: 2024" />
            </label>
            <label>Kilometraje
              <input inputMode="numeric" value={form.km} onChange={cambiar("km")} placeholder="Solo números, ej: 8300" />
            </label>
          </div>
          <div className="fila-form">
            <label>Precio *
              <input inputMode="numeric" value={form.precio} onChange={cambiar("precio")} placeholder="Solo números, ej: 6200000" />
            </label>
            <label>Color
              <input value={form.color} onChange={cambiar("color")} placeholder="Ej: Roja" />
            </label>
          </div>
          <label>Descripción
            <textarea rows="3" value={form.descripcion} onChange={cambiar("descripcion")}
              placeholder="Dueños, papeles, impuestos, matrícula, estado..." />
          </label>
          <label>Estado
            <select value={form.estado} onChange={cambiar("estado")}>
              <option value="disponible">Disponible</option>
              <option value="vendido">Vendido</option>
            </select>
          </label>
          <label>Fotos (puedes elegir varias a la vez)
            <input type="file" accept="image/*" multiple onChange={anadirFotos} />
          </label>
          {subiendo && <p className="nota">Procesando fotos...</p>}
          {form.fotos.length > 0 && (
            <div className="miniaturas">
              {form.fotos.map((f, i) => (
                <div className="miniatura" key={i}>
                  <div className="caja"><Imagen archivo={f} alt={`Foto ${i + 1}`} /></div>
                  {i === 0 ? <span className="portada">Portada</span>
                    : <button type="button" onClick={() => ponerPortada(i)}>Hacer portada</button>}
                  <button type="button" onClick={() => quitarFoto(i)}>Quitar</button>
                </div>
              ))}
            </div>
          )}
          {mensaje && <p className={"aviso " + mensaje.tipo}>{mensaje.texto}</p>}
          <div className="fila-botones">
            <button className="boton" type="submit" disabled={subiendo}>{editando ? "Guardar cambios" : "Agregar al catálogo"}</button>
            {editando && <button type="button" className="boton claro" onClick={cancelar}>Cancelar</button>}
          </div>
        </form>
      </Seccion>

      <Seccion titulo={`Motos del catálogo (${motos.length})`}>
        {motos.length === 0 && <p className="nota">No hay motos todavía.</p>}
        <div className="admin-lista">
          {motos.map((m) => (
            <div className="admin-fila" key={m.id}>
              <div className="admin-mini"><Imagen archivo={(m.fotos || [])[0]} alt={m.nombre} /></div>
              <div className="admin-info">
                <strong>{m.nombre}</strong>
                <span>{m.precio} · {m.modelo}</span>
                <span className={"estado " + m.estado}>{m.estado === "vendido" ? "Vendido" : "Disponible"}</span>
              </div>
              <div className="admin-botones">
                <button type="button" className="boton chico" onClick={() => editar(m)}>Editar</button>
                <button type="button" className="boton chico claro" onClick={() => cambiarEstado(m)}>
                  {m.estado === "vendido" ? "Marcar disponible" : "Marcar vendida"}
                </button>
                <button type="button" className="boton chico peligro" onClick={() => borrar(m)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo={`Reseñas de clientes (${todasResenas.length})`}>
        <p className="nota">Las reseñas se publican solas. Desde aquí puedes eliminar las que no quieras mostrar.</p>
        {todasResenas.length === 0 ? <p className="nota">Todavía no hay reseñas.</p>
          : <div className="admin-lista">{todasResenas.map((r) => <FilaResena key={r.id} r={r} />)}</div>}
      </Seccion>
      <CambiarClave />
    </>
  );
}
/* ======== PORTADA ======== */
const SERVICIOS = [
  { titulo: "Compra tu moto", texto: "Motos revisadas y con papeles listos para el traspaso.", a: "motos" },
  { titulo: "Vende tu moto", texto: "Nosotros la ofrecemos y negociamos por ti.", a: "vender" },
  { titulo: "Trámites", texto: "Traspaso, duplicado de placas, cambio de color y prendas.", a: "tramites" },
  { titulo: "Préstamos con prenda", texto: "Dinero rápido dejando un artículo en garantía.", a: "prestamos" },
  { titulo: "Financiación y pagos", texto: "Financiación, Nequi, Davivienda y transferencia bancaria.", a: "otros" },
];

const PASOS = [
  { n: "1", titulo: "Escríbenos", texto: "Toca el botón de WhatsApp: el mensaje ya viene listo." },
  { n: "2", titulo: "Elige y revisa", texto: "Te mostramos la moto, sus papeles y su estado." },
  { n: "3", titulo: "Nos encargamos del resto", texto: "Acordamos el pago y te ayudamos con el traspaso." },
];

function Inicio() {
  const { motos } = useContext(Datos);
  const disponibles = motos.filter((v) => v.estado !== "vendido");

  return (
    <>
      {/* ===== PORTADA: nombre con forma de placa + logo en grande ===== */}
      <section className="hero">
        <div className="hero-texto">
          <span className="pildora">Compra y venta de motos</span>
          <Placa tamano="lg" como="h1" />
          <p className="hero-lema">Somos unos locos tratando de comernos al mundo</p>
          <div className="hero-botones">
            <a className="boton" href="#/motos">Ver motos</a>
            <BotonWA texto="Quiero vender mi moto" mensaje={mensajeDe(...plantillas.vender)} variante="claro" />
          </div>
        </div>
        <div className="hero-logo">
          <div className="hero-halo" />
          {/* Por ahora el logo es la foto de LOGO en datos.js; cuando haya un logo real, se cambia ese archivo */}
          <img src={urlArchivo(LOGO)} alt="Logo de Negocios con Alejo" />
        </div>
      </section>

      {/* ===== CINTA QUE SE MUEVE ===== */}
      <div className="cinta" aria-hidden="true">
        <div className="cinta-pista">
          {[0, 1].map((k) => (
            <span key={k}>COMPRAMOS ★ VENDEMOS ★ TRÁMITES ★ FINANCIACIÓN ★ PRÉSTAMOS CON PRENDA ★ </span>
          ))}
        </div>
      </div>

      {/* ===== MOTOS DESTACADAS (versión compacta; el catálogo tiene el detalle) ===== */}
      {disponibles.length > 0 && (
        <Reveal>
          <section className="bloque">
            <h2>Motos destacadas</h2>
            <div className="minis">
              {disponibles.slice(0, 3).map((v) => <TarjetaMini key={v.id} v={v} />)}
            </div>
            <p className="centrado"><a className="boton claro" href="#/motos">Ver todo el catálogo</a></p>
          </section>
        </Reveal>
      )}

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
              <div className="paso">
                <span className="paso-n">{p.n}</span>
                <div><h3>{p.titulo}</h3><p>{p.texto}</p></div>
              </div>
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
  admin: Admin,          // oculta: no está en el menú, se entra escribiendo #/admin
};

const rutaActual = () => {
  const r = location.hash.replace(/^#\/?/, "") || "inicio";
  return Object.hasOwn(PAGINAS, r) ? r : "inicio";
};

export default function App() {
  const [ruta, setRuta] = useState(rutaActual);
  const [datos, setDatos] = useState({ motos: [], resenas: [], cargado: false, error: false });
  useScrollVars();

  // Trae motos y reseñas del almacén. Se vuelve a llamar cada vez que algo cambia.
  const recargar = async () => {
    try {
      const [motos, resenas] = await Promise.all([almacen.listarMotos(), almacen.listarResenas()]);
      setDatos({ motos, resenas, cargado: true, error: false });
    } catch {
      setDatos((d) => ({ ...d, cargado: true, error: true }));   // sin internet o sin cupo en el servidor
    }
  };
  useEffect(() => { recargar(); }, []);

  // Al volver a la pestaña (o recuperar internet) se revisa si hubo cambios hechos desde otro dispositivo.
  // El almacén no vuelve a pedir nada si los datos tienen menos de 2 minutos.
  useEffect(() => {
    const revisar = () => { if (document.visibilityState === "visible") recargar(); };
    document.addEventListener("visibilitychange", revisar);
    window.addEventListener("focus", revisar);
    window.addEventListener("online", revisar);
    return () => {
      document.removeEventListener("visibilitychange", revisar);
      window.removeEventListener("focus", revisar);
      window.removeEventListener("online", revisar);
    };
  }, []);

  useEffect(() => {
    const cambio = () => { setRuta(rutaActual()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", cambio);
    return () => window.removeEventListener("hashchange", cambio);
  }, []);

  const Pagina = PAGINAS[ruta];
  return (
    <Datos.Provider value={{ motos: datos.motos, resenas: datos.resenas, recargar }}>
      <Cursor />
      <Cabecera ruta={ruta} />
      {/* key={ruta}: al cambiar de pantalla se repite la animación de entrada */}
      <main key={ruta} className={"pagina" + (ruta === "inicio" ? " es-inicio" : "")}>
        {ruta !== "inicio" && <a className="volver" href="#/inicio">← Volver al inicio</a>}
        {datos.error && (
          <p className="aviso error">
            No pudimos cargar el catálogo en este momento. Escríbenos por{" "}
            <a href={linkWhatsApp("Hola, quiero información")} target="_blank" rel="noreferrer">WhatsApp</a> y te atendemos.
          </p>
        )}
        {datos.cargado ? <Pagina /> : <p className="nota">Cargando...</p>}
      </main>
      <Pie />
      <BarraContacto />
    </Datos.Provider>
  );
}