# Motos con Alejo

Sitio web de compra y venta de motocicletas, trámites de tránsito, financiación y préstamos con prenda.

## Estructura del proyecto

- `codigo/react/`: aplicación principal en React + Vite (es la que se despliega en Netlify según `netlify.toml`).
- `imagenes/`: fotos y logotipo publicados por Vite (`publicDir: "../../imagenes"`). Solo deben guardarse aquí archivos destinados a la web.
- `supabase/schema.sql`: esquema de base de datos, políticas RLS, funciones RPC (`catalogo`, `crear_resena`) y bucket `fotos`.
- `codigo/n8n/generar-video.json`: flujo de n8n + Groq (`openai/gpt-oss-120b`) para generar guiones de video desde el panel administrador (`#/admin`).
- `DOCUMENTACION.md`: documentación técnica y funcional completa del sistema.
- `.github/workflows/mantener-activo.yml`: ping automático cada 3 días para evitar que Supabase en plan gratuito se pause por inactividad.

## Variables de entorno (`codigo/react/.env`)

Consulta `codigo/react/.env.example`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY` (clave pública `publishable` / `anon`, nunca `service_role`)
- `VITE_ADMIN_EMAIL`
- `VITE_N8N_GENERAR_URL` (en producción debe ser una URL pública `https://`, no `localhost`)

## Desarrollo local

```bash
cd codigo/react
npm install
npm run dev
```
