# 🚀 Digital Twin PWA - Makefile
# Comprehensive build and test automation

.PHONY: help build dev test clean docker-build docker-up docker-down docker-test install lint format

# 📋 Default target - show help
help:
	@echo "🚀 Digital Twin PWA - Available Commands:"
	@echo ""
	@echo "📦 SETUP & INSTALLATION:"
	@echo "  make install          - Install all dependencies"
	@echo "  make setup           - Initial project setup"
	@echo ""
	@echo "🔧 DEVELOPMENT:"
	@echo "  make dev             - Start development server"
	@echo "  make build           - Build production version"
	@echo "  make clean           - Clean build artifacts"
	@echo ""
	@echo "🧪 TESTING:"
	@echo "  make test            - Run all tests"
	@echo "  make test-unit       - Run unit tests"
	@echo "  make test-integration - Run integration tests"
	@echo "  make test-e2e        - Run E2E tests"
	@echo "  make test-lighthouse - Run Lighthouse performance tests"
	@echo "  make test-pwa        - Run PWA tests"
	@echo "  make test-accessibility - Run accessibility tests"
	@echo "  make test-watch      - Run tests in watch mode"
	@echo "  make test-coverage   - Run tests with coverage report"
	@echo ""
	@echo "🐳 DOCKER:"
	@echo "  make docker-build    - Build Docker images"
	@echo "  make docker-up       - Start Docker environment"
	@echo "  make docker-down     - Stop Docker environment"
	@echo "  make docker-test     - Run tests in Docker"
	@echo "  make docker-clean    - Clean Docker containers and images"
	@echo ""
	@echo "🎯 CODE QUALITY:"
	@echo "  make lint            - Run ESLint"
	@echo "  make format          - Format code with Prettier"
	@echo "  make validate        - Validate project structure"
	@echo ""
	@echo "📊 REPORTS:"
	@echo "  make report          - Generate comprehensive test report"
	@echo "  make lighthouse      - Generate Lighthouse audit"
	@echo "  make bundle-analysis - Analyze bundle size"
	@echo ""
	@echo "🚀 DEPLOYMENT:"
	@echo "  make deploy-staging  - Deploy to staging"
	@echo "  make deploy-prod     - Deploy to production"
	@echo ""

# 📦 INSTALLATION & SETUP
install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed"

setup: install
	@echo "🔧 Setting up project..."
	mkdir -p test-results logs build
	@echo "🔐 Setting up Git hooks..."
	cp scripts/pre-commit.sh .git/hooks/pre-commit || echo "Git hooks setup skipped"
	chmod +x .git/hooks/pre-commit || echo "Git hooks chmod skipped"
	@echo "✅ Project setup complete"

# 🔧 DEVELOPMENT
dev:
	@echo "🚀 Starting development server..."
	npm run dev

build:
	@echo "🏗️ Building production version..."
	npm run build
	@echo "✅ Build complete"

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf build/ dist/ test-results/ coverage/ .nyc_output/
	rm -f *.log
	@echo "✅ Clean complete"

# 🧪 TESTING
test:
	@echo "🧪 Running all tests..."
	npm test
	@echo "✅ All tests complete"

test-unit:
	@echo "🔬 Running unit tests..."
	npm run test:unit

test-integration:
	@echo "🔗 Running integration tests..."
	npm run test:integration

test-e2e:
	@echo "🎭 Running E2E tests..."
	npm run test:e2e

test-lighthouse:
	@echo "⚡ Running Lighthouse tests..."
	npm run test:lighthouse

test-pwa:
	@echo "📱 Running PWA tests..."
	npm run test:pwa

test-accessibility:
	@echo "♿ Running accessibility tests..."
	npm run test:accessibility

test-watch:
	@echo "👀 Running tests in watch mode..."
	npm run test:watch

test-coverage:
	@echo "📊 Running tests with coverage..."
	npm run test:coverage
	@echo "📄 Coverage report available at: test-results/coverage/index.html"

# 🐳 DOCKER OPERATIONS
docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build
	@echo "✅ Docker images built"

docker-up:
	@echo "🚀 Starting Docker environment..."
	docker-compose up -d
	@echo "🌐 Application available at: http://localhost:8080"
	@echo "📊 Selenium Grid at: http://localhost:4444"

docker-down:
	@echo "⏹️ Stopping Docker environment..."
	docker-compose down

docker-test:
	@echo "🧪 Running tests in Docker..."
	docker-compose run --rm test-runner
	@echo "✅ Docker tests complete"

docker-logs:
	@echo "📋 Showing Docker logs..."
	docker-compose logs -f

docker-clean:
	@echo "🧹 Cleaning Docker environment..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ Docker cleanup complete"

# 🎯 CODE QUALITY
lint:
	@echo "🔍 Running ESLint..."
	npm run lint

format:
	@echo "✨ Formatting code..."
	npm run format

validate:
	@echo "✅ Validating project structure..."
	@test -f package.json || (echo "❌ package.json missing" && exit 1)
	@test -f Dockerfile || (echo "❌ Dockerfile missing" && exit 1)
	@test -f docker-compose.yml || (echo "❌ docker-compose.yml missing" && exit 1)
	@test -d js/ || (echo "❌ js/ directory missing" && exit 1)
	@test -d tests/ || (echo "❌ tests/ directory missing" && exit 1)
	@test -d components/ || (echo "❌ components/ directory missing" && exit 1)
	@echo "✅ Project structure valid"

# 📊 REPORTS & ANALYSIS
report:
	@echo "📊 Generating comprehensive test report..."
	make test-coverage
	make test-lighthouse
	make test-accessibility
	@echo "📄 Reports available in test-results/"

lighthouse:
	@echo "⚡ Running Lighthouse audit..."
	npm run test:lighthouse
	@echo "📄 Lighthouse report: test-results/lighthouse-report.html"

bundle-analysis:
	@echo "📦 Analyzing bundle size..."
	@test -f webpack.config.js && npm run analyze || echo "⏭️ Webpack config not found, skipping bundle analysis"

# 🚀 DEPLOYMENT
deploy-staging:
	@echo "🚀 Deploying to staging..."
	make build
	make test
	@echo "🌐 Deploying to staging environment..."
	# Add your staging deployment commands here
	@echo "✅ Deployed to staging"

deploy-prod:
	@echo "🚀 Deploying to production..."
	@read -p "Are you sure you want to deploy to production? [y/N] " confirm && [ "$$confirm" = "y" ]
	make build
	make test
	@echo "🌐 Deploying to production..."
	# Add your production deployment commands here
	@echo "✅ Deployed to production"

# 🔄 CI/CD HELPERS
ci-setup:
	@echo "🔧 Setting up CI environment..."
	make install
	make validate

ci-test:
	@echo "🧪 Running CI tests..."
	make lint
	make test-coverage
	make test-lighthouse
	@echo "✅ CI tests complete"

ci-build:
	@echo "🏗️ CI build..."
	make build
	make validate-build

validate-build:
	@echo "✅ Validating build..."
	@test -d build/ || (echo "❌ Build directory missing" && exit 1)
	@echo "✅ Build validation complete"

# 📱 PWA SPECIFIC
pwa-audit:
	@echo "📱 PWA Audit..."
	npm run test:pwa
	npm run test:lighthouse

sw-update:
	@echo "🔄 Updating Service Worker..."
	npm run build:sw
	@echo "✅ Service Worker updated"

# 🌐 INTERNATIONALIZATION
i18n-extract:
	@echo "🌐 Extracting i18n strings..."
	# Add i18n extraction logic here
	@echo "✅ i18n strings extracted"

i18n-validate:
	@echo "✅ Validating i18n files..."
	# Add i18n validation logic here
	@echo "✅ i18n validation complete"

# 🔧 UTILITIES
logs:
	@echo "📋 Showing application logs..."
	tail -f logs/*.log 2>/dev/null || echo "No log files found"

health-check:
	@echo "🏥 Running health check..."
	curl -f http://localhost:8080/health || echo "❌ Health check failed"

performance-test:
	@echo "📊 Running performance tests..."
	npm run test:performance

backup:
	@echo "💾 Creating backup..."
	tar -czf backup-$(shell date +%Y%m%d-%H%M%S).tar.gz \
		--exclude=node_modules \
		--exclude=.git \
		--exclude=test-results \
		--exclude=coverage \
		.
	@echo "✅ Backup created"

# 🚨 TROUBLESHOOTING
debug:
	@echo "🐛 Debug information:"
	@echo "Node version: $(shell node --version)"
	@echo "NPM version: $(shell npm --version)"
	@echo "Docker version: $(shell docker --version)"
	@echo "Docker Compose version: $(shell docker-compose --version)"
	@echo "Current directory: $(shell pwd)"
	@echo "Git branch: $(shell git branch --show-current 2>/dev/null || echo 'Not a git repo')"

reset:
	@echo "🔄 Resetting project..."
	make clean
	make docker-clean
	rm -rf node_modules/
	make install
	@echo "✅ Project reset complete"

test2:
	@echo "🧪 Running node tests..."
	node server-test.js

stop:
	./stop.sh

# 📈 MONITORING
monitor:
	@echo "📈 Starting monitoring..."
	@echo "🌐 App: http://localhost:8080"
	@echo "📊 Logs: make logs"
	@echo "🏥 Health: make health-check"

# Default target
.DEFAULT_GOAL := help
