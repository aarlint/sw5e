#!/bin/bash

echo "🚀 Deploying SW5e Party Worker to Cloudflare..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare:"
    wrangler login
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Deploy the worker
echo "🌍 Deploying worker..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy your worker URL from the deployment output above"
    echo "2. Update src/services/partyService.ts with your worker URL"
    echo "3. Run 'npm start' in the main project directory"
    echo ""
    echo "🎉 Your party system is ready!"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi 