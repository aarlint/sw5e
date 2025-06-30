@echo off
echo 🚀 Deploying SW5e Party Worker to Cloudflare...

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
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

:: Deploy the worker
echo 🌍 Deploying worker...
wrangler deploy

if errorlevel 0 (
    echo ✅ Deployment successful!
    echo.
    echo 📋 Next steps:
    echo 1. Copy your worker URL from the deployment output above
    echo 2. Update src/services/partyService.ts with your worker URL
    echo 3. Run 'npm start' in the main project directory
    echo.
    echo 🎉 Your party system is ready!
) else (
    echo ❌ Deployment failed. Please check the error messages above.
    pause
) 