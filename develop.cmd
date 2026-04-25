@echo off
setlocal

set CONTAINER_NAME=espirometria-ia
set IMAGE_NAME=espirometria-ia
set SHOULD_PULL=1
cd /d "%~dp0"

set PROJECT_ROOT=%CD%
set ENV_FILE=%PROJECT_ROOT%\web\.env
set MODELS_DIR=%PROJECT_ROOT%\ml\models
set RAW_DATA_DIR=%PROJECT_ROOT%\ml\data\raw
set SHOULD_BUILD=1
set FORCE_NO_CACHE=0

if /I "%1"=="rebuild" set SHOULD_BUILD=1
if /I "%1"=="rebuild" set FORCE_NO_CACHE=1
if /I "%1"=="nobuild" set SHOULD_BUILD=0
if /I "%1"=="nopull" set SHOULD_PULL=0
if /I "%2"=="nopull" set SHOULD_PULL=0
if /I "%2"=="rebuild" set SHOULD_BUILD=1
if /I "%2"=="rebuild" set FORCE_NO_CACHE=1
if /I "%2"=="nobuild" set SHOULD_BUILD=0

if "%SHOULD_PULL%"=="1" (
  echo [1/4] Actualizando cambios desde Git...
  git pull --ff-only
  if errorlevel 1 (
    echo Fallo la actualizacion con git pull.
    echo.
    echo Revisa si hay cambios locales o archivos no trackeados que entren en conflicto.
    echo Si queres recrear el contenedor sin actualizar desde Git, usa: develop.cmd nopull
    exit /b 1
  )
) else (
  echo [1/4] Omitiendo git pull por parametro nopull...
)

echo [2/4] Eliminando contenedor anterior si existe...
docker rm -f %CONTAINER_NAME% >nul 2>nul

if "%SHOULD_BUILD%"=="1" (
  if "%FORCE_NO_CACHE%"=="1" (
    echo [3/4] Reconstruyendo imagen sin cache...
    docker build --no-cache -t %IMAGE_NAME% .
  ) else (
    echo [3/4] Reconstruyendo imagen usando cache...
    docker build -t %IMAGE_NAME% .
  )
  if errorlevel 1 (
    echo Fallo el build de Docker.
    exit /b 1
  )
) else (
  echo [3/4] Reutilizando imagen existente...
)

echo [4/4] Creando nuevo contenedor en puerto 6060...
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
echo develop.cmd         ^> hace git pull, reconstruye la imagen usando cache y recrea el contenedor
echo develop.cmd nobuild ^> hace git pull y recrea el contenedor sin rebuild
echo develop.cmd rebuild ^> hace git pull, reconstruye la imagen sin cache y recrea el contenedor
echo develop.cmd nopull  ^> reconstruye usando cache y recrea el contenedor sin actualizar desde Git

endlocal
