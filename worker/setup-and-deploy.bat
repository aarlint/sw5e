@echo off
echo 🚀 Setting up SW5e Party Worker for Cloudflare...

:: Check if wrangler is installed
where wrangler >nul 2>nul
if errorlevel 1 (
    echo ❌ Wrangler CLI not found. Installing...
    npm install -g wrangler
)

:: Check if logged in to Cloudflare
wrangler whoami >nul 2>nul
if errorlevel 1 (
    echo 🔐 Please login to Cloudflare:
    wrangler login
    if errorlevel 1 (
        echo ❌ Login failed. Please try again.
        pause
        exit /b 1
    )
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: Create KV namespace
echo 🗄️ Creating KV namespace for party storage...
wrangler kv:namespace create "PARTY_STORAGE" > kv_output.txt 2>&1
if errorlevel 1 (
    echo ❌ Failed to create KV namespace. Check output:
    type kv_output.txt
    del kv_output.txt
    pause
    exit /b 1
)

:: Extract the namespace ID from the output
for /f "tokens=*" %%i in (kv_output.txt) do (
    echo %%i | findstr "id" >nul
    if not errorlevel 1 (
        set "KV_LINE=%%i"
    )
)
del kv_output.txt

:: Create preview namespace
echo 🗄️ Creating preview KV namespace...
wrangler kv:namespace create "PARTY_STORAGE" --preview > kv_preview_output.txt 2>&1
if errorlevel 1 (
    echo ❌ Failed to create preview KV namespace. Check output:
    type kv_preview_output.txt
    del kv_preview_output.txt
    pause
    exit /b 1
)

:: Extract the preview namespace ID from the output
for /f "tokens=*" %%i in (kv_preview_output.txt) do (
    echo %%i | findstr "preview_id" >nul
    if not errorlevel 1 (
        set "KV_PREVIEW_LINE=%%i"
    )
)
del kv_preview_output.txt

:: Update wrangler.toml with the namespace information
echo 📝 Updating wrangler.toml with KV namespace...
(
echo name = "sw5e-party-worker"
echo main = "src/index.ts"
echo compatibility_date = "2024-01-15"
echo.
echo [[kv_namespaces]]
echo binding = "PARTY_STORAGE"
echo %KV_LINE%
echo %KV_PREVIEW_LINE%
) > wrangler.toml

:: Deploy the worker
echo 🌍 Deploying worker...
wrangler deploy
if errorlevel 1 (
    echo ❌ Deployment failed. Please check the error messages above.
    pause
    exit /b 1
)

echo ✅ Setup and deployment successful!
echo.
echo 📋 Next steps:
echo 1. Copy your worker URL from the deployment output above
echo 2. Update ../src/services/partyService.ts with your worker URL
echo 3. Run 'npm start' in the main project directory
echo.
echo 🎉 Your party system is ready!
pause 