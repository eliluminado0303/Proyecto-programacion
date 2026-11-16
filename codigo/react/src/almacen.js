/* =====================================================================
   ALMACÉN DE DATOS: elige DÓNDE se guardan motos, reseñas y sesión.
   ---------------------------------------------------------------------
   - Con las variables VITE_SUPABASE_URL, VITE_SUPABASE_KEY y VITE_ADMIN_EMAIL -> Supabase (base de datos real).
   - Sin variables y trabajando en tu computador (npm run dev) -> modo local de prueba.
   - Sin variables en la página publicada -> NO se cae a modo local (se vería "funcionando"
     pero sin guardar nada para los demás): muestra un error claro.
   Todo el resto del proyecto solo llama a las funciones de "almacen".
   ===================================================================== */
import { almacenLocal } from "./almacenLocal.js";
import { crearAlmacenSupabase } from "./almacenSupabase.js";

const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL;
const LLAVE = import.meta.env.VITE_SUPABASE_KEY;          // la clave PÚBLICA (publishable / anon), nunca la secreta
const CORREO_ADMIN = import.meta.env.VITE_ADMIN_EMAIL;

const sinConfigurar = () => { throw new Error("La página no está conectada a la base de datos (faltan las variables VITE_SUPABASE_URL, VITE_SUPABASE_KEY y VITE_ADMIN_EMAIL)."); };
const almacenSinConexion = {
  modo: "sin-configurar",
  listarMotos: sinConfigurar, guardarMoto: sinConfigurar, borrarMoto: sinConfigurar, subirFoto: sinConfigurar,
  listarResenas: sinConfigurar, crearResena: sinConfigurar, borrarResena: sinConfigurar,
  iniciarSesion: sinConfigurar, cambiarClave: sinConfigurar, restablecer: sinConfigurar,
  cerrarSesion() {}, haySesion: () => false,
};

export const almacen =
  URL_SUPABASE && LLAVE && CORREO_ADMIN ? crearAlmacenSupabase(URL_SUPABASE, LLAVE, CORREO_ADMIN)
  : import.meta.env.DEV ? almacenLocal
  : almacenSinConexion;
