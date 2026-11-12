@echo off
title Negocios con Alejo - servidor
cd /d "%~dp0"

if not exist node_modules (
  echo Instalando librerias por primera vez, esto tarda un minuto...
  call npm install
)

echo Abriendo la pagina. NO cierres esta ventana mientras la uses.
call npm run dev -- --host --port 5173 --strictPort --open
pause