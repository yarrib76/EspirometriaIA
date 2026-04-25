@echo off
setlocal

set CONTAINER_NAME=espirometria-ia
set IMAGE_NAME=espirometria-ia
cd /d "%~dp0"

set PROJECT_ROOT=%CD%
set ENV_FILE=%PROJECT_ROOT%\web\.env
set MODELS_DIR=%PROJECT_ROOT%\ml\models
set RAW_DATA_DIR=%PROJECT_ROOT%\ml\data\raw
set SHOULD_BUILD=0

if /I "%1"=="build" set SHOULD_BUILD=1
if /I "%1"=="rebuild" set SHOULD_BUILD=1

echo [1/3] Eliminando contenedor anterior si existe...
docker rm -f %CONTAINER_NAME% >nul 2>nul

if "%SHOULD_BUILD%"=="1" (
  echo [2/3] Reconstruyendo imagen...
  docker build --no-cache -t %IMAGE_NAME% .
  if errorlevel 1 (
    echo Fallo el build de Docker.
    exit /b 1
  )
) else (
  echo [2/3] Reutilizando imagen existente...
)

echo [3/3] Creando nuevo contenedor en puerto 6060...
docker run -d ^
  --name %CONTAINER_NAME% ^
  -p 6060:6060 ^
  --env-file "%ENV_FILE%" ^
  -e AUTO_BOOTSTRAP_MODEL=false ^
  -e PORT=6060 ^
  -v "%MODELS_DIR%:/app/ml/models" ^
  -v "%RAW_DATA_DIR%:/app/ml/data/raw" ^
  %IMAGE_NAME%

if errorlevel 1 (
  echo Fallo la creacion del contenedor.
  echo Si la imagen no existe aun, ejecuta: develop.cmd build
  exit /b 1
)

echo.
echo Contenedor recreado correctamente.
echo URL: http://localhost:6060
echo Logs:
echo docker logs %CONTAINER_NAME%
echo.
echo Uso:
echo develop.cmd         ^> recrea el contenedor sin rebuild
echo develop.cmd build   ^> reconstruye la imagen y recrea el contenedor

endlocal
