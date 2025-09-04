# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["LeadTracker.Api/LeadTracker.Api.csproj", "LeadTracker.Api/"]
COPY ["LeadTracker.Core/LeadTracker.Core.csproj", "LeadTracker.Core/"]
COPY ["LeadTracker.Infrastructure/LeadTracker.Infrastructure.csproj", "LeadTracker.Infrastructure/"]
RUN dotnet restore "LeadTracker.Api/LeadTracker.Api.csproj"

# Copy source code
COPY . .

# Build the application
WORKDIR "/src/LeadTracker.Api"
RUN dotnet build "LeadTracker.Api.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "LeadTracker.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Test stage (optional, can be used in CI)
FROM build AS test
WORKDIR /src
RUN dotnet test --no-restore --verbosity normal

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

# Copy published application
COPY --from=publish /app/publish .

# Create directories for logs and uploads
RUN mkdir -p logs uploads

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Entry point
ENTRYPOINT ["dotnet", "LeadTracker.Api.dll"]
