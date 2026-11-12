/* =====================================================================
   ALMACÉN DE DATOS (motos, reseñas y sesión del administrador)
   ---------------------------------------------------------------------
   MODO LOCAL (el de ahora): todo se guarda en el navegador (localStorage).
   Sirve para probar el diseño y el panel de administrador, PERO:
     - lo que guardes solo lo ves tú, en este navegador y este computador;
     - la clave de administrador está en el código, así que NO es segura.
   Al publicar la página, solo se reemplaza ESTE archivo por uno que usa una
   base de datos en internet con inicio de sesión real. El resto del proyecto
   no cambia, porque todo lo demás solo llama a las funciones de "almacen".
   ===================================================================== */
import { vehiculos as motosIniciales, CLAVE_ADMIN_LOCAL } from "./datos.js";

const K_MOTOS = "nca_motos_v1";
const K_RESENAS = "nca_resenas_v1";
const K_SESION = "nca_sesion_admin";

const leer = (clave, defecto) => {
  try { const t = localStorage.getItem(clave); return t ? JSON.parse(t) : defecto; } catch { return defecto; }
};
const escribir = (clave, valor) => {
  try { localStorage.setItem(clave, JSON.stringify(valor)); }
  catch { throw new Error("No hay más espacio en el navegador. Usa menos fotos o bórrale fotos a otra moto."); }
};

// La primera vez, el catálogo se llena con las motos de datos.js.
function motos() {
  let lista = leer(K_MOTOS, null);
  if (!lista) {
    lista = motosIniciales.map((v, i) => ({ ...v, id: "base-" + i }));
    escribir(K_MOTOS, lista);
  }
  return lista;
}
const resenas = () => leer(K_RESENAS, []);

// Reduce la foto (máx. 1280 px) para que ocupe poco espacio.
function comprimir(archivo, lado = 1280, calidad = 0.82) {
  return new Promise((ok, fallo) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const esc = Math.min(1, lado / Math.max(img.width, img.height));
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.round(img.width * esc);
      lienzo.height = Math.round(img.height * esc);
      lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
      URL.revokeObjectURL(url);
      ok(lienzo.toDataURL("image/jpeg", calidad));
    };
    img.onerror = () => { URL.revokeObjectURL(url); fallo(new Error("No se pudo leer una de las fotos.")); };
    img.src = url;
  });
}

export const almacen = {
  modo: "local",

  /* ---- Motos ---- */
  async listarMotos() { return motos(); },
  async guardarMoto(moto) {            // sin id = moto nueva; con id = actualiza
    const lista = motos();
    const i = moto.id ? lista.findIndex((m) => m.id === moto.id) : -1;
    if (i >= 0) lista[i] = moto;
    else lista.unshift({ ...moto, id: "m-" + Date.now() });
    escribir(K_MOTOS, lista);
  },
  async borrarMoto(id) { escribir(K_MOTOS, motos().filter((m) => m.id !== id)); },
  async subirFoto(archivo) { return comprimir(archivo); },

  /* ---- Reseñas: se publican al instante; el administrador puede eliminarlas ---- */
  async listarResenas() { return resenas(); },
  async crearResena({ nombre, estrellas, texto }) {
    const lista = resenas();
    lista.unshift({ id: "r-" + Date.now(), nombre, estrellas, texto, fecha: new Date().toISOString() });
    escribir(K_RESENAS, lista);
  },
  async borrarResena(id) { escribir(K_RESENAS, resenas().filter((r) => r.id !== id)); },

  /* ---- Administrador ---- */
  async iniciarSesion(clave) {
    if (clave !== CLAVE_ADMIN_LOCAL) throw new Error("Clave incorrecta.");
    sessionStorage.setItem(K_SESION, "1");
  },
  cerrarSesion() { sessionStorage.removeItem(K_SESION); },
  haySesion() { return sessionStorage.getItem(K_SESION) === "1"; },

  /* Borra todo lo guardado y vuelve a los datos de ejemplo. */
  async restablecer() { localStorage.removeItem(K_MOTOS); localStorage.removeItem(K_RESENAS); },
};