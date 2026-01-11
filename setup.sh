#!/bin/bash
# RajaOTP Landing Page - Project Setup & Deployment Script
# This script helps you get started and deploy the project

echo "🎉 RajaOTP Landing Page - Setup Assistant"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Run development server
echo "🚀 Starting development server..."
echo "📍 Website will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
