# Multi-stage build for PMS Integration Platform
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS api-builder

# Set working directory
WORKDIR /src

# Copy API project files
COPY api/*.csproj ./api/
COPY api/*.sln ./api/

# Restore API dependencies
RUN dotnet restore api/api.csproj

# Copy API source code
COPY api/ ./api/

# Build and publish API
RUN dotnet build api/api.csproj -c Release -o /app/build
RUN dotnet publish api/api.csproj -c Release -o /app/publish

# Build UI
FROM node:18-alpine AS ui-builder

# Set working directory
WORKDIR /app

# Copy UI package files
COPY ui/package*.json ./

# Install UI dependencies
RUN npm ci --only=production

# Copy UI source code
COPY ui/ ./

# Build UI
RUN npm run build

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

# Install Node.js for serving UI
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g serve \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy API from builder
COPY --from=api-builder /app/publish .

# Copy UI from builder
COPY --from=ui-builder /app/dist ./wwwroot

# Copy PMS data directory
COPY pms/ ./pms/

# Create non-root user
RUN groupadd -r pmsuser && useradd -r -g pmsuser pmsuser
RUN chown -R pmsuser:pmsuser /app
USER pmsuser

# Expose ports
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"] 