#!/bin/bash

# Docker entrypoint script for PMS Integration Platform

set -e

echo "🚀 Starting PMS Integration Platform..."

# Set environment variables
export ASPNETCORE_ENVIRONMENT=${ASPNETCORE_ENVIRONMENT:-Production}
export ASPNETCORE_URLS=${ASPNETCORE_URLS:-http://+:8000}

# Start the API
echo "📡 Starting API server..."
dotnet h5net-api.dll &

# Wait for API to start
echo "⏳ Waiting for API to start..."
sleep 10

# Check if API is healthy
echo "🔍 Checking API health..."
for i in {1..30}; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ API is healthy"
        break
    fi
    echo "⏳ Waiting for API to be ready... (attempt $i/30)"
    sleep 2
done

# Start UI server
echo "🌐 Starting UI server..."
cd wwwroot
serve -s . -l 3000 &

# Wait for UI to start
sleep 5

echo "🎉 PMS Integration Platform is running!"
echo "📡 API: http://localhost:8000"
echo "🌐 UI: http://localhost:3000"
echo "🔍 Health: http://localhost:8000/health"

# Keep container running
wait 