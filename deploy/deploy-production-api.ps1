# Production PMS API Deployment Script
param(
    [string]$Environment = "Production",
    [string]$TargetPath = "deployment-production",
    [switch]$UseDocker
)

Write-Host "🚀 Deploying PMS API to $Environment environment..." -ForegroundColor Green

# Clean previous deployment
if (Test-Path $TargetPath) {
    Remove-Item -Recurse -Force $TargetPath
}
New-Item -ItemType Directory -Path $TargetPath | Out-Null

# Build API for production
Write-Host "📦 Building API for production..." -ForegroundColor Yellow
dotnet publish api/api.csproj -c Release -o "$TargetPath/api" --self-contained true -r win-x64

# Copy PMS data
Write-Host "📁 Copying PMS data..." -ForegroundColor Yellow
if (Test-Path "pms") {
    Copy-Item -Recurse "pms" "$TargetPath/pms"
}

# Create production startup script
$startScript = @"
@echo off
echo Starting PMS API in Production mode...
cd /d "%~dp0api"
set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_URLS=http://+:8000
dotnet api.dll
"@

$startScript | Out-File -FilePath "$TargetPath/start-production-api.bat" -Encoding ASCII

# Create production configuration
$productionConfig = @"
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Environment": "Production",
  "Jwt": {
    "Key": "CHANGE-THIS-TO-A-SECURE-RANDOM-KEY",
    "Issuer": "h5net-pms",
    "Audience": "h5net-pms-api"
  },
  "RateLimiting": {
    "RequestsPerMinute": 100,
    "RequestsPerHour": 1000
  },
  "Production": {
    "EnableDevelopmentControllers": false,
    "EnableSwagger": false,
    "EnableDetailedErrors": false
  }
}
"@

$productionConfig | Out-File -FilePath "$TargetPath/api/appsettings.Production.json" -Encoding UTF8

# Create Docker deployment if requested
if ($UseDocker) {
    Write-Host "🐳 Creating Docker deployment..." -ForegroundColor Yellow
    
    $dockerCompose = @"
version: '3.8'
services:
  pms-api:
    build:
      context: .
      dockerfile: Dockerfile.production
    ports:
      - "8000:8000"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
    volumes:
      - ./pms:/app/pms
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
"@

    $dockerCompose | Out-File -FilePath "$TargetPath/docker-compose.production.yml" -Encoding UTF8
}

# Create deployment info
$deploymentInfo = @"
# Production PMS API Deployment
Deployed: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Environment: $Environment
API Version: $(dotnet --version)

## Available Endpoints:
- POST /api/pms/{pmscode} - Process PMS feeds
- GET /health - Health check
- GET /health/ready - Readiness check
- POST /api/auth/login - Authentication

## Startup:
./start-production-api.bat

## Docker (if available):
docker-compose -f docker-compose.production.yml up -d
"@

$deploymentInfo | Out-File -FilePath "$TargetPath/README.md" -Encoding UTF8

Write-Host "✅ Production deployment completed!" -ForegroundColor Green
Write-Host "📁 Deployment location: $TargetPath" -ForegroundColor Cyan
Write-Host "🚀 Start with: cd $TargetPath && ./start-production-api.bat" -ForegroundColor Cyan 