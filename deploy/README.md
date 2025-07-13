# Deployment Directory

This directory contains all deployment-related files for the PMS Integration Platform.

## 📁 **Files Overview**

### 🚀 **deploy-production.ps1**
- **Purpose**: PowerShell script for automated production deployment
- **Features**: 
  - Builds API and UI
  - Creates deployment package
  - Generates startup scripts
  - Runs tests
  - Creates production configuration
- **Usage**: `.\deploy-production.ps1 -Environment Production`

### 🐳 **Dockerfile**
- **Purpose**: Multi-stage Docker build for containerized deployment
- **Features**:
  - Builds .NET API and React UI
  - Creates optimized production image
  - Includes health checks
  - Non-root user for security
- **Usage**: `docker build -f deploy/Dockerfile .`

### 🐳 **docker-compose.yml**
- **Purpose**: Complete stack deployment with monitoring
- **Services**:
  - `pms-platform`: Main application
  - `prometheus`: Metrics collection
  - `grafana`: Visualization dashboard
- **Usage**: `docker-compose -f deploy/docker-compose.yml up -d`

### 🐳 **docker-entrypoint.sh**
- **Purpose**: Docker container startup script
- **Features**:
  - Starts API and UI services
  - Health check verification
  - Environment configuration
- **Usage**: Automatically used by Docker container

### 📚 **PRODUCTION.md**
- **Purpose**: Comprehensive production deployment guide
- **Contents**:
  - Quick start instructions
  - Configuration details
  - Troubleshooting guide
  - Maintenance procedures
  - Security checklist

## 🚀 **Quick Start**

### Option 1: PowerShell Deployment
```powershell
# Deploy to production
.\deploy\deploy-production.ps1

# Start the platform
cd deployment
.\start-platform.bat
```

### Option 2: Docker Compose
```bash
# Build and start all services
docker-compose -f deploy/docker-compose.yml up -d

# Check status
docker-compose -f deploy/docker-compose.yml ps

# View logs
docker-compose -f deploy/docker-compose.yml logs -f pms-platform
```

### Option 3: Docker Build
```bash
# Build Docker image
docker build -f deploy/Dockerfile -t pms-platform .

# Run container
docker run -p 8000:8000 -p 3000:3000 pms-platform
```

## 📋 **Deployment Options**

### **Development**
- Use `dotnet run` in `api/` directory
- Use `npm run dev` in `ui/` directory

### **Production - PowerShell**
- Automated deployment with `deploy-production.ps1`
- Creates standalone deployment package
- Includes startup scripts

### **Production - Docker**
- Containerized deployment
- Includes monitoring stack
- Easy scaling and management

### **Production - Manual**
- Follow `PRODUCTION.md` guide
- Step-by-step deployment process
- Full control over each step

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Required for production
ASPNETCORE_ENVIRONMENT=Production
JWT__KEY=your-secure-jwt-key
JWT__ISSUER=h5net-pms
JWT__AUDIENCE=h5net-pms-api

# Optional
ASPNETCORE_URLS=http://+:8000
RATE_LIMITING__REQUESTS_PER_MINUTE=50
RATE_LIMITING__REQUESTS_PER_HOUR=500
```

### **Docker Environment**
```bash
# Set in docker-compose.yml or docker run
environment:
  - ASPNETCORE_ENVIRONMENT=Production
  - JWT__KEY=your-secure-jwt-key
```

## 📊 **Monitoring**

### **Health Endpoints**
- **Health Check**: `GET /health`
- **Readiness Check**: `GET /health/ready`
- **Metrics**: `GET /health/metrics`

### **Docker Monitoring**
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3001`
- **Application**: `http://localhost:8000/health`

## 🔐 **Security**

### **Production Security Checklist**
- [ ] Change default JWT key
- [ ] Update default passwords
- [ ] Configure HTTPS certificates
- [ ] Set up firewall rules
- [ ] Enable authentication
- [ ] Configure CORS origins
- [ ] Set up monitoring and logging

### **Docker Security**
- Non-root user in container
- Health checks enabled
- Resource limits configured
- Network isolation

## 📁 **Generated Files**

### **PowerShell Deployment**
```
deployment/
├── api/                    # .NET API binaries
├── ui/                     # React UI build
├── pms/                    # PMS data and translators
├── start-api.bat          # API startup script
├── start-ui.bat           # UI startup script
├── start-platform.bat     # Combined startup script
└── deployment-config.json # Deployment configuration
```

### **Docker Deployment**
```
/
├── app/                   # Application root
│   ├── h5net-api.dll     # API binary
│   ├── wwwroot/          # UI static files
│   └── pms/              # PMS data
└── docker-entrypoint.sh  # Startup script
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### PowerShell Deployment Fails
```powershell
# Check prerequisites
dotnet --version
node --version
npm --version

# Check build logs
cd api && dotnet build
cd ../ui && npm run build
```

#### Docker Build Fails
```bash
# Check Dockerfile syntax
docker build -f deploy/Dockerfile . --no-cache

# Check for missing files
ls -la api/
ls -la ui/
```

#### Container Won't Start
```bash
# Check container logs
docker-compose -f deploy/docker-compose.yml logs pms-platform

# Check health endpoint
curl http://localhost:8000/health
```

## 📚 **Documentation**

- **Production Guide**: `PRODUCTION.md`
- **API Documentation**: `http://localhost:8000/swagger`
- **Health Dashboard**: `http://localhost:8000/health`
- **Grafana Dashboard**: `http://localhost:3001` (if monitoring enabled)

## 🤝 **Contributing**

When adding new deployment files:
1. Follow the existing naming conventions
2. Update this README with documentation
3. Test deployment in multiple environments
4. Include error handling and logging
5. Update `PRODUCTION.md` if needed 