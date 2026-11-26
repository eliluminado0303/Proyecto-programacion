/* =====================================================================
   GENERADOR DE VIDEO CON IA (panel del administrador)
   ---------------------------------------------------------------------
   El administrador elige una moto, escribe (opcional) indicaciones y pulsa "Generar".
   La página llama a la Netlify Function (/.netlify/functions/generar-video) — o a un
   webhook externo si se configura VITE_GENERAR_VIDEO_URL (o VITE_N8N_GENERAR_URL en dev) — que:
     1. comprueba que quien llama es el administrador (con el token de Supabase),
     2. toma los datos de esa moto,
     3. le pide a la IA el guion del video, el caption y los hashtags.
   Aquí solo se muestra el resultado.
   ===================================================================== */
import { useState } from "react";
import { almacen } from "./almacen.js";

const URL_GENERADOR =
  import.meta.env.VITE_GENERAR_VIDEO_URL ||
  (import.meta.env.DEV && import.meta.env.VITE_N8N_GENERAR_URL) ||
  "/api/generar-video";
const ESPERA_MAX_MS = 120000;   // si la IA no responde en 2 minutos, se corta

export default function GeneradorVideo({ motos }) {
  const [motoId, setMotoId] = useState("");
  const [instrucciones, setInstrucciones] = useState("");
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [resultado, setResultado] = useState(null);

  const copiar = async (texto, que) => {
    try { await navigator.clipboard.writeText(texto); setAviso({ tipo: "ok", texto: `${que} copiado.` }); }
    catch { setAviso({ tipo: "error", texto: "No se pudo copiar. Selecciona el texto y cópialo a mano." }); }
  };

  const generar = async (e) => {
    e.preventDefault();
    setAviso(null);
    if (!URL_GENERADOR) return setAviso({ tipo: "error", texto: "No hay dirección configurada para el generador de guiones." });
    if (!motoId) return setAviso({ tipo: "error", texto: "Elige primero la moto." });

    setCargando(true); setResultado(null);
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), ESPERA_MAX_MS);
    try {
      const token = await almacen.tokenSesion();
      const resp = await fetch(URL_GENERADOR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, moto_id: motoId, instrucciones: instrucciones.trim() }),
        signal: control.signal,
      });
      if (resp.status === 401) throw new Error("No se reconoció tu sesión de administrador. Cierra sesión y vuelve a entrar.");
      const datos = await resp.json().catch(() => null);
      if (!resp.ok || !datos || datos.error) throw new Error((datos && datos.error) || "No se pudo generar el guion. Intenta de nuevo en unos segundos.");
      setResultado(datos);
    } catch (err) {
      const esRedLocal = /failed to fetch|networkerror|load failed/i.test(String(err && err.message))
        && /^http:\/\/(localhost|127\.0\.0\.1)\b/i.test(URL_GENERADOR);
      const texto = err.name === "AbortError"
        ? "Se demoró demasiado. Intenta de nuevo."
        : esRedLocal
          ? "No se pudo conectar con n8n local. Verifica que n8n esté encendido en este computador."
          : err.message;
      setAviso({ tipo: "error", texto });
    } finally {
      clearTimeout(reloj);
      setCargando(false);
    }
  };

  const hashtags = resultado ? (resultado.hashtags || []).map((h) => (String(h).startsWith("#") ? h : "#" + h)).join(" ") : "";

  return (
    <>
      <p>Elige la moto y, si quieres, dale indicaciones a la IA. Las indicaciones son opcionales.</p>
      <form className="formulario" onSubmit={generar}>
        <label>Moto *
          <select value={motoId} onChange={(e) => setMotoId(e.target.value)} disabled={cargando}>
            <option value="">— Elige una moto —</option>
            {motos.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}{m.modelo ? ` ${m.modelo}` : ""}{m.estado === "vendido" ? " (vendida)" : ""}</option>
            ))}
          </select>
        </label>
        <label>Indicaciones para el video (opcional)
          <textarea rows={3} value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} disabled={cargando}
            placeholder="Ej: tono más relajado, menciona que se recibe moto en parte de pago…" />
        </label>
        {aviso && <p className={"aviso " + aviso.tipo}>{aviso.texto}</p>}
        <div className="fila-botones">
          <button className="boton" type="submit" disabled={cargando}>{cargando ? "Generando… (puede tardar unos segundos)" : "Generar guion del video"}</button>
        </div>
      </form>

      {resultado && (
        <div className="formulario" style={{ marginTop: 18 }}>
          <label>Prompt del video
            <textarea rows={8} readOnly value={resultado.prompt_video} />
          </label>
          <div className="fila-botones">
            <button type="button" className="boton claro chico" onClick={() => copiar(resultado.prompt_video, "Prompt")}>Copiar prompt</button>
          </div>
          <label>Caption de Instagram
            <textarea rows={3} readOnly value={resultado.caption} />
          </label>
          <label>Hashtags
            <input readOnly value={hashtags} />
          </label>
          <div className="fila-botones">
            <button type="button" className="boton claro chico" onClick={() => copiar(`${resultado.caption}\n\n${hashtags}`, "Caption")}>Copiar caption + hashtags</button>
          </div>
        </div>
      )}
    </>
  );
}
