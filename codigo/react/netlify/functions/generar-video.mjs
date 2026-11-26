/* =====================================================================
   NETLIFY FUNCTION: Generador de guiones de video con IA (Gemini)
   ---------------------------------------------------------------------
   Endpoint: POST /.netlify/functions/generar-video
   Variables en Netlify (Site configuration > Environment variables):
     - GEMINI_API_KEY  (OBLIGATORIA, secreta, obtenida gratis en aistudio.google.com/apikey)
     - SUPABASE_URL    (opcional, usa el proyecto por defecto)
     - SUPABASE_KEY    (opcional, clave pública publishable)
     - ADMIN_EMAILS    (opcional, correos autorizados separados por coma)
   ===================================================================== */

const MODELO_GROQ = "openai/gpt-oss-120b";
const MODELO_GEMINI = "gemini-2.5-flash";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://kuxgkrkuqufxydmlhauc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || "sb_publishable_-FB8Gy5AF-rMhmI-BBKTWg_k9r2oxpW";

const ADMINS_DEFECTO = ["marianabedoya0110@gmail.com", "ditangello@gmail.com"];
const ADMINS = new Set([
  ...ADMINS_DEFECTO,
  ...String(process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });

const SISTEMA = `
Eres el creativo audiovisual y guionista de "Motos con Alejo",
un negocio colombiano dedicado a la compra y venta de motocicletas.

Tu trabajo es crear guiones comerciales naturales, dinámicos
y originales para videos de Instagram, además del texto
de publicación correspondiente.

PRESENTADOR:

Alejo es el dueño del negocio y el protagonista de los videos.
Él presenta las motocicletas de manera cercana, espontánea
y natural, como alguien que comparte contenido en sus propias
redes sociales, no como un presentador que recita publicidad.

OBJETIVO:

Crear un video atractivo que permita conocer la motocicleta,
despertar interés y motivar a los espectadores a contactar
por WhatsApp o conocer otras motos disponibles en el perfil.

1. DURACIÓN Y DIÁLOGO

El video debe tener una duración máxima de 30 segundos.

El diálogo debe tener aproximadamente entre 45 y 65 palabras.
No cuentes las acciones visuales como palabras habladas.

La presentación debe ser ágil, natural y atractiva.
Aprovecha el tiempo para presentar la motocicleta sin apresurar
el diálogo ni convertirlo en una enumeración de características.

El diálogo debe poder pronunciarse naturalmente dentro
de los 30 segundos, incluyendo las invitaciones comerciales.

Si la información disponible no permite alcanzar esa extensión
sin repetir o inventar, prioriza la naturalidad y la veracidad.

2. LIBERTAD CREATIVA Y NARRATIVA

Cada video debe sentirse diferente y tener personalidad propia.

No utilices siempre la misma introducción, estructura,
secuencia de acciones, posición de cámara o cierre visual.

No conviertas todos los guiones en una presentación de Alejo
parado frente a la moto, mirando al celular y hablando.

Puedes proponer distintas maneras de presentar la moto:
- Alejo grabándose en primer plano mientras habla.
- Un inicio espontáneo con la cámara en movimiento.
- Alejo acercándose a la motocicleta.
- Tomas desde la perspectiva de Alejo, como si estuviera
  mostrando la moto a sus seguidores.
- Cambios entre planos de Alejo y planos de la motocicleta.
- Acercamientos y recorridos visuales alrededor de la moto.
- Alejo caminando, interactuando con la motocicleta
  o cambiando de posición mientras presenta sus características.
- Tomas de la motocicleta desde diferentes perspectivas.
- Alejo sentado en la motocicleta o montándose en ella.
- Una toma final en la que Alejo se aleja conduciéndola,
  cuando tenga sentido o el administrador lo solicite.

Estas son posibilidades, no una lista de pasos obligatorios.
Puedes proponer otras acciones sencillas y realistas.

Utiliza recursos propios del contenido espontáneo para redes:
cámara en mano, perspectiva en primera persona,
planos cercanos, cambios naturales de encuadre,
movimientos de cámara y transiciones visuales.

También puedes plantear momentos en los que Alejo
se grabe hablando y después cambie la cámara para mostrar
la motocicleta, como sucede habitualmente en videos
espontáneos de redes sociales.

No es necesario describir todos estos recursos en cada video.
Selecciona los que mejor funcionen para cada presentación.

La creatividad debe sentirse orgánica, como un video que
Alejo realmente publicaría en sus redes sociales.

3. INDICACIONES DEL ADMINISTRADOR

Las instrucciones particulares proporcionadas por el administrador
son importantes y deben influir directamente en el resultado.

Pueden establecer:
- Cómo debe comenzar el video.
- Qué acciones debe realizar Alejo.
- Cómo debe grabarse la motocicleta.
- Qué estilo narrativo o audiovisual utilizar.
- Qué característica verificada debe recibir mayor atención.
- Qué tipo de cierre se desea.
- Qué sensación debe transmitir la presentación.

Interpreta estas indicaciones con libertad creativa
y procura cumplirlas de manera concreta.

Si el administrador solicita una acción específica,
incorpórala realmente en el guion. No la sustituyas
por una acción genérica ni la ignores por seguir
una estructura habitual.

Las indicaciones particulares pueden modificar la estructura,
el orden, las acciones, los movimientos de cámara,
el estilo y la narrativa.

Únicamente deben limitarse cuando impliquen inventar datos,
atributos, condiciones o promesas sobre la motocicleta
o el negocio que no estén confirmados.

4. VERACIDAD DE LA INFORMACIÓN

Utiliza exclusivamente los datos proporcionados
en la información de la motocicleta.

No inventes ni supongas:
- Precio o kilometraje.
- Cilindraje, potencia, rendimiento o consumo.
- Estado mecánico o estético.
- Garantías, accesorios o características técnicas.
- Beneficios, ventajas o servicios del negocio.
- Condiciones de financiación, entrega o pruebas.
- Información sobre documentos, matrícula o traspaso.

No afirmes que una motocicleta está como nueva,
en excelente estado, es confiable o tiene documentos en regla,
salvo que esa información aparezca expresamente en los datos.

5. FIDELIDAD A LA DESCRIPCIÓN ORIGINAL

Respeta el significado y las expresiones de la descripción.
No cambies expresiones como "Segundo dueño" por "segunda dueña"
ni "Papeles nuevos" por "papeles renovados".

6. ACCIONES Y COHERENCIA VISUAL

Alejo debe ser el único presentador y protagonista.
Las acciones deben ser físicamente posibles y coherentes.
No describas objetos, documentos, llaves, placas o accesorios no confirmados.
Si Alejo aparece conduciendo, plantea la grabación de manera realista y segura.

7. DIÁLOGO

Escribe en español colombiano natural, cercano y directo.
Todo lo que Alejo diga en voz alta debe estar entre comillas.
Las acciones visuales deben escribirse en tercera persona, sin comillas.

8. ESTRUCTURA Y CIERRE COMERCIAL

CIERRE OBLIGATORIO:
Termina siempre el diálogo con una invitación comercial
que incluya estas dos posibilidades:
- Invitar a contactar por WhatsApp para obtener información
  sobre la motocicleta presentada.
- Invitar a visitar el enlace disponible en la descripción
  del perfil de Instagram para conocer otras motocicletas disponibles.

No inventes números de WhatsApp ni direcciones web.

9. CAPTION Y HASHTAGS

El caption debe ser corto, atractivo y natural, con emojis moderados
y sin agregar información que no esté en los datos.
Incluye entre 3 y 4 hashtags reales relacionados con la moto y el sector.

10. FORMATO DE RESPUESTA

Devuelve exclusivamente un JSON válido con las claves:
"prompt_video", "caption" y "hashtags".
El campo "prompt_video" debe ser un único bloque de texto continuo,
sin dividir en escenas, tomas, apartados ni listas.
"hashtags" debe ser una lista de textos.
`;

function extraerJson(textoCrudo) {
  const limpio = String(textoCrudo || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const r = JSON.parse(limpio);
  if (!r.prompt_video || !r.caption || !Array.isArray(r.hashtags)) {
    throw new Error("Respuesta incompleta de la IA.");
  }
  return r;
}

async function llamarGroq(apiKey, usuario) {
  const clave = apiKey.replace(/^Bearer\s+/i, "").trim();
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${clave}` },
    body: JSON.stringify({
      model: MODELO_GROQ,
      messages: [
        { role: "system", content: SISTEMA },
        { role: "user", content: usuario },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    }),
  });
  const datos = await resp.json().catch(() => null);
  if (!resp.ok) throw new Error(`Groq: ${datos?.error?.message || `HTTP ${resp.status}`}`);
  const texto = datos?.choices?.[0]?.message?.content;
  if (typeof texto !== "string" || !texto.trim()) throw new Error("Groq no devolvió contenido.");
  return extraerJson(texto);
}

async function llamarGemini(apiKey, usuario) {
  const clave = apiKey.replace(/^Bearer\s+/i, "").trim();
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_GEMINI}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": clave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SISTEMA }] },
        contents: [{ role: "user", parts: [{ text: usuario }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          responseSchema: {
            type: "OBJECT",
            properties: {
              prompt_video: { type: "STRING" },
              caption: { type: "STRING" },
              hashtags: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["prompt_video", "caption", "hashtags"],
          },
        },
      }),
    }
  );
  const datos = await resp.json().catch(() => null);
  if (!resp.ok) throw new Error(`Gemini: ${datos?.error?.message || `HTTP ${resp.status}`}`);
  const candidato = datos?.candidates?.[0];
  const texto = (candidato?.content?.parts || []).map((p) => p.text || "").join("").trim();
  if (!texto) throw new Error("Gemini no devolvió contenido.");
  return extraerJson(texto);
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!groqKey && !geminiKey) {
    return json({ error: "Falta configurar GROQ_API_KEY o GEMINI_API_KEY en Netlify (Environment variables)." }, 500);
  }

  let entrada;
  try { entrada = await req.json(); } catch { return json({ error: "Petición inválida." }, 400); }

  const token = String(entrada?.token || "").trim();
  const motoId = String(entrada?.moto_id || "").trim();
  const instrucciones = String(entrada?.instrucciones || "").trim().slice(0, 1000);

  if (!token) return json({ error: "No autorizado" }, 401);
  if (!motoId) return json({ error: "Falta elegir la moto." }, 400);

  let user;
  try {
    const authResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!authResp.ok) return json({ error: "No autorizado" }, 401);
    user = await authResp.json();
  } catch {
    return json({ error: "No se pudo verificar tu sesión con Supabase." }, 502);
  }

  if (!ADMINS.has(String(user?.email || "").toLowerCase())) return json({ error: "No autorizado" }, 401);

  let moto;
  try {
    const catResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/catalogo`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!catResp.ok) return json({ error: "No se pudo consultar el catálogo en Supabase." }, 502);
    const catalogo = await catResp.json();
    moto = (catalogo.motos || []).find((x) => String(x.id) === motoId);
  } catch {
    return json({ error: "Error de conexión al consultar las motos." }, 502);
  }

  if (!moto) return json({ error: "No se encontró esa moto en el catálogo." }, 404);

  const usuario =
    `INFORMACIÓN DE LA MOTOCICLETA:\n\n` +
    `Nombre: ${moto.nombre}\nModelo: ${moto.modelo || ""}\nKilometraje: ${moto.km || ""}\n` +
    `Precio: ${moto.precio || ""}\nColor: ${moto.color || ""}\nDescripción original: ${moto.descripcion || ""}\n\n` +
    (instrucciones
      ? `INDICACIONES PARTICULARES DEL ADMINISTRADOR:\n\n${instrucciones}\n\nTen en cuenta estas indicaciones al construir el guion. Intégralas de forma concreta en las acciones, la narrativa, los planos, el diálogo o el cierre, según corresponda. Respeta siempre la veracidad de los datos de la motocicleta.`
      : `No se proporcionaron indicaciones particulares.\nCrea una presentación original y espontánea.\nEvita repetir estructuras utilizadas en otros videos.`);

  const proveedores = [];
  if (groqKey) proveedores.push({ nombre: "groq", fn: () => llamarGroq(groqKey, usuario) });
  if (geminiKey) proveedores.push({ nombre: "gemini", fn: () => llamarGemini(geminiKey, usuario) });

  const errores = [];
  for (const p of proveedores) {
    try {
      const r = await p.fn();
      return json({
        ok: true,
        proveedor: p.nombre,
        moto: { id: moto.id, nombre: moto.nombre },
        prompt_video: r.prompt_video,
        caption: r.caption,
        hashtags: r.hashtags,
      });
    } catch (err) {
      errores.push(err.message);
    }
  }

  return json({ error: `No se pudo generar el guion con la IA (${errores.join(" | ")}). Intenta de nuevo en unos segundos.` }, 502);
}
