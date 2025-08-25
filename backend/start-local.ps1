# Hotel Room Mapper - Backend Local Development Script

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Hotel Room Mapper - Backend Local" -ForegroundColor Cyan  
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Creando directorios necesarios..." -ForegroundColor Yellow
$directories = @("database", "uploads", "uploads\processed", "uploads\thumbnails", "tmp", "logs")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✓ Creado: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Existe: $dir" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Copiando configuracion local..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Copy-Item ".env.local" ".env" -Force
    Write-Host "  ✓ Configuracion copiada de .env.local" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Archivo .env.local no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Verificando dependencias..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  ✓ node_modules encontrado" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "Iniciando servidor backend con SQLite..." -ForegroundColor Green
Write-Host "API estara disponible en: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""

# Iniciar el servidor
npm run dev