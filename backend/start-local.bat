@echo off
echo =====================================
echo Hotel Room Mapper - Backend Local
echo =====================================
echo.

echo Creando directorios necesarios...
if not exist "database" mkdir database
if not exist "uploads" mkdir uploads
if not exist "uploads\processed" mkdir uploads\processed
if not exist "uploads\thumbnails" mkdir uploads\thumbnails
if not exist "tmp" mkdir tmp
if not exist "logs" mkdir logs

echo.
echo Copiando configuracion local...
copy /Y ".env.local" ".env"

echo.
echo Iniciando servidor backend con SQLite...
echo API estara disponible en: http://localhost:3001
echo.

npm run dev