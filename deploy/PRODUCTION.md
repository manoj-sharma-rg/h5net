# Production Deployment Guide

This guide covers deploying the PMS Integration Platform to production environments.

## 🚀 **Quick Start**

### Option 1: Docker Compose (Recommended)
```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f pms-platform
```

### Option 2: PowerShell Deployment Script
```powershell
# Deploy to production
.\deploy-production.ps1 -Environment Production

# Start the platform
cd deployment
.\start-platform.bat
```

### Option 3: Manual Deployment
```bash
# Build API
cd api
dotnet publish -c Release -o ../deployment/api

# Build UI
cd ../ui
npm run build
cp -r dist ../deployment/ui

# Start API
cd ../deployment/api
dotnet h5net-api.dll
```

## 🔧 **Production Configuration**

### Environment Variables
```bash
# Required
ASPNETCORE_ENVIRONMENT=Production
JWT__KEY=your-super-secure-jwt-key-here
JWT__ISSUER=h5net-pms
JWT__AUDIENCE=h5net-pms-api

# Optional
ASPNETCORE_URLS=http://+:8000
RATE_LIMITING__REQUESTS_PER_MINUTE=50
RATE_LIMITING__REQUESTS_PER_HOUR=500
```

### Security Checklist
- [ ] Change default JWT key in `appsettings.Production.json`
- [ ] Update default passwords in configuration
- [ ] Configure HTTPS certificates
- [ ] Set up firewall rules
- [ ] Enable authentication
- [ ] Configure CORS origins
- [ ] Set up monitoring and logging

## 📊 **Monitoring & Health Checks**

### Health Endpoints
- **Health Check**: `GET /health`
- **Readiness Check**: `GET /health/ready`
- **Metrics**: `GET /health/metrics`

### Example Health Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": "00:15:30",
  "environment": "Production",
  "checks": {
    "database": true,
    "fileSystem": true,
    "memory": true,
    "disk": true
  }
}
```

## 🔐 **Authentication & Security**

### JWT Authentication
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Use token
curl -X GET http://localhost:8000/api/pms/testhotel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Rate Limiting
- **Per Minute**: 50 requests (configurable)
- **Per Hour**: 500 requests (configurable)
- **Headers**: `X-API-Key` for API key-based limiting

## 📁 **File Structure**

### Production Deployment
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

### Docker Deployment
```
/
├── app/                   # Application root
│   ├── h5net-api.dll     # API binary
│   ├── wwwroot/          # UI static files
│   └── pms/              # PMS data
└── docker-entrypoint.sh  # Startup script
```

## 🔍 **Troubleshooting**

### Common Issues

#### 1. API Won't Start
```bash
# Check logs
docker-compose logs pms-platform

# Check configuration
curl http://localhost:8000/health

# Verify environment variables
echo $ASPNETCORE_ENVIRONMENT
```

#### 2. UI Not Loading
```bash
# Check if UI server is running
curl http://localhost:3000

# Check API connectivity
curl http://localhost:8000/health
```

#### 3. Authentication Issues
```bash
# Test login endpoint
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Check JWT configuration
grep -r "JWT" appsettings.Production.json
```

#### 4. Rate Limiting
```bash
# Check rate limit headers
curl -I http://localhost:8000/api/pms/testhotel

# Response headers:
# X-RateLimit-Limit: 50
# X-RateLimit-Remaining: 49
# X-RateLimit-Reset: 1642234567
```

## 📈 **Performance Optimization**

### API Performance
- **Memory**: Monitor with `/health/metrics`
- **CPU**: Use health check endpoints
- **Disk**: Check available space
- **Network**: Monitor request latency

### Scaling
```bash
# Scale API instances
docker-compose up -d --scale pms-platform=3

# Load balancer configuration
# Use nginx or HAProxy for load balancing
```

## 🔄 **Backup & Recovery**

### Data Backup
```bash
# Backup PMS data
tar -czf pms-backup-$(date +%Y%m%d).tar.gz pms/

# Backup configuration
cp appsettings.Production.json config-backup-$(date +%Y%m%d).json
```

### Recovery
```bash
# Restore PMS data
tar -xzf pms-backup-20240115.tar.gz

# Restore configuration
cp config-backup-20240115.json appsettings.Production.json
```

## 📋 **Maintenance**

### Regular Tasks
- [ ] Monitor health endpoints
- [ ] Check disk space
- [ ] Review application logs
- [ ] Update security patches
- [ ] Backup PMS data
- [ ] Test disaster recovery

### Log Rotation
```bash
# Configure log rotation in production
# Use logrotate or similar tools
```

## 🚨 **Emergency Procedures**

### Service Down
1. Check health endpoints
2. Review application logs
3. Restart services if needed
4. Check system resources
5. Verify configuration

### Data Loss
1. Stop all services
2. Restore from backup
3. Verify data integrity
4. Restart services
5. Test functionality

## 📞 **Support**

### Contact Information
- **Technical Issues**: Check logs and health endpoints
- **Configuration**: Review `appsettings.Production.json`
- **Deployment**: Use provided scripts and Docker files

### Useful Commands
```bash
# Check service status
docker-compose ps

# View real-time logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update deployment
docker-compose up -d --build
```

## 📚 **Additional Resources**

- [API Documentation](http://localhost:8000/swagger)
- [Health Dashboard](http://localhost:8000/health)
- [Grafana Dashboard](http://localhost:3001) (if monitoring enabled)
- [Prometheus Metrics](http://localhost:9090) (if monitoring enabled) 