#!/bin/bash

echo "🚀 Building Motion Lite for Netlify deployment..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Copy step no longer needed; `_redirects` is bundled from `public/`
echo "📋 Netlify redirects will be included automatically from public/_redirects"

# Verify build output
echo "✅ Build complete! Checking output..."
echo "📁 Build output structure:"
ls -la dist/
echo ""
echo "📦 Assets:"
ls -la dist/assets/

echo ""
echo "🎉 Your project is ready for Netlify manual upload!"
echo "📤 Option A: Drag the 'dist' folder to Netlify's dashboard"
echo "🔗 Option B: Creating ZIP artifact for upload..."
(
  cd dist && zip -rq ../site.zip .
)
echo "📦 Created site.zip at project root. Upload this ZIP in Netlify → Deploys → Upload a deploy."


