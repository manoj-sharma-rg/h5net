# Production Deployment Script for PMS Integration Platform
# Run with: .\deploy-production.ps1

param(
    [string]$Environment = "Production",
    [string]$ApiPort = "8000",
    [string]$UiPort = "5173",
    [switch]$SkipTests,
    [switch]$SkipBuild
)

Write-Host "🚀 PMS Integration Platform - Production Deployment" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$ProjectRoot = $PSScriptRoot
$ApiPath = Join-Path $ProjectRoot "api"
$UiPath = Join-Path $ProjectRoot "ui"
$DeploymentPath = Join-Path $ProjectRoot "deployment"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "  Environment: $Environment" -ForegroundColor White
Write-Host "  API Port: $ApiPort" -ForegroundColor White
Write-Host "  UI Port: $UiPort" -ForegroundColor White
Write-Host "  Skip Tests: $SkipTests" -ForegroundColor White
Write-Host "  Skip Build: $SkipBuild" -ForegroundColor White
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

$prerequisites = @{
    "dotnet" = "dotnet --version"
    "node" = "node --version"
    "npm" = "npm --version"
}

foreach ($tool in $prerequisites.GetEnumerator()) {
    try {
        $version = Invoke-Expression $tool.Value 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $($tool.Key): $version" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $($tool.Key): Not found" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "  ❌ $($tool.Key): Not found" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Create deployment directory
Write-Host "📁 Creating deployment directory..." -ForegroundColor Yellow
if (Test-Path $DeploymentPath) {
    Remove-Item $DeploymentPath -Recurse -Force
}
New-Item -ItemType Directory -Path $DeploymentPath | Out-Null
Write-Host "  ✅ Deployment directory created" -ForegroundColor Green

# Build and deploy API
Write-Host ""
Write-Host "🔧 Building and deploying API..." -ForegroundColor Yellow

if (-not $SkipBuild) {
    Write-Host "  Building API..." -ForegroundColor White
    Set-Location $ApiPath
    dotnet clean
    dotnet build --configuration Release
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ API build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ API built successfully" -ForegroundColor Green
}

# Publish API
Write-Host "  Publishing API..." -ForegroundColor White
$ApiDeployPath = Join-Path $DeploymentPath "api"
dotnet publish --configuration Release --output $ApiDeployPath --self-contained false

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ API publish failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ API published to $ApiDeployPath" -ForegroundColor Green

# Build and deploy UI
Write-Host ""
Write-Host "🔧 Building and deploying UI..." -ForegroundColor Yellow

if (-not $SkipBuild) {
    Write-Host "  Installing UI dependencies..." -ForegroundColor White
    Set-Location $UiPath
    npm ci --production
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ UI dependency installation failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ UI dependencies installed" -ForegroundColor Green
}

# Build UI
Write-Host "  Building UI..." -ForegroundColor White
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ UI build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ UI built successfully" -ForegroundColor Green

# Copy UI build to deployment
$UiDeployPath = Join-Path $DeploymentPath "ui"
if (Test-Path $UiDeployPath) {
    Remove-Item $UiDeployPath -Recurse -Force
}
Copy-Item (Join-Path $UiPath "dist") $UiDeployPath -Recurse
Write-Host "  ✅ UI deployed to $UiDeployPath" -ForegroundColor Green

# Copy PMS data
Write-Host ""
Write-Host "📁 Copying PMS data..." -ForegroundColor Yellow
$PmsSourcePath = Join-Path $ProjectRoot "pms"
$PmsDeployPath = Join-Path $DeploymentPath "pms"

if (Test-Path $PmsSourcePath) {
    Copy-Item $PmsSourcePath $PmsDeployPath -Recurse
    Write-Host "  ✅ PMS data copied" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ No PMS data found to copy" -ForegroundColor Yellow
}

# Create production configuration
Write-Host ""
Write-Host "⚙️ Creating production configuration..." -ForegroundColor Yellow

$ProductionConfig = @{
    Environment = $Environment
    ApiPort = $ApiPort
    UiPort = $UiPort
    DeploymentPath = $DeploymentPath
    DeployedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Version = "1.0.0"
}

$ConfigPath = Join-Path $DeploymentPath "deployment-config.json"
$ProductionConfig | ConvertTo-Json -Depth 3 | Out-File $ConfigPath -Encoding UTF8
Write-Host "  ✅ Production configuration created" -ForegroundColor Green

# Create startup scripts
Write-Host ""
Write-Host "📜 Creating startup scripts..." -ForegroundColor Yellow

# API startup script
$ApiStartScript = @"
@echo off
cd /d "%~dp0api"
set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_URLS=http://localhost:$ApiPort
dotnet h5net-api.dll
"@

$ApiStartPath = Join-Path $DeploymentPath "start-api.bat"
$ApiStartScript | Out-File $ApiStartPath -Encoding ASCII

# UI startup script
$UiStartScript = @"
@echo off
cd /d "%~dp0ui"
set PORT=$UiPort
npx serve -s . -l $UiPort
"@

$UiStartPath = Join-Path $DeploymentPath "start-ui.bat"
$UiStartScript | Out-File $UiStartPath -Encoding ASCII

# Combined startup script
$CombinedStartScript = @"
@echo off
echo Starting PMS Integration Platform...
echo.
echo Starting API on port $ApiPort...
start "PMS API" cmd /c "%~dp0start-api.bat"
timeout /t 5 /nobreak >nul
echo.
echo Starting UI on port $UiPort...
start "PMS UI" cmd /c "%~dp0start-ui.bat"
echo.
echo PMS Integration Platform is starting...
echo API: http://localhost:$ApiPort
echo UI: http://localhost:$UiPort
echo.
pause
"@

$CombinedStartPath = Join-Path $DeploymentPath "start-platform.bat"
$CombinedStartScript | Out-File $CombinedStartPath -Encoding ASCII

Write-Host "  ✅ Startup scripts created" -ForegroundColor Green

# Run tests if not skipped
if (-not $SkipTests) {
    Write-Host ""
    Write-Host "🧪 Running tests..." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    
    if (Test-Path "tests\run-tests.ps1") {
        & "tests\run-tests.ps1"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ⚠️ Some tests failed, but deployment continues" -ForegroundColor Yellow
        } else {
            Write-Host "  ✅ All tests passed" -ForegroundColor Green
        }
    } else {
        Write-Host "  ⚠️ Test runner not found, skipping tests" -ForegroundColor Yellow
    }
}

# Create deployment summary
Write-Host ""
Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  ✅ API deployed to: $ApiDeployPath" -ForegroundColor Green
Write-Host "  ✅ UI deployed to: $UiDeployPath" -ForegroundColor Green
Write-Host "  ✅ PMS data: $PmsDeployPath" -ForegroundColor Green
Write-Host "  ✅ Configuration: $ConfigPath" -ForegroundColor Green
Write-Host "  ✅ Startup scripts created" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To start the platform:" -ForegroundColor Cyan
Write-Host "  cd $DeploymentPath" -ForegroundColor White
Write-Host "  .\start-platform.bat" -ForegroundColor White
Write-Host ""
Write-Host "📚 Access URLs:" -ForegroundColor Cyan
Write-Host "  API: http://localhost:$ApiPort" -ForegroundColor White
Write-Host "  UI: http://localhost:$UiPort" -ForegroundColor White
Write-Host "  Health: http://localhost:$ApiPort/health" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Production deployment completed successfully!" -ForegroundColor Green 