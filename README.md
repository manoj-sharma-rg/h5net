# h5net

AI-Powered PMS Integration Platform

## Project Overview

This platform enables rapid, secure, and scalable integration of third-party Property Management Systems (PMS) with the RGBridge messaging standard. It features an AI-assisted onboarding wizard and a plugin-based translation system.

## Features

- **AI-Assisted Onboarding**: Automated mapping suggestions using GenAI
- **Plugin System**: Extensible PMS translators with auto-discovery
- **Professional UI**: React-based wizard for seamless onboarding
- **Secure Integration**: GDPR/PCI compliant with audit trails
- **Versioned Mappings**: Non-destructive, traceable integrations

## Project Structure

- `api/` — C#/.NET backend (API Gateway, translation engine, plugin system)
- `ui/` — React frontend (UI wizard for onboarding and mapping)
- `pms/` — PMS-specific translators and mapping files (one folder per PMS)
- `common/` — Shared utilities, schema validators, and AI helpers
- `tests/` — Unit and integration tests for backend and frontend
- `deploy/` — Production deployment scripts, Docker files, and deployment guides
- `dox/` — Documentation, requirements, and planning files

## Quick Start

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+ and npm
- PowerShell or Command Prompt

### Development Setup
```bash
# Backend
cd api
dotnet run
# The API will start on http://localhost:8000

# Frontend
cd ui
npm install
npm run dev
# The UI will start on http://localhost:5173
```

### Production Deployment
```powershell
# PowerShell deployment
.\deploy\deploy-production.ps1

# Docker deployment
docker-compose -f deploy/docker-compose.yml up -d
```

For detailed deployment instructions, see [`deploy/PRODUCTION.md`](deploy/PRODUCTION.md).

For testing instructions, see [`tests/TESTING.md`](tests/TESTING.md).

## API Endpoints

### Onboarding & Setup
- `POST /mappings/{pmscode}` - Create new PMS integration
  - Headers: `X-PMS-Name` (optional)
  - Body: PMS specification (JSON/XML/GraphQL/SOAP)
  - Returns: Mapping suggestions and integration status

### Feed Processing
- `POST /pms/{pmscode}` - Process PMS feeds
  - Body: PMS message payload
  - Returns: Translated RGBridge XML message

## Usage

1. **Onboard New PMS**:
   - Open the UI wizard at `http://localhost:5173`
   - Enter PMS code and name
   - Upload or paste PMS specification
   - Review AI-generated mapping suggestions
   - Complete the onboarding process

2. **Process PMS Feeds**:
   - Send POST requests to `/pms/{pmscode}`
   - The system will auto-discover and use the appropriate translator
   - Receive standardized RGBridge messages

## Development

### Adding New PMS Translators
1. Create a new class implementing `IPmsTranslator`
2. Set the `PmsCode` property to match the PMS identifier
3. Implement the `TranslateToRgbridgeAsync` method
4. The system will auto-discover and load the translator

### Logging
- **Backend**: Logs appear in the terminal where the API is running
- **Frontend**: Open browser DevTools (F12) → Console tab

## Documentation

- `dox/3brd.md` - Business Requirements Document
- `dox/4prd.md` - Product Requirements Document
- `dox/2plan.md` - Project Plan
- `dox/7implement.md` - Implementation Plan

## Architecture

The platform uses a modular architecture with:
- **API Gateway**: Dynamic routing based on PMS codes
- **Plugin System**: Auto-discovery of PMS-specific translators
- **Mapping Engine**: AI-assisted field mapping and validation
- **File Storage**: Versioned mappings and specifications per PMS

## CI/CD Pipeline

The project includes automated CI/CD pipelines using GitHub Actions:

- **Automated Testing**: Runs on every push and pull request
- **Security Scanning**: CodeQL and Trivy vulnerability scans
- **Dependency Management**: Weekly dependency updates and security checks
- **Automated Deployment**: Staging (develop branch) and Production (main branch)

For detailed CI/CD documentation, see [`.github/README.md`](.github/README.md).

## Contributing

1. Follow the established folder structure
2. Add comprehensive logging for debugging
3. Implement proper error handling
4. Update documentation for new features
5. Ensure all CI/CD checks pass before merging

## License

Internal use only - All rights reserved