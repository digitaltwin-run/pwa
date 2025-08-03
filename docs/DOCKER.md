# 🐳 Docker Guide - Digital Twin PWA

Complete guide for containerized development, testing, and deployment of the Digital Twin SVG IDE.

## 🎯 Overview

The Digital Twin PWA uses Docker for:
- **Isolated Development Environment** - Consistent across all machines
- **Automated Testing** - Browser testing with Selenium Grid
- **Production Deployment** - Scalable container orchestration
- **CI/CD Integration** - Reproducible build and test pipelines

## 🏗️ Docker Architecture

### Services Overview

```yaml
# docker-compose.yml structure
services:
  digitaltwin-app:     # Main application server
  test-runner:         # Automated testing environment  
  selenium-chrome:     # Browser automation for E2E tests
  nginx:              # Production web server
```

### Container Details

#### 1. **digitaltwin-app** - Main Application
- **Base Image**: `node:18-alpine`
- **Port**: `8080`
- **Purpose**: Development server and application runtime
- **Features**: Hot reload, development tools, testing integration

#### 2. **test-runner** - Testing Environment
- **Base Image**: `node:18-alpine` with Chrome
- **Purpose**: Automated testing execution
- **Tools**: Puppeteer, Lighthouse, Jest, Axe-core
- **Output**: Test reports in `test-results/`

#### 3. **selenium-chrome** - Browser Automation
- **Base Image**: `selenium/standalone-chrome:latest`
- **Port**: `4444`
- **Purpose**: Cross-browser E2E testing
- **Features**: WebDriver Grid, VNC access

#### 4. **nginx** - Web Server
- **Base Image**: `nginx:alpine`
- **Port**: `80`
- **Purpose**: Production-ready static file serving
- **Features**: Gzip compression, caching headers

## 🚀 Quick Start

### Prerequisites
- **Docker** 20.10+ 
- **Docker Compose** 2.0+
- **Make** (for Makefile commands)

### Basic Commands

```bash
# Show all available Docker commands
make help

# Build all containers
make docker-build

# Start development environment
make docker-up

# Run tests in containers
make docker-test

# View logs
make docker-logs

# Stop all containers
make docker-down

# Clean up everything
make docker-clean
```

## 🔧 Development Workflow

### 1. Initial Setup
```bash
# Build containers (first time)
make docker-build

# Start development environment
make docker-up
```

### 2. Development Server
```bash
# Application available at:
http://localhost:8080

# Selenium Grid dashboard:
http://localhost:4444
```

### 3. File Synchronization
- **Source code** is mounted as volume for hot reload
- **Test results** are persistently stored in `test-results/`
- **Documentation** is accessible in containers

### 4. Testing in Docker
```bash
# Run all tests in containerized environment
make docker-test

# Specific test types
docker-compose run test-runner npm run test:e2e
docker-compose run test-runner npm run test:lighthouse
docker-compose run test-runner npm run test:accessibility
```

## 🧪 Testing Environment

### Headless Browser Testing
```bash
# E2E tests with Puppeteer
docker-compose run test-runner npm run test:headless

# Lighthouse performance audit
docker-compose run test-runner npm run test:lighthouse

# Accessibility testing
docker-compose run test-runner npm run test:accessibility
```

### Selenium Grid Integration
```bash
# Connect to Selenium Grid from tests
TARGET_URL=http://digitaltwin-app:8080 \
SELENIUM_URL=http://selenium-chrome:4444 \
docker-compose run test-runner npm run test:selenium
```

### Test Reports
All test results are stored in `./test-results/` directory:
- `coverage/` - Code coverage reports
- `lighthouse-report.html` - Performance audit
- `puppeteer-report.html` - E2E test results
- `accessibility-report.html` - WCAG compliance

## 🐳 Container Configuration

### Environment Variables

#### Development
```bash
NODE_ENV=development
TESTING_MODE=true
TARGET_URL=http://digitaltwin-app:8080
```

#### Production
```bash
NODE_ENV=production
TESTING_MODE=false
```

### Volume Mounts
```yaml
volumes:
  - ./test-results:/app/test-results    # Persistent test results
  - ./docs:/app/docs                    # Documentation access
  - ./tests:/app/tests                  # Test files
  - .:/usr/share/nginx/html            # Static files (nginx)
```

## 🚀 Production Deployment

### Build Production Image
```bash
# Build optimized production image
docker build -t digitaltwin-pwa:latest .

# Or using Make
make docker-build
```

### Production Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:8080"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### Health Checks
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080 || exit 1
```

## 🔍 Debugging & Troubleshooting

### View Logs
```bash
# All services
make docker-logs

# Specific service
docker-compose logs -f digitaltwin-app
docker-compose logs -f test-runner
docker-compose logs -f selenium-chrome
```

### Interactive Shell Access
```bash
# Access running container
docker-compose exec digitaltwin-app sh

# Run new container with shell
docker-compose run --rm digitaltwin-app sh
```

### Network Debugging
```bash
# Test container connectivity
docker-compose exec digitaltwin-app ping selenium-chrome
docker-compose exec test-runner curl http://digitaltwin-app:8080
```

### Resource Usage
```bash
# View container resource usage
docker stats

# Container information
docker-compose ps
```

## 🎯 Performance Optimization

### Multi-stage Builds
```dockerfile
# Development stage
FROM node:18-alpine as development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Production stage  
FROM node:18-alpine as production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Build Cache Optimization
```dockerfile
# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Then copy source code
COPY . .
```

### Image Size Reduction
```dockerfile
# Use Alpine Linux for smaller images
FROM node:18-alpine

# Clean up after installation
RUN apk add --no-cache chromium \
    && rm -rf /var/cache/apk/*

# Remove dev dependencies in production
RUN npm prune --production
```

## 📊 CI/CD Integration

### GitHub Actions Example
```yaml
name: Docker CI/CD
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: make docker-build
        
      - name: Run tests in Docker
        run: make docker-test
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### GitLab CI Example
```yaml
stages:
  - build
  - test
  - deploy

docker-build:
  stage: build
  script:
    - make docker-build
  
docker-test:
  stage: test
  script:
    - make docker-test
  artifacts:
    reports:
      junit: test-results/*.xml
    paths:
      - test-results/
```

## 🔧 Maintenance

### Regular Cleanup
```bash
# Remove unused containers and images
make docker-clean

# Full system cleanup
docker system prune -a --volumes
```

### Updates
```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest dependencies
make docker-build --no-cache
```

### Monitoring
```bash
# Container health
docker-compose ps

# Resource usage
docker stats

# Log monitoring
make docker-logs
```

## 🎛️ Advanced Configuration

### Custom Dockerfile
Create custom Dockerfile for specific needs:

```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    make \
    python3

# Set Chrome path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install app dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK CMD curl -f http://localhost:8080 || exit 1

# Start application
CMD ["npm", "start"]
```

### Docker Compose Override
Create `docker-compose.override.yml` for local customization:

```yaml
version: '3.8'
services:
  digitaltwin-app:
    ports:
      - "3000:8080"  # Custom port
    environment:
      - DEBUG=true   # Additional env vars
    volumes:
      - ./custom:/app/custom  # Additional mounts
```

## 📞 Support & Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using port 8080
   lsof -i :8080
   ```

2. **Permission issues**
   ```bash
   # Fix ownership
   sudo chown -R $USER:$USER test-results/
   ```

3. **Out of disk space**
   ```bash
   # Clean Docker system
   docker system prune -a --volumes
   ```

4. **Container won't start**
   ```bash
   # Check logs
   docker-compose logs digitaltwin-app
   ```

### Getting Help
- **Logs**: `make docker-logs`
- **Status**: `docker-compose ps`  
- **Debug**: `make debug`
- **Health**: `make health-check`

---

*Docker integration designed for scalable, reliable Digital Twin PWA development and deployment* 🚀
