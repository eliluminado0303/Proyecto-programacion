/* =====================================================================
   ALMACÉN SUPABASE (base de datos real, igual para todos los dispositivos)
   ---------------------------------------------------------------------
   Plan gratis de Supabase: 500 MB de base de datos, 1 GB de fotos, 5 GB de transferencia
   al mes, y el proyecto se PAUSA si pasa 1 semana sin recibir ninguna llamada
   (ver GUIA-SUPABASE.md, paso "Mantener el proyecto activo").
   Por eso este archivo:
     1. Pide motos + reseñas con UNA sola llamada (función catalogo() de la base).
     2. Guarda el resultado en el navegador (CACHE_MS) para no repetirla en cada visita.
     3. Si Supabase no responde, muestra lo último que ese dispositivo vio.
     4. Sube las fotos ya reducidas y con caché largo en el navegador (ahorra transferencia).
   ===================================================================== */
import { createClient } from "@supabase/supabase-js";

const CACHE_MS = 2 * 60 * 1000;           // 2 minutos: lo máximo que tarda un visitante en ver cambios de otro dispositivo (al volver a la pestaña se revisa)
const K_CACHE = "nca_cache_catalogo_v1";
const K_SESION = "nca-admin-auth";        // la sesión del administrador vive solo en la pestaña (sessionStorage)
const BUCKET = "fotos";

// Tamaño de las fotos. Bajarlas ahorra transferencia.
const LADO_MAX = 1000;                    // píxeles del lado más largo
const CALIDAD = 0.72;                     // con esto cada foto queda en ~70-120 KB (el bucket acepta hasta 400 KB)

/* Error con un mensaje ya escrito para el usuario (nuevoError lo deja pasar tal cual). */
const propio = (m) => Object.assign(new Error(m), { propio: true });

/* Convierte cualquier error en un mensaje claro en español. */
function nuevoError(e) {
  if (e && e.propio) return e;
  const msg = String((e && e.message) || "");
  const code = e && e.code;
  if (/invalid login|invalid credentials/i.test(msg)) return new Error("Clave incorrecta.");
  if (/failed to fetch|networkerror|load failed/i.test(msg)) return new Error("No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.");
  if (code === "P0001") return new Error(msg);                                   // mensajes que escribimos en la base de datos
  if (/jwt|token|not authenticated/i.test(msg) || e?.status === 401) return new Error("La sesión venció. Cierra sesión y vuelve a entrar.");
  if (code === "42501" || /row-level security|violates/i.test(msg)) return new Error("No autorizado. Cierra sesión y vuelve a entrar.");
  if (/exceeded|quota|too large|payload/i.test(msg)) return new Error("Una de las fotos pesa demasiado.");
  return new Error("No se pudo completar la acción. Intenta de nuevo en unos minutos.");
}
const ok = ({ data, error }) => { if (error) throw error; return data; };

/* Reduce la foto antes de subirla. Devuelve un texto "data:image/jpeg;base64,..." */
function comprimir(archivo, lado = LADO_MAX, calidad = CALIDAD) {
  return new Promise((resolver, fallo) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const esc = Math.min(1, lado / Math.max(img.width, img.height));
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.round(img.width * esc);
      lienzo.height = Math.round(img.height * esc);
      lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
      URL.revokeObjectURL(url);
      resolver(lienzo.toDataURL("image/jpeg", calidad));
    };
    img.onerror = () => { URL.revokeObjectURL(url); fallo(new Error("No se pudo leer una de las fotos.")); };
    img.src = url;
  });
}

export function crearAlmacenSupabase(url, llave, correoAdmin) {
  const supabase = createClient(url, llave, {
    auth: {
      storageKey: K_SESION,
      storage: window.sessionStorage,     // al cerrar la pestaña, se cierra la sesión del admin
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,          // la página usa rutas con # y no debe confundirlas con enlaces de acceso
    },
  });

  /* Antes de escribir o borrar se comprueba que la sesión del administrador sigue viva.
     Sin sesión, Supabase NO da error: simplemente no borra nada. Por eso se avisa aquí. */
  async function exigirSesion() {
    const { data } = await supabase.auth.getSession();
    if (!data || !data.session) throw propio("La sesión venció. Cierra sesión y vuelve a entrar.");
  }

  /* Sube una foto (texto base64) al bucket y devuelve su dirección pública. */
  async function subirArchivo(dataUrl, carpeta) {
    const blob = await (await fetch(dataUrl)).blob();
    const ruta = `${carpeta}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(ruta, blob, {
      contentType: "image/jpeg",
      cacheControl: "31536000",           // el navegador la guarda 1 año (el nombre es único) -> menos transferencia
    });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
  }

  /* De una dirección pública saca la ruta dentro del bucket (o null si no es de nuestro bucket). */
  const rutaDe = (u) => {
    const marca = `/storage/v1/object/public/${BUCKET}/`;
    const i = typeof u === "string" ? u.indexOf(marca) : -1;
    return i < 0 ? null : decodeURIComponent(u.slice(i + marca.length));
  };
  async function borrarArchivos(urls) {
    const rutas = (urls || []).map(rutaDe).filter(Boolean);
    if (!rutas.length) return;
    try { await supabase.storage.from(BUCKET).remove(rutas); } catch { /* si falla, solo queda un archivo suelto */ }
  }

  /* ---------- Caché del catálogo (motos + reseñas) ---------- */
  let memoria = null;      // { t, motos, resenas }
  let enVuelo = null;      // llamada en curso, para que 2 pedidos al mismo tiempo sean 1 solo

  const leerCache = () => {
    try { const c = JSON.parse(localStorage.getItem(K_CACHE)); return c && Array.isArray(c.motos) ? c : null; }
    catch { return null; }
  };
  const guardarCache = (c) => { try { localStorage.setItem(K_CACHE, JSON.stringify(c)); } catch { /* sin espacio: no pasa nada */ } };
  const invalidar = () => { memoria = null; try { localStorage.removeItem(K_CACHE); } catch { /* nada */ } };

  function catalogo() {
    const c = memoria || (memoria = leerCache());
    if (c && Date.now() - c.t < CACHE_MS) return Promise.resolve(c);
    if (enVuelo) return enVuelo;
    enVuelo = supabase.rpc("catalogo")
      .then(ok)
      .then((r) => {
        memoria = { t: Date.now(), motos: r.motos || [], resenas: r.resenas || [] };
        guardarCache(memoria);
        return memoria;
      })
      .catch((e) => {
        const vieja = memoria || leerCache();
        if (vieja) {                                   // sin conexión o servidor caído: se muestra lo último visto
          vieja.t = Date.now() - CACHE_MS + 60 * 1000; // y se reintenta en 1 minuto, no en cada clic
          memoria = vieja;
          return vieja;
        }
        throw nuevoError(e);
      })
      .finally(() => { enVuelo = null; });
    return enVuelo;
  }

  /* Envuelve las acciones de escritura: traduce errores y deja el caché limpio. */
  async function accion(fn) {
    try { const r = await fn(); invalidar(); return r; }
    catch (e) { throw nuevoError(e); }
  }

  return {
    modo: "supabase",

    /* Descarta lo guardado en el navegador para que la próxima lectura vaya al servidor. */
    refrescar() { invalidar(); },

    /* ---- Motos ---- */
    async listarMotos() { return (await catalogo()).motos; },

    async guardarMoto(moto) {            // sin id = moto nueva; con id = actualiza
      return accion(async () => {
        await exigirSesion();
        const fotos = [];
        for (const f of moto.fotos || []) fotos.push(f.startsWith("data:") ? await subirArchivo(f, "motos") : f);
        const fila = {
          nombre: moto.nombre, modelo: moto.modelo || "", km: moto.km || "", precio: moto.precio || "",
          color: moto.color || "", descripcion: moto.descripcion || "", video: moto.video || "",
          estado: moto.estado || "disponible", fotos,
        };
        if (moto.id) {
          const antes = ok(await supabase.from("motos").select("fotos").eq("id", moto.id).maybeSingle());
          const filas = ok(await supabase.from("motos").update(fila).eq("id", moto.id).select("id"));
          if (!filas || filas.length === 0) throw propio("No se encontró esa moto (quizá ya la borraron desde otro dispositivo). Recarga la página.");
          await borrarArchivos((antes?.fotos || []).filter((u) => !fotos.includes(u)));   // fotos quitadas -> se liberan
        } else {
          ok(await supabase.from("motos").insert(fila));
        }
      });
    },
    async borrarMoto(id) {
      return accion(async () => {
        await exigirSesion();
        const antes = ok(await supabase.from("motos").select("fotos").eq("id", id).maybeSingle());
        ok(await supabase.from("motos").delete().eq("id", id));
        await borrarArchivos(antes?.fotos);
      });
    },
    // Para el formulario: la foto se reduce aquí y se sube cuando se guarda la moto o la reseña.
    async subirFoto(archivo) { return comprimir(archivo); },

    /* ---- Reseñas ---- */
    async listarResenas() { return (await catalogo()).resenas; },
    async crearResena({ nombre, tipo, estrellas, texto, fotos = [] }) {
      return accion(async () => {
        const urls = [];
        for (const f of fotos) urls.push(await subirArchivo(f, "resenas"));
        ok(await supabase.rpc("crear_resena", {
          p_nombre: nombre, p_tipo: tipo, p_estrellas: estrellas, p_texto: texto, p_fotos: urls,
        }));
      });
    },
    async borrarResena(id) {
      return accion(async () => {
        await exigirSesion();
        const antes = ok(await supabase.from("resenas").select("fotos").eq("id", id).maybeSingle());
        ok(await supabase.from("resenas").delete().eq("id", id));
        await borrarArchivos(antes?.fotos);
      });
    },

    /* ---- Administrador (usuario real de Supabase Auth, clave cifrada en el servidor) ---- */
    async iniciarSesion(clave) {
      try { ok(await supabase.auth.signInWithPassword({ email: correoAdmin, password: clave })); }
      catch (e) { throw nuevoError(e); }
    },
    async cambiarClave(actual, nueva) {
      try {
        ok(await supabase.auth.signInWithPassword({ email: correoAdmin, password: actual }));   // comprueba la clave actual
        ok(await supabase.auth.updateUser({ password: nueva }));
      } catch (e) {
        throw /invalid login|invalid credentials/i.test(String(e && e.message))
          ? new Error("La clave actual no es correcta.") : nuevoError(e);
      }
    },
    cerrarSesion() { supabase.auth.signOut().catch(() => {}); },
    /* Token de la sesión del administrador: se le envía a n8n para que compruebe quién llama. */
    
async tokenSesion() {
  // Solicitar a Supabase una sesión actualizada.
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data || !data.session) {
    throw propio(
      "No se pudo renovar la sesión. Cierra sesión y vuelve a entrar."
    );
  }

  return data.session.access_token;
},

    haySesion() {
      try { const s = JSON.parse(window.sessionStorage.getItem(K_SESION)); return !!(s && s.access_token); }
      catch { return false; }
    },

    /* En producción NO se puede borrar todo desde el panel (el botón se oculta en App.jsx). */
    async restablecer() { throw new Error("Esta opción solo existe en el modo de prueba."); },
  };
}